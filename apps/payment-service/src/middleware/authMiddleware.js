import { getAuth } from "@hono/clerk-auth";
import { createMiddleware } from "hono/factory";
export const shouldBeUser = createMiddleware(async (c, next) => {
    const auth = getAuth(c);
    if (!auth?.userId) {
        return c.json({
            message: "You are not logged in.", //登录失败情况
        });
    }
    c.set("userId", auth.userId); //登录成功后设置userId
    await next(); //继续执行后面的接口
});
export const shouldBeAdmin = createMiddleware(async (c, next) => {
    const auth = getAuth(c);
    if (!auth?.userId) {
        return c.json({
            message: "You are not logged in.",
        });
    }
    const claims = auth.sessionClaims;
    if (claims.metadata?.role !== "admin") {
        return c.json({ message: "Unauthorized!" });
    }
    c.set("userId", auth.userId);
    await next();
});
