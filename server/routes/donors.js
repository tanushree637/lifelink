const express = require("express");
const { getDB } = require("../config/firebase");
const { verifyToken, verifyRole } = require("../middleware/auth");
const { generateCertificate } = require("../utils/certificateGenerator");
const router = express.Router();

// Badge definitions
const BADGE_MILESTONES = [
  {
    threshold: 1,
    emoji: "🥉",
    title: "First Life Saver",
    description: "Completed your first donation",
  },
  {
    threshold: 5,
    emoji: "🥈",
    title: "5 Donations Hero",
    description: "Completed 5 donations",
  },
  {
    threshold: 10,
    emoji: "🥇",
    title: "10 Donations Champion",
    description: "Completed 10 donations",
  },
  {
    threshold: 25,
    emoji: "🏆",
    title: "25 Donations Legend",
    description: "Completed 25 donations",
  },
];

// Helper: compute earned badges from completed donation count
function computeBadges(completedCount) {
  return BADGE_MILESTONES.filter((b) => completedCount >= b.threshold);
}

// Helper: update badges for a donor in Firestore
async function updateDonorBadges(db, donorId) {
  const donationsSnap = await db
    .collection("donations")
    .where("donorId", "==", donorId)
    .where("status", "==", "completed")
    .get();

  const completedCount = donationsSnap.size;
  const badges = computeBadges(completedCount);

  await db.collection("users").doc(donorId).update({
    badges,
    completedDonations: completedCount,
    badgesUpdatedAt: new Date(),
  });

  return badges;
}

// Get all pending emergency requests (for diagnostics - all statuses)
router.get(
  "/requests/all-pending",
  verifyToken,
  verifyRole(["donor"]),
  async (req, res) => {
    try {
      const db = getDB();

      // Fetch all pending requests regardless of blood group
      const requestsSnapshot = await db
        .collection("emergencyRequests")
        .where("status", "in", [
          "pending-verification",
          "active",
          "donor-assigned",
        ])
        .orderBy("createdAt", "desc")
        .get();

      const requests = [];
      for (const doc of requestsSnapshot.docs) {
        const requestData = doc.data();

        // Get hospital details
        let hospitalName = "Unknown Hospital";
        if (requestData.hospitalId) {
          const hospitalDoc = await db
            .collection("users")
            .doc(requestData.hospitalId)
            .get();
          if (hospitalDoc.exists) {
            hospitalName =
              hospitalDoc.data().hospitalName || "Unknown Hospital";
          }
        }

        requests.push({
          id: doc.id,
          ...requestData,
          hospitalName,
          createdAt: requestData.createdAt?.toDate?.() || requestData.createdAt,
        });
      }

      console.log(
        `📊 Found ${requests.length} total pending requests (all statuses & blood groups)`,
      );
      res.json(requests);
    } catch (error) {
      console.error("Error fetching all pending requests:", error);
      res.status(500).json({
        message: "Error fetching all pending requests",
        error: error.message,
      });
    }
  },
);

// Get donor profile
router.get("/profile", verifyToken, verifyRole(["donor"]), async (req, res) => {
  try {
    const db = getDB();
    const docRef = db.collection("users").doc(req.user.userId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Donor not found" });
    }

    res.json(doc.data());
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching profile", error: error.message });
  }
});

