import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navigation.css";

const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getRoleRoute = () => {
    if (!user) return "/";
    switch (user.role) {
      case "donor":
        return "/donor/dashboard";
      case "recipient":
        return "/recipient/dashboard";
      case "hospital":
        return "/hospital/dashboard";
      case "admin":
        return "/admin/dashboard";
      default:
        return "/";
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to={user ? getRoleRoute() : "/"} className="navbar-brand">
          🩸 LifeLink
        </Link>

        {user && (
          <div className="navbar-links">
            {user.role === "donor" && (
              <>
                <Link to="/donor/dashboard" className="nav-link">
                  Home
                </Link>
                <Link to="/donor/dashboard" className="nav-link">
                  Emergency Requests
                </Link>
                <Link to="/donor/dashboard" className="nav-link">
                  Donation History
                </Link>
                <Link to="/donor/dashboard" className="nav-link">
                  Profile
                </Link>
                <button className="nav-link logout-link" onClick={handleLogout}>
                  Logout
                </button>
              </>
            )}

            {user.role === "recipient" && (
              <>
                <Link to="/recipient/dashboard" className="nav-link">
                  Dashboard
                </Link>
                <button className="nav-link logout-link" onClick={handleLogout}>
                  Logout
                </button>
              </>
            )}

            {user.role === "hospital" && (
              <>
                <Link to="/hospital/dashboard" className="nav-link">
                  Dashboard
                </Link>
                <button className="nav-link logout-link" onClick={handleLogout}>
                  Logout
                </button>
              </>
            )}

            {user.role === "admin" && (
              <>
                <Link to="/admin/dashboard" className="nav-link">
                  Dashboard
                </Link>
                <button className="nav-link logout-link" onClick={handleLogout}>
                  Logout
                </button>
              </>
            )}
          </div>
        )}

        <div className="navbar-menu">
          {user ? (
            <>
              <span className="navbar-user">{user.name}</span>
              <button className="navbar-logout" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link">
                Login
              </Link>
              <Link to="/signup" className="navbar-link">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
