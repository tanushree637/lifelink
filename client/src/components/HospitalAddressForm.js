import React, { useState, useEffect } from "react";
import { geocodeAddress } from "../utils/geocoding";
import "./HospitalAddressForm.css";

const HospitalAddressForm = ({
  onAddressSubmit,
  initialAddress = "",
  initialCoordinates = null,
  loading = false,
}) => {
  const [address, setAddress] = useState(initialAddress);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [coordinates, setCoordinates] = useState(initialCoordinates || null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    // Clear success message after 3 seconds
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleGeocode = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!address.trim()) {
      setError("Please enter an address");
      return;
    }

    setGeocoding(true);

    try {
      console.log("🔄 Starting geocoding for:", address);
      const result = await geocodeAddress(address);

      setCoordinates({
        latitude: result.latitude,
        longitude: result.longitude,
        displayName: result.displayName,
      });

      // Call parent callback with geocoded data
      if (onAddressSubmit) {
        onAddressSubmit({
          address,
          latitude: result.latitude,
          longitude: result.longitude,
          displayName: result.displayName,
        });
      }

      setSuccess(true);
      setShowMap(true);
    } catch (err) {
      console.error("❌ Geocoding failed:", err);
      setError(err.message || "Failed to geocode address");
      setCoordinates(null);
    } finally {
      setGeocoding(false);
    }
  };

  const handleAddressChange = (e) => {
    setAddress(e.target.value);
    setError(null);
    setSuccess(false);
  };

  return (
    <div className="hospital-address-form">
      <div className="form-section">
        <h3>🏥 Hospital Address</h3>
        <p className="form-description">
          Enter your hospital's address to enable location tracking on the map
        </p>

        <form onSubmit={handleGeocode}>
          <div className="form-group">
            <label htmlFor="address">Address</label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={handleAddressChange}
              placeholder="e.g., City Hospital, Delhi or 123 Medical Center Road, Mumbai"
              disabled={loading || geocoding}
              className="address-input"
            />
            <small className="form-helper">
              Include hospital name and city for best results
            </small>
          </div>

          {error && <div className="form-error">⚠️ {error}</div>}

          {success && (
            <div className="form-success">
              ✅ Location successfully geocoded! Coordinates saved.
            </div>
          )}

          {coordinates && (
            <div className="coordinates-display">
              <h4>📍 Geocoded Coordinates:</h4>
              <div className="coordinates-info">
                <div className="coord-item">
                  <span className="coord-label">Latitude:</span>
                  <span className="coord-value">{coordinates.latitude}</span>
                </div>
                <div className="coord-item">
                  <span className="coord-label">Longitude:</span>
                  <span className="coord-value">{coordinates.longitude}</span>
                </div>
                <div className="coord-item full-width">
                  <span className="coord-label">Display Name:</span>
                  <span className="coord-value-text">
                    {coordinates.displayName}
                  </span>
                </div>
              </div>

              {/* Preview on map */}
              {showMap && (
                <div className="map-preview">
                  <iframe
                    title="Hospital Location Preview"
                    width="100%"
                    height="250"
                    style={{ border: "none", borderRadius: "6px" }}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.longitude - 0.01},${coordinates.latitude - 0.01},${coordinates.longitude + 0.01},${coordinates.latitude + 0.01}&layer=mapnik&marker=${coordinates.latitude},${coordinates.longitude}`}
                  />
                  <p className="map-note">
                    📌 Preview of your hospital location
                  </p>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || geocoding || !address.trim()}
            className="geocode-button"
          >
            {geocoding ? (
              <>
                <span className="spinner"></span>
                Geocoding Address...
              </>
            ) : (
              "🔍 Geocode Address & Save Location"
            )}
          </button>
        </form>
      </div>

      {/* Info section */}
      <div className="info-section">
        <h4>ℹ️ How it works:</h4>
        <ol>
          <li>Enter your hospital's complete address</li>
          <li>
            The system converts it to GPS coordinates (latitude, longitude)
          </li>
          <li>Coordinates are stored in the database</li>
          <li>
            Your hospital appears on the donor/recipient map with a marker 📍
          </li>
        </ol>
      </div>
    </div>
  );
};

export default HospitalAddressForm;
