/**
 * Update Donor Locations in Firestore
 * Changes location field from city name to full address
 */

require("dotenv").config();
const { getDB, initializeFirebase } = require("./config/firebase");

// Mapping of city to full address
const locationMapping = {
  Mumbai: "42 Residential Complex, Andheri West, Mumbai",
  Delhi: "78 Green Park Colony, New Delhi",
  Bangalore: "234 Tech Park Avenue, Bangalore",
  Pune: "156 Society Lane, Pune",
  Hyderabad: "89 Pearl Heights, Hyderabad",
};

async function updateDonorLocations() {
  try {
    console.log("🔄 Initializing Firestore...");
    await initializeFirebase();
    const db = getDB();

    console.log("📍 Fetching all donors...");
    const donorsSnapshot = await db
      .collection("users")
      .where("role", "==", "donor")
      .get();

    if (donorsSnapshot.empty) {
      console.log("❌ No donors found in Firestore");
      return;
    }

    console.log(`✅ Found ${donorsSnapshot.size} donors`);

    let updated = 0;
    let skipped = 0;

    for (const doc of donorsSnapshot.docs) {
      const donor = doc.data();
      const currentLocation = donor.location;

      // Check if location is a city name that needs to be updated
      if (locationMapping[currentLocation]) {
        const newLocation = locationMapping[currentLocation];
        await doc.ref.update({ location: newLocation });
        console.log(`✅ Updated: ${donor.name} (${donor.email})`);
        console.log(`   ${currentLocation} → ${newLocation}`);
        updated++;
      } else if (currentLocation && currentLocation.includes(",")) {
        // Already has a full address
        console.log(`⏭️  Skipped: ${donor.name} (already has full address)`);
        skipped++;
      } else {
        console.log(
          `⚠️  Unknown location format for ${donor.name}: "${currentLocation}"`,
        );
        skipped++;
      }
    }

    console.log("\n📊 Update Summary:");
    console.log(`✅ Updated: ${updated} donors`);
    console.log(`⏭️  Skipped: ${skipped} donors`);
    console.log("✨ Location update completed!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error updating donor locations:", error);
    process.exit(1);
  }
}

updateDonorLocations();
