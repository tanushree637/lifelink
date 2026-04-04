const { createCanvas } = require("canvas");
const fs = require("fs");

/**
 * Generate a professional JPG certificate matching the provided design
 */
function generateCertificate(donorInfo) {
  return new Promise((resolve, reject) => {
    try {
      // Safely convert donation date
      let donationDate = new Date();
      if (donorInfo.donationDate) {
        if (
          donorInfo.donationDate.toDate &&
          typeof donorInfo.donationDate.toDate === "function"
        ) {
          // Handle Firestore Timestamp
          donationDate = donorInfo.donationDate.toDate();
        } else if (donorInfo.donationDate instanceof Date) {
          donationDate = donorInfo.donationDate;
        } else if (typeof donorInfo.donationDate === "number") {
          donationDate = new Date(donorInfo.donationDate);
        } else if (typeof donorInfo.donationDate === "string") {
          donationDate = new Date(donorInfo.donationDate);
        }
      }

      // Create canvas with high resolution (1200x800 at 150 DPI equivalent)
      const width = 1200;
      const height = 800;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Fill background with gradient
      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, "#faf8f5");
      bgGradient.addColorStop(1, "#f5f0eb");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Draw decorative wave patterns
      drawWavePattern(ctx, width, height);

      // === OUTER BORDER ===
      ctx.strokeStyle = "#8b0000";
      ctx.lineWidth = 12;
      ctx.strokeRect(20, 20, width - 40, height - 40);

      // === INNER BORDER ===
      ctx.strokeStyle = "#c41e3a";
      ctx.lineWidth = 3;
      ctx.strokeRect(35, 35, width - 70, height - 70);

      // === TOP DECORATIVE ELEMENTS ===
      // Hearts on sides
      ctx.font = "bold 40px Arial";
      ctx.fillStyle = "#c41e3a";
      ctx.textAlign = "left";
      ctx.fillText("❤", 70, 85);
      ctx.textAlign = "right";
      ctx.fillText("❤", width - 70, 85);

      // === RED RIBBON BANNER ===
      drawRibbon(ctx, width, 60, 120);

      // "LIFELINK" text on ribbon
      ctx.font = "bold 48px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText("LIFELINK", width / 2, 100);

      // === BLOOD DROP DECORATIONS ON RIBBON ===
      ctx.font = "40px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("🩸", width / 2 - 180, 95);
      ctx.fillText("🩸", width / 2 + 180, 95);

      // === TITLE ===
      ctx.font = "bold 44px Georgia";
      ctx.fillStyle = "#8b0000";
      ctx.textAlign = "center";
      ctx.fillText("Certificate of Blood Donation", width / 2, 190);

      // === DECORATIVE LINE ===
      drawDecorativeLine(ctx, width / 2 - 150, 210, width / 2 + 150, 210);

      // === AWARD TEXT ===
      ctx.font = "18px Georgia";
      ctx.fillStyle = "#333333";
      ctx.textAlign = "center";
      ctx.fillText("This certificate is awarded to", width / 2, 250);

      // === DONOR NAME ===
      ctx.font = "bold 52px Georgia";
      ctx.fillStyle = "#333333";
      ctx.textAlign = "center";
      ctx.fillText(donorInfo.name.toUpperCase(), width / 2, 330);

      // === DECORATIVE LINE UNDER NAME ===
      drawDecorativeLine(ctx, width / 2 - 180, 350, width / 2 + 180, 350);

      // === RECOGNITION TEXT ===
      ctx.font = "18px Georgia";
      ctx.fillStyle = "#333333";
      ctx.textAlign = "center";
      ctx.fillText(
        "in recognition of their voluntary blood donation",
        width / 2,
        390,
      );

      // === DONATION DETAILS BOX ===
      // Box background
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.fillRect(200, 415, width - 400, 100);

      // Box border
      ctx.strokeStyle = "#c41e3a";
      ctx.lineWidth = 2;
      ctx.strokeRect(200, 415, width - 400, 100);

      // Details text
      ctx.font = "bold 16px Arial";
      ctx.fillStyle = "#c41e3a";
      ctx.textAlign = "center";

      // Blood Group
      ctx.fillText("BLOOD GROUP", width / 2 - 180, 440);
      ctx.font = "bold 20px Arial";
      ctx.fillStyle = "#333333";
      ctx.fillText(donorInfo.bloodGroup, width / 2 - 180, 475);

      // Hospital
      ctx.font = "bold 16px Arial";
      ctx.fillStyle = "#c41e3a";
      ctx.textAlign = "center";
      ctx.fillText("HOSPITAL", width / 2, 440);
      ctx.font = "16px Arial";
      ctx.fillStyle = "#333333";
      const hospitalText = donorInfo.hospitalName || "Blood Bank";
      ctx.fillText(truncateText(hospitalText, 25), width / 2, 475);

      // Date
      ctx.font = "bold 16px Arial";
      ctx.fillStyle = "#c41e3a";
      ctx.textAlign = "center";
      ctx.fillText("DONATED ON", width / 2 + 180, 440);
      ctx.font = "14px Arial";
      ctx.fillStyle = "#333333";
      const dateStr = donationDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      ctx.fillText(dateStr, width / 2 + 180, 475);

      // === FOOTER SECTION ===
      // Certificate ID (left)
      ctx.font = "bold 12px Arial";
      ctx.fillStyle = "#666666";
      ctx.textAlign = "left";
      ctx.fillText("Certificate ID:", 80, 680);
      ctx.font = "bold 13px Arial";
      ctx.fillStyle = "#333333";
      const certId = `LL-${Date.now().toString().slice(-8).toUpperCase()}`;
      ctx.fillText(certId, 80, 705);

      // Issue Date (center-left)
      ctx.font = "bold 12px Arial";
      ctx.fillStyle = "#666666";
      ctx.textAlign = "center";
      ctx.fillText("Date of Issue", width / 2 - 150, 680);
      ctx.font = "12px Arial";
      ctx.fillStyle = "#333333";
      const issueDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      ctx.fillText(issueDate, width / 2 - 150, 705);

      // Hospital Authority Signature (right half)
      // Signature block background
      ctx.fillStyle = "rgba(200, 200, 200, 0.05)";
      ctx.fillRect(width / 2 + 80, 665, 240, 65);
      ctx.strokeStyle = "#c41e3a";
      ctx.lineWidth = 1;
      ctx.strokeRect(width / 2 + 80, 665, 240, 65);

      // Hospital Authority text - Display actual hospital name
      ctx.font = "bold 13px Arial";
      ctx.fillStyle = "#c41e3a";
      ctx.textAlign = "center";
      const displayHospitalName =
        donorInfo.hospitalName || "LifeLink Blood Bank";
      ctx.fillText(truncateText(displayHospitalName, 30), width / 2 + 200, 683);

      // Signature line (thicker and more realistic)
      ctx.strokeStyle = "#333333";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width / 2 + 95, 710);
      ctx.lineTo(width / 2 + 305, 710);
      ctx.stroke();

      // Authorized signature label
      ctx.font = "10px Arial";
      ctx.fillStyle = "#666666";
      ctx.fillText("Authorized Signature", width / 2 + 200, 725);

      // === BOTTOM TEXT ===
      ctx.font = "11px Georgia";
      ctx.fillStyle = "#666666";
      ctx.textAlign = "center";
      ctx.fillText(
        "Generated by LifeLink - Connecting Hearts, Saving Lives™",
        width / 2,
        780,
      );

      // Convert canvas to JPG buffer
      const buffer = canvas.toBuffer("image/jpeg", { quality: 0.95 });
      console.log(`✅ Certificate JPG generated: ${buffer.length} bytes`);
      resolve(buffer);
    } catch (error) {
      console.error(`❌ Certificate generation error:`, error);
      reject(error);
    }
  });
}

