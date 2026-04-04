const express = require("express");
const { getDB } = require("../config/firebase");
const { verifyToken, verifyRole } = require("../middleware/auth");
const donorsRouter = require("./donors");
const {
  generateCertificate,
  generateCertificateFilename,
} = require("../utils/certificateGenerator");
const router = express.Router();

// Get hospital profile
router.get(
  "/profile",
  verifyToken,
  verifyRole(["hospital"]),
  async (req, res) => {
    try {
      const db = getDB();
      const doc = await db.collection("users").doc(req.user.userId).get();

      if (!doc.exists) {
        return res.status(404).json({ message: "Hospital not found" });
      }

      res.json(doc.data());
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching profile", error: error.message });
    }
  },
);

// Get all verified hospitals (public endpoint)
router.get("/list", async (req, res) => {
  try {
    const db = getDB();
    const hospitalsSnapshot = await db
      .collection("users")
      .where("role", "==", "hospital")
      .where("status", "==", "approved")
      .get();

    const hospitals = [];
    hospitalsSnapshot.forEach((doc) => {
      const data = doc.data();
      hospitals.push({
        id: doc.id,
        name: data.hospitalName || "Unknown Hospital",
        location: data.location || "Unknown Location",
        phone: data.phone || "N/A",
        email: data.email || "N/A",
        address: data.address || data.location,
      });
    });

    res.json(hospitals);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching hospitals", error: error.message });
  }
});

// Get hospital dashboard stats from Firebase
router.get(
  "/dashboard-stats",
  verifyToken,
  verifyRole(["hospital"]),
  async (req, res) => {
    try {
      const db = getDB();

      const requestsSnapshot = await db
        .collection("emergencyRequests")
        .where("hospitalId", "==", req.user.userId)
        .get();

      let verifiedPatients = 0;
      let rejectedRequests = 0;

      requestsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.admissionStatus === "admitted") {
          verifiedPatients += 1;
        }
        if (["not-found", "rejected"].includes(data.admissionStatus)) {
          rejectedRequests += 1;
        }
      });

      const donationsSnapshot = await db
        .collection("donations")
        .where("hospitalId", "==", req.user.userId)
        .get();

      let donationsCompleted = 0;
      donationsSnapshot.forEach((doc) => {
        if (doc.data().status === "completed") {
          donationsCompleted += 1;
        }
      });

      res.json({
        verifiedPatients,
        rejectedRequests,
        donationsCompleted,
      });
    } catch (error) {
      res.status(500).json({
        message: "Error fetching dashboard stats",
        error: error.message,
      });
    }
  },
);

// Get pending donations for verification
router.get(
  "/pending-donations",
  verifyToken,
  verifyRole(["hospital"]),
  async (req, res) => {
    try {
      const db = getDB();
      const donationsSnapshot = await db
        .collection("donations")
        .where("hospitalId", "==", req.user.userId)
        .where("status", "==", "pending")
        .get();

      const donations = [];
      donationsSnapshot.forEach((doc) => {
        donations.push({ id: doc.id, ...doc.data() });
      });

      res.json(donations);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching donations", error: error.message });
    }
  },
);

// Get patient verification requests for admission confirmation
router.get(
  "/patient-verification-requests",
  verifyToken,
  verifyRole(["hospital"]),
  async (req, res) => {
    try {
      const db = getDB();
      const hospitalDoc = await db
        .collection("users")
        .doc(req.user.userId)
        .get();
      const hospitalName = hospitalDoc.exists
        ? hospitalDoc.data().hospitalName || "N/A"
        : "N/A";

      const requestsSnapshot = await db
        .collection("emergencyRequests")
        .where("hospitalId", "==", req.user.userId)
        .get();

      const requests = [];
      for (const doc of requestsSnapshot.docs) {
        const data = doc.data();
        let recipientName = "Unknown Recipient";
        let recipientEmail = "N/A";
        let recipientPhone = "N/A";

        if (data.recipientId) {
          const recipientDoc = await db
            .collection("users")
            .doc(data.recipientId)
            .get();
          if (recipientDoc.exists) {
            const recipientData = recipientDoc.data();
            recipientName = recipientData.name || "Unknown Recipient";
            recipientEmail = recipientData.email || "N/A";
            recipientPhone = recipientData.phone || "N/A";
          }
        }

        requests.push({
          id: doc.id,
          requestId: doc.id,
          patientName: data.patientName || "Unknown Patient",
          bloodGroup: data.bloodGroup || "N/A",
          bloodRequirement: data.quantity
            ? `${data.bloodGroup || "N/A"} (${data.quantity} unit${
                data.quantity > 1 ? "s" : ""
              })`
            : data.bloodGroup || "N/A",
          emergencyLevel: data.urgencyLevel || "normal",
          hospitalName,
          admissionStatus: data.admissionStatus || "pending",
          status: data.status,
          recipientId: data.recipientId || "N/A",
          recipientName,
          contactInfo: {
            email: recipientEmail,
            phone: recipientPhone,
          },
          createdAt: data.createdAt,
        });
      }

      // Sort newest first for faster triage
      requests.sort((a, b) => {
        const aTime = a.createdAt?.seconds
          ? a.createdAt.seconds * 1000
          : new Date(a.createdAt || 0).getTime();
        const bTime = b.createdAt?.seconds
          ? b.createdAt.seconds * 1000
          : new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      });

      res.json(requests);
    } catch (error) {
      res.status(500).json({
        message: "Error fetching patient verification requests",
        error: error.message,
      });
    }
  },
);

