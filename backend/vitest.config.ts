import { defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        globals: true,
        environment: "node",
        include: ["tests/**/*.test.ts"],
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            include: ["modules/**/*.ts"],
            exclude: ["modules/**/*.routes.ts", "modules/**/*.dto.ts"]
        }
    }
})
