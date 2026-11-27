FROM python:3.10-slim
WORKDIR /app
RUN apt-get update && apt-get install -y tesseract-ocr libgl1 libglib2.0-0
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["sh", "-c", "python manage.py migrate --noinput && gunicorn smart_crm.wsgi:application --bind 0.0.0.0:8000"]
