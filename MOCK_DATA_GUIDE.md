# LifeLink Mock Data & Database Seeding Guide

## Overview

This guide explains how to use the mock data and seeding scripts to populate your Firebase database with test data for the LifeLink blood donation management system.

## Files

1. **`mockData.js`** - Contains all mock data definitions for 5 hospitals, 5 donors, 5 recipients, and sample requests/donations
2. **`seed.js`** - Seeding script that populates Firebase with the mock data

## Mock Data Structure

### Hospitals (5)

- City General Hospital (Mumbai)
- Apollo Hospital (Delhi)
- Fortis Healthcare (Bangalore)
- Max Hospital (Pune)
- Sunrise Medical Hospital (Hyderabad)

**Fields included:**

- Hospital name, address, city, phone
- Hospital license (validated format)
- Contact email
- Status (approved)
- Created date

### Donors (5)

- Rajesh Kumar (O+, Mumbai) - 2 completed donations
- Priya Sharma (A+, Delhi) - 5 completed donations (5 Donations Hero badge)
- Amit Singh (B+, Bangalore) - 1 donation, currently locked (unavailable until 2025-03-15)
- Deepika Nair (AB-, Pune) - 3 completed donations
- Vikram Patel (O-, Hyderabad) - 0 donations (new donor)

**Fields included:**

- Full name, contact info, location
- Blood group
- Medical information (age, weight, diseases, eligibility)
- Donation history and badges
- Availability status
- Status (approved)

### Recipients (5)

- Anuj Mishra (O+, Anemia condition)
- Neha Dwivedi (A+, Leukemia condition)
- Raman Joshi (B+, Thalassemia condition)
- Sneha Verma (AB-, Hemophilia condition)
- Suresh Reddy (O-, Post-Surgical Recovery)

**Fields included:**

- Full name, contact info
- Blood type and medical conditions
- Aadhaar number
- Status (approved)

### Emergency Requests (Sample)

- 2 sample emergency requests linking recipients to hospitals
- With various urgency levels and statuses

### Donations (Sample)

- 2 sample completed donations with full donor-recipient-hospital links

## Setup Instructions

### 1. Ensure Firebase Configuration

Make sure your Firebase configuration is properly set up in `config/firebase.js`:

```bash
# Check that your firebase.js file properly initializes Firebase
cat server/config/firebase.js
```

### 2. Install Dependencies

```bash
cd server
npm install
```

### 3. Run the Seeding Script

```bash
# Navigate to server directory
cd server

# Run the seed script
node seed.js
```

### Expected Output

```
🌱 Starting database seeding...

🏥 Seeding hospitals...
   ✅ City General Hospital (ID: abc123...)
   ✅ Apollo Hospital (ID: def456...)
   ✅ Fortis Healthcare (ID: ghi789...)
   ✅ Max Hospital (ID: jkl012...)
   ✅ Sunrise Medical Hospital (ID: mno345...)

👤 Seeding donors...
   ✅ Rajesh Kumar (Blood: O+) (ID: pqr678...)
   ✅ Priya Sharma (Blood: A+) (ID: stu901...)
   ✅ Amit Singh (Blood: B+) (ID: vwx234...)
   ✅ Deepika Nair (Blood: AB-) (ID: yza567...)
   ✅ Vikram Patel (Blood: O-) (ID: bcd890...)

👥 Seeding recipients...
   ✅ Anuj Mishra (ID: efg123...)
   ✅ Neha Dwivedi (ID: hij456...)
   ✅ Raman Joshi (ID: klm789...)
   ✅ Sneha Verma (ID: nop012...)
   ✅ Suresh Reddy (ID: qrs345...)

🆘 Seeding emergency requests...
   ✅ Request for O+ (Status: active) (ID: tuv678...)
   ✅ Request for A+ (Status: pending-verification) (ID: wxy901...)

🩸 Seeding donations...
   ✅ Donation: O+ (Units: 1) (ID: zab234...)
   ✅ Donation: A+ (Units: 1) (ID: cde567...)

╔════════════════════════════════════════╗
║     ✅ DATABASE SEEDING COMPLETE      ║
╚════════════════════════════════════════╝

📊 Summary:
   🏥 Hospitals Added:  5
   👤 Donors Added:     5
   👥 Recipients Added: 5
   🆘 Requests Added:   2
   🩸 Donations Added:  2
```

## Test Credentials

After seeding, use these credentials to test the application:

### Hospital Accounts

```
Email: city-general@hospital.com
Password: hashedPassword123

Email: apollo-hospital@hospital.com
Password: hashedPassword123

Email: fortis-healthcare@hospital.com
Password: hashedPassword123

Email: max-hospital@hospital.com
Password: hashedPassword123

Email: sunrise-hospital@hospital.com
Password: hashedPassword123
```

### Donor Accounts

```
Email: rajesh.kumar@email.com
Password: hashedPassword123
Blood Type: O+

Email: priya.sharma@email.com
Password: hashedPassword123
Blood Type: A+

Email: amit.singh@email.com
Password: hashedPassword123
Blood Type: B+ (Currently unavailable until 2025-03-15)

Email: deepika.nair@email.com
Password: hashedPassword123
Blood Type: AB-

Email: vikram.patel@email.com
Password: hashedPassword123
Blood Type: O- (New donor, no donations yet)
```

