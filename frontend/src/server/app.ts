import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

// PHASE 1
import { errorMiddleware } from './shared/middleware/error.middleware'
import { notFound } from './shared/middleware/not-found.middleware'
import { requestIdMiddleware } from './shared/middleware/request-id.middleware'

// PHASE 2 - Auth
import authRoutes from "./modules/auth/index"
import userRoutes from "./modules/user/user.routes"

// PHASE 3 - Product
import productRoutes from "./modules/product/index"

// PHASE 2 - Step 9: Security Hardening
import { helmetMiddleware } from "./shared/security/helmet.config"

// Phase 3 - Category
import categoryRoutes from "./modules/category/index"

// Phase 4 - Cart
import cartRoutes from "./modules/cart/cart.routes"

// Phase 4 - Step 5: Checkout
import checkoutRoutes from "./modules/checkout/checkout.routes"

// Phase 4 - Step 6: Order
import orderRoutes from "./modules/order/order.routes"

// Address Routes
import addressRoutes from "./modules/address/address.routes"

// Shipping Routes
import shippingRoutes from "./modules/shipping/shipping.routes"

// Payment Methods Routes
import paymentMethodsRoutes from "./modules/payment/payment-methods.routes"

const app = express()

// ============ TRUST PROXY ============
app.set("trust proxy", 1)

// ============ MIDDLEWARE ============
app.use(helmetMiddleware())

// CORS: allow same-origin & configured origins
app.use(cors({
  origin: true,
  credentials: true,
}))

app.use(cookieParser())
app.use(express.json())
app.use(requestIdMiddleware)

// ============ HEALTH CHECK ============
app.get('/health', (_, res) => {
    return res.status(200).json({
        status: "UP",
        service: "Pasaria Fullstack API (Vercel Serverless)"
    })
})

// ============ ROUTES ============
app.use("/auth", authRoutes)
app.use("/users", userRoutes)
app.use("/products", productRoutes)
app.use("/categories", categoryRoutes)
app.use("/cart", cartRoutes)
app.use("/checkout", checkoutRoutes)
app.use("/orders", orderRoutes)
app.use("/addresses", addressRoutes)
app.use("/shipping", shippingRoutes)
app.use("/payments", paymentMethodsRoutes)

// ============ ERROR HANDLING ============
app.use(notFound)
app.use(errorMiddleware)

export default app
export { app }
