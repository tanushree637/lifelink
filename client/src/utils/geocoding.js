/**
 * Geocoding utility using OpenStreetMap Nominatim API
 * Converts address to coordinates (latitude, longitude)
 */

// Using OpenStreetMap's Nominatim API (free, no API key required)
const GEOCODING_API_BASE = "https://nominatim.openstreetmap.org";

/**
 * Geocode an address to get latitude and longitude
 * @param {string} address - The address to geocode (e.g., "City Hospital, Delhi")
 * @returns {Promise<{latitude: number, longitude: number, displayName: string}>}
 */
export const geocodeAddress = async (address) => {
  if (!address || address.trim().length === 0) {
    throw new Error("Address cannot be empty");
  }

  try {
    console.log("🔍 Geocoding address:", address);

    const response = await fetch(
      `${GEOCODING_API_BASE}/search.php?q=${encodeURIComponent(address)}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "LifeLink-BloodDonation-App", // Required by Nominatim
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const results = await response.json();

    if (!results || results.length === 0) {
      throw new Error("No location found for the given address");
    }

    const result = results[0]; // Get the first (most relevant) result

    const coordinates = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      displayName: result.display_name,
      address: result.address, // Full address object with components
    };

    console.log("✅ Geocoding successful:", coordinates);

    return coordinates;
  } catch (error) {
    console.error("❌ Geocoding error:", error);
    throw new Error(
      error.message || "Failed to geocode address. Please try again.",
    );
  }
};

/**
 * Reverse geocode coordinates to get address
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<{address: string, displayName: string}>}
 */
export const reverseGeocodeCoordinates = async (latitude, longitude) => {
  if (!latitude || !longitude) {
    throw new Error("Latitude and longitude are required");
  }

  try {
    console.log(`🔍 Reverse geocoding: ${latitude}, ${longitude}`);

    const response = await fetch(
      `${GEOCODING_API_BASE}/reverse.php?lat=${latitude}&lon=${longitude}&format=json`,
      {
        headers: {
          "User-Agent": "LifeLink-BloodDonation-App", // Required by Nominatim
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    const address = {
      address: result.address || {},
      displayName: result.display_name || "Unknown Location",
    };

    console.log("✅ Reverse geocoding successful:", address);

    return address;
  } catch (error) {
    console.error("❌ Reverse geocoding error:", error);
    throw new Error(error.message || "Failed to reverse geocode coordinates.");
  }
};

/**
 * Validate if coordinates are reasonable (not 0,0 or null)
 * @param {number} latitude
 * @param {number} longitude
 * @returns {boolean}
 */
export const areValidCoordinates = (latitude, longitude) => {
  return (
    latitude !== null &&
    latitude !== undefined &&
    longitude !== null &&
    longitude !== undefined &&
    !(latitude === 0 && longitude === 0)
  );
};
