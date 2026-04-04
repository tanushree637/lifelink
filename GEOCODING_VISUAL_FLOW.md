# 🗺️ Hospital Geocoding Flow - Visual Guide

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      HOSPITAL ENTERS ADDRESS                     │
│                 "City Hospital, Delhi"                           │
│                    (HospitalDashboard)                           │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
         ┌──────────────────┐
         │ HospitalAddress  │
         │ Form Component   │
         └────────┬─────────┘
                  │
         ┌────────▼─────────┐
         │ User clicks      │
         │ "Geocode Address"│
         │ button           │
         └────────┬─────────┘
                  │
                  ▼
    ┌─────────────────────────────┐
    │  geocodeAddress() utility    │
    │  (client/src/utils/geocoding.js)
    │                              │
    │  Calls OpenStreetMap API     │
    │  https://nominatim.osm.org   │
    └────────┬────────────────────┘
             │
             ▼
    ┌─────────────────────────────┐
    │ API Returns Coordinates      │
    │ - latitude: 28.7041          │
    │ - longitude: 77.1025         │
    │ - displayName: City Hospital │
    └────────┬────────────────────┘
             │
             ▼
    ┌─────────────────────────────┐
    │ Show Results to User:        │
    │ - Display coordinates        │
    │ - Show map preview           │
    │ - Enable submit              │
    └────────┬────────────────────┘
             │
             ▼
    ┌─────────────────────────────┐
    │ User confirms & submits      │
    │ handleLocationUpdate()       │
    └────────┬────────────────────┘
             │
             ▼
    ┌──────────────────────────────────┐
    │ API Call to Backend:             │
    │ POST /hospitals/update-location   │
    │ Body: {                          │
    │   address,                       │
    │   latitude,                      │
    │   longitude,                     │
    │   displayName                    │
    │ }                                │
    └────────┬─────────────────────────┘
             │
             ▼
    ┌──────────────────────────────────┐
    │ Database Update (Firestore)      │
    │ users collection                 │
    │ - latitude: 28.7041              │
    │ - longitude: 77.1025             │
    │ - location: "City Hospital..."   │
    │ - address: "City Hospital..."    │
    │ - geocodedAt: timestamp          │
    └────────┬─────────────────────────┘
             │
             ▼
    ┌──────────────────────────────────┐
    │ ✅ Success Response              │
    │ "Location updated successfully"  │
    └────────┬─────────────────────────┘
             │
             ▼
    ┌──────────────────────────────────┐
    │ Profile Refreshed                │
    │ User sees updated info           │
    └──────────────────────────────────┘
```

---

## Display on Map

```
┌──────────────────────────────────────────────────────┐
│                  DONORS/RECIPIENTS VIEW              │
│                    HospitalsMap Component            │
└────────────┬─────────────────────────────────────────┘
             │
             ▼
    ┌─────────────────────────────────┐
    │ Fetch hospitals with coords:    │
    │ GET /hospitals/with-coordinates │
    └────────┬────────────────────────┘
             │
             ▼
    ┌─────────────────────────────────┐
    │ Database Query                  │
    │ (Firestore users collection)    │
    │ Filter: role="hospital"         │
    │         status="approved"       │
    │         latitude & longitude    │
    │         != null                 │
    └────────┬────────────────────────┘
             │
             ▼
    ┌─────────────────────────────────┐
    │ API Response:                   │
    │ [                               │
    │  {                              │
    │    id: "hospital1",             │
    │    name: "City Hospital",       │
    │    latitude: 28.7041,           │
    │    longitude: 77.1025,          │
    │    contact: "+91-xxx-xxx-xxx",  │
    │    ...                          │
    │  },                             │
    │  ...                            │
    │ ]                               │
    └────────┬────────────────────────┘
             │
             ▼
    ┌─────────────────────────────────┐
    │ Render on Map:                  │
    │ - Leaflet MapContainer          │
    │ - OpenStreetMap tiles           │
    │ - Red hospital markers 📍       │
    │ - Popups with info              │
    └────────┬────────────────────────┘
             │
             ▼
    ┌─────────────────────────────────┐
    │ Display Sidebar List:           │
    │ - All hospitals                 │
    │ - Click to select/highlight     │
    │ - Show details                  │
    └─────────────────────────────────┘
