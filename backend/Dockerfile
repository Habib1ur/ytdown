# Use a Node base image
FROM node:20-slim

# Install system dependencies: ffmpeg, python3 (for yt-dlp), and curl
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Manually download yt-dlp so we don't depend on npm postinstall
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Set environment variable to skip the problematic youtube-dl-exec download
ENV YOUTUBE_DL_SKIP_DOWNLOAD=true

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the port (Render uses 10000 by default, but we'll use 8080 as per your config)
EXPOSE 8080

# Start the application
CMD ["npm", "start"]
