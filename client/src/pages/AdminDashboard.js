import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminAPI } from "../utils/api";
import Reports from "./Reports";
import ManageUsers from "./ManageUsers";
import MonitorRequests from "./MonitorRequests";
import SystemAlerts from "./SystemAlerts";
import "../styles/Dashboard.css";
import "../styles/AdminDashboard.css";

// Verhoeff algorithm tables for Aadhaar validation
const verhoeffD = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const verhoeffP = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

const validateAadhaar = (aadhaar) => {
  const cleaned = aadhaar.replace(/\s/g, "");
  if (!/^\d{12}$/.test(cleaned)) return false;
  if (/^[01]/.test(cleaned)) return false;
  let c = 0;
  const digits = cleaned.split("").map(Number).reverse();
  for (let i = 0; i < digits.length; i++) {
    c = verhoeffD[c][verhoeffP[i % 8][digits[i]]];
  }
  return c === 0;
};

const AdminDashboard = () => {
  const [statistics, setStatistics] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [suspiciousActivity, setSuspiciousActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedNav, setSelectedNav] = useState("Home");
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [aadhaarStatus, setAadhaarStatus] = useState({});
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleVerifyAadhaar = (userId, aadhaarNumber) => {
    const isValid = validateAadhaar(aadhaarNumber);
    setAadhaarStatus((prev) => ({
      ...prev,
      [userId]: isValid ? "valid" : "invalid",
    }));
  };

  useEffect(() => {
    fetchAllAdminData();
  }, []);

  const fetchAllAdminData = async () => {
    setLoading(true);
    try {
      const statsResponse = await adminAPI.getStatistics();
      setStatistics(statsResponse.data || {});

      const pendingResp = await adminAPI.getPendingUsers();
      setPendingUsers(Array.isArray(pendingResp.data) ? pendingResp.data : []);

      // Sync any already-rejected users into suspiciousActivity, then fetch
      await adminAPI.syncRejectedUsers();

      const activityResp = await adminAPI.getSuspiciousActivity();
      setSuspiciousActivity(
        Array.isArray(activityResp.data) ? activityResp.data : [],
      );
    } catch (error) {
      console.error("Error fetching statistics:", error);
      setStatistics({});
    } finally {
      setLoading(false);
    }
  };

  const stats = statistics || {};

  // no fabricated data: dashboard shows only real admin API data

  return (
    <div className="admin-dashboard">
      <div className="welcome-banner-admin">
        <div className="banner-content">
          <div className="banner-avatar">👨‍⚕️</div>
          <div className="banner-text">
            <h2>Welcome, Admin!</h2>
            <p>Here are the latest updates and statistics from the platform.</p>
          </div>
        </div>
      </div>

      <div className="dashboard-container home-view">
        <div className="sidebar-content-wrapper">
          <button
            className="sidebar-toggle"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((s) => !s)}
          >
            ☰
          </button>
          <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
            <nav className="sidebar-nav">
              {[
                "Home",
                "Manage Users",
                "Monitor Requests",
                "Reports",
                "System Alerts",
              ].map((item) => (
                <div
                  key={item}
                  className={`nav-item ${selectedNav === item ? "active" : ""}`}
                  onClick={() => {
                    setSelectedNav(item);
                    setSidebarOpen(false);
                  }}
                >
                  {item}
                </div>
              ))}
              <button
                className="nav-item logout-btn"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
              >
                🚪 Logout
              </button>
            </nav>
          </aside>

          <main className="main-content">
            {selectedNav === "Home" && (
              <>
                <section className="stats-section">
                  <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                      <h4>Total Users</h4>
                      <p className="stat-value">{stats.totalUsers ?? 0}</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">🩸</div>
                    <div className="stat-content">
                      <h4>Total Donations</h4>
                      <p className="stat-value">{stats.totalDonations ?? 0}</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">📨</div>
                    <div className="stat-content">
                      <h4>Total Requests</h4>
                      <p className="stat-value available">
                        {stats.totalRequests ?? 0}
                      </p>
                    </div>
                  </div>
                </section>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr",
                    gap: "1.5rem",
                  }}
                >
                  <div>
                    <div className="card">
                      <div className="card-header-large">
                        <h3>Pending Approvals</h3>
                      </div>
                      <div style={{ padding: "1rem" }}>
                        {loading ? (
                          <div className="loading">
                            Loading pending users...
                          </div>
                        ) : pendingUsers.length === 0 ? (
                          <div className="no-data">No pending users</div>
                        ) : (
                          pendingUsers.map((user) => (
                            <div key={user.id} className="pending-user-row">
                              <div className="pending-user-summary">
                                <div
                                  className="pending-user-left"
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                  }}
                                >
                                  <button
                                    className={`expand-arrow ${expandedUserId === user.id ? "expanded" : ""}`}
                                    onClick={() =>
                                      setExpandedUserId(
                                        expandedUserId === user.id
                                          ? null
                                          : user.id,
                                      )
                                    }
                                    title="Show details"
                                  >
                                    ▶
                                  </button>
                                  <div>
                                    <div style={{ fontWeight: 700 }}>
                                      {user.name}
                                    </div>
                                    <div
                                      style={{
                                        color: "#95a5a6",
                                        fontSize: "0.9rem",
                                      }}
                                    >
                                      {user.email} · {user.role}
                                    </div>
                                  </div>
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                  <button
                                    className="btn-accept"
                                    disabled={
                                      user.status && user.status !== "pending"
                                    }
                                    onClick={async () => {
                                      try {
                                        await adminAPI.approveUser(user.id);
                                        fetchAllAdminData();
                                      } catch (err) {
                                        console.error(err);
                                      }
                                    }}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    className="availability-btn inactive"
                                    disabled={
                                      user.status && user.status !== "pending"
                                    }
                                    onClick={async () => {
                                      const reason = prompt(
                                        "Rejection reason (optional):",
                                      );
                                      try {
                                        await adminAPI.rejectUser(
                                          user.id,
                                          reason || "",
                                        );
                                        fetchAllAdminData();
                                      } catch (err) {
                                        console.error(err);
                                      }
                                    }}
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>

                              {expandedUserId === user.id && (
                                <div className="user-details-dropdown">
                                  <div className="user-details-grid">
                                    {user.name && (
                                      <div className="detail-item">
                                        <span className="detail-label">
                                          Full Name
                                        </span>
                                        <span className="detail-value">
                                          {user.name}
                                        </span>
                                      </div>
                                    )}
                                    {user.email && (
                                      <div className="detail-item">
                                        <span className="detail-label">
                                          Email
                                        </span>
                                        <span className="detail-value">
                                          {user.email}
                                        </span>
                                      </div>
                                    )}
                                    {user.role && (
                                      <div className="detail-item">
                                        <span className="detail-label">
                                          Role
                                        </span>
                                        <span className="detail-value">
                                          {user.role}
                                        </span>
                                      </div>
                                    )}
                                    {user.aadhaarNumber && (
                                      <div className="detail-item">
                                        <span className="detail-label">
                                          Aadhaar Number
                                        </span>
                                        <span className="detail-value aadhaar-value">
                                          {user.aadhaarNumber}
                                          {aadhaarStatus[user.id] ===
                                          "valid" ? (
                                            <span className="aadhaar-btn aadhaar-valid">
                                              ✓ Valid
                                            </span>
                                          ) : aadhaarStatus[user.id] ===
                                            "invalid" ? (
                                            <span className="aadhaar-btn aadhaar-invalid">
                                              ✗ Not Valid
                                            </span>
                                          ) : (
                                            <button
                                              className="aadhaar-btn aadhaar-verify"
                                              onClick={() =>
                                                handleVerifyAadhaar(
                                                  user.id,
                                                  user.aadhaarNumber,
                                                )
                                              }
                                            >
                                              Verify
                                            </button>
                                          )}
                                        </span>
                                      </div>
                                    )}
                                    {user.phone && (
                                      <div className="detail-item">
                                        <span className="detail-label">
                                          Phone
                                        </span>
                                        <span className="detail-value">
                                          {user.phone}
                                        </span>
                                      </div>
                                    )}
                                    {user.bloodType && (
                                      <div className="detail-item">
                                        <span className="detail-label">
                                          Blood Type
                                        </span>
                                        <span className="detail-value">
                                          {user.bloodType}
                                        </span>
                                      </div>
                                    )}
                                    {user.age && (
                                      <div className="detail-item">
                                        <span className="detail-label">
                                          Age
                                        </span>
                                        <span className="detail-value">
                                          {user.age}
                                        </span>
                                      </div>
                                    )}
                                    {user.gender && (
                                      <div className="detail-item">
                                        <span className="detail-label">
                                          Gender
                                        </span>
                                        <span className="detail-value">
                                          {user.gender}
                                        </span>
                                      </div>
                                    )}
                                    {user.address && (
                                      <div className="detail-item">
                                        <span className="detail-label">
                                          Address
                                        </span>
                                        <span className="detail-value">
                                          {user.address}
                                        </span>
                                      </div>
                                    )}
                                    {user.city && (
                                      <div className="detail-item">
                                        <span className="detail-label">
                                          City
                                        </span>
                                        <span className="detail-value">
                                          {user.city}
                                        </span>
                                      </div>
                                    )}
                                    {user.state && (
                                      <div className="detail-item">
                                        <span className="detail-label">
                                          State
                                        </span>
                                        <span className="detail-value">
                                          {user.state}
                                        </span>
                                      </div>
                                    )}
                                    {user.hospitalName && (
                                      <div className="detail-item">
                                        <span className="detail-label">
                                          Hospital
                                        </span>
                                        <span className="detail-value">
                                          {user.hospitalName}
                                        </span>
                                      </div>
                                    )}
                                    {user.organType && (
                                      <div className="detail-item">
                                        <span className="detail-label">
                                          Organ Type
                                        </span>
                                        <span className="detail-value">
                                          {user.organType}
                                        </span>
                                      </div>
                                    )}
                                    {user.medicalCondition && (
                                      <div className="detail-item">
                                        <span className="detail-label">
                                          Medical Condition
                                        </span>
                                        <span className="detail-value">
                                          {user.medicalCondition}
                                        </span>
                                      </div>
                                    )}
                                    {user.urgencyLevel && (
                                      <div className="detail-item">
                                        <span className="detail-label">
                                          Urgency
                                        </span>
                                        <span className="detail-value">
                                          {user.urgencyLevel}
                                        </span>
                                      </div>
                                    )}
                                    {user.createdAt && (
                                      <div className="detail-item">
                                        <span className="detail-label">
                                          Registered
                                        </span>
                                        <span className="detail-value">
                                          {user.createdAt.seconds
                                            ? new Date(
                                                user.createdAt.seconds * 1000,
                                              ).toLocaleString()
                                            : new Date(
                                                user.createdAt,
                                              ).toLocaleString()}
                                        </span>
                                      </div>
                                    )}
                                    {user.status && (
                                      <div className="detail-item">
                                        <span className="detail-label">
                                          Status
                                        </span>
                                        <span className="detail-value"></span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="card">
                      <div className="card-header-large">
                        <h3>Suspicious Activity</h3>
                      </div>
                      <div style={{ padding: "1rem" }}>
                        {loading ? (
                          <div className="loading">Loading activity...</div>
                        ) : suspiciousActivity.length === 0 ? (
                          <div className="no-data">
                            No suspicious activity detected
                          </div>
                        ) : (
                          suspiciousActivity.map((a) => (
                            <div
                              key={a.id}
                              style={{
                                padding: "0.6rem 0",
                                borderBottom: "1px dashed #eef2f7",
                              }}
                            >
                              <div style={{ fontWeight: 700 }}>
                                {a.type || "Activity"}
                              </div>
                              <div
                                style={{ color: "#95a5a6", fontSize: "0.9rem" }}
                              >
                                {a.description}
                              </div>
                              <div
                                style={{ color: "#95a5a6", fontSize: "0.8rem" }}
                              >
                                {a.flaggedAt
                                  ? new Date(
                                      a.flaggedAt.seconds * 1000,
                                    ).toLocaleString()
                                  : ""}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="card">
                      <div className="card-header-large">
                        <h3>System Overview</h3>
                      </div>
                      <div style={{ padding: "1rem" }}>
                        <div style={{ marginBottom: 8 }}>
                          <strong>Total Users:</strong> {stats.totalUsers ?? 0}
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <strong>Total Donations:</strong>{" "}
                          {stats.totalDonations ?? 0}
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <strong>Total Requests:</strong>{" "}
                          {stats.totalRequests ?? 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {selectedNav === "Reports" && <Reports />}
            {selectedNav === "Manage Users" && <ManageUsers />}
            {selectedNav === "Monitor Requests" && <MonitorRequests />}
            {selectedNav === "System Alerts" && <SystemAlerts />}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
