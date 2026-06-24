import { createClient } from "redis";

export const redis = 
    createClient({
        url:
            process.env.REDIS_URL,
        socket:{
            reconnectStrategy(retries){
            if(retries>5){
                console.error("[REDIS] reconnect stopped")
                return false
            }
            
            return Math.min(
                retries*300,
            3000)
        }
    }
})

redis.on(
    "error", 
    (err) => {
        const ignored=[
            "Socket closed unexpectedly", "ECONNREFUSED"
        ]
        if(ignored.some(
            msg => err.message.includes(msg)
        )){
            return
        }
        console.error(
            "[REDIS]",
            err.message
        )
    }
)