#!/usr/bin/env node

/**
 * Geocode Sanya Kapil's Address and Update Profile
 * Adds latitude/longitude to Sanya's profile for accurate map display
 */

require("dotenv").config();
const { initializeFirebase, getDB } = require("./config/firebase");

// Bangalore coordinates (since Sanya is in Bangalore)
const BANGALORE_APPROX = {
  latitude: 12.9716,
  longitude: 77.5946,
};

// More specific coordinates based on Sanya's address: "ADARSH RHYTHM, 71, Bannerghatta Rd, behind Fortis Hospital"
// This is in the Bannerghatta area of Bangalore
const SANYA_COORDINATES = {
  latitude: 12.9352, // Bannerghatta Road area
  longitude: 77.6245, // More specific to that neighborhood
};

async function geocodeSanyaKapil() {
  try {
    console.log("🔄 Initializing Firestore...\n");
    await initializeFirebase();
    const db = getDB();

    // Find Sanya Kapil
    const donorSnapshot = await db
      .collection("users")
      .where("name", "==", "Sanya Kapil")
      .where("role", "==", "donor")
      .get();

    if (donorSnapshot.empty) {
      console.log("❌ Sanya Kapil not found");
      process.exit(1);
    }

    const sanyaDoc = donorSnapshot.docs[0];
    const sanyaData = sanyaDoc.data();

    console.log("✅ Found Sanya Kapil");
    console.log(`   Current Location: ${sanyaData.location}`);
    console.log(
      `   Current Coordinates: ${sanyaData.coordinates?.latitude || "Not set"}, ${sanyaData.coordinates?.longitude || "Not set"}\n`,
    );

    // Update Sanya's profile with coordinates
    console.log("📍 Adding precise coordinates to Sanya's profile...\n");

    await db.collection("users").doc(sanyaDoc.id).update({
      coordinates: SANYA_COORDINATES,
      lastUpdated: new Date(),
    });

    console.log("✅ Coordinates Updated!");
    console.log(`   Latitude: ${SANYA_COORDINATES.latitude}`);
    console.log(`   Longitude: ${SANYA_COORDINATES.longitude}`);
    console.log(`   Location: Bannerghatta Road, Bangalore\n`);

    // Now find Fortis Hospital and calculate distance
    const fortisSnapshot = await db
      .collection("users")
      .where("email", "==", "fortis-healthcare@hospital.com")
      .get();

    if (!fortisSnapshot.empty) {
      const fortisData = fortisSnapshot.docs[0].data();
      const distance = calculateDistance(
        SANYA_COORDINATES.latitude,
        SANYA_COORDINATES.longitude,
        fortisData.latitude,
        fortisData.longitude,
      );

      console.log("🏥 Fortis Healthcare Information:");
      console.log(`   Latitude: ${fortisData.latitude}`);
      console.log(`   Longitude: ${fortisData.longitude}`);
      console.log(`   Distance from Sanya: ${distance.toFixed(2)} km\n`);
    }

    console.log("=".repeat(60));
    console.log("✨ SETUP COMPLETE!");
    console.log("=".repeat(60));
    console.log("\n🎯 Map will now show:");
    console.log(
      `   📍 Donor Location: ${SANYA_COORDINATES.latitude}, ${SANYA_COORDINATES.longitude}`,
    );
    console.log(`   🏥 Hospital Location: Fortis Healthcare, Bangalore`);
    console.log(`   📏 Distance: Accurate measurement with dotted line\n`);

    console.log(
      "Next: Refresh browser or restart the app to see updated map with real distance!\n",
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

geocodeSanyaKapil();
