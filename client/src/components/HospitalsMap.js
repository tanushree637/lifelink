import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { donorAPI } from "../utils/api";
import { geocodeAddress } from "../utils/geocoding";
import "./HospitalsMap.css";

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Hospital marker icon
const hospitalIcon = L.icon({
  iconUrl:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23DC2626' width='32' height='32'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9h-2.5v2.5h-2v-2.5H8v-2h2.5V8h2v2.5h2.5v2z'/%3E%3C/svg%3E",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Emergency request marker icon (orange/warning color)
const emergencyRequestIcon = L.icon({
  iconUrl:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23FF6B35' width='32' height='32'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z'/%3E%3C/svg%3E",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Donor location marker icon (blue)
const donorIcon = L.icon({
  iconUrl:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233b82f6' width='32' height='32'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9h-2.5v2.5h-2v-2.5H8v-2h2.5V8h2v2.5h2.5v2z'/%3E%3C/svg%3E",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Calculate distance between two coordinates (in km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
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
  const distance = R * c;
  return distance.toFixed(1);
};

// Separate component to handle map center updates without remounting
function MapController({ center }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !center || !center[0] || !center[1]) return;

    // Delay the view change to avoid conflicts during initialization
    const timer = setTimeout(() => {
      try {
        map.setView(L.latLng(center[0], center[1]), map.getZoom());
      } catch (err) {
        // Silently ignore Strict Mode initialization conflicts
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [center, map]);

  return null;
}

// Component to zoom to selected hospital
function ZoomToHospital({ hospital }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !hospital || !hospital.latitude || !hospital.longitude) return;

    try {
      map.setView(L.latLng(hospital.latitude, hospital.longitude), 15);
    } catch (err) {
      console.error("Error zooming to hospital:", err);
    }
  }, [hospital, map]);

  return null;
}

const HospitalsMap = ({
  emergencyRequests = [],
  hospitalsList = [],
  userCity = null,
}) => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [center, setCenter] = useState([51.505, -0.09]); // Default: London
  const [showEmergencyRequests, setShowEmergencyRequests] = useState(
    emergencyRequests.length > 0,
  );
  const [requestsWithHospitalInfo, setRequestsWithHospitalInfo] = useState([]);
  const [hasFetched, setHasFetched] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  // Geocode user's city when component mounts
  useEffect(() => {
    if (userCity && userCity.trim().length > 0) {
      console.log("🌍 Geocoding user city:", userCity);
      geocodeAddress(userCity)
        .then((coords) => {
          console.log("✅ User city geocoded:", coords);
          setCenter([coords.latitude, coords.longitude]);
        })
        .catch((err) => {
          console.warn("⚠️ Failed to geocode user city:", err);
          // Continue with default center if geocoding fails
        });
    }
  }, [userCity]);

  useEffect(() => {
    // Only fetch once if no hospitalsList provided
    if (!hospitalsList || hospitalsList.length === 0) {
      if (!hasFetched) {
        console.log("ℹ️ No hospitalsList props provided. Fetching from API...");
        setHasFetched(true);
        fetchNearbyHospitals();
      }
    } else {
      // If hospitalsList is provided from props
      console.log("✅ Using hospitalsList from props:", hospitalsList);
      console.log(
        "📊 Props received - emergencyRequests:",
        emergencyRequests.length,
        "hospitals:",
        hospitalsList.length,
      );
      setHospitals(hospitalsList);

      // Calculate center from provided hospitals
      const hospitalsWithCoords = hospitalsList.filter(
        (h) =>
          h.latitude && h.longitude && (h.latitude !== 0 || h.longitude !== 0),
      );

      console.log(
        "📍 Hospitals with coordinates:",
        hospitalsWithCoords.length,
        "out of",
        hospitalsList.length,
      );

      if (hospitalsWithCoords.length > 0) {
        const avgLat =
          hospitalsWithCoords.reduce((sum, h) => sum + (h.latitude || 0), 0) /
          hospitalsWithCoords.length;
        const avgLon =
          hospitalsWithCoords.reduce((sum, h) => sum + (h.longitude || 0), 0) /
          hospitalsWithCoords.length;

        console.log("🗺️ Map center from props:", [avgLat, avgLon]);
        if (avgLat && avgLon) {
          setCenter([avgLat, avgLon]);
        }
      } else {
        console.log(
          "⚠️ No hospitals with valid coordinates found in props. Using default center.",
        );
      }
    }
  }, [hospitalsList, hasFetched]);

  // Process emergency requests with hospital information from props
  useEffect(() => {
    console.log("🔄 Processing emergency requests...");
    console.log("   emergencyRequests length:", emergencyRequests.length);
    console.log("   hospitals length:", hospitals.length);

    if (emergencyRequests.length > 0 && hospitals.length > 0) {
      const requestsWithInfo = emergencyRequests.map((req) => {
        const hospital = hospitals.find((h) => h.id === req.hospitalId);
        return {
          ...req,
          id: req.id || `req-${Math.random()}`,
          hospitalName: hospital?.name || "Unknown Hospital",
          location: hospital?.location || "Unknown Location",
          latitude: hospital?.latitude || null,
          longitude: hospital?.longitude || null,
        };
      });
      setRequestsWithHospitalInfo(requestsWithInfo);
      console.log(
        "✅ Emergency Requests processed:",
        requestsWithInfo.length,
        "request(s)",
        requestsWithInfo,
      );
    } else {
      console.log("ℹ️ No requests or hospitals to process");
      setRequestsWithHospitalInfo([]);
    }
  }, [emergencyRequests, hospitals]); // Include full arrays for proper dependency tracking
  // Update showEmergencyRequests when requests change
  useEffect(() => {
    if (requestsWithHospitalInfo.length > 0) {
      setShowEmergencyRequests(true);
    }
  }, [requestsWithHospitalInfo.length]); // Use length instead of entire array
  const fetchNearbyHospitals = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await donorAPI.getNearbyHospitals();
      const hospitalsData = response.data;

      console.log("🏥 Hospitals fetched from API:", hospitalsData);
      console.log("🏥 Total hospitals:", hospitalsData.length);

      // Store all hospitals, but filter for map display
      const hospitalsWithCoords = hospitalsData.filter(
        (h) =>
          h.latitude && h.longitude && (h.latitude !== 0 || h.longitude !== 0),
      );

      if (hospitalsWithCoords.length === 0 && hospitalsData.length > 0) {
        console.warn(
          "⚠️ No hospitals with valid coordinates found. Still showing",
          hospitalsData.length,
          "hospitals in sidebar. Hospitals data:",
          hospitalsData,
        );
      }

      // Set ALL hospitals, not just those with coordinates
      setHospitals(hospitalsData);

      // Set map center based on hospitals with coordinates
      if (hospitalsWithCoords.length > 0) {
        // Calculate center as average of all hospitals with valid coords
        const avgLat =
          hospitalsWithCoords.reduce((sum, h) => sum + (h.latitude || 0), 0) /
          hospitalsWithCoords.length;
        const avgLon =
          hospitalsWithCoords.reduce((sum, h) => sum + (h.longitude || 0), 0) /
          hospitalsWithCoords.length;

        console.log("🗺️ Map center:", [avgLat, avgLon]);

        if (avgLat && avgLon) {
          setCenter([avgLat, avgLon]);
        }
      }
    } catch (err) {
      console.error("Error fetching nearby hospitals:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load nearby hospitals. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGeocodeSearch = async (e) => {
    e.preventDefault();

    if (!searchInput.trim()) {
      setError("Please enter a location to search");
      return;
    }

    setSearchLoading(true);
    setError(null);
    try {
      console.log("🔍 Geocoding search for:", searchInput);
      const coords = await geocodeAddress(searchInput);

      console.log("✅ Location found:", coords.displayName);
      setCenter([coords.latitude, coords.longitude]);
      setSearchInput("");
    } catch (err) {
      console.error("Geocoding error:", err);
      setError(err.message || "Failed to find location. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  };

  // Cleanup Leaflet containers on unmount
  useEffect(() => {
    return () => {
      // Remove any stray Leaflet containers
      const containers = document.querySelectorAll(".leaflet-container");
      containers.forEach((container) => {
        if (container.hasChildNodes()) {
          const mapClass = Object.keys(container).find(
            (key) =>
              key.startsWith("__") && container[key] && container[key]._leaflet,
          );
          if (!mapClass) {
            // Only remove if it's orphaned
          }
        }
      });
    };
  }, []);

  return (
    <div className="hospitals-map-container">
      <div className="map-header">
        <h2>🏥 Nearby Hospitals with Blood Requests</h2>
        <p className="map-subtitle">
          Hospitals with verified blood requests matching your blood group
        </p>

        {/* Geocoding Search Bar */}
        <form onSubmit={handleGeocodeSearch} className="geocode-search-form">
          <div className="search-input-group">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="🔍 Enter location, city, or hospital address..."
              className="geocode-search-input"
              disabled={searchLoading}
            />
            <button
              type="submit"
              className="geocode-search-btn"
              disabled={searchLoading || !searchInput.trim()}
            >
              {searchLoading ? "🔄 Searching..." : "📍 Search"}
            </button>
          </div>
        </form>

        {requestsWithHospitalInfo.length > 0 && (
          <div className="emergency-requests-toggle">
            <label>
              <input
                type="checkbox"
                checked={showEmergencyRequests}
                onChange={(e) => setShowEmergencyRequests(e.target.checked)}
              />
              Show Emergency Requests ({requestsWithHospitalInfo.length})
            </label>
          </div>
        )}
      </div>

      {error && (
        <div className="map-error">
          <p>{error}</p>
          <button onClick={fetchNearbyHospitals} className="retry-button">
            Retry
          </button>
        </div>
      )}

      {loading && (
        <div className="map-loading">
          <p>⏳ Loading nearby hospitals...</p>
        </div>
      )}

      <div className="map-content">
        {/* Map */}
        <div className="map-wrapper">
          {/* Always render MapContainer to prevent mount/unmount errors in Strict Mode */}
          <MapContainer
            center={[51.505, -0.09]}
            zoom={13}
            className="map-instance"
            style={{ height: "100%", width: "100%" }}
          >
            <MapController center={center} />
            {selectedHospital && <ZoomToHospital hospital={selectedHospital} />}
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              crossOrigin="true"
              maxZoom={19}
              minZoom={1}
            />

            {/* Donor Location Marker */}
            <Marker position={center} icon={donorIcon} zIndexOffset={1000}>
              <Popup>
                <div className="marker-popup">
                  <h3>📍 Your Location</h3>
                  <p className="location-info">You are here</p>
                </div>
              </Popup>
            </Marker>

            {/* Hospital Markers */}
            {hospitals
              .filter(
                (h) =>
                  h.latitude &&
                  h.longitude &&
                  (h.latitude !== 0 || h.longitude !== 0),
              )
              .map((hospital) => (
                <Marker
                  key={hospital.id}
                  position={[hospital.latitude, hospital.longitude]}
                  icon={hospitalIcon}
                  eventHandlers={{
                    click: () => setSelectedHospital(hospital),
                  }}
                >
                  <Popup>
                    <div className="marker-popup">
                      <h3>{hospital.name}</h3>
                      <p className="location-info">📍 {hospital.location}</p>
                      <p className="contact-info">📞 {hospital.contact}</p>
                      <p className="requests-count">
                        🩸 {hospital.requests?.length || 0} active request
                        {hospital.requests?.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}

            {/* Emergency Request Markers */}
            {showEmergencyRequests &&
              requestsWithHospitalInfo
                .filter(
                  (r) =>
                    r.latitude &&
                    r.longitude &&
                    (r.latitude !== 0 || r.longitude !== 0),
                )
                .map((request, idx) => (
                  <Marker
                    key={`emergency-${idx}`}
                    position={[request.latitude, request.longitude]}
                    icon={emergencyRequestIcon}
                    eventHandlers={{
                      click: () =>
                        setSelectedHospital({
                          ...request,
                          isEmergencyRequest: true,
                        }),
                    }}
                  >
                    <Popup>
                      <div className="marker-popup emergency">
                        <h3>🚨 {request.hospitalName}</h3>
                        <p className="location-info">📍 {request.location}</p>
                        <p className="patient-info">
                          👤 Patient: {request.patientName}
                        </p>
                        <p className="blood-info">
                          🩸 Blood Group: {request.bloodGroup}
                        </p>
                        <p className="quantity-info">
                          Qty: {request.quantity} unit
                          {request.quantity > 1 ? "s" : ""}
                        </p>
                        <p className="urgency-info">
                          ⚡ Priority:{" "}
                          <span className={request.urgencyLevel}>
                            {request.urgencyLevel}
                          </span>
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
          </MapContainer>

          {/* Show overlay message if no coordinates */}
          {(() => {
            const hospitalsWithCoords = hospitals.filter(
              (h) =>
                h.latitude &&
                h.longitude &&
                (h.latitude !== 0 || h.longitude !== 0),
            );
            const requestsWithCoords = requestsWithHospitalInfo.filter(
              (r) =>
                r.latitude &&
                r.longitude &&
                (r.latitude !== 0 || r.longitude !== 0),
            );

            return hospitalsWithCoords.length === 0 &&
              requestsWithCoords.length === 0 &&
              (hospitals.length > 0 || requestsWithHospitalInfo.length > 0) ? (
              <div className="map-no-coordinates">
                <p>📍 Map coordinates not available for display</p>
                <p style={{ fontSize: "12px", color: "#9ca3af" }}>
                  Showing {hospitals.length} hospital
                  {hospitals.length !== 1 ? "s" : ""} and{" "}
                  {requestsWithHospitalInfo.length} request
                  {requestsWithHospitalInfo.length !== 1 ? "s" : ""} in the
                  sidebar
                </p>
              </div>
            ) : null;
          })()}

          {/* Empty state overlay */}
          {hospitals.length === 0 &&
            requestsWithHospitalInfo.length === 0 &&
            !loading && (
              <div className="map-empty">
                <p>📭 No nearby hospitals with blood requests at the moment</p>
                <button onClick={fetchNearbyHospitals} className="retry-button">
                  Refresh
                </button>
              </div>
            )}
        </div>

        {/* Hospital Details Sidebar */}
        <div className="hospitals-list">
          <div className="hospitals-list-header">
            <h3>
              🏥 Hospitals ({hospitals.length}
              {requestsWithHospitalInfo.length > 0 &&
                ` + ${requestsWithHospitalInfo.length} Emergency Request${requestsWithHospitalInfo.length !== 1 ? "s" : ""}`}
              )
            </h3>
          </div>

          {hospitals.length === 0 &&
          requestsWithHospitalInfo.length === 0 &&
          !loading ? (
            <div className="no-hospitals">
              <p>No hospitals with verified blood requests</p>
            </div>
          ) : (
            <div className="hospitals-items">
              {/* Display Emergency Requests */}
              {showEmergencyRequests &&
                requestsWithHospitalInfo.map((request, idx) => {
                  const distance =
                    request.latitude && request.longitude
                      ? calculateDistance(
                          center[0],
                          center[1],
                          request.latitude,
                          request.longitude,
                        )
                      : null;

                  return (
                    <div
                      key={`emergency-${idx}`}
                      className={`hospital-item emergency-request-item ${
                        selectedHospital?.isEmergencyRequest &&
                        selectedHospital?.id === request.id
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        setSelectedHospital({
                          ...request,
                          isEmergencyRequest: true,
                        })
                      }
                    >
                      <div className="hospital-item-header">
                        <h4>🚨 {request.hospitalName}</h4>
                        <span className="emergency-badge">Emergency</span>
                      </div>

                      <div className="hospital-item-details">
                        <p className="hospital-location">
                          📍 {request.location}
                        </p>
                        {distance && (
                          <p className="distance-info">📏 {distance} km away</p>
                        )}
                        <p className="patient-info">
                          👤 Patient: {request.patientName}
                        </p>
                      </div>

                      {selectedHospital?.isEmergencyRequest &&
                        selectedHospital?.id === request.id && (
                          <div className="hospital-expanded">
                            <h5>🩸 Blood Request Details:</h5>
                            <div className="request-item">
                              <div className="request-header">
                                <strong>{request.patientName}</strong>
                                <span
                                  className={`urgency-badge ${request.urgencyLevel?.toLowerCase()}`}
                                >
                                  {request.urgencyLevel}
                                </span>
                              </div>
                              <div className="request-details">
                                <p>
                                  <strong>Blood Group:</strong>{" "}
                                  {request.bloodGroup}
                                </p>
                                <p>
                                  <strong>Quantity:</strong> {request.quantity}{" "}
                                  unit{request.quantity > 1 ? "s" : ""}
                                </p>
                                <p>
                                  <strong>Hospital:</strong>{" "}
                                  {request.hospitalName}
                                </p>
                                <p>
                                  <strong>Location:</strong> {request.location}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                  );
                })}

              {/* Display Regular Hospitals */}
              {hospitals.map((hospital) => {
                const distance =
                  hospital.latitude && hospital.longitude
                    ? calculateDistance(
                        center[0],
                        center[1],
                        hospital.latitude,
                        hospital.longitude,
                      )
                    : null;

                return (
                  <div
                    key={hospital.id}
                    className={`hospital-item ${
                      selectedHospital?.id === hospital.id &&
                      !selectedHospital?.isEmergencyRequest
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedHospital({
                        ...hospital,
                        isEmergencyRequest: false,
                      })
                    }
                  >
                    <div className="hospital-item-header">
                      <h4>{hospital.name}</h4>
                      <span className="hospital-requests-badge">
                        {hospital.requests?.length || 0}
                      </span>
                    </div>

                    <div className="hospital-item-details">
                      <p className="hospital-location">
                        📍 {hospital.location}
                      </p>
                      {distance && (
                        <p className="distance-info">📏 {distance} km away</p>
                      )}
                      {hospital.contact && (
                        <p className="hospital-contact">
                          📞 {hospital.contact}
                        </p>
                      )}
                      {hospital.email && (
                        <p className="hospital-email">📧 {hospital.email}</p>
                      )}
                    </div>

                    {selectedHospital?.id === hospital.id &&
                      !selectedHospital?.isEmergencyRequest && (
                        <div className="hospital-expanded">
                          <h5>Active Blood Requests:</h5>
                          <div className="hospital-requests">
                            {hospital.requests &&
                            hospital.requests.length > 0 ? (
                              hospital.requests.map((req, idx) => (
                                <div key={idx} className="request-item">
                                  <div className="request-header">
                                    <strong>{req.patientName}</strong>
                                    <span
                                      className={`urgency-badge ${req.urgencyLevel?.toLowerCase()}`}
                                    >
                                      {req.urgencyLevel}
                                    </span>
                                  </div>
                                  <div className="request-details">
                                    <span className="request-blood">
                                      🩸 {req.bloodGroup}
                                    </span>
                                    <span className="request-quantity">
                                      Qty: {req.quantity} unit
                                      {req.quantity > 1 ? "s" : ""}
                                    </span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p style={{ fontSize: "12px", color: "#9ca3af" }}>
                                No active blood requests for this hospital
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(HospitalsMap);
