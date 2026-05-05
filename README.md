# Pulse Monorepo

Pulse 是一个基于 `pnpm workspace + Turborepo` 的电商系统单仓库项目，包含用户前台、管理员后台、认证服务、商品服务、订单服务、支付服务以及邮件通知服务。

项目采用前后端分离和服务拆分的方式组织：

- `apps/client`：面向用户的商城前台
- `apps/admin`：面向管理员的后台面板
- `apps/auth-service`：用户与权限管理服务，基于 Clerk
- `apps/product-service`：商品与分类服务
- `apps/order-service`：订单服务
- `apps/payment-service`：Payme 支付服务
- `apps/email-service`：邮件通知消费者
- `packages/*`：共享类型、数据库访问层、Redis 工具、TS/ESLint 配置

## 技术栈

- Monorepo：`pnpm workspace`、`turbo`
- 前端：`Next.js 16`、`React 19`、`Tailwind CSS 4`
- 后台 UI：`shadcn/ui`、`Radix UI`、`TanStack Query`、`TanStack Table`
- 认证：`Clerk`
- 商品/支付数据库：`PostgreSQL + Prisma`
- 订单数据库：`MongoDB + Mongoose`
- 支付服务：`Hono`
- 商品/认证服务：`Express`
- 订单服务：`Fastify`
- 异步消息：`Redis Pub/Sub`
- 邮件：`Nodemailer`

## 根目录结构

```text
.
├─ apps/
│  ├─ admin/              # 管理后台
│  ├─ auth-service/       # 用户与权限服务
│  ├─ client/             # 商城前台
│  ├─ email-service/      # 邮件通知服务
│  ├─ order-service/      # 订单服务
│  ├─ payment-service/    # 支付服务
│  └─ product-service/    # 商品服务
├─ packages/
│  ├─ eslint-config/      # 共享 ESLint 配置
│  ├─ order-db/           # 订单数据库访问层
│  ├─ payment-db/         # 支付数据库访问层
│  ├─ product-db/         # 商品数据库访问层
│  ├─ redis/              # Redis 客户端/生产者/消费者封装
│  ├─ types/              # 共享类型与表单校验
│  └─ typescript-config/  # 共享 tsconfig
├─ package.json
├─ pnpm-workspace.yaml
└─ turbo.json
```

## 根配置文件说明

- `package.json`：Monorepo 根脚本，提供 `pnpm dev` 与 `pnpm build`
- `pnpm-workspace.yaml`：声明工作区范围，包含 `apps/*` 与 `packages/*`
- `turbo.json`：定义 `build`、`dev`、`check-types`、`db:*` 等流水线任务

## 应用结构与功能分析

### 1. `apps/client` 用户商城前台

技术形态：`Next.js App Router`

#### 主要页面

- 首页：商品推荐和分类入口
  - `apps/client/src/app/page.tsx`
- 商品列表页：支持分类、排序、搜索
  - `apps/client/src/app/products/page.tsx`
  - `apps/client/src/components/ProductList.tsx`
  - `apps/client/src/components/Categories.tsx`
  - `apps/client/src/components/Filter.tsx`
- 商品详情页：展示图片、规格、颜色、价格，并支持推荐尺码
  - `apps/client/src/app/products/[id]/page.tsx`
  - `apps/client/src/components/ProductInteraction.tsx`
- 购物车页：展示购物项、删除商品、进入结算
  - `apps/client/src/app/cart/page.tsx`
- 结算页：收货信息表单 + Payme 支付入口
  - `apps/client/src/app/checkout/page.tsx`
  - `apps/client/src/components/ShippingForm.tsx`
  - `apps/client/src/components/PaymePaymentForm.tsx`
- 订单页：查看当前用户订单
  - `apps/client/src/app/orders/page.tsx`
  - `apps/client/src/components/OrdersClient.tsx`
- 支付回跳页：根据 `orderId` 查询支付状态
  - `apps/client/src/app/return/page.tsx`
