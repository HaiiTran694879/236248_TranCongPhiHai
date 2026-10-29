
require("dotenv").config();

const dns = require("dns");

// Khắc phục lỗi DNS querySrv trên máy của bạn
dns.setServers(["8.8.8.8"]);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Tên database và collection
const DATABASE_NAME = "236248_TranCongPhiHai";
const COLLECTION_NAME = "foods";

// API kiểm tra backend
app.get("/", (req, res) => {
  res.json({
    message: "Food API is running",
  });
});

// API lấy danh sách món ăn
app.get("/api/foods", async (req, res) => {
  try {
    if (!mongoose.connection.db) {
      return res.status(500).json({
        message: "MongoDB chua ket noi",
      });
    }

    const foods = await mongoose.connection.db
      .collection(COLLECTION_NAME)
      .find({})
      .toArray();

    res.json(foods);
  } catch (error) {
    console.error("Loi lay danh sach mon an:", error.message);

    res.status(500).json({
      message: "Khong the lay danh sach mon an",
    });
  }
});

// Khởi động server
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("Chua cau hinh MONGODB_URI trong file .env");
    }

    // Kết nối đúng database
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: DATABASE_NAME,
    });

    console.log("Da ket noi MongoDB Atlas");
    console.log("Database:", mongoose.connection.name);

    // Kiểm tra số lượng món ăn
    const totalFoods = await mongoose.connection.db
      .collection(COLLECTION_NAME)
      .countDocuments();

    console.log("Collection:", COLLECTION_NAME);
    console.log("So mon an:", totalFoods);

    app.listen(PORT, () => {
      console.log(`Backend dang chay tai http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Loi ket noi:", error.message);
    process.exit(1);
  }
}

startServer();
