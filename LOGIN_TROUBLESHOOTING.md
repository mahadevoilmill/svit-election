# Login Troubleshooting Guide

## ✅ Server Status
- **Endpoint:** http://localhost:5000/login
- **Status:** ✅ Working (Returns 200 OK)
- **Response:** `{ success: true }`

## 🔐 Login Credentials
- **ID:** `NEST` (case-sensitive)
- **Password:** `sardar123` (case-sensitive)

## 🐛 If Login is Not Working

### Step 1: Clear Browser Cache
Press these keys together:
- **Windows/Linux:** `Ctrl + Shift + Delete`
- **Mac:** `Cmd + Shift + Delete`

Then:
1. Select "Cached images and files"
2. Click "Clear data"
3. Close and reopen browser

### Step 2: Hard Refresh
1. Go to http://localhost:5000
2. Press: `Ctrl + F5` (Windows/Linux) or `Cmd + Shift + R` (Mac)

### Step 3: Check Browser Console
1. Open Developer Tools: `F12` or `Ctrl + Shift + I`
2. Go to "Console" tab
3. Look for any error messages
4. When you try to login, watch for messages showing:
   - "Attempting login with: { username: 'NEST', password: 'sardar123' }"
   - "Response status: 200"
   - "Response data: { success: true }"

### Step 4: Try Different Browser
If above doesn't work, try:
- Chrome
- Firefox
- Edge
- Safari

### Step 5: Check Network Tab
1. Open Developer Tools: `F12`
2. Go to "Network" tab
3. Try to login
4. Click on the "login" request
5. Check:
   - **Status:** Should be 200
   - **Request body:** Should show `{"username":"NEST","password":"sardar123"}`
   - **Response:** Should show `{"success":true}`

## 📋 Credentials Summary

| Field | Value | Notes |
|-------|-------|-------|
| **ID** | NEST | Must be EXACT - uppercase |
| **Password** | sardar123 | Must be EXACT - lowercase |

## ✅ Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Connection error" | Make sure server is running (npm start) |
| "Incorrect ID or password" | Check caps - ID is NEST, password is sardar123 |
| Blank page | Clear cache with Ctrl+Shift+Delete |
| Still on login page after submit | Check browser console for errors (F12) |

## 🧪 Test from Terminal
Run this to verify login works:
```bash
node test_login.js
```

Should show: `✔️ Login successful!`

## 🔧 Reset Everything
If all else fails:
```bash
# Kill the server
pkill -f "node server.js"

# Wait 2 seconds
sleep 2

# Start server fresh
npm start
```

Then:
1. Close browser completely
2. Open new browser window
3. Go to http://localhost:5000
4. Try login again