/**
 * Draw wave pattern in background
 */
function drawWavePattern(ctx, width, height) {
  ctx.fillStyle = "rgba(196, 30, 58, 0.05)";
  ctx.beginPath();
  ctx.moveTo(0, 150);
  for (let x = 0; x < width; x += 10) {
    const y = 150 + Math.sin(x * 0.02) * 20;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.fill();

  // Second wave
  ctx.fillStyle = "rgba(196, 30, 58, 0.03)";
  ctx.beginPath();
  ctx.moveTo(0, height - 150);
  for (let x = 0; x < width; x += 10) {
    const y = height - 150 - Math.sin(x * 0.02) * 20;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.fill();
}

/**
 * Draw ribbon banner
 */
function drawRibbon(ctx, width, topY, bottomY) {
  // Main ribbon
  ctx.fillStyle = "#c41e3a";
  ctx.beginPath();
  ctx.moveTo(80, topY);
  ctx.lineTo(width - 80, topY);
  ctx.lineTo(width - 60, bottomY);
  ctx.lineTo(60, bottomY);
  ctx.closePath();
  ctx.fill();

  // Ribbon folds (darker)
  ctx.fillStyle = "#8b0000";
  ctx.beginPath();
  ctx.moveTo(60, bottomY);
  ctx.lineTo(80, topY);
  ctx.lineTo(100, bottomY);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(width - 60, bottomY);
  ctx.lineTo(width - 80, topY);
  ctx.lineTo(width - 100, bottomY);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw decorative line with diamond
 */
function drawDecorativeLine(ctx, startX, startY, endX, endY) {
  // Main line
  ctx.strokeStyle = "#d4af37";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, startY);
  ctx.stroke();

  // Center diamond
  const centerX = (startX + endX) / 2;
  ctx.fillStyle = "#d4af37";
  ctx.beginPath();
  ctx.moveTo(centerX - 6, startY);
  ctx.lineTo(centerX, startY - 6);
  ctx.lineTo(centerX + 6, startY);
  ctx.lineTo(centerX, startY + 6);
  ctx.closePath();
  ctx.fill();
}

/**
 * Truncate text if too long
 */
function truncateText(text, maxLength) {
  return text.length > maxLength
    ? text.substring(0, maxLength - 3) + "..."
    : text;
}

/**
 * Format date to readable format
 */
function formatDate(date) {
  if (!date) return "Unknown Date";
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Generate certificate filename
 */
function generateCertificateFilename(donorName, donationId) {
  const sanitizedName = donorName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  return `certificate_${sanitizedName}_${donationId}.jpg`;
}

module.exports = {
  generateCertificate,
  formatDate,
  generateCertificateFilename,
};
