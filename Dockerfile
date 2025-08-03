FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json .

# Install dependencies
RUN npm install

# Copy all necessary files
COPY signaling_server.js .
COPY web_server_fly.py .
COPY *.html .
COPY index.html .

# Install Python for the web server
RUN apk add --no-cache python3 py3-pip

# Create a startup script
RUN echo '#!/bin/sh' > start.sh && \
    echo 'python3 web_server_fly.py' >> start.sh && \
    chmod +x start.sh

# Set environment variables
ENV PORT=8080
ENV SIGNALING_PORT=3000

# Expose ports
EXPOSE 8080 3000

# Run both servers
CMD ["./start.sh"]