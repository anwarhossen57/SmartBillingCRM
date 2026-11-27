from django.db import models

class Customer(models.Model):
    name = models.CharField(max_length=150)
    mobile = models.CharField(max_length=20, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.mobile}"

class Bill(models.Model):
    bill_id = models.CharField(max_length=50, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='bills')
    
    # Field to store the OCR-extracted product list in JSON format
    product_list = models.JSONField(default=list)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Added null=True, blank=True so the system doesn't crash if OCR misses the date
    printed_datetime = models.DateTimeField(null=True, blank=True) 
    
    # Field for uploading the bill image
    bill_image = models.ImageField(upload_to='bill_images/', null=True, blank=True)
    
    # Order status choices for professional tracking
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Processing', 'Processing'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    ]
    
    # Order status field with default set to Pending
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    
    # Automatically records the date and time when the bill is created
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Bill {self.bill_id} - {self.customer.name}"