const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User.js");
const sendEmail = require("../utils/sendEmail");
const axios = require("axios");
const crypto = require("crypto");

// const { OAuth2Client } = require("google-auth-library");

const router = express.Router();

//signup route
router.post("/signup", async (req, res) => {
  console.log("Signup route hit");

  const { fullName, email, phone, password } = req.body;
  console.log("Request body:", req.body);
  try {
    //if user exists?
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const phoneExists = await User.findOne({ phone });
    if (phoneExists) {
      return res.status(400).json({ message: "Phone number already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    //no user,create new  user
    const newUser = new User({
      fullName: fullName || null,
      email: email || null,
      phone: phone || null,
      password: hashedPassword,
    });
    await newUser.save();
    res.status(201).json({ message: " user created successfully" });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "signup failed", error: error.message });
  }
});

//signin route
router.post("/signin", async (req, res) => {
  console.log("SIGNIN route hit");
  //signin w email
  const { email, password } = req.body;

  try {
    //  find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // Create session token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Signin failed", error: error.message });
  }
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    //   const token = jwt.sign({ id: user._id }, process.env.JWT_RESET_SECRET, {
    //     expiresIn: "15m",
    //   });

    //   const resetLink = `${process.env.CLIENT_URL}/reset-password/${token}`;

    //   const emailHTML = `
    //     <h3>Password Reset</h3>
    //     <p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 15 minutes.</p>
    //   `;

    //   await sendEmail(email, "Reset Your Password", emailHTML);

    //   res.status(200).json({ message: "Reset link sent to email" });
    // } catch (err) {
    //   res
    //   .status(500)
    //   .json({ message: "Error sending reset link", error: err.message });
    // }

    // 🔐 Generate temporary password
    const tempPassword = crypto.randomBytes(4).toString("hex"); // 8-character password

    // 🔒 Hash and store it
    const hashedTempPassword = await bcrypt.hash(tempPassword, 10);
    await User.findByIdAndUpdate(user._id, { password: hashedTempPassword });

    // 🔑 Create reset token
    const token = jwt.sign({ id: user._id }, process.env.JWT_RESET_SECRET, {
      expiresIn: "15m",
    });

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${token}`;

    const emailHTML = `
      <h3>Password Reset</h3>
      <p>Your temporary password is: <strong>${tempPassword}</strong></p>
      <p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 15 minutes.</p>
    `;

    await sendEmail(email, "Your Temporary Password & Reset Link", emailHTML);

    res.status(200).json({ message: "Temporary password and reset link sent" });
  } catch (err) {
    console.error("Error in forgot-password route:", err.message);
    res
      .status(500)
      .json({ message: "Error sending reset email", error: err.message });
  }
});

router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  
  // console.log("Reset password attempt:");
  // console.log("Token:", token);
  // console.log("New password:", newPassword);
  
  if (!newPassword) {
    return res.status(400).json({ message: "New password is required" });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_RESET_SECRET);
    // console.log("Decoded token:", decoded);
    
    const hashed = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(decoded.id, { password: hashed });

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Error verifying token or updating password:", err.message);
    return res.status(400).json({ message: "Invalid or expired token" });
  }
});

// const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// router.post("/google", async (req, res) => {
//   const { token } = req.body; // ✅ define token here first

//   try {
//     const ticket = await client.verifyIdToken({
//       idToken: token, // ✅ now 'token' is defined
//       audience: process.env.GOOGLE_CLIENT_ID,
//     });

//     const { email_verified, email, name } = ticket.getPayload();

//     if (!email_verified) {
//       return res.status(400).json({ message: "Email not verified" });
//     }

//     let user = await User.findOne({ email });

//     if (!user) {
//       user = new User({
//         email,
//         fullName: name,
//         password: "", // no password needed for OAuth users
//       });
//       await user.save();
//     }

//     const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//       expiresIn: "15m",
//     });

//     res.status(200).json({
//       message: "Login successful",
//       token: jwtToken,
//       user: {
//         id: user._id,
//         email: user.email,
//         fullName: user.fullName,
//       },
//     });
//   } catch (error) {
//     console.error("Google sign-in error:", error.message);
//     res.status(500).json({ message: "Google login failed" });
//   }
// });

router.post("/google", async (req, res) => {
  const { token } = req.body;

  try {
    // Get user info from Google
    const response = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const { email, name, email_verified } = response.data;

    if (!email_verified) {
      return res.status(400).json({ message: "Email not verified" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        email,
        fullName: name,
        password: "",
      });
      await user.save();
    }

    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    res.status(200).json({
      message: "Login successful",
      token: jwtToken,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
      },
    });
  } catch (error) {
    console.error("Google sign-in error:", error.message);
    res.status(500).json({ message: "Google login failed" });
  }
});

router.post("/facebook", async (req, res) => {
  const { accessToken, userID } = req.body;

  try {
    const fbRes = await axios.get(
      `https://graph.facebook.com/v10.0/${userID}?fields=id,name,email&access_token=${accessToken}`
    );

    const { email, name } = fbRes.data;

    res.status(200).json({ message: "Login successful", token, user });
  } catch (err) {
    console.error("Facebook sign-in error:", err.message);
    res.status(500).json({ message: "Facebook login failed" });
  }
});




module.exports = router;
