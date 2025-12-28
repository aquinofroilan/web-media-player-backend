import { Request, Response, NextFunction } from "express"
import fs from "fs"
import ffmpeg from "fluent-ffmpeg"
import { listVideoFiles, getVideoMetadata, getFileStats } from "./media.js"
import { getSecureFilePath } from "./security.js"
import { config } from "./config.js"
import { ApiError } from "./types.js"

/**
 * Send an API error response
 */
function sendError(res: Response, statusCode: number, error: string, message: string): void {
    const errorResponse: ApiError = { error, message, statusCode }
    res.status(statusCode).json(errorResponse)
}

/**
 * GET /api/files - List all video files in the media directory
 */
export async function listFilesHandler(
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const files = await listVideoFiles()
        res.json({ files, total: files.length })
    } catch (err) {
        next(err)
    }
}

/**
 * GET /api/metadata/:filename - Get metadata for a specific video file
 */
export async function getMetadataHandler(
    req: Request<{ filename: string }>,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { filename } = req.params
        if (filename === "") {
            sendError(res, 400, "BAD_REQUEST", "Filename is required")
            return
        }

        const metadata = await getVideoMetadata(filename)
        res.json(metadata)
    } catch (err) {
        if (err instanceof Error) {
            if (err.message === "Invalid filename") {
                sendError(res, 400, "BAD_REQUEST", "Invalid filename")
                return
            }
            if (err.message === "File not found") {
                sendError(res, 404, "NOT_FOUND", "File not found")
                return
            }
        }
        next(err)
    }
}

/**
 * Parse Range header and return start/end bytes
 */
function parseRange(rangeHeader: string, fileSize: number): { start: number; end: number } | null {
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader)
    if (match === null) {
        return null
    }

    const startStr: string = match[1]
    const endStr: string = match[2]

    if (startStr === "") {
        // Suffix range: bytes=-500 means last 500 bytes
        if (endStr === "") {
            return null
        }
        const suffixLength = parseInt(endStr, 10)
        const start = Math.max(0, fileSize - suffixLength)
        return { start, end: fileSize - 1 }
    }

    const start = parseInt(startStr, 10)
    const end = endStr !== "" ? parseInt(endStr, 10) : fileSize - 1

    if (start > end || start >= fileSize) {
        return null
    }

    return { start, end: Math.min(end, fileSize - 1) }
}

/**
 * Check if audio transcoding to AAC 5.1 is needed
 */
async function needsAudioTranscoding(filePath: string): Promise<boolean> {
    return new Promise(resolve => {
        ffmpeg.ffprobe(filePath, (err, data) => {
            if (err !== null) {
                resolve(false)
                return
            }

            const audioStream = data.streams.find(s => s.codec_type === "audio")
            if (audioStream === undefined) {
                resolve(false)
                return
            }

            // Only transcode incompatible codecs (AC3, DTS, etc.)
            // Browsers can handle AAC 5.1/7.1 natively
            const codecName = audioStream.codec_name ?? ""
            const incompatibleCodecs = ["ac3", "eac3", "dts", "truehd", "flac", "pcm_s16le"]
            const needsTranscode = incompatibleCodecs.includes(codecName.toLowerCase())
            resolve(needsTranscode)
        })
    })
}

/**
 * GET /api/stream/:filename - Stream or transcode a video file
 */
export async function streamHandler(
    req: Request<{ filename: string }>,
    res: Response,
    _next: NextFunction
): Promise<void> {
    try {
        const { filename } = req.params
        if (filename === "") {
            sendError(res, 400, "BAD_REQUEST", "Filename is required")
            return
        }

        const filePath = getSecureFilePath(filename)
        if (filePath === null) {
            sendError(res, 400, "BAD_REQUEST", "Invalid filename")
            return
        }

        const stats = getFileStats(filename)
        if (stats === null) {
            sendError(res, 404, "NOT_FOUND", "File not found")
            return
        }

        const transcode = req.query["transcode"] === "true"
        const startTime = req.query["startTime"] ? parseFloat(req.query["startTime"] as string) : 0
        const rangeHeader = req.headers.range

        if (transcode) {
            // Transcode mode: copy video, transcode audio to AAC 5.1
            await streamWithTranscode(filePath, res, startTime)
        } else if (rangeHeader !== undefined) {
            // Range request for direct streaming
            streamWithRange(filePath, stats.size, rangeHeader, res)
        } else {
            // Direct streaming without range
            streamDirect(filePath, stats.size, res)
        }
    } catch {
        if (!res.headersSent) {
            sendError(res, 500, "INTERNAL_ERROR", "Failed to stream file")
        }
    }
}

