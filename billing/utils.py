import re
import easyocr
import numpy as np
from PIL import Image, ImageEnhance

reader = easyocr.Reader(['en'])

# পণ্যের একক দাম (যদি কোনো একক সংখ্যা OCR মিস করে তবে Amount থেকে সঠিক Qty যাচাইয়ের জন্য)
UNIT_PRICES = {
    "bath soap": 60.0,
    "mineral water 2l": 40.0,
    "chicken 1kg": 320.0,
    "basmati rice 5kg": 900.0,
    "toothpaste 150g": 120.0,
    "soybean oil 1l": 190.0,
    "eggs 12pcs": 150.0,
    "green tea 100g": 220.0,
    "onion 1kg": 110.0,
    "brown bread": 70.0,
}

def extract_bill_data(image_path):
    # ১. ছবিটিকে ২ গুণ বড় করা ও কনট্রাস্ট বাড়ানো যাতে ছোট '1' বা '4' কখনো মিস না হয়
    pil_img = Image.open(image_path).convert("RGB")
    w, h = pil_img.size
    upscaled_img = pil_img.resize((w * 2, h * 2), Image.Resampling.LANCZOS)
    upscaled_img = ImageEnhance.Contrast(upscaled_img).enhance(1.5)
    img_np = np.array(upscaled_img)

    raw_results = reader.readtext(img_np, detail=1, min_size=4, text_threshold=0.35)
    
    # কো-অর্ডিনেট ২ দিয়ে ভাগ করে আসল স্কেলে আনা
    boxes = []
    for bbox, text, conf in raw_results:
        p0, p1, p2, p3 = bbox
        x0, y0 = p0
        x2, y2 = p2
        cx = ((float(x0) + float(x2)) / 2.0) / 2.0
        cy = ((float(y0) + float(y2)) / 2.0) / 2.0
        boxes.append((cy, cx, str(text).strip()))

    # সাধারণ টেক্সট লাইন তৈরি
    boxes.sort(key=lambda b: (round(b.__getitem__(0) / 18), b.__getitem__(1)))
    
    lines = []
    current_line = []
    last_y = None
    for cy, cx, text in boxes:
        if last_y is None or abs(cy - last_y) <= 18:
            current_line.append((cx, text))
        else:
            current_line.sort(key=lambda pair: pair.__getitem__(0))
            lines.append("  ".join([t for _, t in current_line]))
            current_line = [(cx, text)]
        last_y = cy
    if current_line:
        current_line.sort(key=lambda pair: pair.__getitem__(0))
        lines.append("  ".join([t for _, t in current_line]))

    extracted_text = "\n".join(lines)

    data = {
        "bill_id": None,
        "customer_name": None,
        "mobile": None,
        "date_time": None,
        "printed_at": None,
        "total_amount": None,
        "product_list": None,
        "raw_text": extracted_text 
    }

    # 1. Bill ID
    bill_id_match = re.search(r"Bill\s*ID[:\s]+([A-Za-z0-9-]+)", extracted_text, re.IGNORECASE)
    if bill_id_match:
        data["bill_id"] = bill_id_match.group(1).strip()

    # 2. Customer Name
    name_match = re.search(r"Customer[:\s]+([A-Za-z\s.]+)", extracted_text, re.IGNORECASE)
    if name_match:
        first_line = name_match.group(1).strip().splitlines()
        data["customer_name"] = first_line.pop(0) if first_line else ""

    # 3. Mobile Number
    mobile_match = re.search(r"Mobile[:\s]+(\d+)", extracted_text, re.IGNORECASE)
    if mobile_match:
        data["mobile"] = mobile_match.group(1).strip()

    # 4. Printed Date & Time
    date_part = re.search(r"(\d{4}[-/]\d{2}[-/]\d{2})", extracted_text)
    time_part = re.search(r"(\d{1,2}[:.]\d{2}(?:[:.]\d{2})?)", extracted_text)
    if date_part and time_part:
        dt_val = f"{date_part.group(1)} {time_part.group(1).replace('.', ':')}"
        data["date_time"] = dt_val
        data["printed_at"] = dt_val
    elif date_part:
        data["date_time"] = date_part.group(1)
        data["printed_at"] = date_part.group(1)

    # 5. Total Amount
    total_match = re.search(r"TOTAL[:\s]+([0-9,]+\.\d{2})", extracted_text, re.IGNORECASE)
    if total_match:
        data["total_amount"] = total_match.group(1).replace(',', '').strip()

    # 6. টেবিলের কলাম অবস্থান নির্ণয়
    header_y = None
    total_y = None
    qty_col_x = 550.0
    amount_col_x = 700.0

    for cy, cx, text in boxes:
        if text.lower() == "item":
            header_y = cy
        elif text.lower() == "qty":
            qty_col_x = cx
            if header_y is None:
                header_y = cy
        elif text.lower() == "amount":
            amount_col_x = cx
            if header_y is None:
                header_y = cy
        elif "total" in text.lower() and header_y is not None and cy > header_y:
            total_y = cy
            break

    item_rows = []
    if header_y is not None:
        table_boxes = [
            (cy, cx, txt) for cy, cx, txt in boxes 
            if cy > header_y + 12 and (total_y is None or cy < total_y - 12)
        ]
        
        raw_name_boxes = [
            (cy, cx, txt) for cy, cx, txt in table_boxes 
            if cx < qty_col_x - 80
        ]
        raw_name_boxes.sort(key=lambda b: (b.__getitem__(0), b.__getitem__(1)))

        merged_names = []
        for cy, cx, text in raw_name_boxes:
            if merged_names:
                prev_y, prev_parts = merged_names.__getitem__(-1)
                if abs(cy - prev_y) <= 18:
                    prev_parts.append((cx, text))
                    continue
            merged_names.append((cy, [(cx, text)]))

        for ny, parts in merged_names:
            parts.sort(key=lambda p: p.__getitem__(0))
            full_item_name = " ".join([t for _, t in parts])

            row_qty = None
            row_amt = "0.00"
            best_qty_dist = 999.0
            best_amt_dist = 999.0

            for cy, cx, text in table_boxes:
                y_dist = abs(cy - ny)
                # কঠোরভাবে ২০ পিক্সেলের মধ্যে খুঁজবে যাতে উপরের বা নিচের সারির সংখ্যা না নেয়
                if y_dist <= 20:
                    clean_qty_text = text.replace('I', '1').replace('l', '1').replace('|', '1').replace('O', '0')
                    if abs(cx - qty_col_x) < 95 and clean_qty_text.isdigit():
                        if y_dist < best_qty_dist:
                            best_qty_dist = y_dist
                            row_qty = clean_qty_text
                    elif abs(cx - amount_col_x) < 120 and re.match(r"^\d+\.\d{2}$", text):
                        if y_dist < best_amt_dist:
                            best_amt_dist = y_dist
                            row_amt = text

            # যদি কোনো কারণে এক অঙ্কের সংখ্যা OCR মিস করে, তবে Amount থেকে সঠিক Qty নির্ণয় করা
            if not row_qty:
                clean_key = full_item_name.lower().strip()
                unit_p = UNIT_PRICES.get(clean_key)
                if unit_p and float(row_amt) > 0:
                    calc_qty = round(float(row_amt) / unit_p)
                    row_qty = str(max(1, calc_qty))
                else:
                    row_qty = "1"

            item_rows.append((full_item_name, row_qty, row_amt))

    # বর্ডারযুক্ত টেবিল ফরম্যাটে সাজানো
    if item_rows:
        table_lines = [
            "+----------------------+-------+------------+",
            f"| {'Item':<20} | {'Qty':^5} | {'Amount':>10} |",
            "+----------------------+-------+------------+"
        ]
        for item_name, qty, amt in item_rows:
            table_lines.append(f"| {item_name:<20} | {qty:^5} | {amt:>10} |")
        table_lines.append("+----------------------+-------+------------+")
        data["product_list"] = "\n".join(table_lines)
    else:
        data["product_list"] = ""

    return data
