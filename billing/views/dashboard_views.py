from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum
from billing.models import Customer, Bill

@api_view(['GET'])
@permission_classes([IsAuthenticated]) # <--- ড্যাশবোর্ড স্ট্যাটস এপিআই সিকিউর করা হলো
def get_dashboard_stats(request):
    total_revenue = Bill.objects.aggregate(sum_amount=Sum('total_amount'))['sum_amount'] or 0.00
    total_bills = Bill.objects.count()
    active_customers = Customer.objects.count()
    
    return Response({
        "total_revenue": float(total_revenue),
        "total_bills": total_bills,
        "active_customers": active_customers
    })