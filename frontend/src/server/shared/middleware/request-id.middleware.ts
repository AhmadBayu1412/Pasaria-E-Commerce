import { randomUUID } from "crypto";
import express from "express"

declare global {
    namespace Express {
        interface Request {
            requestId: string
        }
    }
}

export function requestIdMiddleware(
    req: express.Request,
    _res: express.Response,
    next: express.NextFunction
) {
    // ← FIX: req.headers (plural), bukan req.header (singular)
    req.requestId = req.headers["x-request-id"] as string || randomUUID()
    next()
}