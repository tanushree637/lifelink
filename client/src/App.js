import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import DonorDashboard from "./pages/DonorDashboard";
import RecipientDashboard from "./pages/RecipientDashboard";
import HospitalDashboard from "./pages/HospitalDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import "./App.css";

const HomePage = () => (
  <div className="home-container">
    <div className="hero">
      <h1>🩸 Welcome to LifeLink</h1>
      <p>Save lives through blood donation</p>
      <div className="cta-buttons">
        <a href="/login" className="btn btn-primary">
          Login
        </a>
        <a href="/signup" className="btn btn-secondary">
          Sign Up
        </a>
      </div>
    </div>
    <div className="features">
      <div className="feature-card">
        <h3>🩸 Donors</h3>
        <p>Register and help save lives by donating blood</p>
      </div>
      <div className="feature-card">
        <h3>🆘 Recipients</h3>
        <p>Create emergency blood requests instantly</p>
      </div>
      <div className="feature-card">
        <h3>🏥 Hospitals</h3>
        <p>Manage blood donations and verify donors</p>
      </div>
      <div className="feature-card">
        <h3>👨‍💼 Admin</h3>
        <p>Monitor and manage the entire platform</p>
      </div>
    </div>
  </div>
);

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/donor/dashboard"
            element={
              <ProtectedRoute role="donor">
                <DonorDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/recipient/dashboard"
            element={
              <ProtectedRoute role="recipient">
                <RecipientDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/hospital/dashboard"
            element={
              <ProtectedRoute role="hospital">
                <HospitalDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
