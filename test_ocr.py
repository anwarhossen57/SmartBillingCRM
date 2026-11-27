import glob
import os
from billing.utils import extract_bill_data

extensions = ("*.png", "*.jpg", "*.jpeg", "*.webp")
images = []
for ext in extensions:
    images.extend(glob.glob(os.path.join("fake_bills", ext)))

images = sorted(images)

if not images:
    print("Error: 'fake_bills' ফোল্ডারে কোনো ইমেজ ফাইল পাওয়া যায়নি।")
    raise SystemExit(1)

image_file = images[0]
print("Testing Image:", image_file)

extracted_info = extract_bill_data(image_file)

print("\n--- OCR KI DEKHTE PACHHE (RAW TEXT) ---")
print(extracted_info.get("raw_text") or "")
print("---------------------------------------")

print("\n--- 6 FIELDS (FORM DATA) ---")
print("Bill ID      :", extracted_info.get("bill_id"))
print("Customer     :", extracted_info.get("customer_name"))
print("Mobile       :", extracted_info.get("mobile"))
print("Date & Time  :", extracted_info.get("date_time"))
print("Total Amount :", extracted_info.get("total_amount"))
print("Product List :\n" + str(extracted_info.get("product_list") or ""))
print("---------------------------------------\n")