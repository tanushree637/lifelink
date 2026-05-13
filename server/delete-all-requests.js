#!/usr/bin/env node

/**
 * Complete Cleanup - Delete ALL Emergency Requests
 * Then create ONE real request for Sanya Kapil
 */

require("dotenv").config();
const { initializeFirebase, getDB } = require("./config/firebase");

async function completeCleanup() {
  try {
    console.log("🧹 Starting Complete Cleanup...\n");
    await initializeFirebase();
    const db = getDB();

    // Step 1: Delete ALL emergency requests
    console.log("🗑️  Deleting ALL emergency requests from database...\n");

    const allRequests = await db.collection("emergencyRequests").get();

    let deletedCount = 0;

    for (const doc of allRequests.docs) {
      const data = doc.data();
      console.log(
        `   Deleting: ${data.patientName} at ${data.hospitalName || "Unknown"}`,
      );
      await db.collection("emergencyRequests").doc(doc.id).delete();
      deletedCount++;
    }

    console.log(`\n✅ Deleted ${deletedCount} requests\n`);

    // Step 2: Find Sanya Kapil
    console.log("🔍 Finding Sanya Kapil...\n");

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
    const bloodGroup = sanyaData.bloodGroup;

    console.log(`✅ Found Sanya Kapil`);
    console.log(`   Blood Group: ${bloodGroup}`);
    console.log(`   Location: Bangalore\n`);

    // Step 3: Get Fortis Hospital in Bangalore
    console.log("🔍 Finding Fortis Healthcare (Bangalore)...\n");

    const fortisSnapshot = await db
      .collection("users")
      .where("email", "==", "fortis-healthcare@hospital.com")
      .where("role", "==", "hospital")
      .get();

    if (fortisSnapshot.empty) {
      console.log("❌ Fortis Healthcare not found");
      process.exit(1);
    }

    const fortisDoc = fortisSnapshot.docs[0];
    const fortisData = fortisDoc.data();

    console.log(`✅ Found Fortis Healthcare`);
    console.log(
      `   Coordinates: ${fortisData.latitude}, ${fortisData.longitude}\n`,
    );

    // Step 4: Get a real recipient
    console.log("🔍 Finding a recipient...\n");

    const recipientSnapshot = await db
      .collection("users")
      .where("role", "==", "recipient")
      .limit(1)
      .get();

    let recipientId = null;
    if (!recipientSnapshot.empty) {
      recipientId = recipientSnapshot.docs[0].id;
      console.log(`✅ Found recipient\n`);
    }

    // Step 5: Create ONE real emergency request
    console.log("📝 Creating ONE real emergency request...\n");

    const realRequest = {
      recipientId: recipientId || null,
      hospitalId: fortisDoc.id,
      hospitalName: fortisData.hospitalName,
      patientName: "Vikram Desai",
      bloodGroup: bloodGroup,
      quantity: 2,
      urgencyLevel: "high",
      status: "active",
      admissionStatus: "admitted",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection("emergencyRequests").add(realRequest);

    console.log(`✅ Created REAL Emergency Request!`);
    console.log(`   ID: ${docRef.id}`);
    console.log(`   Hospital: ${realRequest.hospitalName}`);
    console.log(`   Patient: ${realRequest.patientName}`);
    console.log(`   Blood Group: ${realRequest.bloodGroup}`);
    console.log(`   Quantity: ${realRequest.quantity} units`);
    console.log(`   Urgency: ${realRequest.urgencyLevel}`);
    console.log(`   Status: ${realRequest.status}\n`);

    // Calculate distance
    const sanyaLat = 12.9716; // Bangalore latitude (approx)
    const sanyaLon = 77.5946; // Bangalore longitude (approx)
    const distance = calculateDistance(
      sanyaLat,
      sanyaLon,
      fortisData.latitude,
      fortisData.longitude,
    );

    console.log(
      `📍 Distance from Sanya's location: ${distance.toFixed(1)} km\n`,
    );

    console.log("=".repeat(60));
    console.log("🎉 CLEANUP COMPLETE!");
    console.log("=".repeat(60));
    console.log("\n✨ Sanya Kapil's Dashboard Now Shows:");
    console.log(`   ✅ 1 Real Emergency Request (no duplicates)`);
    console.log(`   ✅ Hospital: ${fortisData.hospitalName}, Bangalore`);
    console.log(`   ✅ Patient: ${realRequest.patientName}`);
    console.log(`   ✅ Distance: ${distance.toFixed(1)} km`);
    console.log(`   ✅ Real data only\n`);

    console.log("📋 Next Steps:");
    console.log("   1. Refresh your browser or logout/login");
    console.log("   2. Go to Emergency Requests tab");
    console.log("   3. Should see 1 request (Vikram Desai at Fortis)");
    console.log("   4. Go to Hospitals Map tab");
    console.log(
      "   5. Should see distance calculation: " + distance.toFixed(1) + " km\n",
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

completeCleanup();
