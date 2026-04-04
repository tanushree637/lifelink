import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { recipientAPI, hospitalAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import "../styles/Dashboard.css";
import "../styles/RecipientDashboard.css";

const RecipientDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [hospitalId, setHospitalId] = useState("");
  const [hospitals, setHospitals] = useState([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [bloodGroup, setBloodGroup] = useState("");
  const [urgencyLevel, setUrgencyLevel] = useState("medium");
  const [quantity, setQuantity] = useState(1);
  const [patientName, setPatientName] = useState("");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchBloodGroup, setSearchBloodGroup] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [donors, setDonors] = useState([]);
  const [searchError, setSearchError] = useState("");

  const fetchHospitals = async () => {
    setHospitalsLoading(true);
    try {
      const resp = await hospitalAPI.getHospitals();
      console.log("🏥 Fetched hospitals:", resp.data);
      setHospitals(Array.isArray(resp.data) ? resp.data : []);
    } catch (err) {
      console.error("Error fetching hospitals:", err);
      setHospitals([]);
    } finally {
      setHospitalsLoading(false);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const resp = await recipientAPI.getMyRequests();
      const requestsData = extractRequestsFromResponse(resp.data);
      console.log("📊 Fetched requests:", requestsData);
      console.log("📊 Number of requests:", requestsData.length);
      setRequests(requestsData);
    } catch (err) {
      console.error("Error fetching requests:", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchRequests();
    fetchHospitals();
  }, []);

  const extractRequestsFromResponse = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.requests)) return data.requests;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();

    // Validation
    if (!bloodGroup.trim()) {
      alert("Please select a blood group");
      return;
    }
    if (!hospitalId.trim()) {
      alert("Please enter hospital/location");
      return;
    }
    if (!patientName.trim()) {
      alert("Please enter patient name");
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        hospitalId: hospitalId.trim(),
        bloodGroup: bloodGroup.trim(),
        urgencyLevel,
        quantity: parseInt(quantity, 10), // Convert to number
        patientName: patientName.trim(),
      };

      console.log("Sending request data:", requestData);

      const response = await recipientAPI.createEmergencyRequest(requestData);
      console.log("Request created successfully:", response.data);

      // Clear form
      setHospitalId("");
      setBloodGroup("");
      setQuantity(1);
      setPatientName("");
      setUrgencyLevel("medium");

      // Fetch updated requests
      fetchRequests();
      alert("Blood request submitted successfully!");
    } catch (err) {
      console.error("Create request error:", err);
      alert(
        "Failed to create request: " +
          (err.response?.data?.message || err.message),
      );
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleCancelRequest = async (id) => {
    if (!window.confirm("Cancel this request?")) return;
    try {
      await recipientAPI.cancelRequest(id);
      fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchDonors = async (e) => {
    e.preventDefault();

    if (!searchBloodGroup.trim()) {
      alert("Please select a blood group");
      return;
    }

    setSearchLoading(true);
    setSearchError("");
    try {
      const resp = await recipientAPI.searchDonors(
        searchBloodGroup,
        searchLocation,
      );
      const data = resp.data;
      console.log("🔍 Donors search result:", data);
      setDonors(Array.isArray(data) ? data : []);
      if (!data.length) {
        setSearchError("No donors found matching criteria.");
      }
    } catch (err) {
      console.error("Search error:", err);
      setSearchError(
        err.response?.data?.message || "Failed to retrieve donors",
      );
      setDonors([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
      navigate("/login");
    }
  };

  const normalizeStatus = (status) =>
    String(status || "")
      .trim()
      .toLowerCase();
  const getRequestStatus = (request) =>
    normalizeStatus(
      request?.status || request?.requestStatus || request?.state,
    );

  const fulfilledStatuses = new Set([
    "fulfilled",
    "completed",
    "complete",
    "donor-assigned",
    "donor_assigned",
  ]);
  const cancelledStatuses = new Set(["cancelled", "canceled", "rejected"]);

  const activeCount = requests.filter((r) => {
    const status = getRequestStatus(r);
    return !fulfilledStatuses.has(status) && !cancelledStatuses.has(status);
  }).length;

  const fulfilledCount = requests.filter((r) =>
    fulfilledStatuses.has(getRequestStatus(r)),
  ).length;

  const urgent = requests.find((r) => {
    const status = getRequestStatus(r);
    return (
      String(r?.urgencyLevel || "").toLowerCase() === "high" &&
      !fulfilledStatuses.has(status) &&
      !cancelledStatuses.has(status)
    );
  });

  // Debug logging
  console.log("📈 Dashboard Stats:", {
    totalRequests: requests.length,
    activeCount,
    fulfilledCount,
    requests: requests.map((r) => ({
      id: r.id,
      status: r.status,
      bloodGroup: r.bloodGroup,
    })),
  });

  return (
    <div className="recipient-dashboard">
      <div className="dashboard-container">
        <div className="sidebar-content-wrapper">
          <aside className="sidebar">
            <nav className="sidebar-nav recipient">
              <div className="nav-item active">Home</div>
              <div className="nav-item">Request Blood</div>
              <div className="nav-item">Search Donors</div>
              <div className="nav-item">Request History</div>
              <button
                className="logout-btn"
                onClick={handleLogout}
                title="Logout from your account"
              >
                🚪 Logout
              </button>
            </nav>
          </aside>

          <main className="main-content">
            {/* Welcome Banner */}
            <div className="welcome-banner recipient-banner">
              <div className="banner-content">
                <div className="banner-avatar">👩‍⚕️</div>
                <div className="banner-text">
                  <h2>Welcome, Recipient!</h2>
                  <p>You have {activeCount} active blood request(s) pending.</p>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-container">
              <div className="stat-card">
                <h3>{loading ? "..." : activeCount}</h3>
                <p>Active Requests</p>
              </div>
              <div className="stat-card">
                <h3>{loading ? "..." : requests.length}</h3>
                <p>Total Requests</p>
              </div>
              <div className="stat-card">
                <h3>{loading ? "..." : fulfilledCount}</h3>
                <p>Fulfilled</p>
              </div>
            </div>

            <div className="grid-3">
              {/* Request Blood */}
              <div className="card request-card">
                <div className="card-header-large green">
                  <h3>Request Blood</h3>
                </div>
                <div style={{ padding: 16 }}>
                  <form onSubmit={handleCreateRequest} className="request-form">
                    <div className="form-row">
                      <label>🩸 Select Blood Group</label>
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        required
                      >
                        <option value="">Select blood group</option>
                        <option>O+</option>
                        <option>O-</option>
                        <option>A+</option>
                        <option>A-</option>
                        <option>B+</option>
                        <option>B-</option>
                        <option>AB+</option>
                        <option>AB-</option>
                      </select>
                    </div>

                    <div className="form-row">
                      <label>📦 Select Number of Units</label>
                      <select
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(parseInt(e.target.value, 10))
                        }
                      >
                        <option value={1}>1 Unit</option>
                        <option value={2}>2 Units</option>
                        <option value={3}>3 Units</option>
                      </select>
                    </div>

                    <div className="form-row">
                      <label>⚡ Select Urgency Level</label>
                      <select
                        value={urgencyLevel}
                        onChange={(e) => setUrgencyLevel(e.target.value)}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <div className="form-row">
                      <label>🏥 Select Hospital</label>
                      <select
                        value={hospitalId}
                        onChange={(e) => setHospitalId(e.target.value)}
                        disabled={hospitalsLoading}
                        required
                      >
                        <option value="">
                          {hospitalsLoading
                            ? "Loading hospitals..."
                            : "Select a hospital"}
                        </option>
                        {hospitals.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name} - {h.location}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-row">
                      <label>👤 Enter Patient Name</label>
                      <input
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="Patient name"
                        required
                      />
                    </div>

                    <button
                      className="green-btn"
                      type="submit"
                      disabled={loading}
                      style={{ marginTop: 12 }}
                    >
                      {loading ? "Submitting..." : "Submit Emergency Request"}
                    </button>
                  </form>
                </div>
              </div>

              {/* Middle Column */}
              <div className="middle-column">
                <div className="card">
                  <div className="card-header-large green">
                    <h3>Search Donors</h3>
                  </div>
                  <div style={{ padding: 12 }}>
                    <form
                      onSubmit={handleSearchDonors}
                      className="search-donors-form"
                    >
                      <div className="search-form-row">
                        <label>🩸 Select Blood Group</label>
                        <select
                          value={searchBloodGroup}
                          onChange={(e) => setSearchBloodGroup(e.target.value)}
                          required
                        >
                          <option value="">Select blood group</option>
                          <option>O+</option>
                          <option>O-</option>
                          <option>A+</option>
                          <option>A-</option>
                          <option>B+</option>
                          <option>B-</option>
                          <option>AB+</option>
                          <option>AB-</option>
                        </select>
                      </div>
                      <div className="search-form-row">
                        <label>📍 Enter Location (Optional)</label>
                        <input
                          type="text"
                          value={searchLocation}
                          onChange={(e) => setSearchLocation(e.target.value)}
                          placeholder="City/Hospital name"
                        />
                      </div>
                      <button
                        className="search-donors-btn"
                        type="submit"
                        disabled={searchLoading}
                      >
                        {searchLoading ? "Searching..." : "🔍 Search Donors"}
                      </button>
                    </form>
                    {/* display donor results */}
                    {searchError && (
                      <div
                        className="no-data"
                        style={{ marginTop: 8, color: "#b71c1c" }}
                      >
                        {searchError}
                      </div>
                    )}
                    {donors.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <h4>Donors Found:</h4>
                        <ul className="donor-list">
                          {donors.map((d) => (
                            <li key={d.id} className="donor-item">
                              <strong>{d.name || "Anonymous"}</strong> –{" "}
                              {d.bloodGroup}
                              {d.location && <span> · {d.location}</span>}
                              {d.phone && <span> · 📞 {d.phone}</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card">
                  <div className="card-header-large green">
                    <h3>Request History</h3>
                  </div>
                  <div style={{ padding: 12 }}>
                    {requests.length === 0 ? (
                      <div className="no-data">No requests</div>
                    ) : (
                      requests.map((r) => (
                        <div
                          key={r.id}
                          style={{
                            padding: 10,
                            borderBottom: "1px dashed #eef2f7",
                          }}
                        >
                          <div>
                            <strong>{r.bloodGroup}</strong> · {r.quantity}{" "}
                            unit(s)
                          </div>
                          <div className={`status-badge ${r.status}`}>
                            {r.status}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <aside className="right-column">
                <div className="card">
                  <div className="card-header-large green">
                    <h3>Urgent</h3>
                  </div>
                  <div style={{ padding: 12 }}>
                    {urgent ? (
                      <div className="urgent-box">
                        <div className="urgent-title">
                          🔔 Urgent Need for {urgent.bloodGroup}
                        </div>
                        <div className="urgent-hospital">
                          {urgent.hospitalName || urgent.hospitalId}
                        </div>
                        <div className="urgent-badge high">High Priority</div>
                        <button className="green-btn" style={{ marginTop: 10 }}>
                          View Details
                        </button>
                      </div>
                    ) : (
                      <div className="no-data">No urgent requests</div>
                    )}
                  </div>
                </div>
              </aside>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default RecipientDashboard;