- 尺码档案页：记录用户身高、体重、脚长、鞋码
  - `apps/client/src/app/size-profile/page.tsx`
  - `apps/client/src/app/api/size-profile/route.ts`

#### 主要功能

- 商品列表拉取：通过环境变量中的商品服务地址获取数据
  - `apps/client/src/components/ProductList.tsx`
- 商品规格选择：切换颜色、尺码、数量
  - `apps/client/src/components/ProductInteraction.tsx`
- 推荐尺码逻辑：
  - 鞋类按 `sizeProfile.shoeSize` 推荐
  - 服装按身高/体重推断推荐
  - `apps/client/src/app/products/[id]/page.tsx`
- 本地购物车持久化：基于 Zustand + localStorage
  - `apps/client/src/stores/cartStore.ts`
- 收货信息校验：基于 `@repo/types` 里的 `shippingFormSchema`
  - `apps/client/src/components/ShippingForm.tsx`
  - `packages/types/src/cart.ts`
- Payme 支付初始化：向支付服务请求 `paymentUrl`
  - `apps/client/src/components/PaymePaymentForm.tsx`

#### 重要组件

- 导航栏与用户入口
  - `apps/client/src/components/Navbar.tsx`
  - `apps/client/src/components/ProfileButton.tsx`
- 商品卡片与搜索
  - `apps/client/src/components/ProductCard.tsx`
  - `apps/client/src/components/SearchBar.tsx`
- 购物车图标
  - `apps/client/src/components/ShoppingCartIcon.tsx`

### 2. `apps/admin` 管理后台

技术形态：`Next.js App Router + shadcn/ui`

#### 权限与路由保护

- 使用 Clerk 中间件限制后台仅管理员访问
  - `apps/admin/src/middleware.ts`
- Dashboard 与后台布局
  - `apps/admin/src/app/(dashboard)/layout.tsx`
  - `apps/admin/src/components/AppSidebar.tsx`
  - `apps/admin/src/components/Navbar.tsx`

#### 主要页面

- Dashboard 首页：图表、最新订单、统计卡片
  - `apps/admin/src/app/(dashboard)/page.tsx`
  - `apps/admin/src/components/AppBarChart.tsx`
  - `apps/admin/src/components/AppAreaChart.tsx`
  - `apps/admin/src/components/AppPieChart.tsx`
  - `apps/admin/src/components/CardList.tsx`
- 商品管理页：查看商品表格
  - `apps/admin/src/app/(dashboard)/products/page.tsx`
  - `apps/admin/src/app/(dashboard)/products/data-table.tsx`
  - `apps/admin/src/app/(dashboard)/products/columns.tsx`
- 订单管理页：查看订单列表
  - `apps/admin/src/app/(dashboard)/orders/page.tsx`
  - `apps/admin/src/app/(dashboard)/orders/data-table.tsx`
  - `apps/admin/src/app/(dashboard)/orders/columns.tsx`
- 用户管理页：查看用户列表
  - `apps/admin/src/app/(dashboard)/users/page.tsx`
  - `apps/admin/src/app/(dashboard)/users/data-table.tsx`
  - `apps/admin/src/app/(dashboard)/users/columns.tsx`
- 用户详情页：展示个人资料、角色、状态、编辑入口
  - `apps/admin/src/app/(dashboard)/users/[id]/page.tsx`
  - `apps/admin/src/components/EditUser.tsx`
- 未授权页与后台登录页
  - `apps/admin/src/app/(auth)/unauthorized/page.tsx`
  - `apps/admin/src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`

#### 后台核心操作

- 新增商品：表单校验、分类选择、颜色/尺码选择、Cloudinary 图片上传
  - `apps/admin/src/components/AddProduct.tsx`
- 新增分类
  - `apps/admin/src/components/AddCategory.tsx`
- 新增用户：调用认证服务创建 Clerk 用户
  - `apps/admin/src/components/AddUser.tsx`
- 新增订单：关联用户名、邮箱、商品名、数量与状态
  - `apps/admin/src/components/AddOrder.tsx`

