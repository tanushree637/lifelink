# Emergency Requests & Dashboard Firebase Integration - Complete Fix

## 🔍 Problem Identified

The donor dashboard wasn't showing emergency requests for the following reasons:

1. **Incorrect Hospital Selection**: Recipients were entering hospital location as text, not selecting actual hospital IDs from Firebase
2. **Request Status Query**: New requests start with `status: "pending-verification"` but donors were only querying for `status: "active"`
3. **Missing Hospital List API**: No public endpoint existed for recipients to see available hospitals
4. **Incomplete Data Flow**: Hospital names weren't being fetched when displaying requests

## ✅ Solution Implemented

### 1. New Backend Endpoints

#### **GET `/hospitals/list`** (Public - No Auth Required)

Returns all verified hospitals in the system.

```javascript
// Response
[
  {
    id: "hospital_doc_id",
    name: "City General Hospital",
    location: "Downtown, City",
    phone: "555-1234",
    email: "contact@cityhospital.com",
    address: "Downtown, City"
  },
  ...
]
```

#### **Updated GET `/donors/requests/nearby`** (Donor)

Now returns requests with hospital information and proper error handling.

```javascript
// Response
[
  {
    id: "request_id",
    patientName: "John Doe",
    bloodGroup: "O+",
    quantity: 2,
    urgencyLevel: "high",
    hospitalName: "City General Hospital",
    status: "active",
    admissionStatus: "admitted",
    createdAt: "2026-03-28T...",
    ...
  }
]
```

#### **Updated GET `/recipients/my-requests`** (Recipient)

Now includes hospital names for each request.

```javascript
// Response
[
  {
    id: "request_id",
    bloodGroup: "O+",
    quantity: 2,
    urgencyLevel: "medium",
    patientName: "John Doe",
    hospitalName: "City General Hospital",
    status: "pending-verification",
    admissionStatus: "pending",
    createdAt: "2026-03-28T...",
    ...
  }
]
```

### 2. Frontend API Updates

Added new API methods in `client/src/utils/api.js`:

```javascript
// Hospital API
hospitalAPI.getHospitals(); // GET /hospitals/list
```

### 3. Recipient Dashboard Improvements

**File**: `client/src/pages/RecipientDashboard.js`

**Changes**:

- Now fetches actual hospital list from Firebase on mount
- Hospital input changed from text field to dropdown select
- Shows hospital name and location in dropdown
- Sends actual hospital document ID instead of text

**Before**:

```jsx
<input placeholder="e.g., City General Hospital" value={hospitalId} />
```

**After**:

```jsx
<select value={hospitalId}>
  <option>Select a hospital</option>
  {hospitals.map((h) => (
    <option key={h.id} value={h.id}>
      {h.name} - {h.location}
    </option>
  ))}
</select>
```

### 4. Donor Dashboard Improvements

**File**: `client/src/pages/DonorDashboard.js`

**Changes**:

- Request cards now show hospital name
- Shows blood quantity with unit count
- Added helpful message explaining request visibility
- Better help text for why requests might not appear

**Displayed Info**:

- 🩸 Blood group with quantity
- 🏥 Hospital name
- ⚡ Urgency level
- 👤 Patient name

### 5. Backend Query Improvements

**File**: `server/routes/donors.js`

**Enhanced `/requests/nearby` endpoint**:

- Added donor profile validation
- Checks if blood group is set in profile
- Returns helpful error messages
- Fetches and includes hospital names
- Orders by creation date (newest first)
- Logs requests found for debugging

**Error Handling Examples**:

```javascript
// If donor not found
{
  message: "Donor profile not found";
}

// If blood group not set
{
  message: "Blood group not set in donor profile. Please update your profile.";
}
```

## 📊 Complete Data Flow

### Creating & Viewing Emergency Requests

