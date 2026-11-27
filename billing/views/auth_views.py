from rest_framework import generics, status
from django.contrib.auth.models import User
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from billing.serializers import RegisterSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer


# 1. Fetch all real users or create a new user from User Access Management page
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_users(request):
    if request.method == 'GET':
        users = User.objects.all().order_by('id')
        data = []
        for u in users:
            full_name = f"{u.first_name} {u.last_name}".strip() or u.username.capitalize()
            if u.is_superuser:
                role = "Administrator"
            elif u.is_staff:
                role = "Billing Clerk"
            else:
                role = "Viewer"

            data.append({
                "id": u.id,
                "name": full_name,
                "username": u.username,
                "email": u.email or f"{u.username}@smartcrm.com",
                "role": role,
                "is_active": u.is_active,
            })
        return Response(data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        data = request.data
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()
        full_name = data.get('name', '').strip()
        role = data.get('role', 'Billing Clerk')

        if not username or not password:
            return Response({"error": "Username and password are required."}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already exists."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, email=email, password=password)
        if full_name:
            name_parts = full_name.split(' ', 1)
            user.first_name = name_parts.pop(0)
            if name_parts:
                user.last_name = name_parts.pop(0)

        user.is_superuser = (role == 'Administrator')
        user.is_staff = (role in ['Administrator', 'Billing Clerk'])
        user.save()
        return Response({"message": "User created successfully!"}, status=status.HTTP_201_CREATED)


# 2. Update user role, status (Active/Inactive), or reset password
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_user_access(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        data = request.data

        if 'role' in data:
            role = data['role']
            user.is_superuser = (role == 'Administrator')
            user.is_staff = (role in ['Administrator', 'Billing Clerk'])

        if 'is_active' in data:
            user.is_active = bool(data['is_active'])

        if data.get('password'):
            user.set_password(data['password'])

        user.save()
        return Response({"message": "User updated successfully!"}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)


# 3. Get or update currently logged-in user's profile & password
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def user_settings(request):
    user = request.user
    if request.method == 'GET':
        full_name = f"{user.first_name} {user.last_name}".strip() or user.username
        return Response({
            "username": user.username,
            "name": full_name,
            "email": user.email or f"{user.username}@smartcrm.com",
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        data = request.data
        full_name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        new_password = data.get('new_password', '').strip()

        if full_name:
            parts = full_name.split(' ', 1)
            user.first_name = parts.pop(0)
            user.last_name = parts.pop(0) if parts else ""
        if email:
            user.email = email
        if new_password:
            user.set_password(new_password)

        user.save()
        return Response({"message": "Account settings updated successfully!"}, status=status.HTTP_200_OK)
