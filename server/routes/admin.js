const express = require("express");
const { getDB } = require("../config/firebase");
const { verifyToken, verifyRole } = require("../middleware/auth");
const { generateCertificate } = require("../utils/certificateGenerator");
const router = express.Router();

// Get pending users for approval
router.get(
  "/pending-users",
  verifyToken,
  verifyRole(["admin"]),
  async (req, res) => {
    try {
      const db = getDB();
      const usersSnapshot = await db
        .collection("users")
        .where("status", "==", "pending")
        .get();

      const users = [];
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        delete userData.password;
        users.push({ id: doc.id, ...userData });
      });

      res.json(users);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching users", error: error.message });
    }
  },
);

// Approve user
router.post(
  "/approve-user/:userId",
  verifyToken,
  verifyRole(["admin"]),
  async (req, res) => {
    try {
      const db = getDB();
      await db.collection("users").doc(req.params.userId).update({
        status: "approved",
        approvedAt: new Date(),
        approvedBy: req.user.userId,
      });

      res.json({ message: "User approved successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error approving user", error: error.message });
    }
  },
);

// Reject user
router.post(
  "/reject-user/:userId",
  verifyToken,
  verifyRole(["admin"]),
  async (req, res) => {
    try {
      const { reason } = req.body;
      const db = getDB();

      // Fetch user details before rejecting
      const userDoc = await db.collection("users").doc(req.params.userId).get();
      const userData = userDoc.exists ? userDoc.data() : {};

      await db.collection("users").doc(req.params.userId).update({
        status: "rejected",
        rejectionReason: reason,
        rejectedAt: new Date(),
        rejectedBy: req.user.userId,
      });

      // Log rejected user to suspicious activity
      await db.collection("suspiciousActivity").add({
        type: "User Rejected",
        description: `${userData.name || "Unknown"} (${userData.email || "N/A"}) — Role: ${userData.role || "N/A"}${reason ? ". Reason: " + reason : ""}`,
        userId: req.params.userId,
        flaggedAt: new Date(),
      });

      res.json({ message: "User rejected" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error rejecting user", error: error.message });
    }
  },
);

// Sync already-rejected users into suspiciousActivity (backfill)
router.post(
  "/sync-rejected-users",
  verifyToken,
  verifyRole(["admin"]),
  async (req, res) => {
    try {
      const db = getDB();

      // Get all rejected users
      const rejectedSnapshot = await db
        .collection("users")
        .where("status", "==", "rejected")
        .get();

      if (rejectedSnapshot.empty) {
        return res.json({ message: "No rejected users to sync", synced: 0 });
      }

      // Get existing suspicious activity entries that are "User Rejected"
      const existingSnapshot = await db
        .collection("suspiciousActivity")
        .where("type", "==", "User Rejected")
        .get();

      const existingUserIds = new Set();
      existingSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.userId) existingUserIds.add(data.userId);
      });

      // Add missing rejected users to suspiciousActivity
      const batch = db.batch();
      let syncCount = 0;

      rejectedSnapshot.forEach((doc) => {
        if (!existingUserIds.has(doc.id)) {
          const userData = doc.data();
          const activityRef = db.collection("suspiciousActivity").doc();
          batch.set(activityRef, {
            type: "User Rejected",
            description: `${userData.name || "Unknown"} (${userData.email || "N/A"}) — Role: ${userData.role || "N/A"}${userData.rejectionReason ? ". Reason: " + userData.rejectionReason : ""}`,
            userId: doc.id,
            flaggedAt: userData.rejectedAt || new Date(),
          });
          syncCount++;
        }
      });

      if (syncCount > 0) {
        await batch.commit();
      }

      res.json({
        message: `Synced ${syncCount} rejected user(s)`,
        synced: syncCount,
      });
    } catch (error) {
      res.status(500).json({
        message: "Error syncing rejected users",
        error: error.message,
      });
    }
  },
);

// Monitor suspicious activity
router.get(
  "/suspicious-activity",
  verifyToken,
  verifyRole(["admin"]),
  async (req, res) => {
    try {
      const db = getDB();
      const activitiesSnapshot = await db
        .collection("suspiciousActivity")
        .orderBy("flaggedAt", "desc")
        .limit(50)
        .get();

      const activities = [];
      activitiesSnapshot.forEach((doc) => {
        activities.push({ id: doc.id, ...doc.data() });
      });

      res.json(activities);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching activities", error: error.message });
    }
  },
);

