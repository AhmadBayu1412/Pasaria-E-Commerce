import { Request, Response, NextFunction } from "express";

export function errorMiddleware(
    err:any,
    req:Request,
    res:Response,
    next:NextFunction
) {
    // console.error(err) // Uncomment jika ingin debugging
    if (res.headersSent) {
        return next(err)
    }
    
    // STEP 8 cek err.statusCode (dari Business Error) atau err.status (dari library lain)
    const statusCode = err.statusCode || err.status || 500

    return res
        .status(statusCode)
        .json({
            success:false, 
            message:err.message || "Internal Error"
        })
}