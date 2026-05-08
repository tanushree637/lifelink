/**
 * Verify Hospital Distances from Donor Location
 * Checks if newly added hospitals are within 10-20 km of "156 Society Lane, Pune"
 */

// Approximate coordinates for "156 Society Lane, Pune"
const donorLocation = {
  latitude: 18.52,
  longitude: 73.85,
};

// Hospital coordinates (from updated mockData)
const hospitals = [
  {
    name: "Care Multispecialty Hospital",
    latitude: 18.38,
    longitude: 73.92,
  },
  {
    name: "MediCore Advanced Hospital",
    latitude: 18.6,
    longitude: 73.76,
  },
  {
    name: "LifeCare Hospital Pune",
    latitude: 18.4625,
    longitude: 73.9234,
  },
];

// Calculate distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(2);
}

console.log("\n📍 Donor Location: 156 Society Lane, Pune");
console.log(
  `   Coordinates: ${donorLocation.latitude}°N, ${donorLocation.longitude}°E\n`,
);
console.log("🏥 Hospital Distances:\n");

hospitals.forEach((hospital) => {
  const distance = calculateDistance(
    donorLocation.latitude,
    donorLocation.longitude,
    hospital.latitude,
    hospital.longitude,
  );

  const inRange = distance >= 10 && distance <= 20;
  const status = inRange ? "✅" : "⚠️";

  console.log(
    `${status} ${hospital.name}: ${distance} km (${inRange ? "In Range" : "Out of Range"})`,
  );
  console.log(
    `   Coordinates: ${hospital.latitude}°N, ${hospital.longitude}°E\n`,
  );
});