### Recipient Accounts

```
Email: anuj.mishra@email.com
Password: hashedPassword123
Aadhaar: 1234-5678-9101

Email: neha.dwivedi@email.com
Password: hashedPassword123
Aadhaar: 2345-6789-0112

Email: raman.joshi@email.com
Password: hashedPassword123
Aadhaar: 3456-7890-1123

Email: sneha.verma@email.com
Password: hashedPassword123
Aadhaar: 4567-8901-1234

Email: suresh.reddy@email.com
Password: hashedPassword123
Aadhaar: 5678-9012-3456
```

## Testing Scenarios

### 1. Donor Dashboard

Login with any donor account to see:

- Their donation history
- Badges and achievements
- Emergency blood requests matching their blood type
- Availability status
- Medical information validation

**Suggested User:** `rajesh.kumar@email.com` (has 2 donations)

### 2. Recipient Dashboard

Login with any recipient account to:

- Create emergency blood requests
- View request status
- Select hospitals from the available list

**Suggested User:** `anuj.mishra@email.com`

### 3. Hospital Dashboard

Login with any hospital account to:

- View pending blood requests
- Verify patient admission
- Monitor blood inventory
- Manage donations

**Suggested User:** `city-general@hospital.com`

### 4. Admin Dashboard

Use an admin account (create one separately) to:

- Review user approvals
- Monitor system metrics
- View all requests and donations

## Data Relationships

The seed script automatically creates relationships between:

```
Donors → Emergency Requests (by blood group matching)
           ↓
Recipients → Emergency Requests (recipient ID)
           ↓
Hospitals → Emergency Requests (hospital ID)
           ↓
Donations (donor + recipient + hospital linkage)
```

## Modifying Mock Data

To add more donors, recipients, or hospitals, edit `mockData.js`:

### Adding a New Donor

```javascript
{
  email: "new.donor@email.com",
  password: "hashedPassword123",
  name: "New Donor Name",
  role: "donor",
  phone: "+91-9876543225",
  bloodGroup: "B+",
  location: "Chennai",
  available: true,
  createdAt: new Date("2025-02-25"),
  status: "approved",
  medicalHistory: [],
  completedDonations: 0,
  badges: [],
  medicalInfo: {
    age: 25,
    weight: 70,
    lastDonationDate: null,
    diseases: [],
    recentSurgery: false,
    surgeryDetails: null,
    recentIllness: false,
    illnessDetails: null,
    currentMedications: null,
    isPregnantOrNursing: false,
    eligibilityCheckedAt: new Date("2025-02-25"),
    eligible: true,
  },
}
```

### Adding a New Hospital

```javascript
{
  email: "new-hospital@hospital.com",
  password: "hashedPassword123",
  name: "New Hospital",
  role: "hospital",
  phone: "+91-9876543225",
  hospitalName: "New Hospital",
  address: "123 New Address, Area",
  city: "City Name",
  license: "NHP2023006",
  licenseNormalized: "NHP2023006",
  createdAt: new Date("2025-02-25"),
  status: "approved",
}
```

## Clearing Database Before Reseeding

If you need to start fresh:

```javascript
// Option 1: Delete collections via Firebase Console
// Navigate to each collection and delete all documents

// Option 2: Create a cleanup script
const clearDatabase = async () => {
  const db = getDB();
  const collections = ["users", "emergencyRequests", "donations"];

  for (const collection of collections) {
    const snapshot = await db.collection(collection).get();
    for (const doc of snapshot.docs) {
      await db.collection(collection).doc(doc.id).delete();
    }
  }
};
```

## Troubleshooting

### "Failed to connect to Firebase database"

- Check that Firebase credentials are properly configured
- Verify `FIREBASE_*` environment variables are set
- Check Firebase project console for permission issues

### "User already exists with this email"

- Clear the database before reseeding
- Use unique email addresses in mockData.js

### "Hospital license number is already registered"

- Modify the license numbers in mockData.js
- Use unique license numbers for each hospital

### Hash Password Issues

- Ensure `bcryptjs` is installed: `npm install bcryptjs`
- Check that `password` field is being hashed properly

## Next Steps

1. **Start the application:**

   ```bash
   # In one terminal
   cd server && npm run dev

   # In another terminal
   cd client && npm start
   ```

2. **Test core flows:**
   - Hospital approving blood requests
   - Donors responding to requests
   - Recipients tracking their requests
   - Certificates being generated

3. **Verify data integrity:**
   - Check Firebase console for all collections
   - Verify relationships between documents
   - Test all dashboard views

## Notes

- All passwords in the mock data use the same placeholder for testing
- In production, use strong, unique passwords
- Medical information is simplified for testing purposes
- Emergency requests and donations use sample data to demonstrate relationships

## Support

For issues or questions about the mock data setup:

1. Check the corresponding route files in `server/routes/`
2. Review Firebase data flow documentation
3. Check server logs for detailed error messages
