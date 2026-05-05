import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { shouldBeAdmin } from "./middleware/authMiddleware.js";
import userRoute from "./routes/user.route";
import { producer } from "./utils/redis.js";

// CORS配置，允许来自http://localhost:3003的请求，并且允许携带cookie（credentials: true）
const app = express();
app.use(
  cors({
    origin: ["http://localhost:3003"], //auth_service env
    credentials: true,
  }),
);
app.use(express.json());
app.use(clerkMiddleware());

// health check 提供一个让外部系统确认“这个服务还活着吗？”的端点
app.get("/health", (req: Request, res: Response) => {
  return res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

// clerk中间件会在请求对象上添加一个`auth`属性，包含了当前用户的认证信息
app.use("/users", shouldBeAdmin, userRoute);

// 全局错误处理中间件，捕获所有未处理的错误，并返回一个统一的错误响应
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.log(err);
  return res
    .status(err.status || 500)
    .json({ message: err.message || "Inter Server Error!" });
});

// 启动函数
const start = async () => {
  try {
    await producer.connect();
    app.listen(8003, () => {
      console.log("Auth service is running on 8003");
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

start();