// Get system statistics
router.get(
  "/statistics",
  verifyToken,
  verifyRole(["admin"]),
  async (req, res) => {
    try {
      const db = getDB();

      const usersSnapshot = await db.collection("users").get();
      const donationsSnapshot = await db.collection("donations").get();
      const requestsSnapshot = await db.collection("emergencyRequests").get();

      res.json({
        totalUsers: usersSnapshot.size,
        totalDonations: donationsSnapshot.size,
        totalRequests: requestsSnapshot.size,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching statistics", error: error.message });
    }
  },
);

// Regenerate all certificates with updated template
router.post(
  "/regenerate-certificates",
  verifyToken,
  verifyRole(["admin"]),
  async (req, res) => {
    try {
      const db = getDB();
      let regeneratedCount = 0;
      let errorCount = 0;

      console.log(
        "🔄 Starting certificate regeneration for all completed donations...",
      );

      // Get all completed donations
      const donationsSnapshot = await db
        .collection("donations")
        .where("status", "==", "completed")
        .get();

      console.log(
        `📊 Found ${donationsSnapshot.size} completed donations to process`,
      );

      // Process each completed donation
      for (const donDoc of donationsSnapshot.docs) {
        try {
          const donationData = donDoc.data();
          const donationId = donDoc.id;
          const donorId = donationData.donorId;

          // Get donor details
          const donorDoc = await db.collection("users").doc(donorId).get();
          const donorData = donorDoc.exists ? donorDoc.data() : {};

          // Get hospital details
          const hospitalDoc = await db
            .collection("users")
            .doc(donationData.hospitalId)
            .get();
          const hospitalData = hospitalDoc.exists ? hospitalDoc.data() : {};

          // Generate new certificate with updated JPG template
          console.log(
            `🎨 Regenerating JPG certificate for donation ${donationId}...`,
          );
          const jpgBuffer = await generateCertificate({
            name: donorData.name || "Generous Donor",
            bloodGroup: donationData.bloodGroup || "Unknown",
            donationDate: new Date(donationData.createdAt || Date.now()),
            donationId: donationId,
            hospitalName: hospitalData.hospitalName || "LifeLink Blood Bank",
          });

          if (!jpgBuffer || jpgBuffer.length === 0) {
            throw new Error("Certificate generation returned empty buffer");
          }

          // Convert to base64 for storage
          const certificateBase64 = jpgBuffer.toString("base64");

          // Update certificate in Firestore
          await db
            .collection("certificates")
            .doc(donationId)
            .set({
              donationId: donationId,
              donorId: donorId,
              donorName: donorData.name || "Generous Donor",
              donorEmail: donorData.email || "",
              bloodGroup: donationData.bloodGroup || "Unknown",
              hospitalName: hospitalData.hospitalName || "Blood Bank",
              donationDate: new Date(donationData.createdAt || Date.now()),
              certificateImage: certificateBase64,
              createdAt: new Date(),
              regeneratedAt: new Date(),
              regeneratedByAdmin: true,
            });

          console.log(`✅ Certificate regenerated for donation ${donationId}`);
          regeneratedCount++;
        } catch (err) {
          console.error(
            `❌ Error regenerating certificate for donation ${donDoc.id}:`,
            err.message,
          );
          errorCount++;
        }
      }

      const message = `✅ Certificate regeneration complete! Regenerated: ${regeneratedCount}, Errors: ${errorCount}`;
      console.log(message);

      res.json({
        message,
        regeneratedCount,
        errorCount,
        totalProcessed: donationsSnapshot.size,
      });
    } catch (error) {
      console.error("❌ Error in bulk certificate regeneration:", error);
      res.status(500).json({
        message: "Error regenerating certificates",
        error: error.message,
      });
    }
  },
);

// Public endpoint to regenerate certificates (with secret key)
router.post("/regenerate-certificates-now", async (req, res) => {
  try {
    const secretKey = req.headers["x-admin-secret"] || req.body.secret;
    const adminSecret = process.env.ADMIN_SECRET || "admin123";

    if (secretKey !== adminSecret) {
      return res.status(403).json({ message: "Invalid or missing secret key" });
    }

    const db = getDB();
    let regeneratedCount = 0;
    let errorCount = 0;
    const errors = [];

    console.log(
      "🔄 Starting certificate regeneration for all completed donations...",
    );

    // Get all completed donations
    const donationsSnapshot = await db
      .collection("donations")
      .where("status", "==", "completed")
      .get();

    console.log(
      `📊 Found ${donationsSnapshot.size} completed donations to process`,
    );

    // Process each completed donation
    for (const donDoc of donationsSnapshot.docs) {
      try {
        const donationData = donDoc.data();
        const donationId = donDoc.id;
        const donorId = donationData.donorId;

        // Get donor details
        const donorDoc = await db.collection("users").doc(donorId).get();
        const donorData = donorDoc.exists ? donorDoc.data() : {};

        // Get hospital details
        const hospitalDoc = await db
          .collection("users")
          .doc(donationData.hospitalId)
          .get();
        const hospitalData = hospitalDoc.exists ? hospitalDoc.data() : {};

        // Generate new certificate with updated JPG template
        console.log(
          `🎨 Regenerating JPG certificate for donation ${donationId}...`,
        );

        // Safely convert donation date
        let safeDonationDate = new Date();
        if (donationData.createdAt) {
          if (
            donationData.createdAt.toDate &&
            typeof donationData.createdAt.toDate === "function"
          ) {
            safeDonationDate = donationData.createdAt.toDate();
          } else if (donationData.createdAt instanceof Date) {
            safeDonationDate = donationData.createdAt;
          } else if (typeof donationData.createdAt === "number") {
            safeDonationDate = new Date(donationData.createdAt);
          }
        }

        const jpgBuffer = await generateCertificate({
          name: donorData.name || "Generous Donor",
          bloodGroup: donationData.bloodGroup || "Unknown",
          donationDate: safeDonationDate,
          donationId: donationId,
          hospitalName: hospitalData.hospitalName || "LifeLink Blood Bank",
        });

        if (!jpgBuffer || jpgBuffer.length === 0) {
          throw new Error("Certificate generation returned empty buffer");
        }

        // Convert to base64 for storage
        const certificateBase64 = jpgBuffer.toString("base64");

        // Update certificate in Firestore
        await db
          .collection("certificates")
          .doc(donationId)
          .set({
            donationId: donationId,
            donorId: donorId,
            donorName: donorData.name || "Generous Donor",
            donorEmail: donorData.email || "",
            bloodGroup: donationData.bloodGroup || "Unknown",
            hospitalName: hospitalData.hospitalName || "Blood Bank",
            donationDate: safeDonationDate,
            certificateImage: certificateBase64,
            format: "jpg",
            createdAt: new Date(),
            regeneratedAt: new Date(),
            regeneratedByAdmin: true,
          });

        console.log(
          `✅ JPG Certificate regenerated for donation ${donationId}`,
        );
        regeneratedCount++;
      } catch (err) {
        console.error(
          `❌ Error regenerating certificate for donation ${donDoc.id}:`,
          err.message,
        );
        errors.push({
          donationId: donDoc.id,
          error: err.message,
        });
        errorCount++;
      }
    }

    const message = `✅ Certificate regeneration complete! Regenerated: ${regeneratedCount}, Errors: ${errorCount}`;
    console.log(message);

    res.json({
      message,
      regeneratedCount,
      errorCount,
      totalProcessed: donationsSnapshot.size,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("❌ Error in bulk certificate regeneration:", error);
    res.status(500).json({
      message: "Error regenerating certificates",
      error: error.message,
    });
  }
});

// Get detailed analytics for reports
router.get(
  "/analytics",
  verifyToken,
  verifyRole(["admin"]),
  async (req, res) => {
    try {
      const db = getDB();
      const { timeRange = "30" } = req.query; // 7, 30, 365 or 0 for all
      const days = timeRange === "0" ? 36500 : parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get donors
      const donorsSnapshot = await db
        .collection("users")
        .where("role", "==", "donor")
        .where("status", "==", "approved")
        .get();
      const totalDonors = donorsSnapshot.size;

      // Get all donations with dates
      const donationsSnapshot = await db.collection("donations").get();
      const allDonations = [];
      donationsSnapshot.forEach((doc) => {
        const data = doc.data();
        allDonations.push({
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
        });
      });

      // Filter by time range
      const donations = allDonations.filter((d) => d.createdAt >= startDate);
      const completedDonations = allDonations.filter(
        (d) => d.status === "completed" && d.createdAt >= startDate,
      );
      const totalDonations = donations.length;

      // Get all requests with dates
      const requestsSnapshot = await db.collection("emergencyRequests").get();
      const allRequests = [];
      requestsSnapshot.forEach((doc) => {
        const data = doc.data();
        allRequests.push({
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
        });
      });

      // Filter by time range
      const requests = allRequests.filter((r) => r.createdAt >= startDate);
      const fulfilledRequests = requests.filter(
        (r) => r.status === "fulfilled",
      );
      const totalRequests = requests.length;

      // Calculate success rate
      const successRate =
        totalRequests > 0
          ? Math.round((fulfilledRequests.length / totalRequests) * 100)
          : 0;

      // Build monthly trend data
      const monthlyData = {};
      donations.forEach((d) => {
        const month = d.createdAt.toLocaleString("default", {
          month: "short",
          year: "2-digit",
        });
        monthlyData[month] = (monthlyData[month] || 0) + 1;
      });

      // Get last 6 months
      const trendsArray = [];
      const today = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const month = date.toLocaleString("default", {
          month: "short",
          year: "2-digit",
        });
        trendsArray.push({
          month,
          donations: monthlyData[month] || 0,
        });
      }

      // Blood group distribution
      const bloodGroupMap = {};
      completedDonations.forEach((d) => {
        const bg = d.bloodGroup || "Unknown";
        bloodGroupMap[bg] = (bloodGroupMap[bg] || 0) + 1;
      });

      const bloodGroupData = Object.entries(bloodGroupMap).map(
        ([group, count]) => ({
          name: group,
          value: count,
        }),
      );

      // City-wise distribution (from hospital city data)
      const cityMap = {};
      allDonations.forEach((d) => {
        if (d.city) {
          cityMap[d.city] = (cityMap[d.city] || 0) + 1;
        }
      });

      const cityData = Object.entries(cityMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([city, count]) => ({
          city,
          donations: count,
        }));

      // Calculate most requested blood group in requests
      const requestedBloodMap = {};
      requests.forEach((r) => {
        const bg = r.bloodGroup || "Unknown";
        requestedBloodMap[bg] = (requestedBloodMap[bg] || 0) + 1;
      });

      const mostRequestedBlood = Object.entries(requestedBloodMap).sort(
        ([, a], [, b]) => b - a,
      )[0];

      // Most active city
      const mostActiveCity = Object.entries(cityMap).sort(
        ([, a], [, b]) => b - a,
      )[0];

      return res.json({
        totalDonors,
        totalDonations,
        totalRequests,
        completedRequests: fulfilledRequests.length,
        successRate,
        trendsData: trendsArray,
        bloodGroupData,
        cityData,
        insights: {
          mostRequestedBlood: mostRequestedBlood
            ? `${mostRequestedBlood[0]} (${mostRequestedBlood[1]} requests)`
            : "No data",
          mostActiveCity: mostActiveCity
            ? `${mostActiveCity[0]} (${mostActiveCity[1]} donations)`
            : "No data",
          fulfillmentRate: `${successRate}%`,
        },
      });
    } catch (error) {
      res.status(500).json({
        message: "Error fetching analytics",
        error: error.message,
      });
    }
  },
);

// Get all users with optional filtering
router.get(
  "/all-users",
  verifyToken,
  verifyRole(["admin"]),
  async (req, res) => {
    try {
      const db = getDB();
      const { role, status } = req.query;

      let query = db.collection("users");

      // Apply filters
      if (role && role !== "all") {
        query = query.where("role", "==", role);
      }
      if (status && status !== "all") {
        query = query.where("status", "==", status);
      }

      const usersSnapshot = await query.get();
      const users = [];

      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        delete userData.password;
        users.push({
          id: doc.id,
          ...userData,
          createdAt: userData.createdAt?.toDate?.() || userData.createdAt,
          approvedAt: userData.approvedAt?.toDate?.() || userData.approvedAt,
          rejectedAt: userData.rejectedAt?.toDate?.() || userData.rejectedAt,
        });
      });

      res.json(users);
    } catch (error) {
      res.status(500).json({
        message: "Error fetching users",
        error: error.message,
      });
    }
  },
);

// Block/Unblock a user
router.put(
  "/block-user/:userId",
  verifyToken,
  verifyRole(["admin"]),
  async (req, res) => {
    try {
      const db = getDB();
      const { block } = req.body;

      await db
        .collection("users")
        .doc(req.params.userId)
        .update({
          isBlocked: block === true,
          blockedAt: block === true ? new Date() : null,
          blockedBy: block === true ? req.user.userId : null,
        });

      res.json({
        message: block
          ? "User blocked successfully"
          : "User unblocked successfully",
      });
    } catch (error) {
      res.status(500).json({
        message: "Error updating user block status",
        error: error.message,
      });
    }
  },
);

// Get all blood requests for monitoring
router.get(
  "/blood-requests",
  verifyToken,
  verifyRole(["admin"]),
  async (req, res) => {
    try {
      const db = getDB();
      const { status, urgency } = req.query;

      let query = db.collection("emergencyRequests");

      // Apply filters
      if (status && status !== "all") {
        query = query.where("status", "==", status);
      }
      if (urgency && urgency !== "all") {
        query = query.where("urgencyLevel", "==", urgency);
      }

      const requestsSnapshot = await query.orderBy("createdAt", "desc").get();
      const requests = [];

      // Fetch request details with user and hospital info
      for (const doc of requestsSnapshot.docs) {
        const requestData = doc.data();

        // Get recipient details
        const recipientDoc = await db
          .collection("users")
          .doc(requestData.recipientId)
          .get();
        const recipientData = recipientDoc.exists ? recipientDoc.data() : {};

        // Get hospital details
        const hospitalDoc = await db
          .collection("users")
          .doc(requestData.hospitalId)
          .get();
        const hospitalData = hospitalDoc.exists ? hospitalDoc.data() : {};

        requests.push({
          id: doc.id,
          ...requestData,
          recipientName: recipientData.name || "Unknown",
          recipientEmail: recipientData.email,
          hospitalName: hospitalData.hospitalName || "Unknown Hospital",
          hospitalCity: hospitalData.location,
          createdAt:
            requestData.createdAt?.toDate?.() ||
            new Date(requestData.createdAt),
          updatedAt:
            requestData.updatedAt?.toDate?.() ||
            new Date(requestData.updatedAt),
        });
      }

      res.json(requests);
    } catch (error) {
      res.status(500).json({
        message: "Error fetching blood requests",
        error: error.message,
      });
    }
  },
);

// Update blood request status
router.put(
  "/blood-request/:requestId/status",
  verifyToken,
  verifyRole(["admin"]),
  async (req, res) => {
    try {
      const db = getDB();
      const { status } = req.body;

      const validStatuses = [
        "pending",
        "pending-verification",
        "fulfilled",
        "cancelled",
        "invalid",
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      await db
        .collection("emergencyRequests")
        .doc(req.params.requestId)
        .update({
          status,
          updatedAt: new Date(),
          updatedBy: req.user.userId,
        });

      res.json({ message: "Request status updated successfully" });
    } catch (error) {
      res.status(500).json({
        message: "Error updating request status",
        error: error.message,
      });
    }
  },
);

// Reject invalid blood request
router.put(
  "/blood-request/:requestId/reject",
  verifyToken,
  verifyRole(["admin"]),
  async (req, res) => {
    try {
      const db = getDB();
      const { reason } = req.body;

      await db
        .collection("emergencyRequests")
        .doc(req.params.requestId)
        .update({
          status: "invalid",
          rejectionReason: reason || "Invalid request",
          rejectedAt: new Date(),
          rejectedBy: req.user.userId,
        });

      res.json({ message: "Request rejected successfully" });
    } catch (error) {
      res.status(500).json({
        message: "Error rejecting request",
        error: error.message,
      });
    }
  },
);

// Get comprehensive system alerts
router.get(
  "/system-alerts",
  verifyToken,
  verifyRole(["admin"]),
  async (req, res) => {
    try {
      const db = getDB();
      const alerts = [];

      // 1. Invalid Aadhaar entries
      const usersSnapshot = await db.collection("users").get();
      const invalidAadhaarUsers = [];
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        // Check if Aadhaar is invalid format (simple check)
        if (data.aadhaarNumber && data.aadhaarNumber.length !== 12) {
          invalidAadhaarUsers.push({
            id: doc.id,
            name: data.name,
            email: data.email,
            aadhaar: data.aadhaarNumber,
            role: data.role,
            flaggedAt: new Date(),
          });
        }
      });

      if (invalidAadhaarUsers.length > 0) {
        alerts.push({
          type: "Invalid Aadhaar",
          severity: "warning",
          icon: "📋",
          count: invalidAadhaarUsers.length,
          message: `${invalidAadhaarUsers.length} user(s) with invalid Aadhaar format`,
          details: invalidAadhaarUsers,
          timestamp: new Date(),
        });
      }

      // 2. Rejected users
      const rejectedUsersSnapshot = await db
        .collection("users")
        .where("status", "==", "rejected")
        .get();
      const rejectedUsers = [];
      rejectedUsersSnapshot.forEach((doc) => {
        const data = doc.data();
        rejectedUsers.push({
          id: doc.id,
          name: data.name,
          email: data.email,
          reason: data.rejectionReason || "Not specified",
          rejectedAt: data.rejectedAt || new Date(),
          role: data.role,
        });
      });

      if (rejectedUsers.length > 0) {
        alerts.push({
          type: "Rejected Users",
          severity: "error",
          icon: "❌",
          count: rejectedUsers.length,
          message: `${rejectedUsers.length} user(s) have been rejected`,
          details: rejectedUsers,
          timestamp: new Date(),
        });
      }

      // 3. Invalid/spam blood requests
      const invalidRequestsSnapshot = await db
        .collection("emergencyRequests")
        .where("status", "==", "invalid")
        .get();
      const invalidRequests = [];
      for (const doc of invalidRequestsSnapshot.docs) {
        const data = doc.data();
        // Get recipient info
        const recipientDoc = await db
          .collection("users")
          .doc(data.recipientId)
          .get();
        const recipientData = recipientDoc.exists ? recipientDoc.data() : {};

        invalidRequests.push({
          id: doc.id,
          patientName: data.patientName || recipientData.name,
          bloodGroup: data.bloodGroup,
          reason: data.rejectionReason || "Marked as invalid",
          flaggedAt: data.rejectedAt || new Date(),
          recipientEmail: recipientData.email,
        });
      }

      if (invalidRequests.length > 0) {
        alerts.push({
          type: "Invalid Requests",
          severity: "warning",
          icon: "🚨",
          count: invalidRequests.length,
          message: `${invalidRequests.length} request(s) flagged as invalid/spam`,
          details: invalidRequests,
          timestamp: new Date(),
        });
      }

      // 4. Multiple requests from same user
      const allRequestsSnapshot = await db
        .collection("emergencyRequests")
        .where("status", "in", ["pending", "pending-verification"])
        .get();

      const userRequestCounts = {};
      const userRequestDetails = {};

      for (const doc of allRequestsSnapshot.docs) {
        const data = doc.data();
        const recipientId = data.recipientId;

        if (!userRequestCounts[recipientId]) {
          userRequestCounts[recipientId] = 0;
          userRequestDetails[recipientId] = {
            requests: [],
            recipientId,
          };
        }

        userRequestCounts[recipientId]++;
        userRequestDetails[recipientId].requests.push({
          id: doc.id,
          bloodGroup: data.bloodGroup,
          urgency: data.urgencyLevel,
          createdAt: data.createdAt,
        });
      }

      const multipleRequestUsers = [];
      for (const recipientId in userRequestCounts) {
        if (userRequestCounts[recipientId] > 1) {
          const recipientDoc = await db
            .collection("users")
            .doc(recipientId)
            .get();
          const recipientData = recipientDoc.exists ? recipientDoc.data() : {};

          multipleRequestUsers.push({
            recipientId,
            name: recipientData.name,
            email: recipientData.email,
            requestCount: userRequestCounts[recipientId],
            requests: userRequestDetails[recipientId].requests,
            flaggedAt: new Date(),
          });
        }
      }

      if (multipleRequestUsers.length > 0) {
        alerts.push({
          type: "Multiple Requests",
          severity: "info",
          icon: "⚠️",
          count: multipleRequestUsers.length,
          message: `${multipleRequestUsers.length} user(s) with multiple pending requests`,
          details: multipleRequestUsers,
          timestamp: new Date(),
        });
      }

      // 5. Get suspicious activity from database
      const suspiciousSnapshot = await db
        .collection("suspiciousActivity")
        .orderBy("flaggedAt", "desc")
        .limit(10)
        .get();

      const suspiciousActivities = [];
      suspiciousSnapshot.forEach((doc) => {
        const data = doc.data();
        suspiciousActivities.push({
          id: doc.id,
          type: data.type,
          description: data.description,
          userId: data.userId,
          flaggedAt: data.flaggedAt,
        });
      });

      if (suspiciousActivities.length > 0) {
        alerts.push({
          type: "Suspicious Activity",
          severity: "error",
          icon: "🚨",
          count: suspiciousActivities.length,
          message: `${suspiciousActivities.length} suspicious activity record(s) detected`,
          details: suspiciousActivities,
          timestamp: new Date(),
        });
      }

      res.json({
        alerts,
        totalAlerts: alerts.length,
        criticalCount: alerts.filter((a) => a.severity === "error").length,
        warningCount: alerts.filter((a) => a.severity === "warning").length,
      });
    } catch (error) {
      res.status(500).json({
        message: "Error fetching system alerts",
        error: error.message,
      });
    }
  },
);

module.exports = router;
