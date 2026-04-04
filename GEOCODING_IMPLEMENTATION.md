# Hospital Geocoding Flow - Implementation Guide

## 🔄 Complete Flow

### 1. **Hospital Enters Address**

- Hospital goes to their dashboard
- Enters address (e.g., "City Hospital, Delhi")
- Component: `HospitalAddressForm.js`

### 2. **Geocoding API Call**

- Frontend sends address to `geocodeAddress()` utility
- Uses OpenStreetMap's Nominatim API (free, no API key needed)
- Converts address → latitude, longitude

### 3. **API Response**

- Returns:
  - `latitude`: GPS latitude coordinate
  - `longitude`: GPS longitude coordinate
  - `displayName`: Full formatted address

### 4. **Store in Database**

- Backend endpoint: `POST /hospitals/update-location`
- Updates hospital record in Firestore with:
  - `latitude`
  - `longitude`
  - `address`
  - `location`
  - `geocodedAt`: timestamp

### 5. **Display on Map**

- HospitalsMap component fetches hospitals with `GET /hospitals/with-coordinates`
- Shows hospital markers 📍 on the map
- Donors/Recipients see hospital locations

---

## 📁 Files Created/Modified

### Frontend

#### New Files:

1. **`client/src/utils/geocoding.js`**
   - Core geocoding utilities
   - Functions:
     - `geocodeAddress(address)` - Convert address to coordinates
     - `reverseGeocodeCoordinates(lat, lon)` - Convert coordinates to address
     - `areValidCoordinates(lat, lon)` - Validate coordinates

2. **`client/src/components/HospitalAddressForm.js`**
   - React component for hospital address input
   - Features:
     - Address input field
     - Geocoding button
     - Coordinate display
     - Map preview using OpenStreetMap

3. **`client/src/components/HospitalAddressForm.css`**
   - Styling for the form component

#### Modified Files:

1. **`client/src/utils/api.js`**
   - Added new methods to `hospitalAPI`:
     - `getHospitalsWithCoordinates()` - Fetch hospitals with coordinates
     - `updateLocation()` - Update hospital location

### Backend

#### Modified Files:

1. **`server/routes/hospitals.js`**
   - New endpoints:
     - `POST /hospitals/update-location` - Update hospital coordinates
     - `GET /hospitals/with-coordinates` - Get all hospitals with coordinates

---

## 🚀 How to Use

### For Hospitals (Update Location):

1. **Import the component:**

```javascript
import HospitalAddressForm from "../components/HospitalAddressForm";
```

2. **Add to hospital dashboard:**

```jsx
<HospitalAddressForm
  onAddressSubmit={handleLocationUpdate}
  initialAddress={hospitalProfile?.address}
  initialCoordinates={{
    latitude: hospitalProfile?.latitude,
    longitude: hospitalProfile?.longitude,
  }}
  loading={loading}
/>
```

3. **Handle the submission:**

```javascript
const handleLocationUpdate = async (geocodedData) => {
  try {
    await hospitalAPI.updateLocation(
      geocodedData.address,
      geocodedData.latitude,
      geocodedData.longitude,
      geocodedData.displayName,
    );
    // Success!
  } catch (error) {
    console.error("Failed to update location:", error);
  }
};
```

### For Donors/Recipients (View Hospitals on Map):

1. **HospitalsMap component automatically:**
   - Fetches hospitals with coordinates via `hospitalAPI.getNearbyHospitals()`
   - Displays them as red markers 📍
   - Shows hospital details in popups

---

## 🔧 API Endpoints

### Update Hospital Location

**POST** `/api/hospitals/update-location`

Request:

```json
{
  "address": "City Hospital, Delhi",
  "latitude": 28.7041,
  "longitude": 77.1025,
  "displayName": "City Hospital, Delhi, India"
}
```

Response:

```json
{
  "message": "Hospital location updated successfully",
  "coordinates": {
    "latitude": 28.7041,
    "longitude": 77.1025
  }
}
```

### Get Hospitals with Coordinates

**GET** `/api/hospitals/with-coordinates`

Response:

```json
[
  {
    "id": "hospital123",
    "name": "City Hospital",
    "address": "City Hospital, Delhi",
    "latitude": 28.7041,
    "longitude": 77.1025,
    "contact": "+91-11-2345-6789",
    "email": "info@cityhospital.com",
    "requests": []
  }
]
```

---

## 🌍 Geocoding Service

**Service:** OpenStreetMap Nominatim API  
**URL:** https://nominatim.openstreetmap.org  
**API Key:** Not required (free service)  
**Rate Limits:** ~1 request/second

### Example Geocoding:

```javascript
import { geocodeAddress } from "../utils/geocoding";

const coordinates = await geocodeAddress("City Hospital, Delhi");
console.log(coordinates);
// Output:
// {
//   latitude: 28.7041,
//   longitude: 77.1025,
//   displayName: "City Hospital, Delhi, India",
//   address: {...}
// }
```

---

## 📊 Database Schema

### Users Collection (Hospital Document)

```javascript
{
  id: "hospitalId",
  role: "hospital",
  hospitalName: "City Hospital",
  address: "City Hospital, Delhi",           // Full address
  location: "City Hospital, Delhi, India",   // Display name
  latitude: 28.7041,                          // Geocoded
  longitude: 77.1025,                         // Geocoded
  geocodedAt: Timestamp,                      // When geocoded
  phone: "+91-11-2345-6789",
  email: "info@cityhospital.com",
  status: "approved",
  ...otherFields
}
```

---

## ✅ Testing the Flow

1. **Hospital Registration:**
   - Register hospital (initial address added to registration)

2. **Update Location:**
   - Go to Hospital Dashboard
   - Find the "Hospital Address" section
   - Enter address: "City Hospital, Delhi"
   - Click "Geocode Address & Save Location"
   - See coordinates generated and map preview

3. **View on Map:**
   - Go to Donor/Recipient Dashboard
   - Navigate to "Nearby Hospitals" section
   - See hospital markers 📍 on the map
   - Click marker to see hospital details

---

## 🐛 Troubleshooting

### Addresses not geocoding?

- Ensure address includes city and country
- Try: "Hospital Name, City, Country" format
- Check browser console for API errors

### Coordinates on map not showing?

- Verify hospitals have valid lat/lon in database
- Check Network tab for API response
- Ensure coordinates are not (0, 0)

### Map not centering correctly?

- Component calculates center from all hospitals with valid coords
- If only 1 hospital exists, it becomes the center
- Map zoom level is fixed at 13

---

## 📝 Notes

- **No API Key Required:** Uses free OpenStreetMap Nominatim API
- **Client-Side Geocoding:** Address → coordinates happens in browser
- **Database Storage:** Only final coordinates stored, not raw API responses
- **Reverse Geocoding:** Can convert coordinates back to address if needed
- **Performance:** Hospitals update their location once, then fixed on map

---

## 🔐 Security

- Location updates require hospital authentication (`verifyToken`, `verifyRole`)
- Only hospitals can update their own location
- All coordinates validated before storing
