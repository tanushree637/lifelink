#!/usr/bin/env node

/**
 * Geocoding Script: Add coordinates to all hospital locations
 * Geocodes hospital addresses to get latitude/longitude for map display
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

// Map of cities to approximate coordinates (India)
const cityCoordinates = {
  Mumbai: { latitude: 19.076, longitude: 72.8777 },
  Delhi: { latitude: 28.7041, longitude: 77.1025 },
  Bangalore: { latitude: 12.9716, longitude: 77.5946 },
  Pune: { latitude: 18.5204, longitude: 73.8567 },
  Hyderabad: { latitude: 17.385, longitude: 78.4867 },
};

const db = getDB();

async function geocodeAllHospitals() {
  console.log("🌍 Geocoding All Hospital Locations...\n");

  try {
    // Initialize Firebase first
    await initializeFirebase();
    const db = getDB();

    // Get all hospitals
    const hospitalsSnapshot = await db
      .collection("users")
      .where("role", "==", "hospital")
      .get();

    let geocodedCount = 0;

    for (const doc of hospitalsSnapshot.docs) {
      const data = doc.data();
      const city = data.city || data.location || "Unknown";

      if (cityCoordinates[city]) {
        const coords = cityCoordinates[city];

        await doc.ref.update({
          latitude: coords.latitude,
          longitude: coords.longitude,
          location: city, // Ensure location field is set
          geocoded: true,
          geocodedAt: new Date(),
        });

        console.log(`  ✅ ${data.name}`);
        console.log(`     City: ${city}`);
        console.log(
          `     Coordinates: ${coords.latitude}, ${coords.longitude}\n`,
        );
        geocodedCount++;
      } else {
        console.log(
          `  ⚠️  ${data.name} - City "${city}" not found in coordinates map`,
        );
        console.log(`     Location: ${city}\n`);
      }
    }

    console.log("=".repeat(60));
    console.log("✅ GEOCODING COMPLETED!");
    console.log("=".repeat(60));
    console.log(`\n📍 Hospitals geocoded: ${geocodedCount}`);
    console.log(`🗺️  All hospitals now have map coordinates`);
    console.log(`✨ Pin drops are ready to display on the map!\n`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Geocoding Error:", error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run geocoding
geocodeAllHospitals();
