const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./routes/auth.js");
const verifyToken = require("./middleware/verifyToken")

dotenv.config();
const app = express();

//middleware
app.use(express.json());
app.use(cors());

//routes
app.use("/api/auth", authRoutes);

//database connection
// mongoose
//   .connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => console.log("MongoDB Connected"))
//   .catch((err) => console.error("MongoDB Error:", err));

app.get("/", (req, res) => {
  res.send("Server is running");
});
app.get("/api/protected", verifyToken, (req, res) => {
  res.json({ message: "You made it", user: req.user });
});

process.on('uncaughtException', (err) => {
  console.error("Uncaught Exception:", err);
});


// //server port
// const PORT = process.env.PORT || 6000;
// app.listen(PORT, () => console.log(`server running on port ${PORT}`));

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    const PORT = process.env.PORT || 6000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error("Startup error:", err.message);
  }
};
startServer();