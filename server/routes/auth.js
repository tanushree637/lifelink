const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { getDB } = require("../config/firebase");
const router = express.Router();

const HOSPITAL_LICENSE_REGEX = /^[A-Z0-9][A-Z0-9/-]{7,19}$/;

const normalizeHospitalLicense = (license = "") =>
  license.toString().trim().toUpperCase();

const isValidHospitalLicense = (license = "") => {
  const normalized = normalizeHospitalLicense(license);
  if (!normalized) {
    return false;
  }

  if (!HOSPITAL_LICENSE_REGEX.test(normalized)) {
    return false;
  }

  // Require at least one letter and one number to avoid weak/free-form values.
  return /[A-Z]/.test(normalized) && /\d/.test(normalized);
};

// Register
router.post("/register", async (req, res) => {
  try {
    console.log("📝 Registration attempt with data:", req.body);

    const { email, password, name, role, phone } = req.body;

    if (!email || !password || !name || !role) {
      console.log("❌ Missing required fields");
      return res.status(400).json({ message: "Missing required fields" });
    }

    const db = getDB();
    if (!db) {
      console.log("❌ Database connection failed");
      return res.status(500).json({ message: "Database connection failed" });
    }

    const userRef = db.collection("users");
    const existingUser = await userRef.where("email", "==", email).get();

    if (!existingUser.empty) {
      console.log("❌ User already exists:", email);
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    if (phone) {
      const existingPhone = await userRef.where("phone", "==", phone).get();
      if (!existingPhone.empty) {
        console.log("❌ Phone number already registered:", phone);
        return res
          .status(400)
          .json({ message: "Phone number is already registered" });
      }
    }

    if (role === "hospital") {
      const { hospitalName, address, city, license } = req.body;

      if (!hospitalName || !address || !city || !license) {
        return res
          .status(400)
          .json({ message: "All hospital details are required" });
      }

      const normalizedLicense = normalizeHospitalLicense(license);
      if (!isValidHospitalLicense(normalizedLicense)) {
        return res.status(400).json({
          message:
            "Invalid hospital license number. Use 8-20 characters with letters/numbers (allowed: / and -).",
        });
      }

      const existingLicense = await userRef
        .where("licenseNormalized", "==", normalizedLicense)
        .get();

      if (!existingLicense.empty) {
        return res.status(400).json({
          message: "Hospital license number is already registered",
        });
      }
    }

    // Store password as plain text for visibility (development)
    const newUser = {
      email,
      password: password,
      name,
      role,
      phone,
      createdAt: new Date(),
      status: role === "hospital" ? "approved" : "pending",
    };

    if (role === "donor") {
      newUser.bloodGroup = req.body.bloodGroup;
      newUser.location = req.body.location;
      newUser.medicalHistory = req.body.medicalHistory || [];
      newUser.available = true;

      // Store medical eligibility data from screening form
      if (req.body.medicalInfo) {
        newUser.medicalInfo = {
          age: req.body.medicalInfo.age,
          weight: req.body.medicalInfo.weight,
          lastDonationDate: req.body.medicalInfo.lastDonationDate || null,
          diseases: req.body.medicalInfo.diseases || [],
          recentSurgery: req.body.medicalInfo.recentSurgery || false,
          surgeryDetails: req.body.medicalInfo.surgeryDetails || null,
          recentIllness: req.body.medicalInfo.recentIllness || false,
          illnessDetails: req.body.medicalInfo.illnessDetails || null,
          currentMedications: req.body.medicalInfo.currentMedications || null,
          isPregnantOrNursing:
            req.body.medicalInfo.isPregnantOrNursing || false,
          eligibilityCheckedAt:
            req.body.medicalInfo.eligibilityCheckedAt || new Date(),
          eligible: true,
        };
      }
    }

    if (role === "recipient") {
      newUser.aadhaarNumber = req.body.aadhaarNumber;
    }

    if (role === "hospital") {
      const normalizedLicense = normalizeHospitalLicense(req.body.license);
      newUser.hospitalName = req.body.hospitalName;
      newUser.address = req.body.address;
      newUser.city = req.body.city;
      newUser.license = normalizedLicense;
      newUser.licenseNormalized = normalizedLicense;
    }

    const docRef = await userRef.add(newUser);
    console.log("✅ User registered successfully:", docRef.id);

    res.status(201).json({
      message:
        role === "hospital"
          ? "Hospital registered successfully. License verified."
          : "User registered successfully. Pending admin approval.",
      userId: docRef.id,
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({
      message: "Registration failed",
      error: error.message,
      details: error.toString(),
    });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const db = getDB();
    const userRef = db.collection("users");
    const userSnapshot = await userRef.where("email", "==", email).get();

    if (userSnapshot.empty) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const userDoc = userSnapshot.docs[0];
    const user = userDoc.data();

    // Allow login for both approved and pending users (development mode)
    // In production, enforce approval status if needed
    if (process.env.NODE_ENV === "production" && user.status !== "approved") {
      return res.status(403).json({ message: "User not approved by admin" });
    }

    // Try direct password comparison first (new users with plain text)
    let isPasswordValid = password === user.password;

    // If not valid, try bcrypt comparison for old hashed passwords
    if (!isPasswordValid && user.password.startsWith("$2")) {
      try {
        isPasswordValid = await bcrypt.compare(password, user.password);
      } catch (err) {
        isPasswordValid = false;
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: userDoc.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({
      token,
      user: {
        id: userDoc.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
});

// Migrate password to plain text (for users with hashed passwords)
router.post("/migrate-password", async (req, res) => {
  try {
    const { email, password, newPassword } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const db = getDB();
    const userRef = db.collection("users");
    const userSnapshot = await userRef.where("email", "==", email).get();

    if (userSnapshot.empty) {
      return res.status(401).json({ message: "User not found" });
    }

    const userDoc = userSnapshot.docs[0];
    const user = userDoc.data();

    // Verify old password
    let isPasswordValid = password === user.password;

    if (!isPasswordValid && user.password.startsWith("$2")) {
      try {
        isPasswordValid = await bcrypt.compare(password, user.password);
      } catch (err) {
        isPasswordValid = false;
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Update to plain text password
    const plainPassword = newPassword || password;
    await userRef.doc(userDoc.id).update({
      password: plainPassword,
    });

    res.json({
      message: "Password migrated to plain text successfully",
      password: plainPassword,
    });
  } catch (error) {
    res.status(500).json({ message: "Migration failed", error: error.message });
  }
});

module.exports = router;
