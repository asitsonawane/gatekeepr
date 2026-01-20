# Gatekeepr

Tool Access Management App.

## 🚀 Quick Start

### 1. Start the Backend (Go)
The backend runs on port `8080`.
```bash
cd server
go run cmd/api/main.go
```

### 2. Start the Frontend (React)
The frontend runs on `http://localhost:5173`.
```bash
# In a new terminal
npm install
npm run dev
```

## 🧪 How to Test

### Backend Verification
You can use `curl` to test the API directly.

**Health Check:**
```bash
curl http://localhost:8080/health
# Output: OK
```

**Login (Get Token):**
```bash
curl -X POST http://localhost:8080/login -d '{"email":"admin@gatekeepr.com"}'
# Output: {"token":"..."}
```

**Test Protected Endpoint:**
```bash
# Copy the token from above and replace <TOKEN>
curl -H "Authorization: Bearer <TOKEN>" http://localhost:8080/me
```

### Frontend Verification
Open `http://localhost:5173` in your browser.
*Currently, the Frontend is using Mock Data and is not yet connected to the Backend API.*
