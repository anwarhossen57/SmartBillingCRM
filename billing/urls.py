from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# Importing views from the modular views folder
from billing.views.auth_views import (
    RegisterView,
    manage_users,
    update_user_access,
    user_settings,
)
from billing.views.bill_views import (
    scan_bill,
    save_bill,
    get_bills_list,
    get_bill_by_id,
    update_order_status,
)
from billing.views.customer_views import get_customers_list
from billing.views.dashboard_views import get_dashboard_stats

urlpatterns = [
    # Auth & User Management URLs
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/users/', manage_users, name='manage_users'),
    path('api/users/<int:user_id>/update/', update_user_access, name='update_user_access'),
    path('api/settings/', user_settings, name='user_settings'),

    # CRM & Billing APIs
    path('api/scan-bill/', scan_bill, name='scan_bill'),
    path('api/save-bill/', save_bill, name='save_bill'),
    path('api/bills/', get_bills_list, name='bills_list'),
    path('api/bills/<str:bill_id>/', get_bill_by_id, name='bill_detail_by_id'),
    path('api/orders/', get_bills_list, name='orders'),
    path('api/customers/', get_customers_list, name='customers'),
    path('api/dashboard-stats/', get_dashboard_stats, name='dashboard_stats'),
    path('api/update-order-status/', update_order_status, name='update_order_status'),
]
