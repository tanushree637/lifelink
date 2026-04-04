import React, { useState } from "react";
import "./MedicalEligibilityForm.css";

const DISEASES = [
  "HIV/AIDS",
  "Hepatitis B",
  "Hepatitis C",
  "Syphilis",
  "Malaria (in last 3 months)",
  "Tuberculosis",
  "Heart Disease",
  "Cancer",
  "Bleeding Disorder",
  "Diabetes (insulin-dependent)",
];

const MedicalEligibilityForm = ({ onResult, onBack }) => {
  const [formData, setFormData] = useState({
    age: "",
    weight: "",
    lastDonationDate: "",
    diseases: [],
    recentSurgery: "",
    surgeryDetails: "",
    recentIllness: "",
    illnessDetails: "",
    currentMedications: "",
    isPregnantOrNursing: "",
  });

  const [result, setResult] = useState(null); // { eligible, reasons }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDiseaseToggle = (disease) => {
    setFormData((prev) => {
      const diseases = prev.diseases.includes(disease)
        ? prev.diseases.filter((d) => d !== disease)
        : [...prev.diseases, disease];
      return { ...prev, diseases };
    });
  };

  const checkEligibility = () => {
    const reasons = [];
    let eligible = true;

    // ─── Age Check (18–65) ───
    const age = parseInt(formData.age, 10);
    if (!formData.age || isNaN(age)) {
      reasons.push("Age is required.");
      eligible = false;
    } else if (age < 18) {
      reasons.push("You must be at least 18 years old to donate blood.");
      eligible = false;
    } else if (age > 65) {
      reasons.push("Donors must be 65 years old or younger.");
      eligible = false;
    }

    // ─── Weight Check (≥ 50 kg) ───
    const weight = parseFloat(formData.weight);
    if (!formData.weight || isNaN(weight)) {
      reasons.push("Weight is required.");
      eligible = false;
    } else if (weight < 50) {
      reasons.push("You must weigh at least 50 kg (110 lbs) to donate.");
      eligible = false;
    }

    // ─── Time Gap Between Donations (≥ 56 days) ───
    if (formData.lastDonationDate) {
      const lastDate = new Date(formData.lastDonationDate);
      const today = new Date();
      const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
      if (diffDays < 56) {
        reasons.push(
          `Only ${diffDays} days since your last donation. A minimum gap of 56 days (8 weeks) is required. You can donate again after ${new Date(lastDate.getTime() + 56 * 86400000).toLocaleDateString()}.`,
        );
        eligible = false;
      }
    }

    // ─── Major Diseases ───
    if (formData.diseases.length > 0) {
      reasons.push(
        `You reported the following condition(s): ${formData.diseases.join(", ")}. Donors with these conditions are not eligible.`,
      );
      eligible = false;
    }

    // ─── Recent Surgery (within 6 months) ───
    if (formData.recentSurgery === "yes") {
      reasons.push(
        "You have had a recent surgery. Donors must wait at least 6 months after surgery before donating.",
      );
      eligible = false;
    }

    // ─── Recent Illness (within 2 weeks) ───
    if (formData.recentIllness === "yes") {
      reasons.push(
        "You have had a recent illness. Please wait at least 2 weeks after full recovery before donating.",
      );
      eligible = false;
    }

    // ─── Pregnancy / Nursing ───
    if (formData.isPregnantOrNursing === "yes") {
      reasons.push(
        "Pregnant or nursing individuals are not eligible to donate blood.",
      );
      eligible = false;
    }

    return { eligible, reasons };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const eligibility = checkEligibility();
    setResult(eligibility);
  };

  const handleProceed = () => {
    onResult({
      eligible: result.eligible,
      medicalData: {
        age: parseInt(formData.age, 10),
        weight: parseFloat(formData.weight),
        lastDonationDate: formData.lastDonationDate || null,
        diseases: formData.diseases,
        recentSurgery: formData.recentSurgery === "yes",
        surgeryDetails: formData.surgeryDetails || null,
        recentIllness: formData.recentIllness === "yes",
        illnessDetails: formData.illnessDetails || null,
        currentMedications: formData.currentMedications || null,
        isPregnantOrNursing: formData.isPregnantOrNursing === "yes",
        eligibilityCheckedAt: new Date().toISOString(),
      },
    });
  };

  return (
    <div className="medical-form-container">
      <div className="medical-form-header">
        <h3>🏥 Medical Eligibility Screening</h3>
        <p>
          Please fill out this form honestly. Your responses help us ensure a
          safe donation for both you and the recipient.
        </p>
      </div>

      {!result ? (
        <form className="medical-form" onSubmit={handleSubmit}>
          {/* Age */}
          <div className="form-section">
            <label className="form-label">
              <span className="label-icon">🎂</span>
              Age (years) <span className="required">*</span>
            </label>
            <input
              type="number"
              name="age"
              placeholder="Enter your age"
              value={formData.age}
              onChange={handleChange}
              min="1"
              max="120"
              required
              className="form-input"
            />
            <span className="form-hint">Must be between 18 and 65 years</span>
          </div>

          {/* Weight */}
          <div className="form-section">
            <label className="form-label">
              <span className="label-icon">⚖️</span>
              Weight (kg) <span className="required">*</span>
            </label>
            <input
              type="number"
              name="weight"
              placeholder="Enter your weight in kg"
              value={formData.weight}
              onChange={handleChange}
              min="1"
              max="300"
              step="0.1"
              required
              className="form-input"
            />
            <span className="form-hint">Minimum weight: 50 kg (110 lbs)</span>
          </div>

          {/* Last Donation Date */}
          <div className="form-section">
            <label className="form-label">
              <span className="label-icon">📅</span>
              Last Blood Donation Date
            </label>
            <input
              type="date"
              name="lastDonationDate"
              value={formData.lastDonationDate}
              onChange={handleChange}
              max={new Date().toISOString().split("T")[0]}
              className="form-input"
            />
            <span className="form-hint">
              Leave blank if this is your first donation. Minimum gap: 56 days.
            </span>
          </div>

          {/* Major Diseases */}
          <div className="form-section">
            <label className="form-label">
              <span className="label-icon">🦠</span>
              Do you have any of the following conditions?{" "}
              <span className="required">*</span>
            </label>
            <div className="disease-grid">
              {DISEASES.map((disease) => (
                <label
                  key={disease}
                  className={`disease-chip ${formData.diseases.includes(disease) ? "selected" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={formData.diseases.includes(disease)}
                    onChange={() => handleDiseaseToggle(disease)}
                  />
                  <span>{disease}</span>
                </label>
              ))}
            </div>
            <span className="form-hint">
              Select all that apply. Leave unchecked if none.
            </span>
          </div>

          {/* Recent Surgery */}
          <div className="form-section">
            <label className="form-label">
              <span className="label-icon">🔪</span>
              Have you had any surgery in the past 6 months?{" "}
              <span className="required">*</span>
            </label>
            <div className="radio-group">
              <label
                className={`radio-option ${formData.recentSurgery === "no" ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="recentSurgery"
                  value="no"
                  checked={formData.recentSurgery === "no"}
                  onChange={handleChange}
                  required
                />
                <span>No</span>
              </label>
              <label
                className={`radio-option ${formData.recentSurgery === "yes" ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="recentSurgery"
                  value="yes"
                  checked={formData.recentSurgery === "yes"}
                  onChange={handleChange}
                />
                <span>Yes</span>
              </label>
            </div>
            {formData.recentSurgery === "yes" && (
              <input
                type="text"
                name="surgeryDetails"
                placeholder="Please describe the surgery..."
                value={formData.surgeryDetails}
                onChange={handleChange}
                className="form-input conditional-input"
              />
            )}
          </div>

          {/* Recent Illness */}
          <div className="form-section">
            <label className="form-label">
              <span className="label-icon">🤒</span>
              Have you had any illness in the past 2 weeks?{" "}
              <span className="required">*</span>
            </label>
            <div className="radio-group">
              <label
                className={`radio-option ${formData.recentIllness === "no" ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="recentIllness"
                  value="no"
                  checked={formData.recentIllness === "no"}
                  onChange={handleChange}
                  required
                />
                <span>No</span>
              </label>
              <label
                className={`radio-option ${formData.recentIllness === "yes" ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="recentIllness"
                  value="yes"
                  checked={formData.recentIllness === "yes"}
                  onChange={handleChange}
                />
                <span>Yes</span>
              </label>
            </div>
            {formData.recentIllness === "yes" && (
              <input
                type="text"
                name="illnessDetails"
                placeholder="Please describe the illness..."
                value={formData.illnessDetails}
                onChange={handleChange}
                className="form-input conditional-input"
              />
            )}
          </div>

          {/* Pregnancy / Nursing */}
          <div className="form-section">
            <label className="form-label">
              <span className="label-icon">🤰</span>
              Are you currently pregnant or nursing?{" "}
              <span className="required">*</span>
            </label>
            <div className="radio-group">
              <label
                className={`radio-option ${formData.isPregnantOrNursing === "no" ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="isPregnantOrNursing"
                  value="no"
                  checked={formData.isPregnantOrNursing === "no"}
                  onChange={handleChange}
                  required
                />
                <span>No</span>
              </label>
              <label
                className={`radio-option ${formData.isPregnantOrNursing === "yes" ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="isPregnantOrNursing"
                  value="yes"
                  checked={formData.isPregnantOrNursing === "yes"}
                  onChange={handleChange}
                />
                <span>Yes</span>
              </label>
            </div>
          </div>

          {/* Current Medications */}
          <div className="form-section">
            <label className="form-label">
              <span className="label-icon">💊</span>
              Current Medications (if any)
            </label>
            <input
              type="text"
              name="currentMedications"
              placeholder="List any medications you are currently taking..."
              value={formData.currentMedications}
              onChange={handleChange}
              className="form-input"
            />
            <span className="form-hint">Leave blank if none</span>
          </div>

          {/* Buttons */}
          <div className="form-actions">
            <button type="button" className="btn-back" onClick={onBack}>
              ← Back
            </button>
            <button type="submit" className="btn-check-eligibility">
              Check Eligibility →
            </button>
          </div>
        </form>
      ) : (
        /* ─── Result Screen ─── */
        <div
          className={`eligibility-result ${result.eligible ? "eligible" : "ineligible"}`}
        >
          <div className="result-icon">{result.eligible ? "✅" : "❌"}</div>
          <h3 className="result-title">
            {result.eligible
              ? "You Are Eligible to Donate!"
              : "Not Eligible at This Time"}
          </h3>

          {result.eligible ? (
            <p className="result-message">
              Great news! Based on your responses, you meet all the eligibility
              criteria for blood donation. Please proceed to complete your
              registration.
            </p>
          ) : (
            <div className="result-reasons">
              <p className="result-message">
                Based on your responses, you are currently not eligible to
                donate blood for the following reason(s):
              </p>
              <ul className="reasons-list">
                {result.reasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
              <p className="result-note">
                💡 Eligibility may change over time. Please consult a healthcare
                professional for more details.
              </p>
            </div>
          )}

          <div className="result-actions">
            <button
              type="button"
              className="btn-back"
              onClick={() => setResult(null)}
            >
              ← Review Answers
            </button>
            {result.eligible && (
              <button
                type="button"
                className="btn-proceed"
                onClick={handleProceed}
              >
                Proceed to Register ✓
              </button>
            )}
            {!result.eligible && (
              <button type="button" className="btn-back" onClick={onBack}>
                ← Go Back
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalEligibilityForm;
