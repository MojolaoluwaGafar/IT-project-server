const express = require("express");
const router = express.Router();
const sendEmail = require("../utils/sendEmail");

router.post("/contact", async (req, res) => {
  const { firstName,lastName, email, location, message } = req.body;

  if (!firstName || !lastName || !email || !location || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const html = `
    <h3>New Contact Message</h3>
    <p><strong>First Name:</strong> ${firstName}</p>
    <p><strong>Second Name:</strong> ${lastName}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Location:</strong> ${location}</p>
    <p><strong>Message:</strong><br/>${message}</p>
  `;

  try {
    await sendEmail(
      process.env.RECEIVER_EMAIL,
      "New Contact Form Submission",
      html
    );
    res.status(200).json({ success: true, message: "Message sent!" });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

module.exports = router;