```
1. RECIPIENT CREATES REQUEST
   └─ Selects hospital from dropdown (actual ID)
   └─ POST /recipients/emergency-request
   └─ Creates with status: "pending-verification"

2. REQUEST APPEARS IN RECIPIENT DASHBOARD
   └─ GET /recipients/my-requests
   └─ Shows status: "pending-verification"
   └─ Shows hospital name

3. HOSPITAL VERIFIES PATIENT
   └─ POST /hospitals/patient-verification/{requestId}/confirm-admitted
   └─ Sets status: "active" & admissionStatus: "admitted"

4. REQUEST APPEARS FOR DONORS
   └─ GET /donors/requests/nearby
   └─ Only returns status: "active" requests
   └─ Shows hospital name to donor
   └─ Donor can accept request

5. DONATION COMPLETION
   └─ Hospital verifies donation with OTP
   └─ Sets status: "completed"
   └─ Request disappears from active donors
```

## 🔧 How to Test

### 1. Test Recipient Creating Request

1. Log in as recipient
2. Go to Recipient Dashboard
3. Fill form with:
   - Select a hospital from dropdown
   - Select blood group
   - Enter patient name
   - Select urgency level
   - Submit
4. Check "Request History" - request appears with status "pending-verification"

### 2. Test Hospital Verification

1. Log in as hospital
2. Go to Hospital Dashboard
3. Go to "Patient Verification Requests" tab
4. Find the request created above
5. Click "Confirm Admitted"
6. Request status changes to "admitted"

### 3. Test Donor Seeing Request

1. Log in as donor with matching blood group
2. Go to Donor Dashboard
3. Click "⚠️ Emergency Requests" tab
4. Request now appears (was waiting for hospital verification)
5. Can click "Accept Request"

### 4. Verify Hospital List is Working

1. Open browser console
2. Check Network tab
3. When recipient dashboard loads, should see:
   - GET `/hospitals/list` returns list of hospitals

## 📝 Important Notes

**Request Status States**:

- `pending-verification`: Recipient created, waiting for hospital to confirm patient is admitted
- `active`: Hospital confirmed patient, now visible to matching donors
- `completed`: Donation completed
- `rejected`: Hospital rejected (patient not found)
- `cancelled`: Recipient cancelled request

**Why Requests Don't Appear to Donors Immediately**:

- Donors only see requests with `status: "active"`
- Requests start with `status: "pending-verification"`
- Hospital must confirm patient admission first
- This ensures only verified patients receive blood

**Blood Group Matching**:

- Donor sees requests matching their exact blood group
- Hospital must set blood group correctly when creating request
- Donor must have blood group in their profile

## 🐛 Troubleshooting

| Issue                                    | Solution                                                                            |
| ---------------------------------------- | ----------------------------------------------------------------------------------- |
| No hospitals in dropdown                 | Check that hospitals are approved (status: "approved") in Firebase users collection |
| Donor still doesn't see requests         | Check request status is "active", blood group matches donor's blood group           |
| Hospital verification button not working | Ensure hospital is logged in correctly, check browser console for errors            |
| Data not updating                        | Refresh page, check network requests in browser DevTools                            |

## 📱 Dashboards Connected to Firebase

### Donor Dashboard

- ✅ Emergency requests from `/donors/requests/nearby`
- ✅ Profile from `/donors/profile`
- ✅ Donation history from `/donors/history`
- ✅ Badges from `/donors/badges`
- ✅ Nearby hospitals from `/donors/hospitals/nearby`

### Recipient Dashboard

- ✅ My requests from `/recipients/my-requests`
- ✅ Hospital list from `/hospitals/list`
- ✅ Donor search from `/recipients/search-donors`
- ✅ Available donors count from `/recipients/available-donors-count`

### Hospital Dashboard

- ✅ Patient verification requests from `/hospitals/patient-verification-requests`
- ✅ Pending donations from `/hospitals/pending-donations`
- ✅ Profile from `/hospitals/profile`
- ✅ Dashboard stats from `/hospitals/dashboard-stats`
- ✅ Donation history from `/hospitals/donation-history`

### Admin Dashboard

- ✅ Statistics from `/admin/statistics`
- ✅ Pending users from `/admin/pending-users`
- ✅ Suspicious activity from `/admin/suspicious-activity`

## 🚀 Next Steps (Optional Improvements)

1. Add real-time updates using Firebase listeners
2. Implement blood type compatibility matching (O- to any, A- to A/AB, etc.)
3. Add distance-based filtering for nearby hospitals
4. Implement notification system for new requests
5. Add OTP generation for donation verification
6. Add rating/review system for hospitals and donors
