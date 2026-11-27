import os
import uuid
import traceback
from datetime import datetime
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.core.paginator import Paginator
from django.db.models import Q
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from billing.utils import extract_bill_data
from billing.models import Customer, Bill

# 1. Scan and send data to frontend (Keeps a temp copy so save_bill can attach bill_image too)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def scan_bill(request):
    if 'image' not in request.FILES:
        return Response({"error": "No image provided. Please upload a bill."}, status=status.HTTP_400_BAD_REQUEST)
    
    image_file = request.FILES['image']
    temp_name = default_storage.save(f"temp_bills/{uuid.uuid4().hex[:8]}_{image_file.name}", image_file)
    temp_path = default_storage.path(temp_name)
    
    try:
        extracted_data = extract_bill_data(temp_path)
        
        extracted_data['bill_id'] = extracted_data.get('bill_id') or f"AUTO-{uuid.uuid4().hex[:6]}"
        extracted_data['customer_name'] = extracted_data.get('customer_name') or "Unknown Customer"
        extracted_data['mobile'] = extracted_data.get('mobile') or f"UNKNOWN-{uuid.uuid4().hex[:6]}"
        extracted_data['total_amount'] = extracted_data.get('total_amount') or "0.00"
        extracted_data['product_list'] = extracted_data.get('product_list') or ""
        extracted_data['date_time'] = extracted_data.get('date_time') or ""
        extracted_data['printed_datetime'] = extracted_data.get('date_time') or ""
        extracted_data['temp_image_path'] = temp_name
            
        return Response(extracted_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 2. Save bill to database including printed_datetime and bill_image
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_bill(request):
    try:
        data = request.data
        bill_id = data.get('bill_id')
        name = data.get('customer_name') or "Unknown Customer"
        mobile = data.get('mobile') or f"UNKNOWN-{uuid.uuid4().hex[:6]}"
        amount_str = data.get('total_amount')
        product_list_text = data.get('product_list') or ""
        raw_dt = data.get('printed_datetime') or data.get('printed_at') or data.get('date_time') or ""
        order_status = data.get('status') or 'Pending'
        temp_image_path = data.get('temp_image_path')
        
        try:
            total_amount = float(str(amount_str).replace('$', '').replace(',', '').strip()) if amount_str else 0.00
        except ValueError:
            total_amount = 0.00

        # টেবিলের বর্ডার (+---+) ও হেডার বাদ দিয়ে ক্লিন প্রোডাক্ট লিস্ট তৈরি
        product_list_array = []
        for line in product_list_text.split('\n'):
            clean_line = line.strip()
            if not clean_line or clean_line.startswith('+'):
                continue
            if clean_line.startswith('|') and clean_line.endswith('|'):
                parts = clean_line.strip('|').split('|')
                if len(parts) == 3:
                    col1 = parts.pop(0).strip()
                    col2 = parts.pop(0).strip()
                    col3 = parts.pop(0).strip()
                    if col1.lower() != 'item':
                        product_list_array.append(f"{col1} (Qty: {col2}, Amount: {col3})")
            else:
                product_list_array.append(clean_line)

        customer, created = Customer.objects.get_or_create(
            mobile=mobile,
            defaults={'name': name}
        )
        if not created:
            customer.name = name
            customer.save()

        # ছবির তারিখ-সময় (যেমন "2026-10-01 18:39") কে Django DateTimeField-এ রূপান্তর করা
        parsed_printed_dt = None
        if raw_dt:
            for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%d %H:%M:%S", "%Y/%m/%d %H:%M"):
                try:
                    naive_dt = datetime.strptime(str(raw_dt).strip(), fmt)
                    parsed_printed_dt = timezone.make_aware(naive_dt)
                    break
                except ValueError:
                    continue

        defaults_data = {
            'customer': customer,
            'total_amount': total_amount,
            'product_list': product_list_array,
            'printed_datetime': parsed_printed_dt,
            'status': order_status,
        }

        bill, bill_created = Bill.objects.update_or_create(
            bill_id=bill_id,
            defaults=defaults_data
        )

        # টেম্পোরারি ইমেজ থাকলে সেটিকে স্থায়ীভাবে bill_image ফিল্ডে সেভ করা
        if temp_image_path and default_storage.exists(temp_image_path):
            full_temp_path = default_storage.path(temp_image_path)
            with open(full_temp_path, 'rb') as f:
                bill.bill_image.save(os.path.basename(temp_image_path), ContentFile(f.read()), save=True)
            os.remove(full_temp_path)

        return Response({
            "message": "Bill saved successfully!",
            "bill_id": bill.bill_id,
            "printed_datetime": bill.printed_datetime.strftime("%Y-%m-%d %H:%M") if bill.printed_datetime else None
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        traceback.print_exc()
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 3. Fetch single bill by printed bill_id (e.g., GET /api/bills/B-1001/)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_bill_by_id(request, bill_id):
    try:
        bill = Bill.objects.select_related('customer').get(bill_id__iexact=bill_id)
        return Response({
            "id": bill.id,
            "bill_id": bill.bill_id,
            "customer_name": bill.customer.name if bill.customer else "Unknown",
            "mobile": bill.customer.mobile if bill.customer else "Unknown",
            "total_amount": float(bill.total_amount),
            "product_list": bill.product_list,
            "printed_datetime": bill.printed_datetime.strftime("%Y-%m-%d %H:%M") if bill.printed_datetime else "N/A",
            "bill_image": request.build_absolute_uri(bill.bill_image.url) if bill.bill_image else None,
            "status": bill.status,
            "created_at": bill.created_at.strftime("%Y-%m-%d %I:%M %p") if bill.created_at else "N/A",
        }, status=status.HTTP_200_OK)
    except Bill.DoesNotExist:
        return Response({"error": f"Bill '{bill_id}' not found."}, status=status.HTTP_404_NOT_FOUND)


# 4. Fetch all saved bills with Search, Filter, Ordering, and Pagination
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_bills_list(request):
    try:
        bills = Bill.objects.select_related('customer').all().order_by('-id')

        # Search by bill_id or customer_name (?search=B-1001)
        search_query = request.GET.get('search', '').strip()
        if search_query:
            bills = bills.filter(
                Q(bill_id__icontains=search_query) |
                Q(customer__name__icontains=search_query)
            )

        # Filter by customer name/mobile (?customer=Rahim)
        customer_filter = request.GET.get('customer', '').strip()
        if customer_filter:
            bills = bills.filter(
                Q(customer__name__icontains=customer_filter) |
                Q(customer__mobile__icontains=customer_filter)
            )

        # Filter by printed date (?printed_date=2026-10-01)
        printed_date_filter = (request.GET.get('printed_date') or request.GET.get('printed_at') or '').strip()
        if printed_date_filter:
            bills = bills.filter(printed_datetime__date=printed_date_filter)

        # Ordering (?ordering=-total_amount or ?ordering=printed_datetime)
        ordering = request.GET.get('ordering', '').strip()
        if ordering in ['total_amount', '-total_amount', 'bill_id', '-bill_id', 'printed_datetime', '-printed_datetime', 'id', '-id']:
            bills = bills.order_by(ordering)

        # Pagination (?page=1)
        page_number = request.GET.get('page')
        if page_number:
            paginator = Paginator(bills, 10)
            page_obj = paginator.get_page(page_number)
            bills_to_serialize = page_obj.object_list
        else:
            bills_to_serialize = bills

        bill_data = []
        for bill in bills_to_serialize:
            bill_data.append({
                "id": bill.id,
                "bill_id": bill.bill_id,
                "customer_name": bill.customer.name if bill.customer else "Unknown",
                "mobile": bill.customer.mobile if bill.customer else "Unknown",
                "total_amount": float(bill.total_amount),
                "product_list": bill.product_list,
                "printed_datetime": bill.printed_datetime.strftime("%Y-%m-%d %H:%M") if bill.printed_datetime else "N/A",
                "bill_image": request.build_absolute_uri(bill.bill_image.url) if bill.bill_image else None,
                "status": bill.status,
                "created_at": bill.created_at.strftime("%Y-%m-%d %I:%M %p") if bill.created_at else "N/A",
            })

        if page_number:
            return Response({
                "count": paginator.count,
                "total_pages": paginator.num_pages,
                "current_page": page_obj.number,
                "results": bill_data
            }, status=status.HTTP_200_OK)

        return Response(bill_data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 5. Update order status dynamically from the frontend details modal
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_order_status(request):
    data = request.data
    bill_id = data.get('bill_id')
    new_status = data.get('status')
    
    try:
        bill = Bill.objects.get(bill_id=bill_id)
        bill.status = new_status
        bill.save()
        return Response({"message": "Order status updated successfully!"}, status=status.HTTP_200_OK)
    except Bill.DoesNotExist:
        return Response({"error": "Bill not found."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
