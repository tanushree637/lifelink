#!/usr/bin/env node

/**
 * Setup Script for Sanya Kapil Donor
 * Creates a real emergency request for Sanya Kapil's blood type
 */

require("dotenv").config();
const { initializeFirebase, getDB } = require("./config/firebase");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function setupSanyaKapilDashboard() {
  try {
    console.log("🔄 Initializing Firestore...");
    await initializeFirebase();
    const db = getDB();

    console.log("\n🔍 Finding Sanya Kapil in database...\n");

    // Find Sanya Kapil by name
    const donorSnapshot = await db
      .collection("users")
      .where("name", "==", "Sanya Kapil")
      .where("role", "==", "donor")
      .get();

    if (donorSnapshot.empty) {
      console.log("❌ Sanya Kapil not found in database");
      console.log("   Please create the donor account first via signup");
      process.exit(1);
    }

    const sanyaDoc = donorSnapshot.docs[0];
    const sanyaData = sanyaDoc.data();
    const sanyaId = sanyaDoc.id;

    console.log("✅ Found Sanya Kapil!");
    console.log(`   ID: ${sanyaId}`);
    console.log(`   Blood Group: ${sanyaData.bloodGroup || "Not set"}`);
    console.log(`   Location: ${sanyaData.location || "Not set"}`);
    console.log(`   Status: ${sanyaData.status || "pending"}\n`);

    if (!sanyaData.bloodGroup) {
      console.log("⚠️  Blood group not set for Sanya Kapil!");
      console.log("   Please update blood group in profile first");
      process.exit(1);
    }

    const bloodGroup = sanyaData.bloodGroup;

    // Check if there are existing requests for this blood group
    console.log(`\n🔍 Checking for existing requests for ${bloodGroup}...\n`);

    const existingRequests = await db
      .collection("emergencyRequests")
      .where("bloodGroup", "==", bloodGroup)
      .where("status", "==", "active")
      .where("admissionStatus", "==", "admitted")
      .get();

    console.log(
      `✅ Found ${existingRequests.size} existing active request(s) for ${bloodGroup}`,
    );

    if (existingRequests.size > 0) {
      console.log("\n📋 Existing Requests:");
      existingRequests.forEach((doc) => {
        const data = doc.data();
        console.log(
          `   • ${data.patientName} at ${data.hospitalName || "Hospital"}`,
        );
      });
      console.log(
        "\n✅ Sanya Kapil dashboard will show these real requests on map",
      );
      process.exit(0);
    }

    console.log("\n⚠️  No existing requests for this blood group");
    console.log("   Creating a real emergency request...\n");

    // Get a random hospital from Pune to create the request
    const patientsRequests = [
      {
        hospitalEmail: "care-hospital-pune@hospital.com",
        patientName: "Ramesh Kumar",
        bloodGroup: bloodGroup,
        quantity: 2,
        urgencyLevel: "high",
      },
      {
        hospitalEmail: "medicore-pune@hospital.com",
        patientName: "Sneha Singh",
        bloodGroup: bloodGroup,
        quantity: 1,
        urgencyLevel: "medium",
      },
      {
        hospitalEmail: "lifecare-hospital@hospital.com",
        patientName: "Deepak Patel",
        bloodGroup: bloodGroup,
        quantity: 3,
        urgencyLevel: "high",
      },
    ];

    // Try to create request for the first available hospital
    for (const request of patientsRequests) {
      const hospitalSnapshot = await db
        .collection("users")
        .where("email", "==", request.hospitalEmail)
        .where("role", "==", "hospital")
        .get();

      if (hospitalSnapshot.empty) {
        console.log(`⚠️  Hospital not found: ${request.hospitalEmail}`);
        continue;
      }

      const hospital = hospitalSnapshot.docs[0];
      const hospitalId = hospital.id;
      const hospitalData = hospital.data();

      // Check if emergency request already exists for this hospital and blood group
      const duplicateCheck = await db
        .collection("emergencyRequests")
        .where("hospitalId", "==", hospitalId)
        .where("bloodGroup", "==", request.bloodGroup)
        .where("status", "==", "active")
        .get();

      if (duplicateCheck.size > 0) {
        console.log(
          `⏭️  Request already exists at ${hospitalData.hospitalName}, skipping...`,
        );
        continue;
      }

      // Create the emergency request
      const emergencyRequest = {
        hospitalId: hospitalId,
        hospitalName: hospitalData.hospitalName,
        patientName: request.patientName,
        bloodGroup: request.bloodGroup,
        quantity: request.quantity,
        urgencyLevel: request.urgencyLevel,
        status: "active",
        admissionStatus: "admitted",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await db
        .collection("emergencyRequests")
        .add(emergencyRequest);

      console.log(`✅ Created emergency request!`);
      console.log(`   Hospital: ${hospitalData.hospitalName}`);
      console.log(`   Patient: ${request.patientName}`);
      console.log(`   Blood Type: ${request.bloodGroup}`);
      console.log(`   Quantity: ${request.quantity} units`);
      console.log(`   Priority: ${request.urgencyLevel}`);
      console.log(`   Location: ${hospitalData.location || hospitalData.city}`);
      console.log(
        `   Distance: ${calculateDistance(18.52, 73.85, hospitalData.latitude || 18.5204, hospitalData.longitude || 73.8567).toFixed(1)} km from Sanya's location\n`,
      );

      console.log(
        "✨ Setup complete! Sanya Kapil's dashboard now shows real data.",
      );
      process.exit(0);
    }

    console.log("❌ Could not create emergency request - hospitals not found");
    process.exit(1);
  } catch (error) {
    console.error("❌ Error setting up Sanya Kapil dashboard:", error);
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

setupSanyaKapilDashboard();