// Confirm patient admitted
router.post(
  "/patient-verification/:requestId/confirm-admitted",
  verifyToken,
  verifyRole(["hospital"]),
  async (req, res) => {
    try {
      const db = getDB();
      const requestRef = db
        .collection("emergencyRequests")
        .doc(req.params.requestId);
      const requestDoc = await requestRef.get();

      if (!requestDoc.exists) {
        return res.status(404).json({ message: "Request not found" });
      }

      if (requestDoc.data().hospitalId !== req.user.userId) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this request" });
      }

      await requestRef.update({
        admissionStatus: "admitted",
        // Activates request for donor discovery after hospital verification.
        status: "active",
        admittedAt: new Date(),
        updatedAt: new Date(),
      });

      res.json({ message: "Patient marked as admitted" });
    } catch (error) {
      res.status(500).json({
        message: "Error confirming admission",
        error: error.message,
      });
    }
  },
);

// Reject patient verification request (not found)
router.post(
  "/patient-verification/:requestId/reject",
  verifyToken,
  verifyRole(["hospital"]),
  async (req, res) => {
    try {
      const db = getDB();
      const requestRef = db
        .collection("emergencyRequests")
        .doc(req.params.requestId);
      const requestDoc = await requestRef.get();

      if (!requestDoc.exists) {
        return res.status(404).json({ message: "Request not found" });
      }

      if (requestDoc.data().hospitalId !== req.user.userId) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this request" });
      }

      await requestRef.update({
        admissionStatus: "not-found",
        status: "rejected",
        rejectionReason: "not-found",
        updatedAt: new Date(),
      });

      res.json({ message: "Patient request rejected as not found" });
    } catch (error) {
      res.status(500).json({
        message: "Error rejecting request",
        error: error.message,
      });
    }
  },
);

