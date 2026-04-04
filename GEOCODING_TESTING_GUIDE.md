# 🧪 Hospital Geocoding - Testing Guide

## ✅ Pre-Implementation Checklist

Before testing, ensure:

- [x] Geocoding utility created (`client/src/utils/geocoding.js`)
- [x] HospitalAddressForm component created
- [x] Backend endpoints added to hospitals routes
- [x] API client updated with new methods
- [x] HospitalDashboard integrated with form
- [x] All imports added

---

## 🧪 Testing Steps

### Step 1: Test Geocoding Utility (Standalone)

Open browser console and test the geocoding function:

```javascript
// Import and test in browser console
import { geocodeAddress } from "./src/utils/geocoding.js";

// Test with valid address
geocodeAddress("City Hospital, Delhi")
  .then((result) => console.log("✅ Success:", result))
  .catch((error) => console.error("❌ Error:", error));

// Expected output:
// {
//   latitude: 28.7041,
//   longitude: 77.1025,
//   displayName: "City Hospital, Delhi, India",
//   address: {...}
// }
```

---

### Step 2: Test HospitalAddressForm Component

1. **Login as Hospital Admin:**
   - Email: `hospital@test.com` (create one if needed)
   - Password: `test123`

2. **Navigate to Hospital Dashboard**
   - URL: `http://localhost:3000/hospital-dashboard`

3. **Locate Hospital Address Section:**
   - Below hospital info card
   - Look for "🏥 Hospital Address" heading

4. **Test Input:**
   - Enter address: `"City Hospital, Delhi"`
   - Click "🔍 Geocode Address & Save Location" button

5. **Verify Response:**
   - Coordinates appear below input
   - Map preview loads (OpenStreetMap iframe)
   - Success message shows

6. **Expected Output:**
   ```
   📍 Geocoded Coordinates:
   Latitude: 28.7041
   Longitude: 77.1025
   Display Name: City Hospital...
   ```

---

### Step 3: Test Backend Update Endpoint

Use Postman or cURL to test the backend endpoint:

**Postman Setup:**

1. Create new POST request
2. URL: `http://localhost:5000/api/hospitals/update-location`
3. Headers:
   ```
   Authorization: Bearer <YOUR_HOSPITAL_TOKEN>
   Content-Type: application/json
   ```
4. Body (raw JSON):
   ```json
   {
     "address": "City Hospital, Delhi",
     "latitude": 28.7041,
     "longitude": 77.1025,
     "displayName": "City Hospital, Delhi, India"
   }
   ```
5. Send & verify response:
   ```json
   {
     "message": "Hospital location updated successfully",
     "coordinates": {
       "latitude": 28.7041,
       "longitude": 77.1025
     }
   }
   ```

**cURL Command:**

```bash
curl -X POST http://localhost:5000/api/hospitals/update-location \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "address": "City Hospital, Delhi",
    "latitude": 28.7041,
    "longitude": 77.1025,
    "displayName": "City Hospital, Delhi, India"
  }'
```

---

### Step 4: Verify Database Update

1. **Open Firebase Console:**
   - Go to your Firebase project
   - Firestore Database → Collections

2. **Check Users Collection:**
   - Find the hospital document you just updated
   - Verify these fields exist:
     - ✅ `latitude: 28.7041`
     - ✅ `longitude: 77.1025`
     - ✅ `location: "City Hospital..."`
     - ✅ `address: "City Hospital..."`
     - ✅ `geocodedAt: <timestamp>`

---

### Step 5: Test Get Hospitals with Coordinates

**Fetch from Frontend:**

```javascript
import { hospitalAPI } from "./src/utils/api.js";

// Call the endpoint
hospitalAPI
  .getHospitalsWithCoordinates()
  .then((response) => {
    console.log("✅ Hospitals with coordinates:", response.data);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
  });

// Expected response:
// [
//   {
//     id: "hospital1",
//     name: "City Hospital",
//     address: "City Hospital, Delhi",
//     latitude: 28.7041,
//     longitude: 77.1025,
//     contact: "+91-11-2345-6789",
//     email: "info@cityhospital.com",
//     requests: []
//   },
//   ...
// ]
```

---

### Step 6: Test Map Display

1. **Login as Donor:**
   - Email: `donor@test.com` (create one if needed)
   - Password: `test123`

2. **Navigate to Donor Dashboard**
   - URL: `http://localhost:3000/donor-dashboard`

3. **Locate Nearby Hospitals:**
   - Look for "🏥 Nearby Hospitals with Blood Requests" section
   - Should show hospitals with coordinates

4. **Verify Map Display:**
   - Map should show red hospital markers 📍
   - Click marker to see popup with hospital info
   - Sidebar shows hospital list

