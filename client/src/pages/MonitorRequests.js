import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminAPI } from "../utils/api";
import "../styles/MonitorRequests.css";

const MonitorRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [expandedRequestId, setExpandedRequestId] = useState(null);
  const [viewMode, setViewMode] = useState("table");
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch requests when filters change
  useEffect(() => {
    fetchRequests();
  }, [statusFilter, urgencyFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getBloodRequests(
        statusFilter,
        urgencyFilter,
      );
      setRequests(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching requests:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkFulfilled = async (requestId) => {
    if (window.confirm("Mark this request as fulfilled?")) {
      try {
        await adminAPI.updateRequestStatus(requestId, "fulfilled");
        fetchRequests();
      } catch (error) {
        console.error("Error updating request:", error);
        alert("Failed to update request");
      }
    }
  };

  const handleRejectRequest = async (requestId) => {
    const reason = prompt("Rejection reason:");
    if (reason !== null) {
      try {
        await adminAPI.rejectRequest(requestId, reason);
        fetchRequests();
      } catch (error) {
        console.error("Error rejecting request:", error);
        alert("Failed to reject request");
      }
    }
  };

  const getUrgencyLevel = (urgency) => {
    const levels = {
      High: { color: "🔴", class: "urgency-high", label: "High" },
      Medium: { color: "🟡", class: "urgency-medium", label: "Medium" },
      Low: { color: "🟢", class: "urgency-low", label: "Low" },
    };
    const level = levels[urgency] || levels.Medium;
    return level;
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { icon: "⏳", label: "Pending", class: "status-pending" },
      "pending-verification": {
        icon: "⏳",
        label: "Verification",
        class: "status-pending",
      },
      fulfilled: { icon: "✅", label: "Fulfilled", class: "status-fulfilled" },
      cancelled: { icon: "🚫", label: "Cancelled", class: "status-cancelled" },
      invalid: { icon: "❌", label: "Invalid", class: "status-invalid" },
    };
    const badge = badges[status] || badges["pending"];
    return (
      <span className={`status-badge ${badge.class}`}>
        {badge.icon} {badge.label}
      </span>
    );
  };

  // Summary stats
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(
    (r) => r.status === "pending" || r.status === "pending-verification",
  ).length;
  const fulfilledRequests = requests.filter(
    (r) => r.status === "fulfilled",
  ).length;
  const highUrgencyRequests = requests.filter(
    (r) => r.urgencyLevel === "High",
  ).length;

  return (
    <div className="monitor-requests-container">
      {/* Header */}
      <div className="monitor-header">
        <div className="header-content">
          <h1>📩 Monitor Blood Requests</h1>
          <p>Track and manage all blood donation requests</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-box">
          <div className="stat-number">{totalRequests}</div>
          <div className="stat-label">Total Requests</div>
        </div>
        <div className="stat-box pending">
          <div className="stat-number">{pendingRequests}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-box fulfilled">
          <div className="stat-number">{fulfilledRequests}</div>
          <div className="stat-label">Fulfilled</div>
        </div>
        <div className="stat-box emergency">
          <div className="stat-number">{highUrgencyRequests}</div>
          <div className="stat-label">🔴 High Urgency</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Status Filter:</label>
          <div className="filter-buttons">
            {[
              { value: "all", label: "All Status" },
              { value: "pending", label: "⏳ Pending" },
              { value: "pending-verification", label: "📋 Verification" },
              { value: "fulfilled", label: "✅ Fulfilled" },
              { value: "invalid", label: "❌ Invalid" },
              { value: "cancelled", label: "🚫 Cancelled" },
            ].map((opt) => (
              <button
                key={opt.value}
                className={`filter-btn ${statusFilter === opt.value ? "active" : ""}`}
                onClick={() => setStatusFilter(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>Urgency Filter:</label>
          <div className="filter-buttons">
            {[
              { value: "all", label: "All Urgency" },
              { value: "Low", label: "🟢 Low" },
              { value: "Medium", label: "🟡 Medium" },
              { value: "High", label: "🔴 High" },
            ].map((opt) => (
              <button
                key={opt.value}
                className={`filter-btn ${urgencyFilter === opt.value ? "active" : ""}`}
                onClick={() => setUrgencyFilter(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="view-toggle">
          <button
            className={`toggle-btn ${viewMode === "table" ? "active" : ""}`}
            onClick={() => setViewMode("table")}
          >
            📋 Table
          </button>
          <button
            className={`toggle-btn ${viewMode === "cards" ? "active" : ""}`}
            onClick={() => setViewMode("cards")}
          >
            📇 Cards
          </button>
        </div>
      </div>

      {/* Emergency Alert */}
      {highUrgencyRequests > 0 && (
        <div className="emergency-alert">
          <div className="alert-icon">🔴</div>
          <div className="alert-content">
            <h3>Emergency Requests!</h3>
            <p>
              {highUrgencyRequests} high urgency request
              {highUrgencyRequests !== 1 ? "s" : ""} require immediate attention
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>No requests found</p>
        </div>
      ) : viewMode === "table" ? (
        <div className="table-responsive">
          <table className="requests-table">
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Blood Group</th>
                <th>Hospital</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Quantity</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => {
                const urgencyLevel = getUrgencyLevel(req.urgencyLevel);
                return (
                  <tr
                    key={req.id}
                    className={`request-row ${urgencyLevel.class}`}
                  >
                    <td>
                      <strong>{req.patientName || req.recipientName}</strong>
                    </td>
                    <td>
                      <span className="blood-group-badge">
                        {req.bloodGroup}
                      </span>
                    </td>
                    <td>{req.hospitalName}</td>
                    <td>
                      <span className={`urgency-badge ${urgencyLevel.class}`}>
                        {urgencyLevel.color} {urgencyLevel.label}
                      </span>
                    </td>
                    <td>{getStatusBadge(req.status)}</td>
                    <td>{req.quantity} units</td>
                    <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td className="actions-cell">
                      {req.status === "pending" ||
                      req.status === "pending-verification" ? (
                        <>
                          <button
                            className="btn-fulfill"
                            onClick={() => handleMarkFulfilled(req.id)}
                            title="Mark as fulfilled"
                          >
                            ✅ Fulfill
                          </button>
                          <button
                            className="btn-reject-req"
                            onClick={() => handleRejectRequest(req.id)}
                            title="Reject request"
                          >
                            ❌ Reject
                          </button>
                        </>
                      ) : (
                        <span className="action-label">-</span>
                      )}
                      <button
                        className="btn-expand"
                        onClick={() =>
                          setExpandedRequestId(
                            expandedRequestId === req.id ? null : req.id,
                          )
                        }
                        title="View details"
                      >
                        🔍
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="requests-cards">
          {requests.map((req) => {
            const urgencyLevel = getUrgencyLevel(req.urgencyLevel);
            const isExpanded = expandedRequestId === req.id;
            return (
              <div
                key={req.id}
                className={`request-card ${urgencyLevel.class} ${isExpanded ? "expanded" : ""}`}
              >
                <div className="card-header">
                  <div
                    className="urgency-indicator"
                    style={{
                      color:
                        urgencyLevel.color === "🔴"
                          ? "#dc2626"
                          : urgencyLevel.color === "🟡"
                            ? "#eab308"
                            : "#10b981",
                    }}
                  >
                    {urgencyLevel.color}
                  </div>
                  <div className="card-main-info">
                    <h3>{req.patientName || req.recipientName}</h3>
                    <p>{req.hospitalName}</p>
                  </div>
                  <div className="card-badges">
                    <span className="blood-group-badge">{req.bloodGroup}</span>
                    {getStatusBadge(req.status)}
                  </div>
                </div>

                <div className="card-body">
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Urgency</span>
                      <span className={`urgency-badge ${urgencyLevel.class}`}>
                        {urgencyLevel.color} {urgencyLevel.label}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Quantity</span>
                      <span className="info-value">{req.quantity} units</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Status</span>
                      <span className="info-value">
                        {getStatusBadge(req.status)}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Requested</span>
                      <span className="info-value">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="card-details">
                      <div className="detail-section">
                        <h4>Request Details</h4>
                        <div className="details-grid">
                          {req.recipientEmail && (
                            <div className="detail-item">
                              <span className="detail-label">
                                📧 Recipient Email
                              </span>
                              <span className="detail-value">
                                {req.recipientEmail}
                              </span>
                            </div>
                          )}
                          {req.hospitalCity && (
                            <div className="detail-item">
                              <span className="detail-label">
                                📍 Hospital City
                              </span>
                              <span className="detail-value">
                                {req.hospitalCity}
                              </span>
                            </div>
                          )}
                          <div className="detail-item">
                            <span className="detail-label">
                              📋 Admission Status
                            </span>
                            <span className="detail-value">
                              {req.admissionStatus || "Not verified"}
                            </span>
                          </div>
                          {req.rejectionReason && (
                            <div className="detail-item">
                              <span className="detail-label">
                                ❌ Rejection Reason
                              </span>
                              <span className="detail-value">
                                {req.rejectionReason}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {(req.status === "pending" ||
                        req.status === "pending-verification") && (
                        <div className="card-actions">
                          <button
                            className="btn-fulfill"
                            onClick={() => handleMarkFulfilled(req.id)}
                          >
                            ✅ Mark as Fulfilled
                          </button>
                          <button
                            className="btn-reject-req"
                            onClick={() => handleRejectRequest(req.id)}
                          >
                            ❌ Reject Request
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MonitorRequests;
