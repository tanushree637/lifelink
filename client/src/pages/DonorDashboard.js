import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { donorAPI } from "../utils/api";
import HospitalsMap from "../components/HospitalsMap";
import "../styles/Dashboard.css";
import "../styles/DonorDashboard.css";

const DonorDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [available, setAvailable] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [loading, setLoading] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [stats, setStats] = useState({
    totalDonations: 0,
    lastDonationDate: null,
  });
  const [nextAvailableDate, setNextAvailableDate] = useState(null);
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isLocked, setIsLocked] = useState(false);

  const calculateStats = () => {
    if (history && history.length > 0) {
      const lastDonation = history[0];
      let lastDonationDate = null;

      // Handle both Firestore timestamp format and Date objects
      if (lastDonation.createdAt?.seconds) {
        lastDonationDate = new Date(lastDonation.createdAt.seconds * 1000);
      } else if (lastDonation.createdAt instanceof Date) {
        lastDonationDate = lastDonation.createdAt;
      } else if (typeof lastDonation.createdAt === "string") {
        lastDonationDate = new Date(lastDonation.createdAt);
      }

      setStats({
        totalDonations: history.length,
        lastDonationDate: lastDonationDate,
      });
    }
  };

  // Define handleAutoMarkAvailable before updateCountdown
  const handleAutoMarkAvailable = async () => {
    try {
      console.log("Auto-marking donor as available after waiting period");
      await donorAPI.updateAvailability(true);
      setAvailable(true);
      setIsLocked(false);
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    } catch (error) {
      console.error("Error auto-marking as available:", error);
    }
  };

  // Calculate countdown timer
  const updateCountdown = (targetDate) => {
    // Validate target date
    if (!targetDate) {
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setIsLocked(false);
      return;
    }

    const targetTime = new Date(targetDate).getTime();

    // Check if date is valid
    if (isNaN(targetTime)) {
      console.warn("Invalid target date:", targetDate);
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setIsLocked(false);
      return;
    }

    const now = new Date().getTime();
    const distance = targetTime - now;

    if (distance <= 0) {
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setIsLocked(false);
      // Auto mark as available when timer expires
      if (!available) {
        handleAutoMarkAvailable();
      }
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    setCountdown({ days, hours, minutes, seconds });
    setIsLocked(true);
  };

  const handleViewHistory = async () => {
    setLoading(true);
    try {
      const response = await donorAPI.getHistory();
      console.log("📋 History received:", response.data);
      setHistory(response.data);
      calculateStats();
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Initialize profile data on component mount
    // These functions are defined below and called in sequence
    (async () => {
      await fetchProfile();
      await handleViewRequests();
      await handleViewHistory();
      await fetchCertificates();
    })();
  }, []);

  const fetchCertificates = async () => {
    try {
      const response = await donorAPI.getCertificates();
      console.log("🎖️ Certificates received:", response.data);
      setCertificates(response.data || []);
    } catch (error) {
      console.error("Error fetching certificates:", error);
      setCertificates([]);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await donorAPI.getProfile();
      setProfile(response.data);
      setAvailable(response.data.available);

      // Set next available date if exists
      if (response.data.nextAvailableDate) {
        let nextDate = response.data.nextAvailableDate;

        // Handle Firestore timestamp format
        if (nextDate.seconds) {
          nextDate = new Date(nextDate.seconds * 1000);
        } else if (typeof nextDate === "string") {
          nextDate = new Date(nextDate);
        }

        setNextAvailableDate(nextDate);
        updateCountdown(nextDate);
      } else {
        setIsLocked(false);
        setNextAvailableDate(null);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  // Countdown timer effect
  useEffect(() => {
    if (!nextAvailableDate) return;

    const timer = setInterval(() => {
      updateCountdown(nextAvailableDate);
    }, 1000);

    return () => clearInterval(timer);
  }, [nextAvailableDate, available]);

  const handleAvailabilityToggle = async () => {
    try {
      await donorAPI.updateAvailability(!available);
      setAvailable(!available);
      alert("Availability updated");
    } catch (error) {
      console.error("Error updating availability:", error);
    }
  };

  const handleViewRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await donorAPI.getNearbyRequests();
      console.log("📋 Requests received:", response.data);
      setRequests(response.data);
      setDebugInfo({
        bloodGroup: profile?.bloodGroup,
        requestsCount: response.data?.length || 0,
        status: "success",
      });
    } catch (error) {
      console.error("❌ Error fetching requests:", error);
      const errorMsg = error.response?.data?.message || error.message;
      setError(errorMsg);
      setDebugInfo({
        bloodGroup: profile?.bloodGroup,
        error: errorMsg,
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCertificateDownload = async (cert) => {
    try {
      console.log(`📥 Starting download for certificate ${cert.donationId}`);
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Authentication token not found. Please login again.");
        return;
      }

      const downloadUrl = `http://localhost:5000/api/donors/certificate/${cert.donationId}/download`;
      console.log(`🔗 Requesting:`, downloadUrl);

      // Try fetch first
      try {
        const response = await fetch(downloadUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log(
          `📊 Response status:`,
          response.status,
          response.statusText,
        );

        if (!response.ok) {
          throw new Error(
            `Server responded with ${response.status}: ${response.statusText}`,
          );
        }

        const blob = await response.blob();
        console.log(`✅ Blob received: ${blob.size} bytes`);

        // Only proceed if blob has content
        if (blob.size === 0) {
          throw new Error("Received empty file from server");
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `certificate_${cert.donationId}.jpg`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        console.log(`✅ Download completed for ${cert.donationId}`);
      } catch (fetchError) {
        // Fallback: Open in new tab for viewing
        console.warn(`⚠️ Fetch failed, trying direct link:`, fetchError);
        const newWindow = window.open(
          `${downloadUrl}?token=${encodeURIComponent(token)}`,
          "_blank",
        );
        if (!newWindow) {
          alert(
            "Certificate is available but popup was blocked. Try right-clicking the download button and selecting 'Save As'",
          );
        }
      }
    } catch (error) {
      console.error("❌ Error downloading certificate:", error);
      alert("Failed to download certificate: " + error.message);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await donorAPI.acceptRequest(requestId);
      alert("Request accepted!");
      handleViewRequests();
      // Refresh history and certificates after accepting
      await Promise.all([handleViewHistory(), fetchCertificates()]);
    } catch (error) {
      console.error("Error accepting request:", error);
      alert("Failed to accept request");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!profile) {
    return <div className="dashboard">Loading...</div>;
  }

  return (
    <div className="donor-dashboard">
      {/* Welcome Banner */}
      <div className="welcome-banner-donor">
        <div className="banner-content">
          <div className="banner-avatar">👨</div>
          <div className="banner-text">
            <h2>Welcome back, {profile.name.split(" ")[0]}!</h2>
            <p>
              Manage your blood donation activities and lifesaving
              opportunities.
            </p>
          </div>
        </div>
      </div>

      <div className="dashboard-container">
        {/* Stats Cards */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-icon">🩸</div>
            <div className="stat-content">
              <h4>Total Donations</h4>
              <p className="stat-value">{stats.totalDonations}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🚨</div>
            <div className="stat-content">
              <h4>Active Requests</h4>
              <p className="stat-value">{requests.length}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h4>Last Donation</h4>
              <p className="stat-value">
                {stats.lastDonationDate
                  ? stats.lastDonationDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "Never"}
              </p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🟢</div>
            <div className="stat-content">
              <h4>Current Status</h4>
              <p
                className={`stat-value ${available ? "available" : "unavailable"}`}
              >
                {available ? "Available" : "Unavailable"}
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar and Main Content Wrapper */}
        <div className="sidebar-content-wrapper">
          {/* Sidebar */}
          <aside className="sidebar">
            <nav className="sidebar-nav">
              <button className="nav-item" onClick={() => setActiveTab("home")}>
                🏠 Home
              </button>
              <button
                className={`nav-item ${activeTab === "availability" ? "active" : ""}`}
                onClick={() => setActiveTab("availability")}
              >
                💉 My Availability
              </button>
              <button
                className={`nav-item ${activeTab === "requests" ? "active" : ""}`}
                onClick={() => {
                  handleViewRequests();
                  setActiveTab("requests");
                }}
              >
                ⚠️ Emergency Requests
              </button>
              <button
                className={`nav-item ${activeTab === "history" ? "active" : ""}`}
                onClick={() => setActiveTab("history")}
              >
                📋 Donation History
              </button>
              <button
                className={`nav-item ${activeTab === "badges" ? "active" : ""}`}
                onClick={() => setActiveTab("badges")}
              >
                �️ My Certificates
              </button>
              <button
                className={`nav-item ${activeTab === "map" ? "active" : ""}`}
                onClick={() => setActiveTab("map")}
              >
                🗺️ Hospitals Map
              </button>
              <button className="nav-item logout-btn" onClick={handleLogout}>
                🚪 Logout
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <div
            className={`main-content ${activeTab === "home" ? "home-view" : activeTab === "availability" ? "availability-view" : ""}`}
          >
            {/* Profile & Availability Card */}
            {(activeTab === "home" || activeTab === "availability") && (
              <div className="card profile-card-large">
                <div className="card-header-large">
                  <h3>💉 My Profile & Availability</h3>
                  <p className="subtitle">
                    Manage your donation profile and status
                  </p>
                </div>
                <div className="profile-content">
                  <div className="profile-info">
                    <p className="profile-field">
                      <strong>Full Name</strong>
                      <span>{profile.name}</span>
                    </p>
                    <p className="profile-field">
                      <strong>Blood Group</strong>
                      <span className="blood-group">{profile.bloodGroup}</span>
                    </p>
                    <p className="profile-field">
                      <strong>Location</strong>
                      <span>{profile.location}</span>
                    </p>
                  </div>

                  <div className="availability-card">
                    <div className="availability-status">
                      <span
                        className={`status-dot ${available ? "available" : "unavailable"}`}
                      ></span>
                      <span className="status-text">
                        {available
                          ? "You're Available"
                          : "Currently Unavailable"}
                      </span>
                    </div>

                    {isLocked && !available && (
                      <div className="countdown-timer">
                        <p className="countdown-label">⏳ Available in:</p>
                        <div className="countdown-display">
                          <div className="time-unit">
                            <span className="time-value">
                              {String(countdown.days).padStart(2, "0")}
                            </span>
                            <span className="time-label">Days</span>
                          </div>
                          <span className="time-separator">:</span>
                          <div className="time-unit">
                            <span className="time-value">
                              {String(countdown.hours).padStart(2, "0")}
                            </span>
                            <span className="time-label">Hours</span>
                          </div>
                          <span className="time-separator">:</span>
                          <div className="time-unit">
                            <span className="time-value">
                              {String(countdown.minutes).padStart(2, "0")}
                            </span>
                            <span className="time-label">Minutes</span>
                          </div>
                          <span className="time-separator">:</span>
                          <div className="time-unit">
                            <span className="time-value">
                              {String(countdown.seconds).padStart(2, "0")}
                            </span>
                            <span className="time-label">Seconds</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      className={`availability-btn ${available ? "active" : "inactive"} ${isLocked ? "locked" : ""}`}
                      onClick={handleAvailabilityToggle}
                      disabled={isLocked && !available}
                      title={
                        isLocked && !available
                          ? "Locked during waiting period"
                          : ""
                      }
                    >
                      {isLocked && !available
                        ? "🔒 Locked - Waiting Period"
                        : available
                          ? "Mark Unavailable"
                          : "Mark Available"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Emergency Requests Card */}
            {activeTab === "requests" && (
              <div className="card emergency-card">
                <div className="card-header-large">
                  <h3>⚠️ Hospital-Verified Emergency Requests</h3>
                  <p className="subtitle">
                    Active blood requests from verified hospitals
                  </p>
                </div>

                {/* Locked Message */}
                {isLocked && !available && (
                  <div className="locked-message">
                    <p className="lock-icon">🔒</p>
                    <p className="lock-text">
                      You're in your waiting period after your last donation.
                    </p>
                    <p className="lock-subtext">
                      You can accept requests again in {countdown.days} days,{" "}
                      {countdown.hours} hours, and {countdown.minutes} minutes.
                    </p>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="error-banner">
                    <div className="error-content">
                      <span className="error-icon">⚠️</span>
                      <div className="error-details">
                        <p className="error-title">Unable to fetch requests</p>
                        <p className="error-message">{error}</p>
                        {debugInfo?.bloodGroup && (
                          <p className="debug-info">
                            Your blood group:{" "}
                            <strong>{debugInfo.bloodGroup || "Not set"}</strong>
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      className="btn-retry"
                      onClick={() => handleViewRequests()}
                    >
                      🔄 Retry
                    </button>
                  </div>
                )}

                {loading ? (
                  <p className="loading">⏳ Loading emergency requests...</p>
                ) : !error && requests.length === 0 ? (
                  <div className="no-data">
                    <p>✓ No active emergency requests at the moment</p>
                    <p
                      className="help-text"
                      style={{
                        fontSize: "12px",
                        color: "#777",
                        marginTop: "8px",
                      }}
                    >
                      Requests appear here when hospitals verify patient
                      admission for your blood group (
                      {profile?.bloodGroup || "Not set"}).
                    </p>
                    <button
                      className="btn-refresh"
                      onClick={() => handleViewRequests()}
                      style={{
                        marginTop: "12px",
                        padding: "8px 16px",
                        background: "#c41e3a",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                      }}
                    >
                      🔄 Refresh
                    </button>
                  </div>
                ) : !error && requests.length > 0 ? (
                  <div className="requests-list">
                    <div className="requests-count-badge">
                      {requests.length} Active Request
                      {requests.length !== 1 ? "s" : ""}
                    </div>
                    {requests.map((request) => {
                      const createdDate = request.createdAt
                        ? new Date(
                            typeof request.createdAt === "number"
                              ? request.createdAt * 1000
                              : request.createdAt,
                          )
                        : new Date();
                      const hoursAgo = Math.floor(
                        (Date.now() - createdDate.getTime()) / (1000 * 60 * 60),
                      );
                      const timeDisplay =
                        hoursAgo === 0
                          ? "Just now"
                          : hoursAgo === 1
                            ? "1 hour ago"
                            : `${hoursAgo} hours ago`;

                      return (
                        <div
                          key={request.id}
                          className="request-card-item verified"
                        >
                          <div className="request-status-badge">
                            <span className="verified-badge">
                              ✓ Hospital Verified
                            </span>
                          </div>
                          <div className="request-body">
                            <div className="request-header">
                              <div className="request-blood">🩸</div>
                              <div className="request-info">
                                <div className="request-top-row">
                                  <h4>{request.patientName}</h4>
                                  <span
                                    className={`urgency-badge ${request.urgencyLevel?.toLowerCase()}`}
                                  >
                                    {request.urgencyLevel.toUpperCase()}
                                  </span>
                                </div>
                                <p className="request-blood-type">
                                  <strong>{request.bloodGroup}</strong> •{" "}
                                  {request.quantity} unit
                                  {request.quantity > 1 ? "s" : ""} needed
                                </p>
                                <div className="request-details">
                                  <p className="request-hospital">
                                    🏥 {request.hospitalName || "Hospital"}
                                  </p>
                                  <p className="request-time">
                                    ⏰ {timeDisplay}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <button
                            className="btn-accept"
                            onClick={() => handleAcceptRequest(request.id)}
                            disabled={isLocked && !available}
                            style={
                              isLocked && !available
                                ? { opacity: 0.5, cursor: "not-allowed" }
                                : {}
                            }
                            title={
                              isLocked && !available
                                ? "You must wait until your waiting period expires"
                                : ""
                            }
                          >
                            {isLocked && !available
                              ? "🔒 Locked"
                              : "Accept Request →"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            )}

            {/* Donation History Card */}
            {activeTab === "history" && (
              <div className="card history-card">
                <div className="card-header-large">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <div>
                      <h3>📋 Donation History</h3>
                      <p className="subtitle">
                        Your past donations and records
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        Promise.all([handleViewHistory(), fetchCertificates()])
                      }
                      style={{
                        padding: "8px 16px",
                        background: "#c41e3a",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        fontWeight: "500",
                      }}
                    >
                      🔄 Refresh
                    </button>
                  </div>
                </div>

                {loading ? (
                  <p className="loading">⏳ Loading your donation history...</p>
                ) : history.length === 0 ? (
                  <p className="no-data">
                    ✓ You haven't made any donations yet
                  </p>
                ) : (
                  <div className="history-list">
                    {history.map((donation) => {
                      // Handle both Firestore timestamp format and Date objects
                      let donationDate;
                      if (donation.createdAt?.seconds) {
                        // Firestore timestamp format
                        donationDate = new Date(
                          donation.createdAt.seconds * 1000,
                        );
                      } else if (donation.createdAt instanceof Date) {
                        donationDate = donation.createdAt;
                      } else if (typeof donation.createdAt === "string") {
                        donationDate = new Date(donation.createdAt);
                      } else {
                        donationDate = new Date();
                      }

                      return (
                        <div key={donation.id} className="history-item-row">
                          <div className="history-blood">🩸</div>
                          <div className="history-details">
                            <p className="history-status">
                              {donation.bloodGroup}
                            </p>
                            <p className="history-date">
                              {donationDate.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                          <span className="status-badge">
                            {donation.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Certificates Card */}
            {activeTab === "badges" && (
              <div className="card certificates-card">
                <div className="card-header-large">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <div>
                      <h3>🎖️ My Donation Certificates</h3>
                      <p className="subtitle">
                        Download certificates for each blood donation
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        Promise.all([handleViewHistory(), fetchCertificates()])
                      }
                      style={{
                        padding: "8px 16px",
                        background: "#c41e3a",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        fontWeight: "500",
                      }}
                    >
                      🔄 Refresh
                    </button>
                  </div>
                </div>

                {loading ? (
                  <p className="loading">⏳ Loading your certificates...</p>
                ) : certificates.length === 0 ? (
                  <div className="no-data">
                    <p>✓ No certificates yet</p>
                    <p
                      className="help-text"
                      style={{
                        fontSize: "12px",
                        color: "#777",
                        marginTop: "8px",
                      }}
                    >
                      You'll receive a certificate after each blood donation is
                      completed and verified by the hospital.
                    </p>
                  </div>
                ) : (
                  <div className="certificates-grid">
                    <div className="cert-count-badge">
                      {certificates.length} Certificate
                      {certificates.length !== 1 ? "s" : ""}
                    </div>
                    {certificates.map((cert) => {
                      // Handle various date formats
                      let donationDate;
                      if (cert.donationDate) {
                        if (cert.donationDate?.seconds) {
                          // Firestore timestamp
                          donationDate = new Date(
                            cert.donationDate.seconds * 1000,
                          );
                        } else if (typeof cert.donationDate === "number") {
                          // Milliseconds timestamp
                          donationDate = new Date(cert.donationDate);
                        } else if (typeof cert.donationDate === "string") {
                          // ISO string
                          donationDate = new Date(cert.donationDate);
                        } else {
                          donationDate = new Date();
                        }
                      } else if (cert.createdAt) {
                        // Fallback to createdAt if donationDate is not available
                        if (cert.createdAt?.seconds) {
                          donationDate = new Date(
                            cert.createdAt.seconds * 1000,
                          );
                        } else if (typeof cert.createdAt === "number") {
                          donationDate = new Date(cert.createdAt);
                        } else if (typeof cert.createdAt === "string") {
                          donationDate = new Date(cert.createdAt);
                        } else {
                          donationDate = new Date();
                        }
                      } else {
                        donationDate = new Date();
                      }

                      // Validate date
                      if (isNaN(donationDate.getTime())) {
                        donationDate = new Date();
                      }

                      return (
                        <div key={cert.donationId} className="certificate-item">
                          <div className="cert-header">
                            <div className="cert-icon">📜</div>
                            <div className="cert-info">
                              <h4>Blood Donation Certificate</h4>
                              <p className="cert-donor">
                                {cert.donorName || "Donor"}
                              </p>
                              <p className="cert-date">
                                {donationDate.toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="cert-details">
                            <span className="cert-blood-badge">
                              {cert.bloodGroup}
                            </span>
                            <span className="cert-hospital">
                              {cert.hospitalName}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCertificateDownload(cert)}
                            className="btn-download-cert"
                            style={{
                              padding: "10px 20px",
                              background: "#c41e3a",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "0.95rem",
                              fontWeight: "500",
                              width: "100%",
                            }}
                          >
                            ⬇️ Download Certificate
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Hospitals Map */}
            {activeTab === "map" && (
              <div className="card map-card">
                <HospitalsMap userCity={profile.location} />
              </div>
            )}

            {/* Tips & Reminders */}
            {(activeTab === "home" || activeTab === "availability") && (
              <div className="card tips-card">
                <div className="card-header-large">
                  <h3>💡 Tips & Reminders</h3>
                  <p className="subtitle">Important guidelines for donors</p>
                </div>
                <div className="tips-list">
                  <div className="tip-item">
                    <span className="tip-icon">🩸</span>
                    <p>
                      <strong>Donation Frequency:</strong> You can donate blood
                      every 56 days to maintain your health and help others in
                      need.
                    </p>
                  </div>
                  <div className="tip-item">
                    <span className="tip-icon">🍽️</span>
                    <p>
                      <strong>Pre-Donation Meal:</strong> Eat a healthy,
                      balanced meal before donating to ensure optimal blood
                      collection and your well-being.
                    </p>
                  </div>
                  <div className="tip-item">
                    <span className="tip-icon">🆔</span>
                    <p>
                      <strong>Documentation:</strong> Always bring a valid ID to
                      your donation appointment to verify your identity and
                      donation eligibility.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorDashboard;