### 3. `apps/auth-service` 认证与用户管理服务

技术形态：`Express`

#### 入口与中间件

- 服务入口、CORS、Clerk 中间件、健康检查
  - `apps/auth-service/src/index.ts`
- 用户/管理员权限判断
  - `apps/auth-service/src/middleware/authMiddleware.ts`
- Clerk 服务端客户端封装
  - `apps/auth-service/src/utils/clerk.ts`

#### 功能

- 获取用户列表
  - `apps/auth-service/src/routes/user.route.ts`
- 获取单个用户详情
  - `apps/auth-service/src/routes/user.route.ts`
- 创建用户
  - `apps/auth-service/src/routes/user.route.ts`
- 删除用户
  - `apps/auth-service/src/routes/user.route.ts`
- 用户创建后向 Redis 发布 `user.created` 事件，供邮件服务消费
  - `apps/auth-service/src/routes/user.route.ts`
  - `apps/auth-service/src/utils/redis.ts`

### 4. `apps/product-service` 商品与分类服务

技术形态：`Express + Prisma`

#### 入口与路由

- 服务入口、CORS、Clerk 中间件、健康检查
  - `apps/product-service/src/index.ts`
- 商品路由
  - `apps/product-service/src/routes/product.route.ts`
- 分类路由
  - `apps/product-service/src/routes/category.route.ts`
- 权限中间件
  - `apps/product-service/src/middleware/authMiddleware.ts`

#### 商品功能

- 创建商品，校验 `colors` 与 `images` 的一一对应关系
  - `apps/product-service/src/controllers/product.controller.ts`
- 更新商品
  - `apps/product-service/src/controllers/product.controller.ts`
- 删除商品
  - `apps/product-service/src/controllers/product.controller.ts`
- 商品列表查询：支持 `sort`、`category`、`search`
  - `apps/product-service/src/controllers/product.controller.ts`
- 商品详情查询
  - `apps/product-service/src/controllers/product.controller.ts`

#### 分类功能

- 创建分类
- 更新分类
- 删除分类
- 获取分类列表
  - `apps/product-service/src/controllers/category.controller.ts`

### 5. `apps/order-service` 订单服务

技术形态：`Fastify + Mongoose`

#### 入口与基础设施

- 服务入口、CORS、Clerk 插件、健康检查
  - `apps/order-service/src/index.ts`
- MongoDB 连接
  - `packages/order-db/src/connection.ts`
- 订单模型
  - `packages/order-db/src/order-model.ts`
- 权限中间件
  - `apps/order-service/src/middleware/authMiddleware.ts`

#### 订单功能

- 管理员创建订单
  - `apps/order-service/src/routes/order.ts`
- 用户查看自己的订单
  - `apps/order-service/src/routes/order.ts`
- 管理员查看全部订单
  - `apps/order-service/src/routes/order.ts`
- 用户删除自己的订单，带 48 小时限制
  - `apps/order-service/src/routes/order.ts`
- 管理员删除订单
  - `apps/order-service/src/routes/order.ts`
- 获取畅销商品统计
  - `apps/order-service/src/routes/order.ts`
- 获取近 6 个月订单图表数据
  - `apps/order-service/src/routes/order.ts`

#### 服务协作

- 创建订单时会向商品服务查询商品价格
  - `apps/order-service/src/routes/order.ts`
- 监听 Redis 中的 `payment.successful` 事件并落库生成订单
  - `apps/order-service/src/utils/subscriptions.ts`
  - `apps/order-service/src/utils/order.ts`

### 6. `apps/payment-service` 支付服务

技术形态：`Hono + Prisma`

#### 入口与路由

- 服务入口、Clerk 中间件、CORS、健康检查
  - `apps/payment-service/src/index.ts`
- 创建支付会话与查询支付状态
  - `apps/payment-service/src/routes/session.route.ts`
- Payme 回调处理
  - `apps/payment-service/src/routes/webhooks.route.ts`
