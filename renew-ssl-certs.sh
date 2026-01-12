#!/bin/bash

# SSL Certificate Renewal Script
# Automatically renews SSL certificates for multiple domains

# Log file location
LOG_FILE="/var/log/ssl-renewal.log"

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_message "Starting SSL certificate renewal process"

# Stop Apache2 to free up port 80/443 for certbot standalone mode
log_message "Stopping Apache2"
sudo systemctl stop apache2

# Renew specific certificates only (excluding api.anthonyarseneau.ca)
log_message "Running certbot renew for specific domains"
sudo certbot renew --cert-name anthonyarseneau.ca --non-interactive --agree-tos >> "$LOG_FILE" 2>&1
sudo certbot renew --cert-name ranz-bontogon.com --non-interactive --agree-tos >> "$LOG_FILE" 2>&1
sudo certbot renew --cert-name arseneau.ai --non-interactive --agree-tos >> "$LOG_FILE" 2>&1

# Restart Apache2
log_message "Restarting Apache2"
sudo systemctl start apache2

log_message "SSL certificate renewal process completed"
