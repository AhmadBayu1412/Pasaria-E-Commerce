import { Response, Request } from "express"
export function ok(res:Response){
    return res
    .json({
         success:true,
    })
}

export function fail(res:Response){
    return res
    .json({
        success:false,
        message:"Invalid id"
    })
}