// Update availability status
router.put(
  "/availability",
  verifyToken,
  verifyRole(["donor"]),
  async (req, res) => {
    try {
      const { available } = req.body;
      const db = getDB();

      await db.collection("users").doc(req.user.userId).update({
        available,
        lastUpdated: new Date(),
      });

      res.json({ message: "Availability updated" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error updating availability", error: error.message });
    }
  },
);

// Get nearby emergency requests
router.get(
  "/requests/nearby",
  verifyToken,
  verifyRole(["donor"]),
  async (req, res) => {
    try {
      const db = getDB();
      const donor = await db.collection("users").doc(req.user.userId).get();

      if (!donor.exists) {
        return res.status(404).json({ message: "Donor profile not found" });
      }

      const donorData = donor.data();

      if (!donorData.bloodGroup) {
        return res.status(400).json({
          message:
            "Blood group not set in donor profile. Please update your profile.",
        });
      }

      console.log(
        `🔍 Donor ${req.user.userId} searching for requests with blood group: ${donorData.bloodGroup}`,
      );

      // Fetch emergency requests matching bloodGroup and status active (hospital verified)
      let requestsSnapshot;
      try {
        requestsSnapshot = await db
          .collection("emergencyRequests")
          .where("bloodGroup", "==", donorData.bloodGroup)
          .where("status", "==", "active")
          .orderBy("createdAt", "desc")
          .get();
      } catch (queryError) {
        // If composite index is missing, fall back to fetching all active and filtering in code
        console.warn(
          "⚠️ Composite index missing, using fallback query:",
          queryError.message,
        );

        const allActiveSnapshot = await db
          .collection("emergencyRequests")
          .where("status", "==", "active")
          .get();

        // Filter by blood group in application
        const filtered = [];
        allActiveSnapshot.forEach((doc) => {
          if (doc.data().bloodGroup === donorData.bloodGroup) {
            filtered.push(doc);
          }
        });

        // Create a fake snapshot-like response
        requestsSnapshot = {
          docs: filtered,
        };
      }

      const requests = [];
      for (const doc of requestsSnapshot.docs) {
        const requestData = doc.data();

        // Get hospital details
        let hospitalName = "Unknown Hospital";
        let hospitalLocation = "Unknown Location";
        if (requestData.hospitalId) {
          const hospitalDoc = await db
            .collection("users")
            .doc(requestData.hospitalId)
            .get();
          if (hospitalDoc.exists) {
            hospitalName =
              hospitalDoc.data().hospitalName || "Unknown Hospital";
            hospitalLocation =
              hospitalDoc.data().location || "Unknown Location";
          }
        }

        requests.push({
          id: doc.id,
          ...requestData,
          hospitalName,
          hospitalLocation,
          createdAt: requestData.createdAt?.toDate?.() || requestData.createdAt,
          updatedAt: requestData.updatedAt?.toDate?.() || requestData.updatedAt,
        });
      }

      console.log(
        `✅ Found ${requests.length} active requests for donor blood group ${donorData.bloodGroup}`,
      );
      res.json(requests);
    } catch (error) {
      console.error("❌ Error fetching requests:", error);
      res
        .status(500)
        .json({ message: "Error fetching requests", error: error.message });
    }
  },
);

// Accept donation request
router.post(
  "/accept-request/:requestId",
  verifyToken,
  verifyRole(["donor"]),
  async (req, res) => {
    try {
      const { requestId } = req.params;
      const db = getDB();

      const requestDoc = await db
        .collection("emergencyRequests")
        .doc(requestId)
        .get();

      if (!requestDoc.exists) {
        return res.status(404).json({ message: "Emergency request not found" });
      }

      const requestData = requestDoc.data();
      if (requestData.status !== "active") {
        return res
          .status(400)
          .json({ message: "Request is no longer available" });
      }

      // Create donation record
      const donation = {
        donorId: req.user.userId,
        requestId,
        recipientId: requestData.recipientId || null,
        hospitalId: requestData.hospitalId || null,
        bloodGroup: requestData.bloodGroup || null,
        urgencyLevel: requestData.urgencyLevel || null,
        patientName: requestData.patientName || null,
        status: "pending",
        createdAt: new Date(),
      };

      const docRef = await db.collection("donations").add(donation);

      // Update request
      await db.collection("emergencyRequests").doc(requestId).update({
        assignedDonor: req.user.userId,
        status: "donor-assigned",
        updatedAt: new Date(),
      });

      res.json({ message: "Request accepted", donationId: docRef.id });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error accepting request", error: error.message });
    }
  },
);

// Get donation history
router.get("/history", verifyToken, verifyRole(["donor"]), async (req, res) => {
  try {
    const db = getDB();
    const donationsSnapshot = await db
      .collection("donations")
      .where("donorId", "==", req.user.userId)
      .get();

    const donations = [];
    donationsSnapshot.forEach((doc) => {
      donations.push({ id: doc.id, ...doc.data() });
    });

    // Sort by createdAt in descending order (newest first)
    donations.sort((a, b) => {
      const dateA = a.createdAt?.getTime?.() || 0;
      const dateB = b.createdAt?.getTime?.() || 0;
      return dateB - dateA;
    });

    console.log(
      `📋 Donation history for ${req.user.userId}: ${donations.length} donations found`,
    );
    res.json(donations);
  } catch (error) {
    console.error("Error fetching history:", error);
    res
      .status(500)
      .json({ message: "Error fetching history", error: error.message });
  }
});

// Get donor badges
router.get("/badges", verifyToken, verifyRole(["donor"]), async (req, res) => {
  try {
    const db = getDB();
    const badges = await updateDonorBadges(db, req.user.userId);
    const userDoc = await db.collection("users").doc(req.user.userId).get();
    const completedDonations = userDoc.data().completedDonations || 0;

    // Calculate progress toward next badge
    const nextBadge =
      BADGE_MILESTONES.find((b) => completedDonations < b.threshold) || null;

    res.json({
      badges,
      completedDonations,
      nextBadge,
      allMilestones: BADGE_MILESTONES,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching badges", error: error.message });
  }
});

// Get nearby hospitals with verified blood requests
router.get(
  "/hospitals/nearby",
  verifyToken,
  verifyRole(["donor"]),
  async (req, res) => {
    try {
      const db = getDB();
      const donor = await db.collection("users").doc(req.user.userId).get();

      if (!donor.exists) {
        return res.status(404).json({ message: "Donor profile not found" });
      }

      const donorData = donor.data();

      if (!donorData.bloodGroup) {
        return res.status(400).json({
          message:
            "Blood group not set in donor profile. Please update your profile.",
        });
      }

      // Fetch verified emergency requests (status: active AND admissionStatus: admitted)
      // Then filter by blood group in application code to avoid composite index requirement
      const requestsSnapshot = await db
        .collection("emergencyRequests")
        .where("status", "==", "active")
        .where("admissionStatus", "==", "admitted")
        .get();

      const hospitalsMap = new Map();

      // Aggregate requests by hospital, filter by blood group
      for (const doc of requestsSnapshot.docs) {
        const request = doc.data();

        // Filter by blood group in application code
        if (request.bloodGroup !== donorData.bloodGroup) {
          continue;
        }

        const hospitalId = request.hospitalId;

        if (hospitalId) {
          // Get hospital details
          const hospitalDoc = await db
            .collection("users")
            .doc(hospitalId)
            .get();

          if (hospitalDoc.exists) {
            const hospitalData = hospitalDoc.data();
            const key = hospitalId;

            if (!hospitalsMap.has(key)) {
              hospitalsMap.set(key, {
                id: hospitalId,
                name: hospitalData.hospitalName || "Unknown Hospital",
                location: hospitalData.location || "Unknown Location",
                latitude:
                  hospitalData.latitude ||
                  parseFloat(hospitalData.location?.split(",")[0]) ||
                  0,
                longitude:
                  hospitalData.longitude ||
                  parseFloat(hospitalData.location?.split(",")[1]) ||
                  0,
                contact: hospitalData.phone || "N/A",
                email: hospitalData.email || "N/A",
                requests: [],
              });
            }

            hospitalsMap.get(key).requests.push({
              requestId: doc.id,
              patientName: request.patientName || "Unknown Patient",
              bloodGroup: request.bloodGroup,
              quantity: request.quantity || 1,
              urgencyLevel: request.urgencyLevel || "normal",
              createdAt: request.createdAt,
            });
          }
        }
      }

      const hospitals = Array.from(hospitalsMap.values());
      console.log(
        `✅ Found ${hospitals.length} hospitals with verified requests for donor blood group ${donorData.bloodGroup}`,
      );
      res.json(hospitals);
    } catch (error) {
      console.error("Error fetching nearby hospitals:", error);
      res.status(500).json({
        message: "Error fetching nearby hospitals",
        error: error.message,
      });
    }
  },
);

// Get all pending emergency requests (not yet fulfilled)
router.get(
  "/requests/pending",
  verifyToken,
  verifyRole(["donor"]),
  async (req, res) => {
    try {
      const db = getDB();
      const { status } = req.query; // Optional: filter by specific status

      let query = db.collection("emergencyRequests");

      // Filter by status if provided, otherwise get all pending (non-completed)
      if (status) {
        query = query.where("status", "==", status);
      } else {
        // Get all non-completed requests (pending-verification, active, donor-assigned)
        query = query.where("status", "in", [
          "pending-verification",
          "active",
          "donor-assigned",
        ]);
      }

      const requestsSnapshot = await query.orderBy("createdAt", "desc").get();

      const requests = [];
      for (const doc of requestsSnapshot.docs) {
        const requestData = doc.data();

        // Get hospital details
        let hospitalName = "Unknown Hospital";
        if (requestData.hospitalId) {
          const hospitalDoc = await db
            .collection("users")
            .doc(requestData.hospitalId)
            .get();
          if (hospitalDoc.exists) {
            hospitalName =
              hospitalDoc.data().hospitalName || "Unknown Hospital";
          }
        }

        requests.push({
          id: doc.id,
          ...requestData,
          hospitalName,
          createdAt: requestData.createdAt?.toDate?.() || requestData.createdAt,
          updatedAt: requestData.updatedAt?.toDate?.() || requestData.updatedAt,
        });
      }

      console.log(
        `✅ Found ${requests.length} pending emergency requests${status ? ` with status: ${status}` : ""}`,
      );
      res.json(requests);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      res.status(500).json({
        message: "Error fetching pending requests",
        error: error.message,
      });
    }
  },
);

// Get donor certificates (certificates from completed donations)
router.get(
  "/certificates",
  verifyToken,
  verifyRole(["donor"]),
  async (req, res) => {
    try {
      const db = getDB();
      const donorId = req.user.userId;

      // Get all donations for this donor (simpler query without composite index)
      const donationsSnapshot = await db
        .collection("donations")
        .where("donorId", "==", donorId)
        .get();

      // Filter for completed donations and sort by createdAt in memory
      const completedDonations = donationsSnapshot.docs
        .filter((doc) => doc.data().status === "completed")
        .sort((a, b) => {
          // Handle Firestore Timestamps and Date objects
          const getTime = (timestamp) => {
            if (!timestamp) return 0;
            if (timestamp.toDate && typeof timestamp.toDate === "function") {
              // Firestore Timestamp
              return timestamp.toDate().getTime();
            } else if (timestamp instanceof Date) {
              return timestamp.getTime();
            } else if (typeof timestamp === "number") {
              return timestamp;
            }
            return 0;
          };

          const dateA = getTime(a.data().createdAt);
          const dateB = getTime(b.data().createdAt);
          return dateB - dateA; // Descending order
        });

      const certificates = [];
      for (const donDoc of completedDonations) {
        // Try to get certificate for this donation
        try {
          const certDoc = await db
            .collection("certificates")
            .doc(donDoc.id)
            .get();
          if (certDoc.exists) {
            const certData = certDoc.data();
            certificates.push({
              donationId: donDoc.id,
              ...certData,
              downloadUrl: `/api/donors/certificate/${donDoc.id}/download`,
            });
          }
        } catch (err) {
          console.error(
            `❌ Error fetching certificate for donation ${donDoc.id}:`,
            err.message,
          );
        }
      }

      console.log(
        `✅ Fetched ${certificates.length} certificates for donor ${donorId}`,
      );
      res.json(certificates);
    } catch (error) {
      console.error("❌ Error fetching certificates:", error);
      res.status(500).json({
        message: "Error fetching certificates",
        error: error.message,
      });
    }
  },
);

// Download certificate image
router.get(
  "/certificate/:donationId/download",
  verifyToken,
  verifyRole(["donor"]),
  async (req, res) => {
    try {
      const db = getDB();
      const { donationId } = req.params;
      const donorId = req.user.userId;

      console.log(
        `📥 Download request for certificate ${donationId} by donor ${donorId}`,
      );

      // Get certificate metadata to verify ownership
      const certDoc = await db.collection("certificates").doc(donationId).get();

      if (!certDoc.exists) {
        console.warn(`⚠️ Certificate not found: ${donationId}`);
        return res.status(404).json({ message: "Certificate not found" });
      }

      const certData = certDoc.data();

      // Verify donor owns this certificate
      if (certData.donorId !== donorId) {
        console.warn(
          `⚠️ Unauthorized download attempt: ${donorId} tried to download ${donationId}`,
        );
        return res
          .status(403)
          .json({ message: "Not authorized to download this certificate" });
      }

      // Get donation information
      const donationDoc = await db
        .collection("donations")
        .doc(donationId)
        .get();

      if (!donationDoc.exists) {
        console.warn(`⚠️ Donation record not found: ${donationId}`);
        return res.status(404).json({ message: "Donation record not found" });
      }

      const donationData = donationDoc.data();

      // Get donor information
      const donorDoc = await db.collection("users").doc(donorId).get();

      if (!donorDoc.exists) {
        console.warn(`⚠️ User/Donor record not found: ${donorId}`);
        return res.status(404).json({ message: "Donor record not found" });
      }

      const donorData = donorDoc.data();

      // Get hospital information
      let hospitalName = "Blood Bank";
      if (donationData.hospitalId) {
        const hospitalDoc = await db
          .collection("hospitals")
          .doc(donationData.hospitalId)
          .get();
        if (hospitalDoc.exists) {
          hospitalName = hospitalDoc.data().hospitalName || "Blood Bank";
        }
      }

      // Generate fresh certificate with updated JPG layout
      console.log(`🎨 Regenerating JPG certificate for donation ${donationId}`);
      const jpgBuffer = await generateCertificate({
        name: donorData.name,
        bloodGroup: donationData.bloodGroup || "Unknown",
        donationDate: new Date(),
        donationId: donationId,
        hospitalName: hospitalName,
      });

      if (!jpgBuffer || jpgBuffer.length === 0) {
        throw new Error("Certificate generation returned empty buffer");
      }

      console.log(
        `✅ Sending regenerated JPG certificate ${donationId} to donor ${donorId}`,
      );

      // Send JPG file
      res.set({
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename="certificate_${donationId}.jpg"`,
        "Content-Length": jpgBuffer.length,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      });

      return res.end(jpgBuffer);
    } catch (error) {
      console.error("❌ Error downloading certificate:", error);
      res.status(500).json({
        message: "Error downloading certificate",
        error: error.message,
      });
    }
  },
);

// Export helper so hospital route can use it
router.updateDonorBadges = updateDonorBadges;

module.exports = router;
