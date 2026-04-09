# LifeLink Test Data Quick Reference

## 🏥 Hospitals (5)

| Name                     | Email                          | City      | Phone          | License    |
| ------------------------ | ------------------------------ | --------- | -------------- | ---------- |
| City General Hospital    | city-general@hospital.com      | Mumbai    | +91-9876543210 | MGH2023001 |
| Apollo Hospital          | apollo-hospital@hospital.com   | Delhi     | +91-9876543211 | AHD2023002 |
| Fortis Healthcare        | fortis-healthcare@hospital.com | Bangalore | +91-9876543212 | FTH2023003 |
| Max Hospital             | max-hospital@hospital.com      | Pune      | +91-9876543213 | MXH2023004 |
| Sunrise Medical Hospital | sunrise-hospital@hospital.com  | Hyderabad | +91-9876543214 | SMH2023005 |

**All Hospital Passwords:** `hashedPassword123`

---

## 👤 Donors (5)

| Name         | Email                  | Blood | City      | Donations | Status       | Notes                      |
| ------------ | ---------------------- | ----- | --------- | --------- | ------------ | -------------------------- |
| Rajesh Kumar | rajesh.kumar@email.com | O+    | Mumbai    | 2         | ✅ Available | Has First Life Saver badge |
| Priya Sharma | priya.sharma@email.com | A+    | Delhi     | 5         | ✅ Available | Has 5 Donations Hero badge |
| Amit Singh   | amit.singh@email.com   | B+    | Bangalore | 1         | ❌ Locked    | Available after 2025-03-15 |
| Deepika Nair | deepika.nair@email.com | AB-   | Pune      | 3         | ✅ Available | Universal negative donor   |
| Vikram Patel | vikram.patel@email.com | O-    | Hyderabad | 0         | ✅ Available | Universal donor, new user  |

**All Donor Passwords:** `hashedPassword123`

**Donor Details:**

### Rajesh Kumar

- Age: 28, Weight: 72 kg
- Last Donation: 2025-02-15
- Medical: No conditions
- Badge: 🥉 First Life Saver

### Priya Sharma

- Age: 31, Weight: 58 kg
- Last Donation: 2025-02-20
- Medical: No conditions
- Badges: 🥉 First Life Saver, 🥈 5 Donations Hero

### Amit Singh

- Age: 26, Weight: 68 kg
- Last Donation: 2025-02-15
- Locked Until: 2025-03-15
- Medical: No conditions

### Deepika Nair

- Age: 29, Weight: 65 kg
- Last Donation: 2025-02-10
- Medical: No conditions
- Badge: 🥉 First Life Saver

### Vikram Patel

- Age: 23, Weight: 70 kg
- Last Donation: None (new donor)
- Medical: No conditions

---

## 👥 Recipients (5)

| Name         | Email                  | Blood Type | City | Medical Condition      | Aadhaar        |
| ------------ | ---------------------- | ---------- | ---- | ---------------------- | -------------- |
| Anuj Mishra  | anuj.mishra@email.com  | O+         | -    | Anemia                 | 1234-5678-9101 |
| Neha Dwivedi | neha.dwivedi@email.com | A+         | -    | Leukemia               | 2345-6789-0112 |
| Raman Joshi  | raman.joshi@email.com  | B+         | -    | Thalassemia            | 3456-7890-1123 |
| Sneha Verma  | sneha.verma@email.com  | AB-        | -    | Hemophilia             | 4567-8901-1234 |
| Suresh Reddy | suresh.reddy@email.com | O-         | -    | Post Surgical Recovery | 5678-9012-3456 |

**All Recipient Passwords:** `hashedPassword123`

---

## 🆘 Sample Emergency Requests

| Patient     | Blood | Hospital              | Status               | Urgency | Quantity |
| ----------- | ----- | --------------------- | -------------------- | ------- | -------- |
| Patient One | O+    | City General Hospital | Active               | High    | 2 units  |
| Patient Two | A+    | Apollo Hospital       | Pending Verification | Medium  | 1 unit   |

---

## 🩸 Sample Donations (Completed)

