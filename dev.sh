#!/bin/bash
# Lance un serveur local pour développer Depensa
# Usage: ./dev.sh
# Puis ouvrir: http://localhost:8080/app.html

echo "🚀 Depensa dev server → http://localhost:8080/app.html"
python3 -m http.server 8080
