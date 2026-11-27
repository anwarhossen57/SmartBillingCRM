FROM python:3.10-slim
WORKDIR /app
RUN apt-get update && apt-get install -y libgl1 libglib2.0-0
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn dj-database-url psycopg2-binary whitenoise
COPY . .
EXPOSE 7860
CMD ["sh", "-c", "python manage.py migrate && gunicorn smart_crm.wsgi:application --bind 0.0.0.0:7860"]
