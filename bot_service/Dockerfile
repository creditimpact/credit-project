FROM python:3.10-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install wkhtmltopdf for pdfkit
RUN apt-get update \
    && apt-get install -y wkhtmltopdf \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=6000

CMD ["sh", "-c", "gunicorn -b 0.0.0.0:$PORT main:app"]
