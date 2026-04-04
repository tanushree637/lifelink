# Complete Blood Request Flow - Testing Guide

This guide walks through the complete flow for blood requests to appear in a donor's dashboard.

## 🔄 Complete Flow

```
1. Donor Setup
   └─ Donor logs in
   └─ Donor sets blood group (e.g., "O+")
   └─ Donor marks themselves as available

2. Recipient Creates Request
   └─ Recipient logs in
   └─ Recipient creates emergency request
   │    ├─ Select hospital from dropdown
   │    ├─ Blood group (e.g., "O+")
   │    ├─ Quantity (e.g., 2 units)
   │    ├─ Urgency level (high, medium, low)
   │    └─ Patient name
   └─ Request created with status: "pending-verification"
   └─ Request stored in Firebase: emergencyRequests collection

3. Hospital Verification
   └─ Hospital logs in
   └─ Hospital views patient verification requests
   │    ├─ Sees the pending request from recipient
   │    ├─ Verifies patient is actually admitted
   │    └─ Confirms admission
   └─ Hospital clicks "Confirm Admitted"
   └─ Request status changes to: "active"
   └─ Request appears to ALL MATCHING DONORS

4. Donor Sees Request
   └─ Donor dashboard loads on page visit
   └─ Donor clicks "Emergency Requests" tab
   └─ Queries emergencyRequests where:
   │    ├─ bloodGroup == donor's blood group (e.g., "O+")
   │    └─ status == "active"
   └─ Request displays in list with:
        ├─ ✓ Hospital Verified badge
        ├─ Patient name
        ├─ Blood group & quantity
        ├─ Hospital name & location
        ├─ How long ago request was created
        └─ Accept button
```

## Step-by-Step Testing

### Step 1: Create Test Donor

```
1. Go to http://localhost:3000/signup
2. Select role: "Donor"
3. Fill in details:
   - Name: "John Donor"
   - Email: "donor@test.com"
   - Password: "pass123"
   - Blood Group: "O+"  ← CRITICAL: Must be set!
   - Location: "Downtown, City"
4. Click Register
5. Wait for admin approval (or manually approve in admin dashboard)
6. Login as donor
```

### Step 2: Create Test Hospital

```
1. Go to http://localhost:3000/signup
2. Select role: "Hospital"
3. Fill in details:
   - Hospital Name: "Test Hospital"
   - Email: "hospital@test.com"
   - Password: "pass123"
   - Location: "Downtown, City"
4. Click Register
5. Wait for admin approval
6. Login as hospital
```

### Step 3: Create Test Recipient

```
1. Go to http://localhost:3000/signup
2. Select role: "Recipient"
3. Fill in details:
   - Name: "Jane Recipient"
   - Email: "recipient@test.com"
   - Password: "pass123"
4. Click Register
5. Wait for admin approval
6. Login as recipient
```

### Step 4: Recipient Creates Blood Request

```
1. Login as recipient (Jane Recipient)
2. Go to Recipient Dashboard
3. Fill in emergency request:
   - Hospital: Select "Test Hospital"
   - Blood Group: "O+"  ← MUST MATCH DONOR (John Donor)
   - Quantity: 2 units
   - Urgency: "high"
   - Patient Name: "Test Patient"
4. Click "Create Request"
5. Request created with status: "pending-verification"
```

### Step 5: Hospital Verifies Request (CRITICAL STEP)

```
1. Login as hospital (Test Hospital)
2. Go to Hospital Dashboard
3. View "Patient Verification Requests" tab
4. See the request from Jane Recipient for "O+" blood
5. Click "Confirm Admitted" button
6. Request status changes to "active" ← NOW VISIBLE TO DONORS
```

### Step 6: Donor Sees Request

```
1. Login as donor (John Donor)
2. Go to Donor Dashboard
3. Click "⚠️ Emergency Requests" tab
4. Should see:
   ✓ Request with "✓ Hospital Verified" badge
   ✓ "Test Patient" name
   ✓ "O+" blood type
   ✓ "2 units needed"
   ✓ "Test Hospital" name
   ✓ Urgent urgency level
   ✓ "Accept Request →" button
```

## 🔍 Debugging

### If donor doesn't see requests:

**Check 1: Donor's blood group is set**

```
1. Login as donor
2. Go to profile
3. Verify blood group shows (e.g., "O+")
4. If blank, update it!
```

**Check 2: Request was created with correct blood group**

```
Firebase → emergencyRequests collection
Look for documents where:
  - bloodGroup: "O+" (matches donor)
  - recipientId: [recipient_id]
  - status: "pending-verification" (before hospital confirms)
```

**Check 3: Hospital confirmed the request**

```
Firebase → emergencyRequests collection
Look for same document:
  - admissionStatus: "admitted"
  - status: "active" ← THIS IS CRITICAL
  - If status is still "pending-verification",
    hospital hasn't confirmed yet
```

**Check 4: Open browser console (F12)**

```
1. Login as donor
2. Press F12 to open developer tools
3. Go to Console tab
4. Look for messages like:
   "🔍 Donor [id] searching for requests with blood group: O+"
   "✅ Found 1 active requests for donor blood group O+"
   ✅ = requests found
   "Found 0" = no matching requests
```

**Check 5: Test all-pending endpoint**

```
1. Open browser console as logged-in donor
2. Run:
   fetch('/api/donors/requests/all-pending', {
     headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')}
   }).then(r => r.json()).then(d => console.log(d))
3. Should show ALL pending requests (debug mode)
4. Count how many have status: "active"
```

## 📋 Firebase Data Structure

### emergencyRequests Collection

```javascript
{
  recipientId: "user_id",
  hospitalId: "hospital_id",
  patientName: "Test Patient",
  bloodGroup: "O+",
  quantity: 2,
  urgencyLevel: "high",
  status: "active",  // Must be "active" for donors to see
  admissionStatus: "admitted",  // Hospital confirmed
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

### users Collection (Donor)

```javascript
{
  name: "John Donor",
  email: "donor@test.com",
  role: "donor",
  bloodGroup: "O+",  // CRITICAL: Must be set!
  location: "Downtown, City",
  available: true,
  status: "approved",
}
```

## ✅ Verification Checklist

- [ ] Donor has blood group set (e.g., "O+")
- [ ] Donor is marked as available
- [ ] Recipient creates request with MATCHING blood group
- [ ] Hospital app shows request in "Patient Verification Requests"
- [ ] Hospital clicks "Confirm Admitted" button
- [ ] Request status in Firebase changes to "active"
- [ ] Donor refreshes dashboard
- [ ] Request appears in "Emergency Requests" tab

## 🆘 Common Issues

| Issue                             | Solution                                                 |
| --------------------------------- | -------------------------------------------------------- |
| "No requests shown"               | Check if donor's blood group is set                      |
| "Blood group field is blank"      | Complete donor profile with blood group                  |
| "Recipient can't select hospital" | Hospital must be approved first                          |
| "Hospital can't confirm request"  | Go to "Patient Verification Requests" tab                |
| "Browser shows 0 requests"        | Open console and check server logs                       |
| "Query error in console"          | Firebase composite index might be missing (auto-created) |

## 🚀 Quick Test

```bash
# Terminal 1: Start server
cd server
npm start

# Terminal 2: Start client
cd client
npm start

# Then follow Steps 1-6 above
```

---

**Key Points to Remember:**

1. ✓ Donor needs blood group set
2. ✓ Request must have matching blood group
3. ✓ Hospital must confirm admission (status → "active")
4. ✓ Donor queries filter by bloodGroup + status=active
