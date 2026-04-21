const axios = require("axios");

const API_URL = "http://localhost:5000/api";

// Test credentials from mockData
const testUsers = [
  // Admin
  { email: "admin@lifelink.com", password: "admin123", role: "admin" },

  // Hospitals
  {
    email: "city-general@hospital.com",
    password: "HospitalPass123",
    role: "hospital",
  },
  {
    email: "apollo-hospital@hospital.com",
    password: "HospitalPass123",
    role: "hospital",
  },
  {
    email: "fortis-healthcare@hospital.com",
    password: "HospitalPass123",
    role: "hospital",
  },
  {
    email: "max-hospital@hospital.com",
    password: "HospitalPass123",
    role: "hospital",
  },
  {
    email: "sunrise-hospital@hospital.com",
    password: "HospitalPass123",
    role: "hospital",
  },

  // Donors
  { email: "rajesh.kumar@email.com", password: "DonorPass123", role: "donor" },
  { email: "priya.sharma@email.com", password: "DonorPass123", role: "donor" },
  { email: "amit.singh@email.com", password: "DonorPass123", role: "donor" },
  { email: "deepika.nair@email.com", password: "DonorPass123", role: "donor" },
  { email: "vikram.patel@email.com", password: "DonorPass123", role: "donor" },

  // Recipients
  {
    email: "anuj.mishra@email.com",
    password: "RecipientPass123",
    role: "recipient",
  },
  {
    email: "neha.dwivedi@email.com",
    password: "RecipientPass123",
    role: "recipient",
  },
  {
    email: "raman.joshi@email.com",
    password: "RecipientPass123",
    role: "recipient",
  },
  {
    email: "sneha.verma@email.com",
    password: "RecipientPass123",
    role: "recipient",
  },
  {
    email: "suresh.reddy@email.com",
    password: "RecipientPass123",
    role: "recipient",
  },
];

async function testLogin(email, password, role) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });

    const { token, user } = response.data;
    return {
      success: true,
      email,
      role,
      message: `✅ Login successful`,
      token: token.substring(0, 20) + "...",
      user: user.name,
    };
  } catch (error) {
    return {
      success: false,
      email,
      role,
      message: `❌ ${error.response?.data?.message || error.message}`,
    };
  }
}

async function runTests() {
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║           🧪 LifeLink LOGIN TEST SUITE                ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  const results = [];
  let passed = 0;
  let failed = 0;

  for (const user of testUsers) {
    const result = await testLogin(user.email, user.password, user.role);
    results.push(result);

    if (result.success) {
      passed++;
      console.log(
        `${result.message} | ${user.role.toUpperCase()} | ${user.email}`,
      );
    } else {
      failed++;
      console.log(
        `${result.message} | ${user.role.toUpperCase()} | ${user.email}`,
      );
    }

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Summary
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║                    📊 TEST SUMMARY                    ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  console.log(
    `Total Tests: ${testUsers.length} | Passed: ${passed} | Failed: ${failed}`,
  );
  console.log(
    `Pass Rate: ${((passed / testUsers.length) * 100).toFixed(1)}%\n`,
  );

  const adminCount = results.filter((r) => r.role === "admin").length;
  const adminPassed = results.filter(
    (r) => r.role === "admin" && r.success,
  ).length;
  const hospitalCount = results.filter((r) => r.role === "hospital").length;
  const hospitalPassed = results.filter(
    (r) => r.role === "hospital" && r.success,
  ).length;
  const donorCount = results.filter((r) => r.role === "donor").length;
  const donorPassed = results.filter(
    (r) => r.role === "donor" && r.success,
  ).length;
  const recipientCount = results.filter((r) => r.role === "recipient").length;
  const recipientPassed = results.filter(
    (r) => r.role === "recipient" && r.success,
  ).length;

  console.log("BREAKDOWN BY ROLE:");
  console.log(`  👤 Admin:      ${adminPassed}/${adminCount}`);
  console.log(`  🏥 Hospitals:  ${hospitalPassed}/${hospitalCount}`);
  console.log(`  🩸 Donors:     ${donorPassed}/${donorCount}`);
  console.log(`  👥 Recipients: ${recipientPassed}/${recipientCount}`);

  if (failed > 0) {
    console.log("\n⚠️  FAILED LOGINS:");
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`   • ${r.email} (${r.role}): ${r.message}`);
      });
  }

  console.log("\n");
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  console.error("❌ Test suite error:", error.message);
  process.exit(1);
});
