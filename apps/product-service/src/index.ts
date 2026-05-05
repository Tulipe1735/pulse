import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { shouldBeUser } from "./middleware/authMiddleware.js";
import productRouter from "./routes/product.route";
import categoryRouter from "./routes/category.route";
import { consumer, producer } from "./utils/redis.js";

const app = express();
// CORS 让前端能够访问后端服务，允许来自 localhost:3002 和 localhost:3003 的请求，并且支持携带凭证（如 cookies）。
app.use(
  cors({
    origin: ["http://localhost:3002", "http://localhost:3003"],
    credentials: true,
  }),
);
app.use(express.json());

// clerkMiddleware 用于处理用户认证，确保只有经过认证的用户才能访问受保护的路由。
app.use(clerkMiddleware());

// health check endpoint
app.get("/health", (req: Request, res: Response) => {
  return res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

// 测试认证的路由，只有通过 shouldBeUser 中间件验证的用户才能访问，返回一个简单的 JSON 响应，包含认证成功的信息和用户 ID。
app.get("/test", shouldBeUser, (req, res) => {
  res.json({ message: "Product service authenticated", userId: req.userId });
});

// 将product和category的路由注册到 Express 应用中，使得这些路由能够处理对应的 HTTP 请求。
app.use("/products", productRouter);
app.use("/categories", categoryRouter);

// error handling middleware，捕获应用中的错误并返回一个统一的 JSON 响应，包含错误信息和状态码。
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.log(err);
  return res
    .status(err.status || 500)
    .json({ message: err.message || "Inter Server Error!" });
});

// 启动函数，连接 Redis 并启动 Express 服务器
const start = async () => {
  app.listen(8000, () => {
    console.log("Product service is running on 8000");
  });

  try {
    await Promise.all([producer.connect(), consumer.connect()]);
    console.log("Redis connected for product-service");
  } catch (error) {
    console.error(
      "Redis is unavailable. Product service will continue without Redis.",
      error,
    );
  }
};

start();
