from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from billing.models import Customer

@api_view(['GET'])
@permission_classes([IsAuthenticated]) # <--- কাস্টমার লিস্ট এপিআই সিকিউর করা হলো
def get_customers_list(request):
    customers = Customer.objects.all().order_by('-id')
    
    customer_data = [
        {
            "id": c.id,
            "name": c.name,
            "mobile": c.mobile,
            "created_at": c.created_at.strftime("%Y-%m-%d %H:%M") if hasattr(c, 'created_at') and c.created_at else "N/A"
        }
        for c in customers
    ]
    return Response(customer_data)