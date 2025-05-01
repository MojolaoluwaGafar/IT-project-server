const express = require("express");
const router = express.Router();
const sendEmail = require("../utils/sendEmail"); 

router.post("/subscribe", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const html = `
    <h3>New Subscription</h3>
    <p><strong>Email:</strong> ${email}</p>
  `;

  try {
    await sendEmail(process.env.RECEIVER_EMAIL, "New Email Subscriber", html);
    res
      .status(200)
      .json({ success: true, message: "Thank you for subscribing!" });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ error: "Failed to subscribe" });
  }
});

module.exports = router;
