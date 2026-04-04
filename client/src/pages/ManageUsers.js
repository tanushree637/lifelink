import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminAPI } from "../utils/api";
import "../styles/ManageUsers.css";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [viewMode, setViewMode] = useState("table"); // table or cards
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch users when filters change
  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAllUsers(roleFilter, statusFilter);
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      await adminAPI.approveUser(userId);
      fetchUsers();
    } catch (error) {
      console.error("Error approving user:", error);
      alert("Failed to approve user");
    }
  };

  const handleRejectUser = async (userId) => {
    const reason = prompt("Rejection reason (optional):");
    if (reason !== null) {
      try {
        await adminAPI.rejectUser(userId, reason);
        fetchUsers();
      } catch (error) {
        console.error("Error rejecting user:", error);
        alert("Failed to reject user");
      }
    }
  };

  const handleBlockUser = async (userId, isBlocked) => {
    const confirmMsg = isBlocked
      ? "Are you sure you want to unblock this user?"
      : "Are you sure you want to block this user?";

    if (window.confirm(confirmMsg)) {
      try {
        await adminAPI.blockUser(userId, !isBlocked);
        fetchUsers();
      } catch (error) {
        console.error("Error updating block status:", error);
        alert("Failed to update user status");
      }
    }
  };

  // Filter users by search term
  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Separate pending users
  const pendingUsers = filteredUsers.filter((u) => u.status === "pending");
  const otherUsers = filteredUsers.filter((u) => u.status !== "pending");

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: "badge-pending", icon: "⏳", label: "Pending" },
      approved: { class: "badge-approved", icon: "✅", label: "Approved" },
      rejected: { class: "badge-rejected", icon: "❌", label: "Rejected" },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`badge ${badge.class}`}>
        {badge.icon} {badge.label}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const roles = {
      donor: { class: "role-donor", icon: "👥", label: "Donor" },
      recipient: { class: "role-recipient", icon: "🏥", label: "Recipient" },
      hospital: { class: "role-hospital", icon: "🏢", label: "Hospital" },
    };
    const roleInfo = roles[role] || roles.donor;
    return (
      <span className={`role-badge ${roleInfo.class}`}>
        {roleInfo.icon} {roleInfo.label}
      </span>
    );
  };

  return (
    <div className="manage-users-container">
      {/* Header */}
      <div className="manage-users-header">
        <div className="header-content">
          <h1>👥 Manage Users</h1>
          <p>Control and monitor all platform users</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Role Filter:</label>
          <div className="filter-buttons">
            {[
              { value: "all", label: "All Users" },
              { value: "donor", label: "👥 Donors" },
              { value: "recipient", label: "🏥 Recipients" },
              { value: "hospital", label: "🏢 Hospitals" },
            ].map((opt) => (
              <button
                key={opt.value}
                className={`filter-btn ${roleFilter === opt.value ? "active" : ""}`}
                onClick={() => setRoleFilter(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>Status Filter:</label>
          <div className="filter-buttons">
            {[
              { value: "all", label: "All Status" },
              { value: "pending", label: "⏳ Pending" },
              { value: "approved", label: "✅ Approved" },
              { value: "rejected", label: "❌ Rejected" },
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
          <label>Search:</label>
          <input
            type="text"
            placeholder="Search by name or email..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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

      {/* Pending Approvals Alert */}
      {pendingUsers.length > 0 && (
        <div className="pending-alert">
          <div className="alert-icon">⏳</div>
          <div className="alert-content">
            <h3>Pending Approvals</h3>
            <p>
              {pendingUsers.length} user{pendingUsers.length !== 1 ? "s" : ""}{" "}
              awaiting approval
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👤</div>
          <p>No users found</p>
        </div>
      ) : (
        <>
          {/* Pending Users Section */}
          {pendingUsers.length > 0 && (
            <div className="users-section">
              <h2 className="section-title">
                ⏳ Pending Approvals ({pendingUsers.length})
              </h2>
              {viewMode === "table" ? (
                <div className="table-responsive">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingUsers.map((u) => (
                        <tr key={u.id} className="pending-row">
                          <td>
                            <strong>{u.name}</strong>
                          </td>
                          <td>{u.email}</td>
                          <td>{getRoleBadge(u.role)}</td>
                          <td>{getStatusBadge(u.status)}</td>
                          <td className="actions-cell">
                            <button
                              className="btn-approve"
                              onClick={() => handleApproveUser(u.id)}
                              title="Approve user"
                            >
                              ✅ Approve
                            </button>
                            <button
                              className="btn-reject"
                              onClick={() => handleRejectUser(u.id)}
                              title="Reject user"
                            >
                              ❌ Reject
                            </button>
                            <button
                              className="btn-expand"
                              onClick={() =>
                                setExpandedUserId(
                                  expandedUserId === u.id ? null : u.id,
                                )
                              }
                              title="View details"
                            >
                              🔍 View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="users-cards">
                  {pendingUsers.map((u) => (
                    <UserCard
                      key={u.id}
                      user={u}
                      isExpanded={expandedUserId === u.id}
                      onToggleExpand={() =>
                        setExpandedUserId(expandedUserId === u.id ? null : u.id)
                      }
                      onApprove={() => handleApproveUser(u.id)}
                      onReject={() => handleRejectUser(u.id)}
                      onBlock={() => handleBlockUser(u.id, u.isBlocked)}
                      getRoleBadge={getRoleBadge}
                      getStatusBadge={getStatusBadge}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Other Users Section */}
          {otherUsers.length > 0 && (
            <div className="users-section">
              <h2 className="section-title">All Users ({otherUsers.length})</h2>
              {viewMode === "table" ? (
                <div className="table-responsive">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Blocked</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {otherUsers.map((u) => (
                        <tr key={u.id}>
                          <td>
                            <strong>{u.name}</strong>
                          </td>
                          <td>{u.email}</td>
                          <td>{getRoleBadge(u.role)}</td>
                          <td>{getStatusBadge(u.status)}</td>
                          <td>
                            <span
                              className={
                                u.isBlocked ? "blocked-yes" : "blocked-no"
                              }
                            >
                              {u.isBlocked ? "🚫 Blocked" : "✓ Active"}
                            </span>
                          </td>
                          <td className="actions-cell">
                            {u.status === "pending" && (
                              <>
                                <button
                                  className="btn-approve"
                                  onClick={() => handleApproveUser(u.id)}
                                >
                                  ✅ Approve
                                </button>
                                <button
                                  className="btn-reject"
                                  onClick={() => handleRejectUser(u.id)}
                                >
                                  ❌ Reject
                                </button>
                              </>
                            )}
                            <button
                              className={
                                u.isBlocked ? "btn-unblock" : "btn-block"
                              }
                              onClick={() => handleBlockUser(u.id, u.isBlocked)}
                            >
                              {u.isBlocked ? "🔓 Unblock" : "🚫 Block"}
                            </button>
                            <button
                              className="btn-expand"
                              onClick={() =>
                                setExpandedUserId(
                                  expandedUserId === u.id ? null : u.id,
                                )
                              }
                            >
                              🔍 View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="users-cards">
                  {otherUsers.map((u) => (
                    <UserCard
                      key={u.id}
                      user={u}
                      isExpanded={expandedUserId === u.id}
                      onToggleExpand={() =>
                        setExpandedUserId(expandedUserId === u.id ? null : u.id)
                      }
                      onApprove={() => handleApproveUser(u.id)}
                      onReject={() => handleRejectUser(u.id)}
                      onBlock={() => handleBlockUser(u.id, u.isBlocked)}
                      getRoleBadge={getRoleBadge}
                      getStatusBadge={getStatusBadge}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// User Card Component
const UserCard = ({
  user,
  isExpanded,
  onToggleExpand,
  onApprove,
  onReject,
  onBlock,
  getRoleBadge,
  getStatusBadge,
}) => {
  return (
    <div className={`user-card ${isExpanded ? "expanded" : ""}`}>
      <div className="card-header">
        <div className="user-info">
          <h3>{user.name}</h3>
          <p>{user.email}</p>
        </div>
        <div className="card-badges">
          {getRoleBadge(user.role)}
          {getStatusBadge(user.status)}
        </div>
      </div>

      {isExpanded && (
        <div className="card-details">
          <div className="detail-grid">
            {user.phoneNumber && (
              <div className="detail-item">
                <span className="detail-label">📱 Phone</span>
                <span className="detail-value">{user.phoneNumber}</span>
              </div>
            )}
            {user.bloodGroup && (
              <div className="detail-item">
                <span className="detail-label">🩸 Blood Group</span>
                <span className="detail-value">{user.bloodGroup}</span>
              </div>
            )}
            {user.aadhaarNumber && (
              <div className="detail-item">
                <span className="detail-label">📋 Aadhaar</span>
                <span className="detail-value">
                  {user.aadhaarNumber.slice(-4).padStart(12, "*")}
                </span>
              </div>
            )}
            {user.hospitalName && (
              <div className="detail-item">
                <span className="detail-label">🏢 Hospital</span>
                <span className="detail-value">{user.hospitalName}</span>
              </div>
            )}
            {user.location && (
              <div className="detail-item">
                <span className="detail-label">📍 Location</span>
                <span className="detail-value">{user.location}</span>
              </div>
            )}
            {user.createdAt && (
              <div className="detail-item">
                <span className="detail-label">📅 Joined</span>
                <span className="detail-value">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="detail-item">
              <span className="detail-label">🔒 Status</span>
              <span className="detail-value">
                {user.isBlocked ? "🚫 Blocked" : "✓ Active"}
              </span>
            </div>
          </div>

          <div className="card-actions">
            {user.status === "pending" && (
              <>
                <button className="btn-approve" onClick={onApprove}>
                  ✅ Approve
                </button>
                <button className="btn-reject" onClick={onReject}>
                  ❌ Reject
                </button>
              </>
            )}
            <button
              className={user.isBlocked ? "btn-unblock" : "btn-block"}
              onClick={onBlock}
            >
              {user.isBlocked ? "🔓 Unblock" : "🚫 Block"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
