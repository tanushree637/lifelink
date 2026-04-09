import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { hospitalAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import "../styles/Dashboard.css";
import "../styles/HospitalDashboard.css";

const HospitalDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [donations, setDonations] = useState([]);
  const [history, setHistory] = useState([]);
  const [patientRequests, setPatientRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    verifiedPatients: 0,
    rejectedRequests: 0,
    donationsCompleted: 0,
  });
  const [activeTab, setActiveTab] = useState("patient-verification");
  const [loading, setLoading] = useState(false);
  const [requestActionLoadingId, setRequestActionLoadingId] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);
  const [otp, setOtp] = useState("");
  const [regeneratingId, setRegeneratingId] = useState(null);

  const fetchDashboardStatsData = async () => {
    try {
      const response = await hospitalAPI.getDashboardStats();
      setDashboardStats(
        response.data || {
          verifiedPatients: 0,
          rejectedRequests: 0,
          donationsCompleted: 0,
        },
      );
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  const handleViewPatientVerificationRequests = async () => {
    setLoading(true);
    try {
      const response = await hospitalAPI.getPatientVerificationRequests();
      setPatientRequests(response.data);
      setSelectedRequest(response.data[0] || null);
      setActiveTab("patient-verification");
    } catch (error) {
      console.error("Error fetching patient verification requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await hospitalAPI.getProfile();
      setProfile(response.data);
      await Promise.all([
        handleViewPatientVerificationRequests(),
        fetchDashboardStatsData(),
      ]);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      await fetchProfile();
    };
    loadProfile();
  }, []);

  const handleViewPendingDonations = async () => {
    setLoading(true);
    try {
      const response = await hospitalAPI.getPendingDonations();
      setDonations(response.data);
      setActiveTab("pending");
    } catch (error) {
      console.error("Error fetching donations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = async () => {
    setLoading(true);
    try {
      const response = await hospitalAPI.getDonationHistory();
      setHistory(response.data);
      setActiveTab("history");
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDonation = async (donationId) => {
    if (!otp || otp.length !== 6) {
      alert("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      await hospitalAPI.verifyDonation(donationId, otp, {
        verificationTime: new Date(),
      });
      alert("Donation verified successfully");
      setOtp("");
      setVerifyingId(null);
      await Promise.all([
        handleViewPendingDonations(),
        fetchDashboardStatsData(),
      ]);
    } catch (error) {
      console.error("Error verifying donation:", error);
      alert("Failed to verify donation");
    }
  };

  const handleConfirmAdmitted = async (requestId) => {
    setRequestActionLoadingId(requestId);
    try {
      await hospitalAPI.confirmAdmitted(requestId);
      alert("Patient marked as admitted");
      await Promise.all([
        handleViewPatientVerificationRequests(),
        fetchDashboardStatsData(),
      ]);
    } catch (error) {
      console.error("Error confirming admission:", error);
      alert("Failed to confirm admission");
    } finally {
      setRequestActionLoadingId(null);
    }
  };

  const handleRejectNotFound = async (requestId) => {
    setRequestActionLoadingId(requestId);
    try {
      await hospitalAPI.rejectPatientRequest(requestId);
      alert("Request rejected as not found");
      await Promise.all([
        handleViewPatientVerificationRequests(),
        fetchDashboardStatsData(),
      ]);
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Failed to reject request");
    } finally {
      setRequestActionLoadingId(null);
    }
  };

  const handleSelectRequest = (request) => {
    setSelectedRequest(request);
  };

  const handleRegenerateCertificate = async (donationId) => {
    setRegeneratingId(donationId);
    try {
      await hospitalAPI.regenerateCertificate(donationId);
      alert("Certificate successfully regenerated with new design!");
      // Refresh history to show updated certificate
      await handleViewHistory();
    } catch (error) {
      console.error("Error regenerating certificate:", error);
      alert("Failed to regenerate certificate");
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
      navigate("/login");
    }
  };

  if (!profile) {
    return (
      <div className="hospital-dashboard">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="hospital-dashboard">
      <div className="dashboard-container">
        <div className="sidebar-content-wrapper">
          <aside className="sidebar">
            <nav className="sidebar-nav hospital">
              <div className="nav-item active">🏥 Home</div>
              <div
                className="nav-item"
                onClick={handleViewPatientVerificationRequests}
              >
                🔴 Patient Verification Requests
              </div>
              <div className="nav-item" onClick={handleViewPendingDonations}>
                📋 Donation Confirmation
              </div>
              <div className="nav-item" onClick={handleViewHistory}>
                📜 Donation History
              </div>
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
            <div className="welcome-banner hospital-banner">
              <div className="banner-content">
                <div className="banner-avatar">🏥</div>
                <div className="banner-text">
                  <h2>{profile.hospitalName}</h2>
                  <p className="hospital-name">Hospital Dashboard</p>
                </div>
              </div>
            </div>

            {/* Hospital Profile Card */}
            <div className="hospital-info-card">
              <h3>Hospital Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">📍 Address:</span>
                  <span className="info-value">{profile.address}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">🏙️ City:</span>
                  <span className="info-value">{profile.city}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">📄 License:</span>
                  <span className="info-value">{profile.license}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">📞 Contact:</span>
                  <span className="info-value">
                    {profile.phone || profile.contactNumber || "N/A"}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">✉️ Email:</span>
                  <span className="info-value">{profile.email || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-container">
              <div className="stat-card hospital-stat">
                <h3>{dashboardStats.verifiedPatients}</h3>
                <p>Verified Patients</p>
              </div>
              <div className="stat-card hospital-stat">
                <h3>{dashboardStats.rejectedRequests}</h3>
                <p>Rejected Requests</p>
              </div>
              <div className="stat-card hospital-stat">
                <h3>{dashboardStats.donationsCompleted}</h3>
                <p>Donations Completed</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs-section">
              <div className="tabs">
                <button
                  className={`tab-btn ${activeTab === "patient-verification" ? "active" : ""}`}
                  onClick={handleViewPatientVerificationRequests}
                  disabled={loading}
                >
                  Patient Verification Requests
                </button>
                <button
                  className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
                  onClick={handleViewPendingDonations}
                  disabled={loading}
                >
                  Donation Confirmation
                </button>
                <button
                  className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
                  onClick={handleViewHistory}
                  disabled={loading}
                >
                  Donation History
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === "patient-verification" && (
                <div className="content-section">
                  <h3 className="section-title">
                    Patient Verification Requests
                  </h3>
                  {loading ? (
                    <div className="loading-spinner">Loading...</div>
                  ) : patientRequests.length === 0 ? (
                    <div className="no-data">
                      No patient verification requests
                    </div>
                  ) : (
                    <>
                      {selectedRequest && (
                        <div className="request-details-panel">
                          <h4>Request Details View</h4>
                          <div className="request-details-grid">
                            <div>
                              <p>
                                👤 <strong>Recipient Details:</strong>{" "}
                                {selectedRequest.recipientName} (
                                {selectedRequest.recipientId})
                              </p>
                              <p>
                                📞 <strong>Contact Info:</strong>{" "}
                                {selectedRequest.contactInfo?.phone} |{" "}
                                {selectedRequest.contactInfo?.email}
                              </p>
                            </div>
                            <div>
                              <p>
                                🩸 <strong>Blood Requirement:</strong>{" "}
                                {selectedRequest.bloodRequirement ||
                                  selectedRequest.bloodGroup}
                              </p>
                              <p>
                                🚨 <strong>Emergency Level:</strong>{" "}
                                {selectedRequest.emergencyLevel || "normal"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="patient-requests-grid">
                        {patientRequests.map((request) => (
                          <div
                            key={request.id}
                            className={`patient-request-card ${selectedRequest?.id === request.id ? "selected" : ""}`}
                            onClick={() => handleSelectRequest(request)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                handleSelectRequest(request);
                              }
                            }}
                          >
                            <div className="card-header">
                              <span className="donation-id">
                                📋 Request ID: {request.requestId?.slice(0, 8)}
                                ...
                              </span>
                              <span
                                className={`status-badge admission-status ${request.admissionStatus || "pending"}`}
                              >
                                {request.admissionStatus || "pending"}
                              </span>
                            </div>
                            <div className="card-body">
                              <div className="request-details">
                                <p>
                                  👤 <strong>Patient Name:</strong>{" "}
                                  {request.patientName}
                                </p>
                                <p>
                                  🩸 <strong>Blood Group Required:</strong>{" "}
                                  {request.bloodGroup}
                                </p>
                                <p>
                                  🏥 <strong>Hospital:</strong>{" "}
                                  {request.hospitalName}
                                </p>
                                <p>
                                  🆔 <strong>Request ID:</strong>{" "}
                                  {request.requestId}
                                </p>
                                <p>
                                  ✅ <strong>Admission Status:</strong>{" "}
                                  {request.admissionStatus || "pending"}
                                </p>
                              </div>
                              <div className="button-group patient-actions">
                                <button
                                  className="btn-primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleConfirmAdmitted(request.requestId);
                                  }}
                                  disabled={
                                    requestActionLoadingId === request.requestId
                                  }
                                >
                                  ✅ Confirm Admitted
                                </button>
                                <button
                                  className="btn-danger"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRejectNotFound(request.requestId);
                                  }}
                                  disabled={
                                    requestActionLoadingId === request.requestId
                                  }
                                >
                                  ❌ Reject (Not Found)
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === "pending" && (
                <div className="content-section">
                  <h3 className="section-title">
                    Pending Donations for Confirmation
                  </h3>
                  {loading ? (
                    <div className="loading-spinner">Loading...</div>
                  ) : donations.length === 0 ? (
                    <div className="no-data">No pending donations</div>
                  ) : (
                    <div className="donations-grid">
                      {donations.map((donation) => (
                        <div key={donation.id} className="donation-card">
                          <div className="card-header">
                            <span className="donation-id">
                              🩸 ID: {donation.id.slice(0, 8)}...
                            </span>
                            <span className={`status-badge ${donation.status}`}>
                              {donation.status}
                            </span>
                          </div>
                          <div className="card-body">
                            <div className="donation-info">
                              <p className="donor-id">
                                👤 Donor: {donation.donorId}
                              </p>
                              {donation.bloodGroup && (
                                <p className="blood-group">
                                  🩸 {donation.bloodGroup}
                                </p>
                              )}
                            </div>
                            {verifyingId === donation.id ? (
                              <div className="otp-verification">
                                <input
                                  type="text"
                                  maxLength="6"
                                  className="otp-input"
                                  placeholder="Enter 6-digit OTP"
                                  value={otp}
                                  onChange={(e) => setOtp(e.target.value)}
                                />
                                <div className="button-group">
                                  <button
                                    onClick={() =>
                                      handleVerifyDonation(donation.id)
                                    }
                                    className="btn-primary"
                                  >
                                    ✓ Verify
                                  </button>
                                  <button
                                    onClick={() => {
                                      setVerifyingId(null);
                                      setOtp("");
                                    }}
                                    className="btn-secondary"
                                  >
                                    ✕ Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                className="btn-verify"
                                onClick={() => setVerifyingId(donation.id)}
                              >
                                ✅ Mark Donation Completed
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "history" && (
                <div className="content-section">
                  <h3 className="section-title">Donation History</h3>
                  {loading ? (
                    <div className="loading-spinner">Loading...</div>
                  ) : history.length === 0 ? (
                    <div className="no-data">No donation history</div>
                  ) : (
                    <div className="history-grid">
                      {history.map((donation) => (
                        <div key={donation.id} className="history-card">
                          <div className="history-header">
                            <span className="history-id">
                              📋 {donation.id.slice(0, 8)}...
                            </span>
                            <span className={`status-badge ${donation.status}`}>
                              {donation.status}
                            </span>
                          </div>
                          <div className="history-details">
                            <p>
                              👤 <strong>Donor:</strong> {donation.donorId}
                            </p>
                            {donation.bloodGroup && (
                              <p>
                                🩸 <strong>Blood Group:</strong>{" "}
                                {donation.bloodGroup}
                              </p>
                            )}
                            <p>
                              📅 <strong>Date:</strong>{" "}
                              {donation.createdAt?.seconds
                                ? new Date(
                                    donation.createdAt.seconds * 1000,
                                  ).toLocaleDateString()
                                : "N/A"}
                            </p>
                          </div>
                          <div
                            className="button-group"
                            style={{ marginTop: "12px" }}
                          >
                            <button
                              className="btn-primary"
                              onClick={() =>
                                handleRegenerateCertificate(donation.id)
                              }
                              disabled={regeneratingId === donation.id}
                              style={{ width: "100%" }}
                            >
                              {regeneratingId === donation.id
                                ? "🔄 Regenerating..."
                                : "🎨 Update Certificate"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default HospitalDashboard;