| Donor        | Recipient    | Hospital              | Blood | Units |
| ------------ | ------------ | --------------------- | ----- | ----- |
| Rajesh Kumar | Anuj Mishra  | City General Hospital | O+    | 1     |
| Priya Sharma | Neha Dwivedi | Apollo Hospital       | A+    | 1     |

---

## 🎯 Testing Scenarios

### Scenario 1: View Donor Dashboard

```
Login: rajesh.kumar@email.com / hashedPassword123
Click: Donor Dashboard
Expected: See 2 donations, 1 badge, blood requests for O+
```

### Scenario 2: Create Emergency Request

```
Login: anuj.mishra@email.com / hashedPassword123
Click: Create Request
Select: Any Hospital (dropdown)
Blood Type: O+
Quantity: 2 units
Expected: Request created, appears in hospital dashboard
```

### Scenario 3: Hospital Review Requests

```
Login: city-general@hospital.com / hashedPassword123
Click: Hospital Dashboard
Expected: See pending/active requests
Click: Verify Patient
Expected: Update admission status to admitted
```

### Scenario 4: Donor Accepts Request

```
Login: rajesh.kumar@email.com / hashedPassword123
Click: Emergency Requests
Expected: See requests matching O+ blood type
Click: Accept Request
Expected: Status updated to donor-assigned
```

---

## 📊 Blood Group Distribution

| Blood Type              | Available Donors | Donors Locked              |
| ----------------------- | ---------------- | -------------------------- |
| O+ (Universal)          | 1 (Rajesh Kumar) | -                          |
| A+                      | 1 (Priya Sharma) | -                          |
| B+                      | 1 (Amit Singh)   | ❌ Locked until 2025-03-15 |
| AB- (Rare)              | 1 (Deepika Nair) | -                          |
| O- (Universal Negative) | 1 (Vikram Patel) | -                          |

---

## 🔐 Test Credentials Summary

### Quick Copy-Paste for Easy Testing

**Hospital Admin:**

```
Email: city-general@hospital.com
Pass: hashedPassword123
```

**Donor:**

```
Email: rajesh.kumar@email.com
Pass: hashedPassword123
```

**Recipient:**

```
Email: anuj.mishra@email.com
Pass: hashedPassword123
```

---

## 📝 Important Notes

1. **Passwords**: All test accounts use `hashedPassword123` - change in production!
2. **Data Persistence**: Data persists in Firebase until manually deleted
3. **Aadhaar Numbers**: Test numbers, not real aadhaar
4. **License Numbers**: Follow the validated format (8-20 chars, alphanumeric + / -)
5. **Dates**: Most data created between 2025-01-15 and 2025-02-25

---

## 🚀 Quick Start Commands

```bash
# 1. Navigate to server directory
cd server

# 2. Ensure Firebase config is set up
npm install

# 3. Seed the database
node seed.js

# 4. Start servers
npm run dev        # Terminal 1
cd ../client && npm start  # Terminal 2

# 5. Test login
# Open http://localhost:3000
# Use credentials from above
```

---

## 🔍 Data Location in Firebase

After seeding, check Firebase Console:

```
Project Root
├── users/
│   ├── [hospital_ids] (5 documents)
│   ├── [donor_ids] (5 documents)
│   └── [recipient_ids] (5 documents)
├── emergencyRequests/
│   └── [request_ids] (2 documents)
└── donations/
    └── [donation_ids] (2 documents)
```

---

## 🐛 Troubleshooting

**Q: Login fails with "User not approved"**
A: All seeded users have `status: "approved"`, check Firebase console

**Q: Can't see emergency requests as donor**
A: Make sure blood group matches and request status is "active" or "pending-verification"

**Q: Seeding script fails**
A: Check Firebase credentials and internet connection, see MOCK_DATA_GUIDE.md

**Q: Need to reset data**
A: Delete all documents in Firebase console collections, then run `node seed.js` again

---

## 📞 Support Resources

- **MOCK_DATA_GUIDE.md** - Complete detailed guide
- **FIREBASE_DATA_FLOW.md** - Data structure and relationships
- **BLOOD_REQUEST_VERIFICATION.md** - Request flow documentation
- **Firebase Console** - View actual data in real-time

---

Generated: 2025-02-28
Last Updated: 2025-02-28
