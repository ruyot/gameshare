FROM python:3.11-slim

WORKDIR /app

# Copy only the necessary files
COPY web_server_fly.py .
COPY *.html .
COPY index.html .

# Set environment variable
ENV PORT=8080

# Expose port
EXPOSE 8080

# Run the server
CMD ["python", "web_server_fly.py"]