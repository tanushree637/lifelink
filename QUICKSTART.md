# LifeLink - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Firebase Configuration (2 min)

1. Follow `FIREBASE_SETUP.md` to create Firebase project
2. Get your credentials
3. Update `server/.env` with Firebase details

```bash
# server/.env
PORT=5000
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@project.iam.gserviceaccount.com
JWT_SECRET=your-super-secret-key-change-this
NODE_ENV=development
```

### Step 2: Install Dependencies (2 min)

```bash
# Backend
cd server
npm install

# Frontend (in a new terminal)
cd client
npm install
```

### Step 3: Start Development Servers (1 min)

**Terminal 1 - Backend:**

```bash
cd server
npm run dev
```

✅ Backend running at `http://localhost:5000`

**Terminal 2 - Frontend:**

```bash
cd client
npm start
```

✅ Frontend running at `http://localhost:3000`

## 🧪 Test the Application

### 1. Create Admin User

- Go to Firebase Firestore Console
- Create new document in `users` collection:

```json
{
  "email": "admin@test.com",
  "name": "Admin User",
  "role": "admin",
  "status": "approved",
  "password": "[use an online bcrypt hasher to hash 'admin123']"
}
```

### 2. Admin Approves Hospital

- Login as admin
- Go to "Pending Approvals"
- Create new hospital:
  - Email: hospital@test.com
  - Password: hospital123
  - Hospital Name: Test Hospital
  - City: New York
  - License: LIC123456
- Admin approves it

### 3. Create Blood Request

- Register as recipient
- Wait for admin approval
- Create emergency request:
  - Blood Group: O+
  - Urgency: High
  - Patient: John Doe
  - Hospital: Test Hospital

### 4. Donor Matches Request

- Register as donor
  - Blood Group: O+
  - Location: New York
- Wait for admin approval
- View nearby requests
- Accept request

### 5. Hospital Verifies

- Login as hospital
- See pending donation
- Enter OTP (any 6 digits in test mode)
- Mark as verified

## 📁 Project Structure

```
LifeLink/
├── server/                 # Backend
│   ├── routes/             # API route handlers
│   ├── config/firebase.js  # Firebase setup
│   ├── middleware/auth.js  # JWT verification
│   ├── server.js           # Main server
│   ├── package.json
│   ├── .env               # ⚠️ Create this
│   └── .env.example       # Template
│
├── client/                 # Frontend
│   ├── src/
│   │   ├── pages/          # 4 dashboards + auth pages
│   │   ├── components/     # Navigation, reusable components
│   │   ├── context/        # Auth state management
│   │   ├── utils/          # API client
│   │   ├── styles/         # CSS styling
│   │   └── App.js          # Main app with routing
│   ├── package.json
│   ├── .env               # Optional for development
│   └── .env.example       # Template
│
├── README.md              # Full documentation
├── FIREBASE_SETUP.md      # Firebase instructions
├── QUICKSTART.md          # This file
├── .gitignore             # Git ignore rules
└── package.json          # Optional workspace config

```

## 🚀 Common Commands

### Backend

```bash
# Development with auto-reload
npm run dev

# Production start
npm start

# Install new package
npm install package-name
```

### Frontend

```bash
# Start development server
npm start

# Build for production
npm build

# Run tests
npm test

# Install new package
npm install package-name
```

## 🔧 Troubleshooting

### Issue: "Port 5000 already in use"

```bash
# Kill process on Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Issue: "Cannot connect to Firebase"

- ✅ Check `.env` file has all credentials
- ✅ Verify Firestore is enabled in Firebase Console
- ✅ Check firestore rules allow operations

### Issue: "Login keeps failing"

- ✅ Make sure user status is "approved" in Firestore
- ✅ Check browser console for error details
- ✅ Verify JWT_SECRET is set in .env

### Issue: "CORS errors"

- ✅ Backend CORS already configured
- ✅ Check frontend API URL in axios calls
- ✅ Verify backend is running

## 📊 API Testing with Postman

### 1. Register

```
POST http://localhost:5000/api/auth/register
Headers: Content-Type: application/json
Body: {
  "email": "donor@test.com",
  "password": "pass123",
  "name": "John Donor",
  "role": "donor",
  "phone": "1234567890",
  "bloodGroup": "O+",
  "location": "New York"
}
```

### 2. Login

```
POST http://localhost:5000/api/auth/login
Headers: Content-Type: application/json
Body: {
  "email": "donor@test.com",
  "password": "pass123"
}
```

### 3. Get Nearby Requests

```
GET http://localhost:5000/api/donors/requests/nearby
Headers: Authorization: Bearer <your_token>
```

## 🎯 What Each Role Can Do

### Donor 🩸

- ✅ Register with blood type
- ✅ Toggle availability
- ✅ View nearby emergency requests
- ✅ Accept requests
- ✅ Track donation history

### Recipient 🆘

- ✅ Create blood requests
- ✅ Specify urgency level
- ✅ Track request status
- ✅ View matched donors

### Hospital 🏥

- ✅ View pending donations
- ✅ Verify with OTP
- ✅ Track all donations
- ✅ Manage inventory

### Admin 👨‍💼

- ✅ Approve/reject users
- ✅ View statistics
- ✅ Monitor activities
- ✅ Manage system

## 🌐 Frontend URLs

| Page                | URL                    | Requires        |
| ------------------- | ---------------------- | --------------- |
| Home                | `/`                    | None            |
| Login               | `/login`               | None            |
| Sign Up             | `/signup`              | None            |
| Donor Dashboard     | `/donor/dashboard`     | Donor login     |
| Recipient Dashboard | `/recipient/dashboard` | Recipient login |
| Hospital Dashboard  | `/hospital/dashboard`  | Hospital login  |
| Admin Dashboard     | `/admin/dashboard`     | Admin login     |

## 📚 Documentation Files

- `README.md` - Full project documentation
- `FIREBASE_SETUP.md` - Step-by-step Firebase setup
- `QUICKSTART.md` - This file (quick setup guide)

## 🆘 Need Help?

1. **Check Logs** - Look at terminal output for errors
2. **Browser Console** - Press F12, check Console tab
3. **Read Docs** - Check README.md and FIREBASE_SETUP.md
4. **Firebase Console** - Verify data was created correctly

## 🎉 Next Steps

After confirming everything works:

1. **Customize UI** - Update colors, logos in CSS files
2. **Add Features** - Email notifications, SMS, etc.
3. **Deploy** - Push to Heroku (backend) and Vercel (frontend)
4. **Scale** - Implement geolocation matching algorithm
5. **Monitor** - Set up analytics and error tracking

## 📝 Notes

- This is a development setup
- For production:
  - Change JWT_SECRET to a strong random string
  - Enable Firebase security rules
  - Set up HTTPS
  - Add environment-specific configs
  - Deploy to production servers

---

**You're all set! 🚀 Happy coding!**