5. **Expected Result:**
   - Hospital appears on map at `28.7041, 77.1025`
   - Popup shows hospital name, location, contact
   - Sidebar list selectable

---

### Step 7: End-to-End Testing

**Complete Flow Test:**

1. **Hospital:** Login and update address
   → Address geocoded to coordinates
   → Coordinates saved to database

2. **Donor:** Login and view hospitals
   → Sees hospital on map with marker 📍
   → Can click to see details

3. **Verify:**
   - ✅ Address entered correctly
   - ✅ Coordinates generated
   - ✅ Database updated
   - ✅ Map shows marker
   - ✅ Popup shows info

---

## 🐛 Troubleshooting

### Issue: "No location found for the given address"

**Solution:**

- Use more specific address: `"Specific Hospital Name, City, Country"`
- Example: `"AIIMS Hospital, New Delhi, India"`
- Try: `"Metro Hospital, Delhi"`

### Issue: Coordinates not showing on map

**Solution:**

- Verify hospital has valid coordinates in database
- Check Network tab: ensure API returns hospitals with lat/lon
- Clear browser cache and reload

### Issue: Map not loading

**Solution:**

- Check browser console for errors
- Ensure Leaflet and react-leaflet installed
- Verify OpenStreetMap tiles loading

### Issue: Geocoding very slow

**Solution:**

- Nominatim API has rate limits
- Wait a few seconds between requests
- Try simpler address: `"Delhi"` instead of `"Building 123, Street..."`

### Issue: "Authentication required" error

**Solution:**

- Verify hospital token in localStorage
- Re-login to get fresh token
- Check Authorization header format

### Issue: Coordinates (0, 0) on map

**Solution:**

- These coordinates are filtered out in HospitalsMap
- Ensure valid coordinates: `latitude != 0 && longitude != 0`
- Re-geocode address

---

## 📊 Data Validation

### Valid Coordinates Range

```javascript
Latitude: -90 to 90
Longitude: -180 to 180

Invalid: (0, 0) - filtered out
```

### Valid Address Examples

```javascript
"City Hospital, Delhi";
"AIIMS, New Delhi, India";
"Apollo Hospital, Mumbai";
"Hospital Name, City, State, Country";
"123 Medical Center Road, Mumbai, India";
```

### Invalid Address Examples

```javascript
"Hospital"; // Too vague
"123 Road"; // No city
"Kolkata"; // Just a city (geocodes to city center)
""; // Empty
```

---

## 🔐 Security Testing

### Test Authorization

**Unauthorized Access:**

```bash
# This should fail (no token or invalid token)
curl -X POST http://localhost:5000/api/hospitals/update-location \
  -H "Content-Type: application/json" \
  -d '{"address": "..."}'

# Expected: 401 Unauthorized
```

**Non-Hospital User:**

```bash
# Login as Donor, try to update hospital location
# Should fail with 403 Forbidden
```

**Hospital Cannot Update Other Hospital:**

```javascript
// Even with token, cannot update different hospital's location
// Verified by userId in middleware
```

---

## 📈 Performance Testing

### Geocoding Performance

- Expected time: 200-500ms per address
- Nominatim API: ~1 request/second limit

### Map Rendering

- With 50 hospitals: ~100-200ms to render
- With 500 hospitals: ~500-1000ms

### Database Query

- Get hospitals with coordinates: ~50-100ms
- Uses indexed queries for speed

---

## ✅ Final Verification Checklist

- [ ] Hospital can enter address
- [ ] Address geocodes to coordinates
- [ ] Coordinates display correctly
- [ ] Map preview shows location
- [ ] Database updates with coordinates
- [ ] Success message appears
- [ ] Donor sees hospital on map
- [ ] Marker appears at correct location
- [ ] Popup shows hospital info
- [ ] Sidebar shows hospital list
- [ ] Clicking marker shows popup
- [ ] Map centers correctly
- [ ] No console errors

---

## 📝 Sample Test Data

### Test Hospital Registration

```javascript
{
  email: "hospital@test.com",
  password: "test123",
  name: "Test Hospital",
  role: "hospital",
  phone: "+91-11-2345-6789",
  hospitalName: "City Hospital",
  address: "Connaught Place, New Delhi",
  city: "New Delhi",
  license: "LIC123456789"
}
```

### Test Address for Geocoding

- `"City Hospital, Delhi"` → 28.7041, 77.1025
- `"Mumbai Central"` → 18.9676, 72.8194
- `"Bangalore"` → 12.9716, 77.5946

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Test with multiple hospitals
- [ ] Test with various address formats
- [ ] Test map with 100+ hospitals
- [ ] Test on mobile browsers
- [ ] Test on slow network (2G)
- [ ] Verify error handling
- [ ] Check console for warnings
- [ ] Test with different browsers
- [ ] Verify analytics tracking
- [ ] Check security headers
