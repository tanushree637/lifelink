#!/usr/bin/env node

/**
 * Create AB- Blood Requests Script
 * Creates 4 emergency blood requests for AB- from different recipients
 *
 * Usage: node create-ab-requests.js
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const { initializeFirebase, getDB } = require("./config/firebase");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function createABBloodRequests() {
  try {
    // Initialize Firebase
    await initializeFirebase();
    const db = getDB();

    if (!db) {
      console.error("❌ Failed to connect to Firebase database");
      process.exit(1);
    }

    console.log("🩸 Creating AB- Blood Requests...\n");

    // Get all approved recipients
    const recipientsSnapshot = await db
      .collection("users")
      .where("role", "==", "recipient")
      .where("status", "==", "approved")
      .get();

    const recipients = [];
    recipientsSnapshot.forEach((doc) => {
      recipients.push({ id: doc.id, ...doc.data() });
    });

    if (recipients.length < 4) {
      console.error(
        `❌ Need at least 4 approved recipients. Found: ${recipients.length}`,
      );
      process.exit(1);
    }

    // Get all approved hospitals
    const hospitalsSnapshot = await db
      .collection("users")
      .where("role", "==", "hospital")
      .where("status", "==", "approved")
      .get();

    const hospitals = [];
    hospitalsSnapshot.forEach((doc) => {
      hospitals.push({ id: doc.id, ...doc.data() });
    });

    if (hospitals.length < 4) {
      console.error(
        `❌ Need at least 4 approved hospitals. Found: ${hospitals.length}`,
      );
      process.exit(1);
    }

    console.log(`✅ Found ${recipients.length} recipients`);
    console.log(`✅ Found ${hospitals.length} hospitals\n`);

    // Create 4 AB- blood requests
    const requests = [
      {
        recipientId: recipients[0].id,
        hospitalId: hospitals[0].id,
        patientName: `${recipients[0].name} - Emergency AB- Needed`,
        bloodGroup: "AB-",
        quantity: 2,
        urgencyLevel: "high",
        status: "active",
        admissionStatus: "admitted",
        createdAt: new Date("2025-04-20"),
        updatedAt: new Date("2025-04-20"),
      },
      {
        recipientId: recipients[1].id,
        hospitalId: hospitals[1].id,
        patientName: `${recipients[1].name} - Emergency AB- Needed`,
        bloodGroup: "AB-",
        quantity: 1,
        urgencyLevel: "high",
        status: "active",
        admissionStatus: "admitted",
        createdAt: new Date("2025-04-21"),
        updatedAt: new Date("2025-04-21"),
      },
      {
        recipientId: recipients[2].id,
        hospitalId: hospitals[2].id,
        patientName: `${recipients[2].name} - Emergency AB- Needed`,
        bloodGroup: "AB-",
        quantity: 3,
        urgencyLevel: "medium",
        status: "active",
        admissionStatus: "admitted",
        createdAt: new Date("2025-04-22"),
        updatedAt: new Date("2025-04-22"),
      },
      {
        recipientId: recipients[3].id,
        hospitalId: hospitals[3].id,
        patientName: `${recipients[3].name} - Emergency AB- Needed`,
        bloodGroup: "AB-",
        quantity: 2,
        urgencyLevel: "medium",
        status: "pending-verification",
        admissionStatus: "pending",
        createdAt: new Date("2025-04-23"),
        updatedAt: new Date("2025-04-23"),
      },
    ];

    console.log("🩸 Creating blood requests:\n");

    for (let i = 0; i < requests.length; i++) {
      const req = requests[i];
      const docRef = await db.collection("emergencyRequests").add(req);
      console.log(`   ✅ Request #${i + 1}: ${req.patientName}`);
      console.log(
        `      Hospital: ${hospitals[i].hospitalName} | Recipient: ${recipients[i].name}`,
      );
      console.log(`      Blood: ${req.bloodGroup} | Units: ${req.quantity}`);
      console.log(`      Status: ${req.status} | Urgency: ${req.urgencyLevel}`);
      console.log(`      ID: ${docRef.id}\n`);
      await delay(100);
    }

    console.log("╔════════════════════════════════════════╗");
    console.log("║  ✅ AB- BLOOD REQUESTS CREATED         ║");
    console.log("╚════════════════════════════════════════╝\n");

    console.log("📊 Summary:");
    console.log(`   ✅ Total Requests Created: 4`);
    console.log(`   🩸 Blood Type: AB- (all requests)`);
    console.log(`   👥 Recipients Used: ${recipients.length}`);
    console.log(`   🏥 Hospitals Used: ${hospitals.length}`);
    console.log(`\n📋 Request Details:`);

    for (let i = 0; i < 4; i++) {
      console.log(`\n   Request ${i + 1}:`);
      console.log(
        `      Recipient: ${recipients[i].name} (${recipients[i].email})`,
      );
      console.log(`      Hospital: ${hospitals[i].hospitalName}`);
      console.log(`      Units: ${requests[i].quantity}`);
      console.log(`      Urgency: ${requests[i].urgencyLevel}`);
      console.log(`      Status: ${requests[i].status}`);
    }

    console.log("\n✨ Ready for testing!\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating blood requests:", error);
    process.exit(1);
  }
}

// Run the script
createABBloodRequests();
