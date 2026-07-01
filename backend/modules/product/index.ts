// modules/product/index.ts
// UPDATE: Export image modules

export * from "./controllers/product.controller.js"
export * from "./controllers/image.controller.js"
export * from "./services/product.service.js"
export * from "./services/image.service.js"
export * from "./services/inventory.service.js"
export * from "./rules/product.rules.js"
export * from "./rules/image.rules.js"
export * from "./validation/product.validation.js"
export * from "./validation/image.validation.js"
export * from "./types/product.dto.js"
export * from "./types/image.dto.js"

export { default } from "./routes/product.routes.js"