## 🎯 Sanya Kapil Dashboard - Setup Instructions

### What's Fixed:

1. ✅ **Hospital Coordinates** - All hospitals now have proper latitude/longitude
2. ✅ **Duplicate Requests** - Deduplication logic added to prevent showing same request 4x
3. ✅ **Real Data Only** - Dashboard now shows only actual emergency requests (no fake data)
4. ✅ **Accurate Distances** - Map will calculate real distances using Haversine formula

### ⚙️ Setup Steps:

#### Step 1: Ensure Server & Database are Updated

```bash
cd server
npm install  # If needed
```

#### Step 2: Seed Database (Updates Hospital Coordinates)

```bash
node seed.js
```

This will add all hospitals with their proper GPS coordinates.

#### Step 3: Setup Sanya Kapil Dashboard

```bash
node setup-sanya-kapil.js
```

This script will:

- Find Sanya Kapil in the database
- Check their blood type
- Create a REAL emergency request matching their blood type
- Show distance calculation from their location to the hospital

### 🚀 What Happens When Sanya Kapil Logs In:

1. **Emergency Requests Tab**: Shows only REAL requests matching their blood type
2. **Map Tab**:
   - Shows actual hospital locations with GPS coordinates
   - Displays accurate distance in KM from Sanya's location
   - Shows distance lines with measurements
   - Only shows hospitals within 30 km radius

3. **Request Details**: Each request card shows:
   - Patient name
   - Hospital name & address
   - Blood type & quantity needed
   - Urgency level
   - Time since request was created

### ✨ Key Features:

- **No Fake Data**: Only shows real emergency requests from the database
- **Accurate Distances**: Uses actual GPS coordinates to calculate distances
- **Real-time Updates**: Pulls latest requests from Firestore
- **Clear Information**: All hospital details visible in the UI

### 📍 Hospital Locations (for reference):

| Hospital                 | City      | Coordinates          |
| ------------------------ | --------- | -------------------- |
| City General Hospital    | Mumbai    | 19.076°N, 72.8777°E  |
| Apollo Hospital          | Delhi     | 28.7041°N, 77.1025°E |
| Fortis Healthcare        | Bangalore | 12.9716°N, 77.5946°E |
| Max Hospital             | Pune      | 18.5204°N, 73.8567°E |
| Sunrise Medical Hospital | Hyderabad | 17.385°N, 78.4867°E  |
| Care Multispecialty      | Pune      | 18.38°N, 73.92°E     |
| MediCore Advanced        | Pune      | 18.6°N, 73.76°E      |
| LifeCare Hospital        | Pune      | 18.4625°N, 73.9234°E |

### 🔍 Troubleshooting:

**Issue**: Dashboard shows "No active emergency requests"

- ✅ This is CORRECT if Sanya's blood type has no active requests in the database
- Run `node setup-sanya-kapil.js` to create a real request

**Issue**: Map shows hospitals but no distances

- ✅ Ensure hospitals have latitude/longitude (just seeded)
- ✅ Ensure Sanya has a location set in their profile

**Issue**: Map shows 0 km or incorrect distance

- Check that both donor location and hospital coordinates are set
- Restart server to reload hospital data
