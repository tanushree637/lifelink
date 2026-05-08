# Dashboard Data Synchronization Guide

## Overview

All dashboards in LifeLink are now fully synced with Firestore. This guide explains how to seed mock data and ensure dashboards display all available data.

## Quick Start

### 1. Seed the Database with Mock Data

```bash
# From project root or server directory
node server/seed.js
# OR
cd server && node seed.js
```

The seed script now works from any directory and automatically:

- Initializes Firebase connection
- Seeds 5 hospitals with approved status
- Seeds 5 donors with approved status
- Seeds 5 recipients with approved status
- Seeds sample emergency requests
- Seeds sample donations with "completed" status
- Logs test credentials

### 2. Refresh Dashboard Data

Each dashboard now has a **🔄 Refresh** button in the top banner that forces a data sync with Firestore:

- **Admin Dashboard**: Refreshes users, requests, statistics
- **Donor Dashboard**: Refreshes profile, requests, history, certificates
- **Hospital Dashboard**: Refreshes profile, requests, donations, stats
- **Recipient Dashboard**: Refreshes requests and available hospitals

Click the refresh button to manually sync data at any time.

## Data Structure & Relationships

### Collections

#### Users Collection

```javascript
{
  id: "userId",
  name: "Name",
  email: "email@example.com",
  password: "plaintext", // Test data only
  role: "donor" | "hospital" | "recipient" | "admin",
  status: "approved" | "pending" | "rejected",
  bloodGroup: "O+" | "O-" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-",
  available: true | false,
  createdAt: Date,
  // Hospital specific
  hospitalName: "Hospital Name",
  address: "123 Street",
  city: "City Name",
  license: "LICENSE123",
  // Donor specific
  location: "Location",
  lastDonatedAt: Date,
  nextAvailableDate: Date,
}
```

#### Emergency Requests Collection

```javascript
{
  id: "requestId",
  recipientId: "userId",
  hospitalId: "userId",
  patientName: "Patient Name",
  bloodGroup: "O+",
  quantity: 2,
  urgencyLevel: "high" | "medium" | "low",
  status: "pending-verification" | "active" | "donor-assigned" | "completed" | "rejected",
  admissionStatus: "pending" | "admitted" | "not-found" | "rejected",
  createdAt: Date,
  updatedAt: Date,
}
```

#### Donations Collection

```javascript
{
  id: "donationId",
  donorId: "userId",
  hospitalId: "userId",
  recipientId: "userId",
  requestId: "requestId",
  bloodGroup: "O+",
  quantity: 500,
  units: 1,
  status: "pending" | "completed",
  createdAt: Date,
  verifiedAt: Date,
}
```

## Dashboard Data Sources

### Admin Dashboard

#### Home Tab

- **Total Users**: From `users` collection filtered by role
- **Total Donations**: From `donations` collection count
- **Total Requests**: From `emergencyRequests` collection count
- **Pending Users**: From users with `status: "pending"`
- **Suspicious Activity**: From `suspiciousActivity` collection

**New Endpoints**:

- `/admin/all-donations` - All donations with donor/hospital names
- `/admin/all-requests-detailed` - All requests with full details
- `/admin/donor-stats` - Statistics for each approved donor
- `/admin/hospital-stats` - Statistics for each approved hospital

#### Monitor Requests Tab

- Fetches from `/admin/blood-requests` with optional status/urgency filters
- Shows all emergency requests across all hospitals

#### Manage Users Tab

- Fetches from `/admin/all-users` with role/status filters
- Shows all users with approval/rejection actions

#### Reports Tab

- Fetches from `/admin/analytics` with time range filtering
- Shows trends, blood group distribution, success rates

### Donor Dashboard

**Data Fetched**:

- **Profile**: `/donors/profile` - Current donor details
- **Requests**: `/donors/requests/nearby` - Active requests matching blood group
- **History**: `/donors/history` - All donations by current donor
- **Certificates**: `/donors/certificates` - Generated certificates

### Hospital Dashboard

**Data Fetched**:

- **Profile**: `/hospitals/profile` - Hospital details
- **Dashboard Stats**: `/hospitals/dashboard-stats` - Verified patients, rejections, donations
- **Patient Verification**: `/hospitals/patient-verification-requests` - Emergency requests
- **Pending Donations**: `/hospitals/pending-donations` - Donations awaiting verification
- **Donation History**: `/hospitals/donation-history` - All verified donations

### Recipient Dashboard

**Data Fetched**:

- **My Requests**: `/recipients/my-requests` - All emergency requests by current recipient
- **Hospitals**: `/hospitals/list` - Available hospitals for creating requests
- **Donor Search**: `/recipients/search-donors` - Search donors by blood group

## Request Status Flow

```
Emergency Request Status:
pending-verification
    ↓ (Hospital confirms admission)
active
    ↓ (Donor accepts request)
donor-assigned
    ↓ (Donation verified with OTP)
completed ✅

Alternative paths:
pending-verification → rejected (Hospital rejects)
active → cancelled (Recipient cancels)
```

```
Admission Status (separate from request status):
pending
    ↓ (Hospital verifies patient admitted)
admitted ✅

Alternative paths:
pending → not-found (Patient not found)
pending → rejected (Request rejected)
```

```
Donation Status:
pending (Created when donor accepts request)
    ↓ (Hospital OTP verification)
completed ✅ (Certificate generated)
```

## Testing the Sync

### Step 1: Seed Database

```bash
cd server
node seed.js
```

Expected output:

