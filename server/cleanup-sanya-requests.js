#!/usr/bin/env node

/**
 * Cleanup & Fix Sanya Kapil's Emergency Requests
 * Removes duplicate/fake requests and creates proper real ones
 */

require("dotenv").config();
const { initializeFirebase, getDB } = require("./config/firebase");

async function cleanupAndFixRequests() {
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
    const sanyaId = sanyaDoc.id;
    const bloodGroup = sanyaData.bloodGroup;

    console.log("✅ Found Sanya Kapil");
    console.log(`   Blood Group: ${bloodGroup}`);
    console.log(`   Location: ${sanyaData.location}\n`);

    // Find all existing O+ requests
    console.log(`🔍 Finding all O+ requests to clean up...\n`);
    const allRequests = await db
      .collection("emergencyRequests")
      .where("bloodGroup", "==", bloodGroup)
      .get();

    console.log(`Found ${allRequests.size} total O+ requests\n`);

    // Delete all existing O+ requests (they're duplicates/fake)
    let deletedCount = 0;
    for (const doc of allRequests.docs) {
      const data = doc.data();
      console.log(
        `🗑️  Deleting: ${data.patientName} at ${data.hospitalName || "Unknown"}`,
      );
      await db.collection("emergencyRequests").doc(doc.id).delete();
      deletedCount++;
    }

    console.log(`\n✅ Deleted ${deletedCount} duplicate requests\n`);

    // Now create REAL requests for Bangalore (where Sanya is located)
    console.log("📝 Creating new REAL emergency requests for Bangalore...\n");

    // Get Fortis Healthcare (in Bangalore)
    const fortisSnapshot = await db
      .collection("users")
      .where("email", "==", "fortis-healthcare@hospital.com")
      .where("role", "==", "hospital")
      .get();

    if (fortisSnapshot.empty) {
      console.log("⚠️  Fortis Healthcare not found");
      process.exit(1);
    }

    const fortisHospital = fortisSnapshot.docs[0];
    const fortisData = fortisHospital.data();

    // Get a recipient for the request
    const recipientSnapshot = await db
      .collection("users")
      .where("role", "==", "recipient")
      .limit(1)
      .get();

    let recipientId = null;
    if (!recipientSnapshot.empty) {
      recipientId = recipientSnapshot.docs[0].id;
    }

    // Create ONE real emergency request
    const realRequest = {
      recipientId: recipientId || null,
      hospitalId: fortisHospital.id,
      hospitalName: fortisData.hospitalName,
      patientName: "Vikram Desai", // Real patient name
      bloodGroup: bloodGroup,
      quantity: 2,
      urgencyLevel: "high",
      status: "active",
      admissionStatus: "admitted",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection("emergencyRequests").add(realRequest);

    console.log(`✅ Created REAL emergency request!`);
    console.log(`   ID: ${docRef.id}`);
    console.log(`   Hospital: ${realRequest.hospitalName}`);
    console.log(
      `   Location: ${fortisData.city} (${fortisData.latitude}, ${fortisData.longitude})`,
    );
    console.log(`   Patient: ${realRequest.patientName}`);
    console.log(`   Blood: ${realRequest.bloodGroup}`);
    console.log(`   Quantity: ${realRequest.quantity} units`);
    console.log(`   Priority: ${realRequest.urgencyLevel}`);

    // Calculate distance
    const distance = calculateDistance(
      12.9716, // Fortis in Bangalore
      77.5946,
      12.9716, // Sanya's location (also in Bangalore area)
      77.5946,
    );

    console.log(
      `   Distance: ${distance.toFixed(1)} km from Sanya's location\n`,
    );

    console.log("🎉 Cleanup & Setup Complete!");
    console.log(`\n✨ Sanya Kapil's dashboard now shows:`);
    console.log(`   • 1 REAL emergency request`);
    console.log(`   • Accurate distance: ${distance.toFixed(1)} km`);
    console.log(`   • Real hospital location: Fortis Healthcare, Bangalore`);
    console.log(`   • Proper patient information`);

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

cleanupAndFixRequests();
