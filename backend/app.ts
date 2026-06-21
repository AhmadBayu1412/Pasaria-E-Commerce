import express, { Request, Response } from "express";
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())

// Base health check route (Sesuai phase 1)
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'UP',
        message: 'Pasaria E-Commerce API is running on Modular Monolith architecture'
    })
})

app.listen(port, () => {
    console.log(`⚡️[server]: Server Pasaria berjalan di http://localhost:${port}`)
})