```

---

## Component Architecture

```
HospitalDashboard (page)
├── Hospital Profile Info
├── HospitalAddressForm
│   ├── Address Input Field
│   ├── Geocode Button
│   ├── Coordinates Display
│   │   └── Map Preview (OpenStreetMap iframe)
│   └── Info Section
└── Other Dashboard Tabs

HospitalsMap (component)
├── Map Container (Leaflet)
│   ├── TileLayer (OpenStreetMap)
│   ├── Hospital Markers (red 📍)
│   └── Emergency Request Markers (orange ⚠️)
└── Hospitals Sidebar List
    ├── Hospital Items
    └── Emergency Request Items
```

---

## Database Changes

### Before

```javascript
{
  id: "hospital1",
  role: "hospital",
  hospitalName: "City Hospital",
  address: "New Delhi",
  city: "Delhi",
  phone: "+91-11-2345-6789",
  email: "info@cityhospital.com",
  // ❌ No coordinates
}
```

### After

```javascript
{
  id: "hospital1",
  role: "hospital",
  hospitalName: "City Hospital",
  address: "City Hospital, New Delhi",  // ✅ More detailed
  location: "City Hospital, New Delhi, India",  // ✅ Display name
  city: "Delhi",
  latitude: 28.7041,                     // ✅ Geocoded
  longitude: 77.1025,                    // ✅ Geocoded
  geocodedAt: Timestamp,                 // ✅ When geocoded
  phone: "+91-11-2345-6789",
  email: "info@cityhospital.com",
}
```

---

## API Endpoints

### 1. Geocode Address (Client-Side)

**No Backend Call**

- Function: `geocodeAddress(address)`
- Uses: OpenStreetMap Nominatim API (free)
- Returns: `{ latitude, longitude, displayName }`

### 2. Update Hospital Location

**POST** `/api/hospitals/update-location`

```
Request:
{
  "address": "City Hospital, New Delhi",
  "latitude": 28.7041,
  "longitude": 77.1025,
  "displayName": "City Hospital, New Delhi, India"
}

Response:
{
  "message": "Hospital location updated successfully",
  "coordinates": {
    "latitude": 28.7041,
    "longitude": 77.1025
  }
}
```

### 3. Get Hospitals with Coordinates

**GET** `/api/hospitals/with-coordinates`

```
Response:
[
  {
    "id": "hospital1",
    "name": "City Hospital",
    "address": "City Hospital, New Delhi",
    "latitude": 28.7041,
    "longitude": 77.1025,
    "contact": "+91-11-2345-6789",
    "email": "info@cityhospital.com",
    "requests": []
  },
  ...
]
```

---

## 📱 User Flow

### Hospital Admin

1. Login to Hospital Dashboard
2. See "Hospital Address" section with form
3. Enter address: "City Hospital, Delhi"
4. Click "Geocode Address & Save Location"
5. See coordinates displayed
6. See map preview
7. Success message appears
8. Profile updates with coordinates

### Donors/Recipients

1. Login to their dashboard
2. View "Nearby Hospitals" section
3. See map with red hospital markers 📍
4. Click marker or sidebar item to see details
5. Can see exact hospital locations with addresses

---

## 🔄 Real-time Updates

When hospital updates location:

1. Database updated immediately
2. HospitalsMap refetches on next visit
3. New coordinates shown on map
4. Hospital appears in correct map location

---

## Performance Considerations

- **Geocoding**: Happens once per hospital
- **Database**: Uses indexed queries for fast hospital lookup
- **Map**: Only loads hospitals with valid coordinates
- **Caching**: Browser caches geocoding results
- **API Rate Limit**: Nominatim: ~1 req/sec (suitable for manual updates)
