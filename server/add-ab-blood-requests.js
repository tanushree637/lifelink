/**
 * Add AB- Blood Requests to Pune Hospitals
 * Creates active blood requests for the 3 Pune hospitals
 */

require("dotenv").config();
const { getDB, initializeFirebase } = require("./config/firebase");

const bloodRequests = [
  {
    hospitalEmail: "care-hospital-pune@hospital.com",
    patientName: "Rajiv Malhotra",
    bloodGroup: "AB-",
    quantity: 3,
    urgencyLevel: "high",
  },
  {
    hospitalEmail: "medicore-pune@hospital.com",
    patientName: "Priya Sengupta",
    bloodGroup: "AB-",
    quantity: 2,
    urgencyLevel: "high",
  },
  {
    hospitalEmail: "lifecare-hospital@hospital.com",
    patientName: "Vikram Sharma",
    bloodGroup: "AB-",
    quantity: 4,
    urgencyLevel: "critical",
  },
];

async function addBloodRequests() {
  try {
    console.log("🔄 Initializing Firestore...");
    await initializeFirebase();
    const db = getDB();

    console.log(`📍 Adding AB- blood requests for 3 hospitals...\n`);

    let added = 0;

    for (const request of bloodRequests) {
      // Find hospital by email
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

      // Create emergency request
      const emergencyRequest = {
        hospitalId: hospitalId,
        hospitalEmail: request.hospitalEmail,
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

      const docRef = await db.collection("bloodRequests").add(emergencyRequest);

      console.log(`✅ Added: ${hospitalData.hospitalName}`);
      console.log(`   👤 Patient: ${request.patientName}`);
      console.log(`   🩸 Blood Group: ${request.bloodGroup}`);
      console.log(`   📦 Quantity: ${request.quantity} units`);
      console.log(`   ⚡ Priority: ${request.urgencyLevel}\n`);
      added++;
    }

    console.log("📊 Summary:");
    console.log(`✅ Added: ${added} blood requests`);
    console.log("✨ Blood request setup completed!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error adding blood requests:", error);
    process.exit(1);
  }
}

addBloodRequests();
