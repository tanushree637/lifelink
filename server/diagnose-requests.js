#!/usr/bin/env node

/**
 * Diagnostic Script - Check Emergency Requests
 */

require("dotenv").config();
const { initializeFirebase, getDB } = require("./config/firebase");

async function diagnoseRequests() {
  try {
    console.log("🔍 Diagnosing Emergency Requests Database...\n");
    await initializeFirebase();
    const db = getDB();

    // Get ALL emergency requests
    const allRequests = await db.collection("emergencyRequests").get();

    console.log(
      `📊 Total Emergency Requests in Database: ${allRequests.size}\n`,
    );

    if (allRequests.size === 0) {
      console.log("✅ Database is clean - no emergency requests\n");
      process.exit(0);
    }

    console.log("📋 All Requests:\n");

    let patientOneCount = 0;
    let duplicates = new Map();

    for (const doc of allRequests.docs) {
      const data = doc.data();
      const key = `${data.patientName}_${data.bloodGroup}_${data.hospitalId}`;

      if (!duplicates.has(key)) {
        duplicates.set(key, []);
      }
      duplicates.get(key).push(doc.id);

      if (data.patientName === "Patient One") {
        patientOneCount++;
      }

      console.log(`ID: ${doc.id}`);
      console.log(`   Patient: ${data.patientName}`);
      console.log(`   Blood: ${data.bloodGroup}`);
      console.log(`   Hospital: ${data.hospitalName || "Unknown"}`);
      console.log(`   Status: ${data.status}`);
      console.log(
        `   Created: ${data.createdAt?.toDate?.() || data.createdAt}`,
      );
      console.log("");
    }

    console.log("\n🔎 Analysis:");
    console.log(`   Fake "Patient One" requests: ${patientOneCount}`);

    let duplicateCount = 0;
    for (const [key, ids] of duplicates.entries()) {
      if (ids.length > 1) {
        duplicateCount++;
        console.log(`   ⚠️  Duplicate: ${key} (${ids.length} copies)`);
      }
    }

    if (patientOneCount > 0 || duplicateCount > 0) {
      console.log("\n❌ Database contains fake/duplicate data");
      console.log("   Run: node delete-all-requests.js");
    } else {
      console.log("\n✅ Database looks clean");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

diagnoseRequests();
