const admin = require("firebase-admin");
require("dotenv").config();

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

const db = admin.firestore();

async function deleteAllUsers() {
  try {
    console.log("🗑️  Clearing all users from database...\n");

    const usersRef = db.collection("users");
    const snapshot = await usersRef.get();

    if (snapshot.empty) {
      console.log("✅ Database is already empty\n");
      process.exit(0);
    }

    const batch = db.batch();
    let count = 0;

    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
    });

    await batch.commit();
    console.log(`✅ Deleted ${count} users\n`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error clearing database:", error.message);
    process.exit(1);
  }
}

deleteAllUsers();
