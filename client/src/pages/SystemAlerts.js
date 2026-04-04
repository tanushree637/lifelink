import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminAPI } from "../utils/api";
import "../styles/SystemAlerts.css";

const SystemAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedAlertId, setExpandedAlertId] = useState(null);
  const [triggerRefresh, setTriggerRefresh] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch alerts
  useEffect(() => {
    fetchAlerts();
  }, [triggerRefresh]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getSystemAlerts();
      const data = response.data || {};
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const severityConfig = {
    error: { color: "#dc2626", bgColor: "#fee2e2", borderColor: "#fca5a5" },
    warning: { color: "#ea580c", bgColor: "#fed7aa", borderColor: "#fdba74" },
    info: { color: "#0284c7", bgColor: "#e0f2fe", borderColor: "#7dd3fc" },
  };

  const getAlertColor = (severity) => {
    return severityConfig[severity] || severityConfig.info;
  };

  return (
    <div className="system-alerts-container">
      {/* Header */}
      <div className="alerts-header">
        <div className="header-content">
          <h1>🚨 System Alerts</h1>
          <p>Monitor security issues and system anomalies</p>
        </div>
        <button
          className="refresh-btn"
          onClick={() => setTriggerRefresh((prev) => prev + 1)}
          disabled={loading}
        >
          🔄 {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Alert Summary */}
      {alerts.length > 0 && (
        <div className="alerts-summary">
          <div className="summary-stat">
            <div className="summary-number">{alerts.length}</div>
            <div className="summary-label">Total Alerts</div>
          </div>
          <div className="summary-stat critical">
            <div className="summary-number">
              {alerts.reduce(
                (count, a) => count + (a.severity === "error" ? 1 : 0),
                0,
              )}
            </div>
            <div className="summary-label">Critical</div>
          </div>
          <div className="summary-stat warning">
            <div className="summary-number">
              {alerts.reduce(
                (count, a) => count + (a.severity === "warning" ? 1 : 0),
                0,
              )}
            </div>
            <div className="summary-label">Warnings</div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading system alerts...</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="no-alerts">
          <div className="no-alerts-icon">✅</div>
          <h2>All Clear!</h2>
          <p>No system alerts at this time</p>
        </div>
      ) : (
        <div className="alerts-grid">
          {alerts.map((alert) => {
            const colors = getAlertColor(alert.severity);
            const isExpanded = expandedAlertId === alert.type;

            return (
              <div
                key={alert.type}
                className={`alert-card ${alert.severity} ${isExpanded ? "expanded" : ""}`}
                style={{
                  borderLeftColor: colors.borderColor,
                  backgroundColor: isExpanded ? colors.bgColor : "white",
                }}
              >
                <div
                  className="alert-header"
                  onClick={() =>
                    setExpandedAlertId(isExpanded ? null : alert.type)
                  }
                >
                  <div className="alert-icon" style={{ color: colors.color }}>
                    {alert.icon}
                  </div>
                  <div className="alert-title-section">
                    <h3>{alert.type}</h3>
                    <p>{alert.message}</p>
                  </div>
                  <div
                    className="alert-count"
                    style={{
                      backgroundColor: colors.bgColor,
                      color: colors.color,
                    }}
                  >
                    {alert.count}
                  </div>
                  <button
                    className="expand-btn"
                    style={{ color: colors.color }}
                  >
                    {isExpanded ? "▼" : "▶"}
                  </button>
                </div>

                {isExpanded && alert.details && alert.details.length > 0 && (
                  <div className="alert-details">
                    <div className="details-list">
                      {alert.type === "Invalid Aadhaar" && (
                        <div className="details-items">
                          {alert.details.map((item) => (
                            <div key={item.id} className="detail-row">
                              <div className="detail-info">
                                <strong>{item.name}</strong>
                                <span className="detail-meta">
                                  {item.email}
                                </span>
                                <span className="detail-meta">
                                  Aadhaar: {item.aadhaar}
                                </span>
                              </div>
                              <span className="detail-role">{item.role}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {alert.type === "Rejected Users" && (
                        <div className="details-items">
                          {alert.details.map((item) => (
                            <div key={item.id} className="detail-row">
                              <div className="detail-info">
                                <strong>{item.name}</strong>
                                <span className="detail-meta">
                                  {item.email}
                                </span>
                                <span className="detail-meta">
                                  Reason: {item.reason}
                                </span>
                              </div>
                              <span className="detail-role">{item.role}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {alert.type === "Invalid Requests" && (
                        <div className="details-items">
                          {alert.details.map((item) => (
                            <div key={item.id} className="detail-row">
                              <div className="detail-info">
                                <strong>{item.patientName}</strong>
                                <span className="detail-meta">
                                  Blood: {item.bloodGroup}
                                </span>
                                <span className="detail-meta">
                                  {item.recipientEmail}
                                </span>
                                <span className="detail-meta">
                                  Reason: {item.reason}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {alert.type === "Multiple Requests" && (
                        <div className="details-items">
                          {alert.details.map((item) => (
                            <div key={item.recipientId} className="detail-row">
                              <div className="detail-info">
                                <strong>{item.name}</strong>
                                <span className="detail-meta">
                                  {item.email}
                                </span>
                                <span className="detail-meta">
                                  {item.requestCount} pending request
                                  {item.requestCount > 1 ? "s" : ""}
                                </span>
                              </div>
                              <span className="detail-count">
                                {item.requestCount}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {alert.type === "Suspicious Activity" && (
                        <div className="details-items">
                          {alert.details.map((item) => (
                            <div key={item.id} className="detail-row">
                              <div className="detail-info">
                                <strong>{item.type}</strong>
                                <span className="detail-meta">
                                  {item.description}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button className="action-btn">📋 View More Details</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SystemAlerts;
