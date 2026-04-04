# Firebase Setup Guide for LifeLink

## Prerequisites

- Google Cloud Account
- Node.js and npm installed

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter "LifeLink" as project name
4. Click "Continue"
5. Enable Google Analytics (optional)
6. Click "Create project"

## Step 2: Set up Firestore Database

1. In Firebase console, select your project
2. Click "Build" -> "Firestore Database"
3. Click "Create database"
4. Select region closest to you
5. Start in **Test mode** (for development)
6. Click "Create"

## Step 3: Create Collections

You'll create these collections in Firestore:

- `users` - All platform users (donors, recipients, hospitals, admins)
- `emergencyRequests` - Blood requests
- `donations` - Donation records
- `suspiciousActivity` - Activity logs

Firestore will auto-create collections when you add documents.

## Step 4: Set up Authentication (Optional for Frontend)

1. In Firebase console, click "Build" -> "Authentication"
2. Click "Get started"
3. Enable "Email/Password" provider
4. Save your Web API Key for the frontend config

## Step 5: Get Firebase Admin SDK Credentials

### For Backend (Node.js):

1. In Firebase console, click ⚙️ (Settings) -> "Project settings"
2. Go to "Service accounts" tab
3. Click "Generate new private key"
4. Save the JSON file

### Extract these values and add to `.env`:

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

**Important**: When copying `FIREBASE_PRIVATE_KEY`, keep the newline characters as `\n`

## Step 6: Clean CORS and Security Rules

1. In Firestore console, click "Rules"
2. Replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Read and write all data if signed in
    match /{document=**} {
      allow read, write: if request.auth != null;
      allow read, write: if request.resource.data.status == "approved";
    }
  }
}
```

3. Click "Publish"

## Step 7: Get Web API Key (for Frontend)

1. Go back to "Project settings"
2. Go to "General" tab
3. Scroll down to find "Web API Key"
4. You'll use this to configure Firebase in the React app (optional for future frontend auth)

## Step 8: Update Environment Variables

### Backend (server/.env):

```
PORT=5000
FIREBASE_PROJECT_ID=xxxxxx
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@xxxxx.iam.gserviceaccount.com
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

### Frontend (client/.env) - Optional later:

```
REACT_APP_FIREBASE_API_KEY=xxxxx
REACT_APP_FIREBASE_AUTH_DOMAIN=xxxxx
REACT_APP_FIREBASE_PROJECT_ID=xxxxx
REACT_APP_FIREBASE_STORAGE_BUCKET=xxxxx
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=xxxxx
REACT_APP_FIREBASE_APP_ID=xxxxx
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

## Step 9: Install Dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

## Step 10: Start Development Servers

### Terminal 1 - Backend:

```bash
cd server
npm run dev
```

### Terminal 2 - Frontend:

```bash
cd client
npm start
```

Backend will run on: `http://localhost:5000`
Frontend will run on: `http://localhost:3000`

## Database Structure

### users collection

```javascript
{
  email: "user@example.com",
  password: "hashed_password",
  name: "User Name",
  role: "donor|recipient|hospital|admin",
  phone: "+1234567890",
  status: "pending|approved|rejected",
  createdAt: timestamp,

  // If role = 'donor':
  bloodGroup: "O+",
  location: "City Name",
  available: true,
  medicalHistory: [],

  // If role = 'hospital':
  hospitalName: "Hospital Name",
  address: "Address",
  city: "City",
  license: "License Number"
}
```

### emergencyRequests collection

```javascript
{
  recipientId: "user_id",
  hospitalId: "hospital_id",
  bloodGroup: "O+",
  urgencyLevel: "high|medium|low",
  quantity: 1,
  patientName: "Patient Name",
  status: "active|donor-assigned|completed|cancelled",
  assignedDonor: "donor_id",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### donations collection

```javascript
{
  donorId: "donor_id",
  requestId: "request_id",
  hospitalId: "hospital_id",
  status: "pending|completed",
  createdAt: timestamp,
  verifiedAt: timestamp,
  verifiedBy: "hospital_id"
}
```

## Testing the Application

1. **Register as Donor**:
   - Go to Signup, select "Donor" role
   - Fill in all details
   - Wait for admin approval

2. **Register as Hospital**:
   - Go to Signup, select "Hospital" role
   - Fill in hospital details
   - Wait for admin approval

3. **Admin Approval**:
   - Create an admin user (manually in Firestore or use signup with "admin" role, then manually set status to "approved" in Firestore)
   - Login as admin
   - Approve pending users

4. **Create Emergency Request**:
   - Login as recipient
   - Create emergency request
   - Donors will see it in their dashboard

## Troubleshooting

### CORS Issues

Make sure the backend has proper CORS configuration in `server.js`

### Firebase Connection Issues

- Check `.env` file has correct credentials
- Verify Firestore is enabled
- Check firestore rules allow operations

### Authentication Issues

- Verify JWT_SECRET is set
- Check token is being sent in Authorization header

## Next Development Steps

1. Add real-time location tracking for donors
2. Implement OTP verification
3. Add payment integration
4. Implement email notifications
5. Add SMS notifications
6. Implement geolocation-based matching algorithm
7. Add admin analytics dashboard
8. Implement activity logging and suspicious activity detection
