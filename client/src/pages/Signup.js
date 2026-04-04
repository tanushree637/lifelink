import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../utils/api";
import MedicalEligibilityForm from "../components/MedicalEligibilityForm";
import "../styles/AuthPages.css";

const HOSPITAL_LICENSE_REGEX = /^[A-Za-z0-9][A-Za-z0-9/-]{7,19}$/;

const Signup = () => {
  const [role, setRole] = useState("donor");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    bloodGroup: "",
    gender: "",
    location: "",
    hospitalName: "",
    address: "",
    city: "",
    license: "",
    aadhaarNumber: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = basic info, 2 = medical form (donors only)
  const [medicalData, setMedicalData] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate required fields
    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.phone
    ) {
      setError("Please fill in all required fields");
      return;
    }

    if (
      role === "donor" &&
      (!formData.bloodGroup || !formData.location || !formData.gender)
    ) {
      setError("Blood group, gender, and location are required for donors");
      return;
    }

    if (role === "recipient" && !formData.aadhaarNumber) {
      setError("Aadhaar number is required for recipients");
      return;
    }

    if (role === "recipient" && !/^\d{12}$/.test(formData.aadhaarNumber)) {
      setError("Aadhaar number must be a 12-digit number");
      return;
    }

    if (
      role === "hospital" &&
      (!formData.hospitalName ||
        !formData.address ||
        !formData.city ||
        !formData.license)
    ) {
      setError("All hospital details are required");
      return;
    }

    if (role === "hospital" && !HOSPITAL_LICENSE_REGEX.test(formData.license)) {
      setError(
        "Invalid hospital license number. Use 8-20 characters with letters/numbers (allowed: / and -).",
      );
      return;
    }

    // For donors, show medical form as step 2
    if (role === "donor" && step === 1) {
      setStep(2);
      return;
    }

    setLoading(true);

    try {
      const data = {
        ...formData,
        role,
        ...(role === "donor" && medicalData
          ? { medicalInfo: medicalData }
          : {}),
      };

      await authAPI.register(data);
      setSuccess(
        role === "hospital"
          ? "✅ Hospital registration successful! License verified. You can now log in."
          : "✅ Registration successful! Your data has been saved to Firebase. Waiting for admin approval...",
      );

      // Clear form
      setFormData({
        name: "",
        email: "",
        password: "",
        phone: "",
        bloodGroup: "",
        gender: "",
        location: "",
        hospitalName: "",
        address: "",
        city: "",
        license: "",
        aadhaarNumber: "",
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error("🔴 Registration Error Details:", {
        status: err.response?.status,
        message: err.response?.data?.message,
        details: err.response?.data?.details,
        error: err.response?.data?.error,
        fullError: err,
      });

      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.details ||
        err.response?.data?.error ||
        "Registration failed. Please try again.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleMedicalResult = ({ eligible, medicalData: mData }) => {
    if (eligible) {
      setMedicalData(mData);
      // Auto-submit registration with medical data
      setStep(3); // Mark as completed medical step
      // Trigger form submission programmatically
      submitRegistration(mData);
    }
  };

  const submitRegistration = async (mData) => {
    setLoading(true);
    setError("");
    try {
      const data = {
        ...formData,
        role,
        medicalInfo: mData,
      };

      await authAPI.register(data);
      setSuccess(
        "✅ Registration successful! Your data has been saved to Firebase. Waiting for admin approval...",
      );

      setFormData({
        name: "",
        email: "",
        password: "",
        phone: "",
        bloodGroup: "",
        gender: "",
        location: "",
        hospitalName: "",
        address: "",
        city: "",
        license: "",
        aadhaarNumber: "",
      });
      setMedicalData(null);
      setStep(1);

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error("🔴 Registration Error Details:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.details ||
        err.response?.data?.error ||
        "Registration failed. Please try again.";
      setError(errorMsg);
      setStep(2); // Go back to medical form on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>🩸 Sign Up to LifeLink</h2>
        {role === "donor" && step > 1 && (
          <div className="step-indicator">
            <span className="step completed">1. Basic Info ✓</span>
            <span
              className={`step ${step === 2 ? "active" : step === 3 ? "completed" : ""}`}
            >
              2. Medical Screening {step === 3 ? "✓" : ""}
            </span>
          </div>
        )}
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {step === 2 && role === "donor" ? (
          <MedicalEligibilityForm
            onResult={handleMedicalResult}
            onBack={() => setStep(1)}
          />
        ) : step === 3 ? (
          <div className="loading-registration">
            <p>⏳ Completing your registration...</p>
          </div>
        ) : (
          <>
            <div className="role-selector">
              <label>
                <input
                  type="radio"
                  value="donor"
                  checked={role === "donor"}
                  onChange={(e) => setRole(e.target.value)}
                />
                🩸 Donor
              </label>
              <label>
                <input
                  type="radio"
                  value="recipient"
                  checked={role === "recipient"}
                  onChange={(e) => setRole(e.target.value)}
                />
                🆘 Recipient
              </label>
              <label>
                <input
                  type="radio"
                  value="hospital"
                  checked={role === "hospital"}
                  onChange={(e) => setRole(e.target.value)}
                />
                🏥 Hospital
              </label>
            </div>

            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Full Name *"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email *"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password (min 6 chars) *"
                value={formData.password}
                onChange={handleChange}
                minLength="6"
                required
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number *"
                value={formData.phone}
                onChange={handleChange}
                required
              />

              {role === "donor" && (
                <>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Blood Group *</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Gender *</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  <input
                    type="text"
                    name="location"
                    placeholder="City/Location *"
                    value={formData.location}
                    onChange={handleChange}
                    required
                  />
                </>
              )}

              {role === "recipient" && (
                <>
                  <input
                    type="text"
                    name="aadhaarNumber"
                    placeholder="Aadhaar Number (12 digits) *"
                    value={formData.aadhaarNumber}
                    onChange={handleChange}
                    maxLength="12"
                    pattern="\d{12}"
                    required
                  />
                </>
              )}

              {role === "hospital" && (
                <>
                  <input
                    type="text"
                    name="hospitalName"
                    placeholder="Hospital Name *"
                    value={formData.hospitalName}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="text"
                    name="address"
                    placeholder="Street Address *"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="text"
                    name="city"
                    placeholder="City *"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="text"
                    name="license"
                    placeholder="License Number *"
                    value={formData.license}
                    onChange={handleChange}
                    required
                  />
                </>
              )}

              <button type="submit" disabled={loading}>
                {loading
                  ? "Creating Account... 💾"
                  : role === "donor"
                    ? "Next: Medical Screening →"
                    : "Sign Up & Save to Firebase"}
              </button>
            </form>
            <p>
              Already have an account? <a href="/login">Login here</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Signup;