```
🌱 Starting database seeding...
🏥 Seeding hospitals...
   ✅ City General Hospital (ID: xxx)
   ...
👤 Seeding donors...
   ✅ Rajesh Kumar (Blood: O+) (ID: xxx)
   ...
👥 Seeding recipients...
   ✅ Recipient Name (ID: xxx)
   ...
🆘 Seeding emergency requests...
   ✅ Request for O+ (Status: active) (ID: xxx)
   ...
🩸 Seeding donations...
   ✅ Donation: O+ (Units: 1) (ID: xxx)
   ...
```

### Step 2: Login and View Dashboard

**Test Accounts** (from seed output):

**Hospitals**:

- Email: `city-general@hospital.com` / Password: `HospitalPass123`
- Email: `apollo-hospital@hospital.com` / Password: `HospitalPass123`

**Donors**:

- Email: `rajesh.kumar@email.com` / Password: `DonorPass123` (Blood: O+)
- Email: `priya.singh@email.com` / Password: `DonorPass123` (Blood: A+)

**Recipients**:

- Email: `patient1@email.com` / Password: `RecipientPass123`
- Email: `patient2@email.com` / Password: `RecipientPass123`

**Admin**:

- Email: `admin@lifelink.com` / Password: `admin123`

### Step 3: Verify Data Display

1. **Hospital Dashboard**: Should show
   - Patient verification requests (emergency requests)
   - Pending donations for verification
   - Donation history
   - Dashboard stats

2. **Donor Dashboard**: Should show
   - Active requests matching blood group
   - Donation history
   - Total donations count

3. **Recipient Dashboard**: Should show
   - Created emergency requests
   - Available hospitals list

4. **Admin Dashboard**: Should show
   - Total statistics (users, donations, requests)
   - Pending user approvals
   - Monitor requests tab with all requests
   - Reports with analytics

### Step 4: Click Refresh Button

Click the 🔄 Refresh button in any dashboard banner to force data sync with Firestore.

## API Endpoints for Data Sync

### Admin Endpoints

```
GET /admin/statistics - Basic counts (totalUsers, totalDonations, totalRequests)
GET /admin/all-users?role=all&status=all - All users with filtering
GET /admin/blood-requests?status=all&urgency=all - All requests with filtering
GET /admin/analytics?timeRange=30 - Analytics with time range
GET /admin/all-donations - All donations with donor/hospital details
GET /admin/all-requests-detailed - All requests with full details
GET /admin/donor-stats - Statistics for all approved donors
GET /admin/hospital-stats - Statistics for all approved hospitals
GET /admin/suspicious-activity - Flagged suspicious activities
GET /admin/pending-users - Users awaiting approval
```

### Hospital Endpoints

```
GET /hospitals/profile - Hospital information
GET /hospitals/dashboard-stats - Stats (verified patients, rejections, donations)
GET /hospitals/patient-verification-requests - Emergency requests for this hospital
GET /hospitals/pending-donations - Donations awaiting verification
GET /hospitals/donation-history - All verified donations
GET /hospitals/list - All approved hospitals (public)
```

### Donor Endpoints

```
GET /donors/profile - Donor profile and availability
GET /donors/requests/nearby - Active requests matching donor blood group
GET /donors/requests/all-pending - All pending requests (diagnostic)
GET /donors/history - Donation history for this donor
GET /donors/badges - Donor badges earned
GET /donors/certificates - Certificates generated
```

### Recipient Endpoints

```
GET /recipients/my-requests - Emergency requests created by recipient
GET /recipients/search-donors?bloodGroup=O+&location=Mumbai - Search for donors
GET /recipients/available-donors-count - Count of available donors
```

## Troubleshooting

### Dashboards Show No Data

1. **Check if seed ran successfully**:
   - Look for the seed completion message with counts
   - Verify you have test account credentials

2. **Manually refresh dashboard**:
   - Click the 🔄 Refresh button in the dashboard banner
   - Check browser console for any API errors

3. **Check Firebase connection**:
   - Open browser DevTools → Network tab
   - Verify API calls to `/api/admin/...`, `/api/donors/...`, etc.
   - Check response status codes (should be 200)

4. **Verify data in Firestore**:
   - Go to Firebase Console → Firestore
   - Check collections: `users`, `emergencyRequests`, `donations`
   - Verify documents exist with correct fields

### Missing Data in Specific Dashboard

**Hospital shows no requests**:

- Emergency requests must have `hospitalId` matching logged-in hospital
- Request must have `status: "active"` or `status: "pending-verification"`

**Donor shows no requests**:

- Active requests must have `bloodGroup` matching donor's blood group
- Request must have `status: "active"`

**Admin shows zero donors**:

- Donors must have `role: "donor"` AND `status: "approved"`
- Donors created in time range are counted based on `createdAt`

**Reports show no data**:

- Check selected time range
- Donations must have valid `createdAt` date
- Requests must have valid `createdAt` date

## Data Sync Flow

```
User Action (Click Refresh)
    ↓
Dashboard calls API endpoint
    ↓
Server queries Firestore collection
    ↓
Server fetches related data (user names, hospital details, etc.)
    ↓
Server returns complete data with all relationships
    ↓
Frontend state updated with new data
    ↓
UI re-renders with latest data
```

## Notes

- All dashboards now refresh data on mount (initial load)
- Manual refresh button available in each dashboard banner
- New admin endpoints provide comprehensive data views
- Time-range filtering works on Admin Reports
- User-specific data is properly filtered by userId
- All timestamps are properly converted from Firestore format
