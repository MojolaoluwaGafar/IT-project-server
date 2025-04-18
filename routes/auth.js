const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User.js");
const sendEmail = require("../utils/sendEmail");

const router = express.Router()

//signup route 
router.post("/signup", async (req, res) => {
  console.log("Signup route hit");


    const { email, phone, password } = req.body;
    console.log("Request body:", req.body);
    try {
        //if user exists?
       const userExisting = await User.findOne({
  $or: [{ email }, { phone }]});
  console.log("User existing?", userExisting);
        if (userExisting){
            return res.status(400).json({ message: "user already exists"})
        }
         const hashedPassword = await bcrypt.hash(password, 10);

         //no user,create new  user 
         const newUser = new User({
            email: email || null,
            phone : phone || null,
            password: hashedPassword,
         });
         await newUser.save();
         res.status(201).json({ message:" user created successfully" });
    } catch (error) {
       console.error("Signup error:", error);
        res.status(500).json({ message: "signup failed", error: error.message });
    }
});

//signin route
router.post("/signin", async (req, res)=>{
    //signin w email
    const {email,password} = req.body;

    try {
      //  find user
      const user = await User.findOne({email});

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(401).json({ message: "Invalid credentials" });

      // Create session token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "3d",
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

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const resetLink = `http://localhost:6000/reset-password/${token}`;

    const emailHTML = `
      <h3>Password Reset</h3>
      <p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 15 minutes.</p>
    `;

    await sendEmail(email, "Reset Your Password", emailHTML);

    res.status(200).json({ message: "Reset link sent to email" });
  } catch (err) {
    res.status(500).json({ message: "Error sending reset link", error: err.message });
  }
});

router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_RESET_SECRET);

    const hashed = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(decoded.id, { password: hashed });

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
});



module.exports = router;