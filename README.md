# 🧾 SmartBillingCRM — Automated OCR Billing & Customer Management System

An intelligent, full-stack **Customer Relationship Management (CRM) & Automated Billing System** built with **Django REST Framework**, **PostgreSQL**, **Next.js**, and **EasyOCR**. The application extracts structured invoice data from receipt images, auto-populates billing forms with human-in-the-loop verification, links records to customers, and provides JWT-secured search, filtering, ordering, and pagination APIs.

---

## 🚀 Key Features

- **JWT Authentication & Role-Based Access:** Secure user registration (with mobile number), login, token refresh, and role-based user access control using `djangorestframework-simplejwt`.
- **Automated Receipt OCR Engine:** Upload bill images (`PNG`/`JPG`) via a JWT-protected endpoint (`/api/scan-bill/`). Uses image upscaling and **EasyOCR** to extract:
  - Printed Bill ID (e.g., `B-1001`)
  - Customer Name
  - Mobile Number
  - Product List (Item, Quantity, Amount)
  - Total Amount
  - Printed Bill Date & Time
  - Full Raw OCR Text (for manual verification)
- **Human-in-the-Loop Billing Form:** Automatically populates the Next.js billing form from the OCR JSON response, allowing staff to review and correct any OCR misreads before saving to PostgreSQL.
- **Customer Auto-Linking:** Automatically links saved bills to existing customers via mobile number or creates a new customer record if not found.
- **Advanced Bill Lookup, Search & Filtering:**
  - Retrieve a single bill directly by its **Printed Bill ID** (`GET /api/bills/<bill_id>/`).
  - Search by `bill_id` or `customer_name`.
  - Filter by `customer` or `printed_date`.
  - Dynamic sorting (`ordering`) and pagination (`page`).
- **Dynamic Dashboard & Reports:** Real-time revenue KPIs, active customer counts, product inventory extracted from scanned bills, and one-click CSV report exports.

---

## 🛠️ Tech Stack

- **Backend:** Python, Django, Django REST Framework (DRF), SimpleJWT
- **Database:** PostgreSQL
- **OCR & Image Processing:** EasyOCR, Pillow (PIL), OpenCV
- **Frontend:** Next.js (App Router), React, TypeScript/JavaScript, Tailwind CSS

---

## 📂 Project Structure

```text
SmartBillingCRM/
├── billing/                  # Core Django app (Models, Serializers, Modular Views, OCR Utils)
│   ├── views/
│   │   ├── auth_views.py     # Registration, User Management & Profile Settings
│   │   ├── bill_views.py     # OCR Scan, Save Bill, Bill Lookup, Search/Filter/Pagination
│   │   ├── customer_views.py # Customer Directory API
│   │   └── dashboard_views.py# Revenue & KPI Analytics API
├── smart_crm/                # Django Project Settings & Root URLs
├── smart_crm_frontend/       # Next.js Frontend Application
│   ├── app/                  # App Router Pages & Layout
│   └── components/           # Dashboard, SubmitBill, Orders, Customers, Products, Reports, Users, Settings
├── fake_bills/               # 20 Synthetic Sample Bill Images (B-1001 to B-1020)
├── generate_report.py        # Script to generate OCR vs. Database Manual Comparison Report
└── manage.py
```

---

## ⚙️ Installation & Setup

### 1. Backend Setup (Django + PostgreSQL)

```bash
# Clone the repository
git clone <your-github-repo-url>
cd SmartBillingCRM

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate      # On Windows
# source venv/bin/activate # On Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Configure PostgreSQL database in smart_crm/settings.py, then run migrations
python manage.py makemigrations
python manage.py migrate

# Start the Django development server
python manage.py runserver
```

### 2. Frontend Setup (Next.js)

```bash
cd smart_crm_frontend
npm install
npm run dev
```

- **Frontend URL:** `http://localhost:3000`
- **Backend API Base URL:** `http://127.0.0.1:8000`

---

## 🔌 API Endpoints Overview

All `/api/bills/` and `/api/scan-bill/` endpoints require the header:
`Authorization: Bearer <access_token>`

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/register/` | Register a new user with mobile number | No |
| `POST` | `/api/login/` | Obtain JWT `access` and `refresh` tokens | No |
| `POST` | `/api/token/refresh/` | Refresh expired access token | No |
| `POST` | `/api/scan-bill/` | Upload receipt image (`form-data`) & extract OCR JSON | Yes |
| `POST` | `/api/save-bill/` | Save verified bill data & link customer | Yes |
| `GET` | `/api/bills/` | List bills with `search`, `customer`, `printed_date`, `ordering`, `page` | Yes |
| `GET` | `/api/bills/<bill_id>/` | Retrieve a single bill by its **Printed Bill ID** (e.g., `B-1001`) | Yes |
| `POST` | `/api/update-order-status/` | Update bill status (`Pending` / `Completed`) | Yes |
| `GET` | `/api/customers/` | List all registered customers | Yes |
| `GET` | `/api/dashboard-stats/` | Fetch total revenue, bill count, and active customers | Yes |

### Example Query Parameters
- **Search:** `GET /api/bills/?search=Sadia`
- **Filter by Printed Date:** `GET /api/bills/?printed_date=2026-10-31`
- **Ordering & Pagination:** `GET /api/bills/?ordering=-total_amount&page=1`

---

## 📊 OCR Comparison Report

To generate the side-by-side comparison report (Image vs. Raw OCR Text vs. Saved Database Values) across all 20 synthetic bills:

```bash
python generate_report.py
```
This outputs `OCR_Comparison_Report.html`, which can be opened in any browser and saved as a PDF.

---

## 📝 Disclaimer
All customer names, mobile numbers, and invoice images included in `fake_bills/` are 100% synthetic/fake data generated strictly for educational and testing purposes.
