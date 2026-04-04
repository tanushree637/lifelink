const admin = require("firebase-admin");
const bcrypt = require("bcryptjs");

let db;

const initializeFirebase = async () => {
  try {
    const serviceAccount = {
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    };

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
      });
    }

    db = admin.firestore();
    console.log("Firebase initialized successfully");

    // 🔥 Automatically create default admin if not exists
    await createDefaultAdmin();
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
};

const createDefaultAdmin = async () => {
  try {
    const adminRef = db.collection("users");
    const snapshot = await adminRef.where("role", "==", "admin").get();

    if (snapshot.empty) {
      const hashedPassword = await bcrypt.hash("admin123", 10);

      await adminRef.add({
        email: "admin@lifelink.com",
        password: hashedPassword,
        name: "Super Admin",
        role: "admin",
        phone: "0000000000",
        status: "approved",
        createdAt: new Date(),
      });

      console.log("✅ Default admin created");
      console.log("📧 Email: admin@lifelink.com");
      console.log("🔑 Password: admin123");
    } else {
      console.log("Admin already exists");
    }
  } catch (error) {
    console.error("Error creating default admin:", error);
  }
};

const getDB = () => db;

module.exports = { initializeFirebase, getDB };