- 权限中间件
  - `apps/payment-service/src/middleware/authMiddleware.ts`

#### 支付功能

- 根据购物车金额生成 Payme 支付跳转链接
  - `apps/payment-service/src/routes/session.route.ts`
  - `apps/payment-service/src/utils/payme.ts`
- 根据 `orderId` 查询支付状态
  - `apps/payment-service/src/routes/session.route.ts`
- 处理 Payme 回调方法：
  - `CheckPerformTransaction`
  - `CreateTransaction`
  - `PerformTransaction`
  - `CancelTransaction`
  - `CheckTransaction`
  - `apps/payment-service/src/routes/webhooks.route.ts`
- 交易成功或取消后向 Redis 发布 `payment.successful` 事件
  - `apps/payment-service/src/routes/webhooks.route.ts`

### 7. `apps/email-service` 邮件通知服务

技术形态：`Node.js + Redis Consumer + Nodemailer`

#### 功能

- 监听 `user.created` 事件，发送欢迎邮件
  - `apps/email-service/src/index.ts`
- 监听 `order.created` 事件，发送订单创建通知
  - `apps/email-service/src/index.ts`
- 邮件发送封装
  - `apps/email-service/src/utils/mailer.ts`

## 共享包结构与职责

### 1. `packages/types`

共享类型、表单 Schema、权限声明都集中在这里。

- 统一导出入口
  - `packages/types/src/index.ts`
- 用户与角色相关类型、用户表单校验
  - `packages/types/src/auth.ts`
- 商品类型、颜色/尺码枚举、商品/分类表单校验
  - `packages/types/src/product.ts`
- 购物车类型、收货表单校验、购物车 store 类型
  - `packages/types/src/cart.ts`
- 订单类型、订单状态、订单表单与图表类型
  - `packages/types/src/order.ts`
- 尺码档案类型
  - `packages/types/src/size.ts`

### 2. `packages/product-db`

商品与分类的 Prisma Client 与 Schema。

- Prisma Schema
  - `packages/product-db/prisma/schema.prisma`
- Prisma Client 导出
  - `packages/product-db/src/client.ts`
  - `packages/product-db/src/index.ts`

#### 数据模型

- `Product`
  - 字段：`name`、`shortDescription`、`description`、`price`、`sizes`、`colors`、`images`、`categorySlug`
- `Category`
  - 字段：`name`、`slug`

### 3. `packages/order-db`

订单数据库访问层，基于 Mongoose。

- MongoDB 连接
  - `packages/order-db/src/connection.ts`
- 订单模型 `Order`
  - `packages/order-db/src/order-model.ts`
- 导出入口
  - `packages/order-db/src/index.ts`

#### 数据模型

- `Order`
  - 字段：`userId`、`username`、`email`、`amount`、`status`、`products[]`

### 4. `packages/payment-db`

支付事务的 Prisma Client 与 Payme 交易表。

- Prisma Schema
  - `packages/payment-db/prisma/schema.prisma`
- Prisma Client 导出
  - `packages/payment-db/src/client.ts`
  - `packages/payment-db/src/index.ts`

#### 数据模型

- `PaymeTransaction`
  - 字段：`id`、`orderId`、`amount`、`state`、`reason`
  - 时间字段：`createTime`、`performTime`、`cancelTime`

### 5. `packages/redis`

Redis 客户端与 Pub/Sub 基础封装。

- Redis Client 创建
  - `packages/redis/src/client.ts`
- 消息生产者
  - `packages/redis/src/producer.ts`
- 消息消费者
  - `packages/redis/src/consumer.ts`
- 对外导出
  - `packages/redis/src/index.ts`

### 6. 配置包

- 共享 TypeScript 配置
  - `packages/typescript-config/base.json`
  - `packages/typescript-config/nextjs.json`
  - `packages/typescript-config/react-library.json`
- 共享 ESLint 配置
  - `packages/eslint-config/base.js`
  - `packages/eslint-config/next.js`
  - `packages/eslint-config/react-internal.js`

