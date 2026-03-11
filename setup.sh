#!/bin/bash
echo "========================================"
echo " BanyanVision Fashion - Setup Script"
echo "========================================"

# Get the directory where this script lives
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "📦 Installing Backend dependencies..."
cd "$SCRIPT_DIR/backend"
npm install
echo "✅ Backend packages installed"

echo ""
echo "📦 Installing Frontend dependencies..."
cd "$SCRIPT_DIR/frontend"
npm install
echo "✅ Frontend packages installed"

echo ""
echo "========================================"
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Copy backend/.env.example → backend/.env"
echo "  2. Fill in your MongoDB, Cloudinary, Razorpay keys"
echo "  3. Terminal 1: cd backend && npm run dev"
echo "  4. Terminal 2: cd frontend && npm start"
echo "========================================"
