const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./routes/auth.js");
const verifyToken = require("./middleware/verifyToken")
const contactRoutes = require("./routes/contact");
const subscribeRoutes = require("./routes/subscribe");

dotenv.config();
const app = express();

//middleware
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);


//routes
app.use("/api/auth", authRoutes);
app.use("/api", contactRoutes);
app.use("/api",subscribeRoutes);

app.get("/", (req, res) => {
  res.send("Server is running");
});
app.get("/api/protected", verifyToken, (req, res) => {
  res.json({ message: "You made it", user: req.user });
});

//database connection
// mongoose
//   .connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => console.log("MongoDB Connected"))
//   .catch((err) => console.error("MongoDB Error:", err));

// //server port
// const PORT = process.env.PORT || 6000;
// app.listen(PORT, () => console.log(`server running on port ${PORT}`));


const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    console.log("🟢 About to start server...");
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error("Startup error:", err.message);
  }
};
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.stack || err);
});
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err.stack || err);
});
startServer();
