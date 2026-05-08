#!/usr/bin/env node

/**
 * Migration Script: Update Existing Users with New Fields
 * Updates all existing hospitals, donors, and recipients with correct data structure
 * Adds missing fields like 'city' to hospitals
 */

require("dotenv").config();

const path = require("path");
const fs = require("fs");

// Handle directory detection
let currentDir = __dirname;
if (!fs.existsSync(path.join(currentDir, "config"))) {
  if (fs.existsSync(path.join(currentDir, "server", "config"))) {
    currentDir = path.join(currentDir, "server");
  }
}

// Load dependencies
const { initializeFirebase, getDB } = require(
  path.join(currentDir, "config/firebase"),
);
const mockData = require(path.join(currentDir, "mockData"));

async function migrateExistingUsers() {
  console.log("🔄 Starting migration of existing users...\n");

  try {
    // Initialize Firebase first
    await initializeFirebase();
    const db = getDB();
    // ============================================
    // MIGRATE HOSPITALS
    // ============================================
    console.log("📋 Migrating Hospitals...");
    const hospitalsSnapshot = await db
      .collection("users")
      .where("role", "==", "hospital")
      .get();

    let hospitalsUpdated = 0;
    const hospitalCityMap = {
      "city-general@hospital.com": "Mumbai",
      "apollo-hospital@hospital.com": "Delhi",
      "fortis-healthcare@hospital.com": "Bangalore",
      "max-hospital@hospital.com": "Pune",
      "sunrise-hospital@hospital.com": "Hyderabad",
    };

    for (const doc of hospitalsSnapshot.docs) {
      const data = doc.data();
      const email = data.email;
      const cityFromMap = hospitalCityMap[email];

      if (!data.city && cityFromMap) {
        await doc.ref.update({
          city: cityFromMap,
          location: cityFromMap,
        });
        console.log(`  ✅ ${data.name} → Added city: ${cityFromMap}`);
        hospitalsUpdated++;
      } else if (data.city && !data.location) {
        await doc.ref.update({
          location: data.city,
        });
        console.log(`  ✅ ${data.name} → Added location field`);
        hospitalsUpdated++;
      }
    }
    console.log(`✓ Hospitals migrated: ${hospitalsUpdated}\n`);

    // ============================================
    // MIGRATE DONORS
    // ============================================
    console.log("📋 Migrating Donors...");
    const donorsSnapshot = await db
      .collection("users")
      .where("role", "==", "donor")
      .get();

    let donorsUpdated = 0;
    for (const doc of donorsSnapshot.docs) {
      const data = doc.data();
      const updateData = {};

      // Add missing fields
      if (data.status !== "approved") {
        updateData.status = "approved";
      }
      if (!data.medicalHistory) {
        updateData.medicalHistory = [];
      }
      if (data.available === undefined) {
        updateData.available = true;
      }
      if (!data.completedDonations) {
        updateData.completedDonations = 0;
      }

      if (Object.keys(updateData).length > 0) {
        await doc.ref.update(updateData);
        console.log(`  ✅ ${data.name} → Fields updated`);
        donorsUpdated++;
      }
    }
    console.log(`✓ Donors migrated: ${donorsUpdated}\n`);

    // ============================================
    // MIGRATE RECIPIENTS
    // ============================================
    console.log("📋 Migrating Recipients...");
    const recipientsSnapshot = await db
      .collection("users")
      .where("role", "==", "recipient")
      .get();

    let recipientsUpdated = 0;
    for (const doc of recipientsSnapshot.docs) {
      const data = doc.data();
      const updateData = {};

      // Add missing fields
      if (data.status !== "approved") {
        updateData.status = "approved";
      }
      if (!data.medicalHistory) {
        updateData.medicalHistory = [];
      }
      if (!data.location) {
        updateData.location = "Unknown";
      }

      if (Object.keys(updateData).length > 0) {
        await doc.ref.update(updateData);
        console.log(`  ✅ ${data.name} → Fields updated`);
        recipientsUpdated++;
      }
    }
    console.log(`✓ Recipients migrated: ${recipientsUpdated}\n`);

    // ============================================
    // SYNC COLLECTIONS
    // ============================================
    console.log("📋 Ensuring all mock data users exist...");

    // Ensure all hospitals from mockData exist
    let hospitalsCreated = 0;
    for (const hospital of mockData.hospitals) {
      const existingHospital = await db
        .collection("users")
        .where("email", "==", hospital.email)
        .get();
      if (existingHospital.empty) {
        await db.collection("users").add(hospital);
        console.log(`  ✨ Created: ${hospital.name}`);
        hospitalsCreated++;
      }
    }
    console.log(`✓ New hospitals created: ${hospitalsCreated}\n`);

    // Ensure all donors from mockData exist
    let donorsCreated = 0;
    for (const donor of mockData.donors) {
      const existingDonor = await db
        .collection("users")
        .where("email", "==", donor.email)
        .get();
      if (existingDonor.empty) {
        await db.collection("users").add(donor);
        console.log(`  ✨ Created: ${donor.name}`);
        donorsCreated++;
      }
    }
    console.log(`✓ New donors created: ${donorsCreated}\n`);

    // Ensure all recipients from mockData exist
    let recipientsCreated = 0;
    for (const recipient of mockData.recipients) {
      const existingRecipient = await db
        .collection("users")
        .where("email", "==", recipient.email)
        .get();
      if (existingRecipient.empty) {
        await db.collection("users").add(recipient);
        console.log(`  ✨ Created: ${recipient.name}`);
        recipientsCreated++;
      }
    }
    console.log(`✓ New recipients created: ${recipientsCreated}\n`);

    // ============================================
    // UPDATE REQUESTS & DONATIONS
    // ============================================
    console.log("📋 Updating Emergency Requests...");
    const requestsSnapshot = await db.collection("emergencyRequests").get();

    let requestsUpdated = 0;
    for (const doc of requestsSnapshot.docs) {
      const data = doc.data();
      const updateData = {};

      if (!data.createdAt) {
        updateData.createdAt = new Date();
      }
      if (!data.status) {
        updateData.status = "pending-verification";
      }
      if (!data.bloodType && data.bloodGroup) {
        updateData.bloodType = data.bloodGroup;
      }

      if (Object.keys(updateData).length > 0) {
        await doc.ref.update(updateData);
        requestsUpdated++;
      }
    }
    console.log(`✓ Requests updated: ${requestsUpdated}\n`);

    console.log("📋 Updating Donations...");
    const donationsSnapshot = await db.collection("donations").get();

    let donationsUpdated = 0;
    for (const doc of donationsSnapshot.docs) {
      const data = doc.data();
      const updateData = {};

      if (!data.donatedAt) {
        updateData.donatedAt = new Date();
      }
      if (!data.status) {
        updateData.status = "completed";
      }
      if (!data.units) {
        updateData.units = 1;
      }

      if (Object.keys(updateData).length > 0) {
        await doc.ref.update(updateData);
        donationsUpdated++;
      }
    }
    console.log(`✓ Donations updated: ${donationsUpdated}\n`);

    // ============================================
    // SUMMARY
    // ============================================
    console.log("\n" + "=".repeat(50));
    console.log("✅ MIGRATION COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(50));
    console.log("\n📊 Summary:");
    console.log(`  • Hospitals updated: ${hospitalsUpdated}`);
    console.log(`  • Donors updated: ${donorsUpdated}`);
    console.log(`  • Recipients updated: ${recipientsUpdated}`);
    console.log(`  • New hospitals created: ${hospitalsCreated}`);
    console.log(`  • New donors created: ${donorsCreated}`);
    console.log(`  • New recipients created: ${recipientsCreated}`);
    console.log(`  • Requests updated: ${requestsUpdated}`);
    console.log(`  • Donations updated: ${donationsUpdated}`);
    console.log(
      "\n✨ All existing users have been synced with new data structure!",
    );
    console.log("🔄 Refresh your browser (Ctrl+R) to see the changes.\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration Error:", error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run migration
migrateExistingUsers();
