/**
 * Add New Hospitals to Firestore
 * Adds the 3 new hospitals in 10-20 km radius of "156 Society Lane, Pune"
 */

require("dotenv").config();
const { getDB, initializeFirebase } = require("./config/firebase");

const newHospitals = [
  {
    email: "care-hospital-pune@hospital.com",
    password: "HospitalPass123",
    name: "Care Multispecialty Hospital",
    role: "hospital",
    phone: "+91-9876543225",
    hospitalName: "Care Multispecialty Hospital",
    address: "42 Kondhwa Road, Pune",
    city: "Pune",
    latitude: 18.38,
    longitude: 73.92,
    license: "CMP2023006",
    licenseNormalized: "CMP2023006",
    createdAt: new Date("2025-02-15"),
    status: "approved",
  },
  {
    email: "medicore-pune@hospital.com",
    password: "HospitalPass123",
    name: "MediCore Advanced Hospital",
    role: "hospital",
    phone: "+91-9876543226",
    hospitalName: "MediCore Advanced Hospital",
    address: "87 Baner Road, Pune",
    city: "Pune",
    latitude: 18.6,
    longitude: 73.76,
    license: "MCA2023007",
    licenseNormalized: "MCA2023007",
    createdAt: new Date("2025-02-18"),
    status: "approved",
  },
  {
    email: "lifecare-hospital@hospital.com",
    password: "HospitalPass123",
    name: "LifeCare Hospital Pune",
    role: "hospital",
    phone: "+91-9876543227",
    hospitalName: "LifeCare Hospital Pune",
    address: "215 Hadapsar Road, Pune",
    city: "Pune",
    latitude: 18.4625,
    longitude: 73.9234,
    license: "LCP2023008",
    licenseNormalized: "LCP2023008",
    createdAt: new Date("2025-02-20"),
    status: "approved",
  },
];

async function addHospitals() {
  try {
    console.log("🔄 Initializing Firestore...");
    await initializeFirebase();
    const db = getDB();

    console.log(`📍 Adding ${newHospitals.length} new hospitals...\n`);

    let added = 0;
    let skipped = 0;

    for (const hospital of newHospitals) {
      // Check if hospital already exists
      const existingHospital = await db
        .collection("users")
        .where("email", "==", hospital.email)
        .get();

      if (!existingHospital.empty) {
        console.log(`⏭️  Skipped: ${hospital.name} (already exists)`);
        skipped++;
        continue;
      }

      // Check if license already exists
      const existingLicense = await db
        .collection("users")
        .where("licenseNormalized", "==", hospital.licenseNormalized)
        .get();

      if (!existingLicense.empty) {
        console.log(`⏭️  Skipped: ${hospital.name} (license already exists)`);
        skipped++;
        continue;
      }

      // Add hospital to Firestore
      const docRef = await db.collection("users").add(hospital);
      console.log(`✅ Added: ${hospital.name}`);
      console.log(`   📍 Distance from donor: ~${getDistance(hospital)} km`);
      console.log(`   📧 Email: ${hospital.email}\n`);
      added++;
    }

    console.log("📊 Summary:");
    console.log(`✅ Added: ${added} hospitals`);
    console.log(`⏭️  Skipped: ${skipped} hospitals`);
    console.log("✨ Hospital setup completed!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error adding hospitals:", error);
    process.exit(1);
  }
}

function getDistance(hospital) {
  // Reference point: 156 Society Lane, Pune (18.52°N, 73.85°E)
  const donorLat = 18.52;
  const donorLon = 73.85;

  const R = 6371; // Earth's radius in km
  const dLat = ((hospital.latitude - donorLat) * Math.PI) / 180;
  const dLon = ((hospital.longitude - donorLon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((donorLat * Math.PI) / 180) *
      Math.cos((hospital.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance.toFixed(2);
}

addHospitals();
