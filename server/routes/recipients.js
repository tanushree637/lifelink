const express = require("express");
const { getDB } = require("../config/firebase");
const { verifyToken, verifyRole } = require("../middleware/auth");
const router = express.Router();

// Create emergency request
router.post(
  "/emergency-request",
  verifyToken,
  verifyRole(["recipient"]),
  async (req, res) => {
    try {
      const { hospitalId, bloodGroup, urgencyLevel, quantity, patientName } =
        req.body;

      if (!bloodGroup || !urgencyLevel || !hospitalId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const db = getDB();
      const emergencyRequest = {
        recipientId: req.user.userId,
        hospitalId,
        bloodGroup,
        urgencyLevel,
        quantity: quantity || 1,
        patientName,
        // Hospital must verify admission first; only then request becomes active for donors.
        status: "pending-verification",
        admissionStatus: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await db
        .collection("emergencyRequests")
        .add(emergencyRequest);

      res.status(201).json({
        message: "Emergency request created",
        requestId: docRef.id,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error creating request", error: error.message });
    }
  },
);

// Get request status
router.get(
  "/request/:requestId",
  verifyToken,
  verifyRole(["recipient"]),
  async (req, res) => {
    try {
      const db = getDB();
      const doc = await db
        .collection("emergencyRequests")
        .doc(req.params.requestId)
        .get();

      if (!doc.exists) {
        return res.status(404).json({ message: "Request not found" });
      }

      res.json({ id: doc.id, ...doc.data() });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching request", error: error.message });
    }
  },
);

// Get recipient's requests
router.get(
  "/my-requests",
  verifyToken,
  verifyRole(["recipient"]),
  async (req, res) => {
    try {
      const db = getDB();
      console.log("📋 Fetching requests for user:", req.user.userId);

      // Try with orderBy first
      let requestsSnapshot;
      try {
        requestsSnapshot = await db
          .collection("emergencyRequests")
          .where("recipientId", "==", req.user.userId)
          .orderBy("createdAt", "desc")
          .get();
      } catch (orderError) {
        // If orderBy fails (missing index), fetch without ordering
        console.log(
          "⚠️ OrderBy failed, fetching without ordering:",
          orderError.message,
        );
        requestsSnapshot = await db
          .collection("emergencyRequests")
          .where("recipientId", "==", req.user.userId)
          .get();
      }

      const requests = [];
      for (const doc of requestsSnapshot.docs) {
        const data = doc.data();

        // Get hospital details
        let hospitalName = "Unknown Hospital";
        if (data.hospitalId) {
          const hospitalDoc = await db
            .collection("users")
            .doc(data.hospitalId)
            .get();
          if (hospitalDoc.exists) {
            hospitalName =
              hospitalDoc.data().hospitalName || "Unknown Hospital";
          }
        }

        requests.push({
          id: doc.id,
          ...data,
          hospitalName,
          // Convert Firestore Timestamp to ISO string if needed
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        });
      }

      // Sort by createdAt in JavaScript if not already sorted
      requests.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });

      console.log(
        `✅ Found ${requests.length} requests for user ${req.user.userId}`,
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

// Cancel request
router.put(
  "/request/:requestId/cancel",
  verifyToken,
  verifyRole(["recipient"]),
  async (req, res) => {
    try {
      const db = getDB();
      await db
        .collection("emergencyRequests")
        .doc(req.params.requestId)
        .update({
          status: "cancelled",
          updatedAt: new Date(),
        });

      res.json({ message: "Request cancelled" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error cancelling request", error: error.message });
    }
  },
);

// Search donors by blood group (and optional location)
router.get(
  "/search-donors",
  verifyToken,
  verifyRole(["recipient"]),
  async (req, res) => {
    try {
      const { bloodGroup, location } = req.query;
      if (!bloodGroup) {
        return res
          .status(400)
          .json({ message: "bloodGroup query param required" });
      }

      const db = getDB();
      let query = db
        .collection("users")
        .where("role", "==", "donor")
        .where("bloodGroup", "==", bloodGroup)
        .where("available", "==", true);

      const snapshot = await query.get();
      const donors = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        // if location filter provided, do a simple substring match on location field
        if (
          !location ||
          (data.location &&
            data.location.toLowerCase().includes(location.toLowerCase()))
        ) {
          donors.push({
            id: doc.id,
            name: data.name,
            bloodGroup: data.bloodGroup,
            location: data.location,
            phone: data.phone,
          });
        }
      });

      console.log(`🔍 Found ${donors.length} donors, sample:`, donors[0]);
      res.json(donors);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error searching donors", error: error.message });
    }
  },
);

// Get count of available donors
router.get(
  "/available-donors-count",
  verifyToken,
  verifyRole(["recipient"]),
  async (req, res) => {
    try {
      const db = getDB();
      const snapshot = await db
        .collection("users")
        .where("role", "==", "donor")
        .where("available", "==", true)
        .get();

      const count = snapshot.size;
      console.log(`👥 Available donors count: ${count}`);
      res.json({ count });
    } catch (error) {
      console.error("❌ Error fetching donors count:", error);
      res
        .status(500)
        .json({ message: "Error fetching donors count", error: error.message });
    }
  },
);

module.exports = router;