/**
 * Stream file with Range support
 */
function streamWithRange(
    filePath: string,
    fileSize: number,
    rangeHeader: string,
    res: Response
): void {
    const range = parseRange(rangeHeader, fileSize)

    if (range === null) {
        res.status(416)
            .set("Content-Range", `bytes */${String(fileSize)}`)
            .end()
        return
    }

    const { start, end } = range
    const chunkSize = end - start + 1

    res.status(206)
    res.set({
        "Content-Range": `bytes ${String(start)}-${String(end)}/${String(fileSize)}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize.toString(),
        "Content-Type": "video/mp4"
    })

    const stream = fs.createReadStream(filePath, { start, end })
    stream.pipe(res)

    stream.on("error", () => {
        if (!res.headersSent) {
            res.status(500).end()
        }
    })
}

/**
 * Stream file directly without range
 */
function streamDirect(filePath: string, fileSize: number, res: Response): void {
    res.set({
        "Content-Length": fileSize.toString(),
        "Content-Type": "video/mp4",
        "Accept-Ranges": "bytes"
    })

    const stream = fs.createReadStream(filePath)
    stream.pipe(res)

    stream.on("error", () => {
        if (!res.headersSent) {
            res.status(500).end()
        }
    })
}

/**
 * Stream with transcoding: copy video, transcode audio to AAC 5.1
 */
async function streamWithTranscode(
    filePath: string,
    res: Response,
    startTime: number = 0
): Promise<void> {
    const needsTranscode = await needsAudioTranscoding(filePath)

    res.set({
        "Content-Type": "video/mp4",
        "Transfer-Encoding": "chunked"
    })

    const command = ffmpeg(filePath)

    // Add hardware acceleration if configured
    if (config.hwAccel !== undefined && config.hwAccel !== "") {
        command.inputOptions([`-hwaccel ${config.hwAccel}`])
    }

    // Seek to start time if provided
    if (startTime > 0) {
        command.seekInput(startTime)
    }

    command
        .outputOptions([
            "-movflags",
            "frag_keyframe+empty_moov+faststart",
            "-c:v",
            "copy" // Copy video stream
        ])
        .outputOptions(
            needsTranscode ?
                ["-c:a", "aac", "-ac", "6", "-b:a", "384k"] // Transcode audio to AAC 5.1
            :   ["-c:a", "copy"] // Copy audio if already compatible
        )
        .format("mp4")
        .on("error", (err: Error) => {
            console.error("FFmpeg error:", err.message)
            if (!res.headersSent) {
                res.status(500).end()
            }
        })
        .pipe(res, { end: true })
}
function convertSrtToVtt(srt: string): string {
    return "WEBVTT\n\n" + srt.replace(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/g, "$1:$2:$3.$4")
}
export async function getSubtitlesHandler(
    req: Request<{ filename: string }>,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { filename } = req.params
        const baseName = filename.replace(/\.[^/.]+$/, "") // Remove extension

        // Look for .vtt or .srt file
        const vttPath = getSecureFilePath(`${baseName}.vtt`)
        const srtPath = getSecureFilePath(`${baseName}.srt`)

        if (vttPath && fs.existsSync(vttPath)) {
            res.sendFile(vttPath)
        } else if (srtPath && fs.existsSync(srtPath)) {
            // Convert SRT to VTT if needed
            const srtContent = fs.readFileSync(srtPath, "utf-8")
            const vttContent = convertSrtToVtt(srtContent)
            res.set("Content-Type", "text/vtt")
            res.send(vttContent)
        } else {
            sendError(res, 404, "NOT_FOUND", "Subtitles not found")
        }
    } catch (err) {
        next(err)
    }
}