## 关键业务链路

### 用户下单与支付链路

1. 用户在前台选择商品并加入购物车  
   对应文件：`apps/client/src/components/ProductInteraction.tsx`、`apps/client/src/stores/cartStore.ts`
2. 用户在结算页填写收货信息并请求支付链接  
   对应文件：`apps/client/src/components/ShippingForm.tsx`、`apps/client/src/components/PaymePaymentForm.tsx`
3. 支付服务生成 Payme 跳转地址  
   对应文件：`apps/payment-service/src/routes/session.route.ts`、`apps/payment-service/src/utils/payme.ts`
4. Payme 回调支付结果，支付服务记录交易并发布消息  
   对应文件：`apps/payment-service/src/routes/webhooks.route.ts`
5. 订单服务订阅 `payment.successful`，写入订单库  
   对应文件：`apps/order-service/src/utils/subscriptions.ts`、`apps/order-service/src/utils/order.ts`
6. 用户在订单页查看自己的订单  
   对应文件：`apps/client/src/app/orders/page.tsx`

### 管理员运营链路

1. 管理员登录后台  
   对应文件：`apps/admin/src/middleware.ts`
2. 创建分类、商品、用户、订单  
   对应文件：`apps/admin/src/components/AddCategory.tsx`、`AddProduct.tsx`、`AddUser.tsx`、`AddOrder.tsx`
3. 后台列表页从各服务拉取数据渲染表格与图表  
   对应文件：`apps/admin/src/app/(dashboard)/*`

### 用户注册通知链路

1. 认证服务创建 Clerk 用户  
   对应文件：`apps/auth-service/src/routes/user.route.ts`
2. 认证服务发布 `user.created` 事件  
   对应文件：`apps/auth-service/src/routes/user.route.ts`
3. 邮件服务订阅事件并发送欢迎邮件  
   对应文件：`apps/email-service/src/index.ts`

## 端口约定

- `client`：`3002`
- `admin`：`3003`
- `product-service`：`8000`
- `order-service`：`8001`
- `payment-service`：`8002`
- `auth-service`：`8003`

## 常用命令

在仓库根目录执行：

```bash
pnpm install
pnpm dev
pnpm build
```

按应用单独启动时，可使用：

```bash
pnpm --filter client dev
pnpm --filter admin dev
pnpm --filter product-service dev
pnpm --filter order-service dev
pnpm --filter payment-service dev
pnpm --filter auth-service dev
pnpm --filter email-service dev
```

## 关键环境变量

从代码中可以确认至少需要以下变量：

- `DATABASE_URL`
- `PAYMENT_DATABASE_URL`
- `MONGO_URL`
- `REDIS_URL`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`
- `NEXT_PUBLIC_PRODUCT_SERVICE_URL`
- `NEXT_PUBLIC_ORDER_SERVICE_URL`
- `NEXT_PUBLIC_PAYMENT_SERVICE_URL`
- `NEXT_PUBLIC_AUTH_SERVICE_URL`
- `PRODUCT_SERVICE_URL`
- `ORDER_SERVICE_URL`
- `PAYME_MERCHANT_ID`
- `PAYME_MERCHANT_KEY`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`

## 当前项目特点总结

- 不是单体应用，而是一个拆分明确的电商微服务风格 Monorepo
- 商品与支付数据使用 PostgreSQL/Prisma，订单使用 MongoDB/Mongoose
- 认证统一走 Clerk，前台与后台都复用同一套身份体系
- Redis 负责跨服务消息通知，当前重点链路为用户创建与支付成功
- `packages/types` 是整个仓库的契约中心，前后端表单和类型都依赖它

## 备注

- 根目录原有 `README.md` 是 Turborepo 默认模板，已经不再反映本项目实际结构。
- 仓库中部分文件带有旧注释或历史遗留命名，例如 `webhooks.route.ts` 实际承载的是 Payme 回调逻辑，这一点在阅读代码时需要注意。
