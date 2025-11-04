FROM python:3.11-slim
WORKDIR /app

# Install system deps for pdfplumber and other libs
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpoppler-cpp-dev \
    poppler-utils \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY . .

ENV FLASK_APP=final_prototype.py
ENV FLASK_ENV=production
EXPOSE 5000

CMD ["python", "final_prototype.py"]
