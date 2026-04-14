import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { shouldBeAdmin } from "./middleware/authMiddleware.js";
import userRoute from "./routes/user.route";
import { producer } from "./utils/redis.js";
const app = express();
app.use(cors({
    origin: ["http://localhost:3003"], //auth_service env
    credentials: true,
}));
app.use(express.json());
app.use(clerkMiddleware());
app.get("/health", (req, res) => {
    return res.status(200).json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: Date.now(),
    });
});
app.use("/users", shouldBeAdmin, userRoute);
app.use((err, req, res, next) => {
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
    }
    catch (error) {
        console.log(error);
        process.exit(1);
    }
};
start();
