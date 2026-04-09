#!/usr/bin/env node

/**
 * Database Seeding Script
 * Populates Firebase with mock data for testing
 *
 * Usage: node seed.js
 */

require("dotenv").config();
const bcrypt = require("bcryptjs");
const { initializeFirebase, getDB } = require("./config/firebase");
const mockData = require("./mockData");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function seedDatabase() {
  try {
    // Initialize Firebase first
    await initializeFirebase();

    const db = getDB();

    if (!db) {
      console.error("❌ Failed to connect to Firebase database");
      process.exit(1);
    }

    console.log("🌱 Starting database seeding...\n");

    // ============================================
    // SEED HOSPITALS
    // ============================================
    console.log("🏥 Seeding hospitals...");
    const hospitalIds = [];

    for (const hospital of mockData.hospitals) {
      try {
        const hashedPassword = await bcrypt.hash(hospital.password, 10);
        const hospitalData = {
          ...hospital,
          password: hashedPassword,
        };

        const docRef = await db.collection("users").add(hospitalData);
        hospitalIds.push(docRef.id);
        console.log(`   ✅ ${hospital.hospitalName} (ID: ${docRef.id})`);
        await delay(100); // Small delay to avoid rate limiting
      } catch (error) {
        console.error(
          `   ❌ Error adding hospital ${hospital.hospitalName}:`,
          error.message,
        );
      }
    }

    // ============================================
    // SEED DONORS
    // ============================================
    console.log("\n👤 Seeding donors...");
    const donorIds = [];

    for (const donor of mockData.donors) {
      try {
        const hashedPassword = await bcrypt.hash(donor.password, 10);
        const donorData = {
          ...donor,
          password: hashedPassword,
        };

        const docRef = await db.collection("users").add(donorData);
        donorIds.push(docRef.id);
        console.log(
          `   ✅ ${donor.name} (Blood: ${donor.bloodGroup}) (ID: ${docRef.id})`,
        );
        await delay(100);
      } catch (error) {
        console.error(`   ❌ Error adding donor ${donor.name}:`, error.message);
      }
    }

    // ============================================
    // SEED RECIPIENTS
    // ============================================
    console.log("\n👥 Seeding recipients...");
    const recipientIds = [];

    for (const recipient of mockData.recipients) {
      try {
        const hashedPassword = await bcrypt.hash(recipient.password, 10);
        const recipientData = {
          ...recipient,
          password: hashedPassword,
        };

        const docRef = await db.collection("users").add(recipientData);
        recipientIds.push(docRef.id);
        console.log(`   ✅ ${recipient.name} (ID: ${docRef.id})`);
        await delay(100);
      } catch (error) {
        console.error(
          `   ❌ Error adding recipient ${recipient.name}:`,
          error.message,
        );
      }
    }

    // ============================================
    // SEED EMERGENCY REQUESTS
    // ============================================
    console.log("\n🆘 Seeding emergency requests...");

    if (recipientIds.length > 0 && hospitalIds.length > 0) {
      for (let i = 0; i < mockData.emergencyRequests.length; i++) {
        try {
          const request = mockData.emergencyRequests[i];
          const requestData = {
            recipientId: recipientIds[i % recipientIds.length],
            hospitalId: hospitalIds[i % hospitalIds.length],
            patientName: request.patientName,
            bloodGroup: request.bloodGroup,
            quantity: request.quantity,
            urgencyLevel: request.urgencyLevel,
            status: request.status,
            admissionStatus: request.admissionStatus,
            createdAt: request.createdAt,
            updatedAt: request.updatedAt,
          };

          const docRef = await db
            .collection("emergencyRequests")
            .add(requestData);
          console.log(
            `   ✅ Request for ${request.bloodGroup} (Status: ${request.status}) (ID: ${docRef.id})`,
          );
          await delay(100);
        } catch (error) {
          console.error(`   ❌ Error adding emergency request:`, error.message);
        }
      }
    }

    // ============================================
    // SEED DONATIONS
    // ============================================
    console.log("\n🩸 Seeding donations...");

    if (
      donorIds.length > 0 &&
      recipientIds.length > 0 &&
      hospitalIds.length > 0
    ) {
      for (let i = 0; i < mockData.donations.length; i++) {
        try {
          const donation = mockData.donations[i];
          const donationData = {
            donorId: donorIds[i % donorIds.length],
            recipientId: recipientIds[i % recipientIds.length],
            hospitalId: hospitalIds[i % hospitalIds.length],
            bloodGroup: donation.bloodGroup,
            quantity: donation.quantity,
            units: donation.units,
            status: donation.status,
            donationDate: donation.donationDate,
            createdAt: donation.createdAt,
          };

          const docRef = await db.collection("donations").add(donationData);
          console.log(
            `   ✅ Donation: ${donation.bloodGroup} (Units: ${donation.units}) (ID: ${docRef.id})`,
          );
          await delay(100);
        } catch (error) {
          console.error(`   ❌ Error adding donation:`, error.message);
        }
      }
    }

    // ============================================
    // SEED SUMMARY
    // ============================================
    console.log("\n");
    console.log("╔════════════════════════════════════════╗");
    console.log("║     ✅ DATABASE SEEDING COMPLETE      ║");
    console.log("╚════════════════════════════════════════╝");
    console.log(`\n📊 Summary:`);
    console.log(`   🏥 Hospitals Added:  ${hospitalIds.length}`);
    console.log(`   👤 Donors Added:     ${donorIds.length}`);
    console.log(`   👥 Recipients Added: ${recipientIds.length}`);
    console.log(
      `   🆘 Requests Added:   ${Math.min(mockData.emergencyRequests.length, recipientIds.length && hospitalIds.length ? recipientIds.length : 0)}`,
    );
    console.log(
      `   🩸 Donations Added:  ${Math.min(mockData.donations.length, donorIds.length && recipientIds.length && hospitalIds.length ? donorIds.length : 0)}`,
    );

    console.log("\n📝 Test Credentials:\n");
    console.log("HOSPITALS:");
    mockData.hospitals.forEach((h) => {
      console.log(`   Email: ${h.email}, Password: ${h.password}`);
    });

    console.log("\nDONORS:");
    mockData.donors.forEach((d) => {
      console.log(
        `   Email: ${d.email}, Password: ${d.password}, Blood: ${d.bloodGroup}`,
      );
    });

    console.log("\nRECIPIENTS:");
    mockData.recipients.forEach((r) => {
      console.log(`   Email: ${r.email}, Password: ${r.password}`);
    });

    console.log("\n✨ Ready for testing!\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

// Run the seeding
seedDatabase();
