import dotenv from "dotenv"
import path from "path"

dotenv.config()

export interface Config {
    port: number
    mediaDir: string
    hwAccel: string | undefined
    nodeEnv: string
    allowedOrigins: string[]
}

const mediaDir = process.env["MEDIA_DIR"] ?? "./media"

export const config: Config = {
    port: parseInt(process.env["PORT"] ?? "3000", 10),
    mediaDir: path.isAbsolute(mediaDir) ? mediaDir : path.resolve(process.cwd(), mediaDir),
    hwAccel: process.env["HWACCEL"] ?? undefined,
    nodeEnv: process.env["NODE_ENV"] ?? "development",
    allowedOrigins: [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080"
    ]
}

export const SUPPORTED_VIDEO_EXTENSIONS = [
    ".mp4",
    ".mkv",
    ".avi",
    ".mov",
    ".wmv",
    ".webm",
    ".flv",
    ".m4v",
    ".ts",
    ".mts",
    ".m2ts"
]
