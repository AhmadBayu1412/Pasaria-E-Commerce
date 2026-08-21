import { Request, Response } from "express"

export function notFound(req: Request, res: Response) {
    return res
        .status(404)
        .json({
            error: {
                code: "NOT_FOUND",
                message: `Route ${req.method} ${req.path} tidak ditemukan`
            }
        })
}