// Verify donation with OTP
router.post(
  "/verify-donation/:donationId",
  verifyToken,
  verifyRole(["hospital"]),
  async (req, res) => {
    try {
      const { otp, donationDetails } = req.body;
      const db = getDB();
      const donationRef = db.collection("donations").doc(req.params.donationId);
      const donationDoc = await donationRef.get();

      if (!donationDoc.exists) {
        return res.status(404).json({ message: "Donation not found" });
      }

      const donationData = donationDoc.data();
      if (
        donationData.hospitalId &&
        donationData.hospitalId !== req.user.userId
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to complete this donation" });
      }

      // Verify OTP (in production, compare with sent OTP)
      if (!otp || otp.length !== 6) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      // Get donor information for certificate
      let donorName = "Generous Donor";
      let donorEmail = "";
      const donorId = donationData.donorId;
      if (donorId) {
        const donorDoc = await db.collection("users").doc(donorId).get();
        if (donorDoc.exists) {
          donorName = donorDoc.data().name || "Generous Donor";
          donorEmail = donorDoc.data().email || "";
        }
      }

      // Get hospital name
      const hospitalDoc = await db
        .collection("users")
        .doc(req.user.userId)
        .get();
      const hospitalName = hospitalDoc.exists
        ? hospitalDoc.data().hospitalName || "Blood Bank"
        : "Blood Bank";

      // Generate certificate
      let certificateData = null;
      try {
        console.log(
          `🎨 Generating certificate for donation ${req.params.donationId}`,
        );
        const certificateImage = await generateCertificate({
          name: donorName,
          bloodGroup: donationData.bloodGroup || "Unknown",
          donationDate: new Date(),
          donationId: req.params.donationId,
          hospitalName: hospitalName,
        });

        if (!certificateImage || certificateImage.length === 0) {
          throw new Error("Certificate image generation returned empty buffer");
        }

        console.log(
          `✅ Certificate image generated: ${certificateImage.length} bytes`,
        );

        // Store certificate in Firestore (as base64 for storage)
        const certificateBase64 = certificateImage.toString("base64");

        if (!certificateBase64 || certificateBase64.length === 0) {
          throw new Error("Failed to convert certificate to base64");
        }

        console.log(
          `📊 Base64 encoded: ${certificateBase64.length} characters`,
        );

        certificateData = {
          donationId: req.params.donationId,
          donorId: donorId,
          certificateGenerated: true,
          certificateUrl: null, // Will be generated via download endpoint
          generatedAt: new Date(),
          donorName: donorName,
        };

        // Store in separate certificates collection
        console.log(
          `💾 Storing certificate in Firestore for donation ${req.params.donationId}...`,
        );
        const certRef = await db
          .collection("certificates")
          .doc(req.params.donationId)
          .set({
            donationId: req.params.donationId,
            donorId: donorId,
            donorName: donorName,
            donorEmail: donorEmail,
            bloodGroup: donationData.bloodGroup,
            hospitalName: hospitalName,
            donationDate: new Date(),
            certificateImage: certificateBase64,
            createdAt: new Date(),
          });

        console.log(
          `✅ Certificate stored in Firestore for donation ${req.params.donationId}`,
        );

        // Verify certificate was stored
        const verifyDoc = await db
          .collection("certificates")
          .doc(req.params.donationId)
          .get();

        if (verifyDoc.exists) {
          const storedData = verifyDoc.data();
          const imageLength = (storedData.certificateImage || "").length;
          if (imageLength > 0) {
            console.log(
              `✅ (VERIFIED) Certificate exists with ${imageLength} characters in base64`,
            );
          } else {
            console.warn(
              `⚠️ Certificate document exists but certificateImage is empty`,
            );
          }
        } else {
          console.warn(`⚠️ Certificate document not found after creation`);
        }
      } catch (certError) {
        console.error("❌ Certificate generation error:", certError.message);
        console.error("Stack:", certError.stack);
        // Don't fail the donation if certificate generation fails
      }

      // Get donor's gender to calculate unavailability period
      const donor = await db.collection("users").doc(donorId).get();
      const donorData = donor.exists ? donor.data() : {};
      const donorGender = donorData.gender || donorData.sex || "male";

      // Calculate unavailability period: 90 days for male, 120 days for female
      const unavailabilityDays =
        donorGender.toLowerCase() === "female" ? 120 : 90;
      const nextAvailableDate = new Date();
      nextAvailableDate.setDate(
        nextAvailableDate.getDate() + unavailabilityDays,
      );

      await donationRef.update({
        status: "completed",
        verifiedAt: new Date(),
        verifiedBy: req.user.userId,
        donationDetails,
        ...certificateData,
      });

      if (donationData.requestId) {
        await db
          .collection("emergencyRequests")
          .doc(donationData.requestId)
          .update({
            status: "completed",
            updatedAt: new Date(),
            completedAt: new Date(),
          });
      }

      // Mark donor as unavailable for 90 days (male) or 120 days (female)
      await db
        .collection("users")
        .doc(donorId)
        .update({
          available: false,
          lastDonatedAt: new Date(),
          nextAvailableDate: nextAvailableDate,
          unavailableReason: `Waiting period after donation (${unavailabilityDays} days for ${donorGender})`,
        });

      // Note: Removed badge update - replaced with certificate system

      res.json({
        message: "Donation verified successfully",
        certificateGenerated: !!certificateData,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error verifying donation", error: error.message });
    }
  },
);

// Get donation history
router.get(
  "/donation-history",
  verifyToken,
  verifyRole(["hospital"]),
  async (req, res) => {
    try {
      const db = getDB();
      const donationsSnapshot = await db
        .collection("donations")
        .where("hospitalId", "==", req.user.userId)
        .orderBy("createdAt", "desc")
        .get();

      const donations = [];
      donationsSnapshot.forEach((doc) => {
        donations.push({ id: doc.id, ...doc.data() });
      });

      res.json(donations);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching history", error: error.message });
    }
  },
);

// Update hospital location with geocoded coordinates
router.post(
  "/update-location",
  verifyToken,
  verifyRole(["hospital"]),
  async (req, res) => {
    try {
      const { address, latitude, longitude, displayName } = req.body;

      if (!address || latitude === undefined || longitude === undefined) {
        return res.status(400).json({
          message: "Address, latitude, and longitude are required",
        });
      }

      if (isNaN(parseFloat(latitude)) || isNaN(parseFloat(longitude))) {
        return res.status(400).json({
          message: "Invalid coordinates",
        });
      }

      const db = getDB();
      const hospitalRef = db.collection("users").doc(req.user.userId);

      await hospitalRef.update({
        address: address || displayName,
        location: displayName || address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        geocodedAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(
        `✅ Hospital location updated: ${address} -> (${latitude}, ${longitude})`,
      );

      res.json({
        message: "Hospital location updated successfully",
        coordinates: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        },
      });
    } catch (error) {
      console.error("Error updating hospital location:", error);
      res.status(500).json({
        message: "Error updating hospital location",
        error: error.message,
      });
    }
  },
);

// Get all verified hospitals with coordinates
router.get("/with-coordinates", async (req, res) => {
  try {
    const db = getDB();
    const hospitalsSnapshot = await db
      .collection("users")
      .where("role", "==", "hospital")
      .where("status", "==", "approved")
      .get();

    const hospitals = [];
    hospitalsSnapshot.forEach((doc) => {
      const data = doc.data();
      hospitals.push({
        id: doc.id,
        name: data.hospitalName || "Unknown Hospital",
        location: data.location || data.address || "Unknown Location",
        address: data.address || data.location,
        phone: data.phone || data.contact || "N/A",
        email: data.email || "N/A",
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        requests: data.requests || [], // Include any associated requests
        contact: data.phone || "N/A",
      });
    });

    console.log(`📍 Retrieved ${hospitals.length} hospitals with coordinates`);

    res.json(hospitals);
  } catch (error) {
    console.error("Error fetching hospitals with coordinates:", error);
    res.status(500).json({
      message: "Error fetching hospitals",
      error: error.message,
    });
  }
});

// Regenerate certificate with new design (for existing old certificates)
router.post(
  "/regenerate-certificate/:donationId",
  verifyToken,
  verifyRole(["hospital"]),
  async (req, res) => {
    try {
      const db = getDB();
      const certRef = db.collection("certificates").doc(req.params.donationId);
      const certDoc = await certRef.get();

      if (!certDoc.exists) {
        return res.status(404).json({ message: "Certificate not found" });
      }

      const certData = certDoc.data();

      // Verify hospital owns this certificate (via donation)
      const donationDoc = await db
        .collection("donations")
        .doc(req.params.donationId)
        .get();

      if (!donationDoc.exists) {
        return res.status(404).json({ message: "Donation not found" });
      }

      if (donationDoc.data().hospitalId !== req.user.userId) {
        return res
          .status(403)
          .json({ message: "Not authorized to regenerate this certificate" });
      }

      // Extract donor info from stored certificate
      const donorInfo = {
        name: certData.donorName,
        bloodGroup: certData.bloodGroup,
        donationDate: certData.donationDate?.toDate?.() || new Date(),
        donationId: req.params.donationId,
        hospitalName: certData.hospitalName,
      };

      console.log(
        `🎨 Regenerating certificate for donation ${req.params.donationId}`,
      );

      // Generate new certificate with updated design
      const certificateImage = await generateCertificate(donorInfo);

      if (!certificateImage || certificateImage.length === 0) {
        throw new Error("Certificate generation returned empty buffer");
      }

      console.log(
        `✅ New certificate generated: ${certificateImage.length} bytes`,
      );

      // Convert to base64
      const certificateBase64 = certificateImage.toString("base64");

      // Update certificate in Firestore
      await certRef.update({
        certificateImage: certificateBase64,
        updatedAt: new Date(),
        regeneratedAt: new Date(),
      });

      console.log(
        `✅ Certificate regenerated and updated in Firestore for ${req.params.donationId}`,
      );

      res.json({
        message: "Certificate successfully regenerated",
        donationId: req.params.donationId,
      });
    } catch (error) {
      console.error("Certificate regeneration error:", error.message);
      res.status(500).json({
        message: "Error regenerating certificate",
        error: error.message,
      });
    }
  },
);

module.exports = router;
