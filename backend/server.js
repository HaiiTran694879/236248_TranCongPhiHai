require("dotenv").config();

const dns = require("dns");

// Workaround DNS đã hoạt động trên máy của bạn
dns.setServers(["8.8.8.8"]);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { ObjectId } = require("mongodb");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;
const DB_NAME =
  process.env.MONGODB_DB || "236248_TranCongPhiHai";
const COLLECTION_NAME = "foods";

function getFoodsCollection() {
  return mongoose.connection.db.collection(COLLECTION_NAME);
}

// Các trường được phép gửi lên API
const allowedFields = [
  "foodId",
  "name",
  "category",
  "cuisine",
  "ingredients",
  "price",
  "quantity",
  "description",
  "imageUrl",
];

// Kiểm tra dữ liệu món ăn
function validateFood(food) {
  const errors = [];

  const requiredStringFields = [
    "foodId",
    "name",
    "category",
    "cuisine",
  ];

  for (const field of requiredStringFields) {
    if (
      typeof food[field] !== "string" ||
      food[field].trim() === ""
    ) {
      errors.push(`${field} la truong bat buoc va phai la chuoi`);
    }
  }

  if (
    food.ingredients !== undefined &&
    (
      !Array.isArray(food.ingredients) ||
      !food.ingredients.every(
        (item) => typeof item === "string" && item.trim() !== ""
      )
    )
  ) {
    errors.push("ingredients phai la mang cac chuoi khong rong");
  }

  if (
    typeof food.price !== "number" ||
    !Number.isFinite(food.price) ||
    food.price < 0
  ) {
    errors.push("price phai la so khong am");
  }

  if (
    !Number.isInteger(food.quantity) ||
    food.quantity < 0
  ) {
    errors.push("quantity phai la so nguyen khong am");
  }

  for (const field of ["description", "imageUrl"]) {
    if (
      food[field] !== undefined &&
      typeof food[field] !== "string"
    ) {
      errors.push(`${field} phai la chuoi`);
    }
  }

  return errors;
}

// Chỉ nhận những trường được phép
function pickAllowedFields(body) {
  const result = {};

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      result[field] = body[field];
    }
  }

  return result;
}

// Kiểm tra ObjectId
function isValidId(id) {
  return ObjectId.isValid(id) &&
    new ObjectId(id).toHexString() === id.toLowerCase();
}

// Endpoint kiểm tra backend và MongoDB
app.get("/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;

  res.status(connected ? 200 : 503).json({
    status: connected ? "ok" : "error",
    backend: "running",
    database: connected ? "connected" : "disconnected",
  });
});

// Endpoint gốc
app.get("/", (req, res) => {
  res.json({
    message: "Food API is running",
  });
});

// GET /api/foods
// GET /api/foods?search=pho
app.get("/api/foods", async (req, res) => {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : "";

    let filter = {};

    if (search) {
      // Escape ký tự đặc biệt để tìm kiếm an toàn
      
const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const keyword = new RegExp(escapedSearch, "i");

const filter = {
  $or: [
    { name: keyword },
    { category: keyword },
    { cuisine: keyword },
  ],
};

    }

    const foods = await getFoodsCollection()
      .find(filter)
      .toArray();

    res.status(200).json(foods);
  } catch (error) {
    console.error("Loi lay danh sach mon an:", error.message);

    res.status(500).json({
      message: "Khong the lay danh sach mon an",
    });
  }
});

// GET /api/foods/:id
app.get("/api/foods/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        message: "ID mon an khong hop le",
      });
    }

    const food = await getFoodsCollection().findOne({
      _id: new ObjectId(id),
    });

    if (!food) {
      return res.status(404).json({
        message: "Khong tim thay mon an",
      });
    }

    res.status(200).json(food);
  } catch (error) {
    console.error("Loi lay chi tiet mon an:", error.message);

    res.status(500).json({
      message: "Khong the lay chi tiet mon an",
    });
  }
});

// POST /api/foods
app.post("/api/foods", async (req, res) => {
  try {
    const food = pickAllowedFields(req.body);
    const errors = validateFood(food);

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Du lieu mon an khong hop le",
        errors,
      });
    }

    food.foodId = food.foodId.trim();

    // Kiểm tra trùng mã món ăn
    const existingFood = await getFoodsCollection().findOne({
      foodId: food.foodId,
    });

    if (existingFood) {
      return res.status(409).json({
        message: "foodId da ton tai",
      });
    }

    const result = await getFoodsCollection().insertOne(food);

    const createdFood = await getFoodsCollection().findOne({
      _id: result.insertedId,
    });

    res.status(201).json({
      message: "Them mon an thanh cong",
      data: createdFood,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "foodId da ton tai",
      });
    }

    console.error("Loi them mon an:", error.message);

    res.status(500).json({
      message: "Khong the them mon an",
    });
  }
});

// PUT /api/foods/:id
app.put("/api/foods/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        message: "ID mon an khong hop le",
      });
    }

    const collection = getFoodsCollection();
    const objectId = new ObjectId(id);

    const existingFood = await collection.findOne({
      _id: objectId,
    });

    if (!existingFood) {
      return res.status(404).json({
        message: "Khong tim thay mon an",
      });
    }

    const updates = pickAllowedFields(req.body);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "Khong co truong hop le de cap nhat",
      });
    }

    const updatedFood = {
      ...existingFood,
      ...updates,
      _id: objectId,
    };

    const errors = validateFood(updatedFood);

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Du lieu cap nhat khong hop le",
        errors,
      });
    }

    updatedFood.foodId = updatedFood.foodId.trim();

    const duplicateFood = await collection.findOne({
      foodId: updatedFood.foodId,
      _id: { $ne: objectId },
    });

    if (duplicateFood) {
      return res.status(409).json({
        message: "foodId da ton tai o mon an khac",
      });
    }

    delete updatedFood._id;

    await collection.updateOne(
      { _id: objectId },
      { $set: updatedFood }
    );

    const result = await collection.findOne({
      _id: objectId,
    });

    res.status(200).json({
      message: "Cap nhat mon an thanh cong",
      data: result,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "foodId da ton tai",
      });
    }

    console.error("Loi cap nhat mon an:", error.message);

    res.status(500).json({
      message: "Khong the cap nhat mon an",
    });
  }
});

// DELETE /api/foods/:id
app.delete("/api/foods/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        message: "ID mon an khong hop le",
      });
    }

    const result = await getFoodsCollection().deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "Khong tim thay mon an",
      });
    }

    res.status(200).json({
      message: "Xoa mon an thanh cong",
    });
  } catch (error) {
    console.error("Loi xoa mon an:", error.message);

    res.status(500).json({
      message: "Khong the xoa mon an",
    });
  }
});

// Xử lý JSON sai định dạng
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      message: "JSON gui len khong hop le",
    });
  }

  next(err);
});

// Kết nối MongoDB rồi mới mở cổng API
async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("Chua cau hinh MONGODB_URI trong file .env");
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: DB_NAME,
      serverSelectionTimeoutMS: 10000,
    });

    console.log("Da ket noi MongoDB Atlas");
    console.log("Database:", mongoose.connection.name);

    // Đảm bảo foodId không bị trùng trong database
    await getFoodsCollection().createIndex(
      { foodId: 1 },
      { unique: true }
    );

    const totalFoods = await getFoodsCollection().countDocuments();
    console.log("Collection:", COLLECTION_NAME);
    console.log("So mon an:", totalFoods);

    app.listen(PORT, () => {
      console.log(`Backend dang chay tai http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Loi khoi dong backend:", error.message);
    process.exit(1);
  }
}

startServer();