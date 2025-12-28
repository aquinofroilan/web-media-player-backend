export interface VideoFile {
    filename: string
    path: string
    size: number
    extension: string
    createdAt: Date
    modifiedAt: Date
}

export interface VideoTrack {
    index: number
    codec: string
    width: number
    height: number
    frameRate?: number
    bitRate?: number
}

export interface AudioTrack {
    index: number
    codec: string
    channels: number
    channelLayout?: string
    sampleRate?: number
    bitRate?: number
    language?: string
    title?: string
}

export interface SubtitleTrack {
    index: number
    codec: string
    language?: string
    title?: string
}

export interface MediaMetadata {
    filename: string
    format: string
    duration: number
    size: number
    video?: VideoTrack
    audio?: AudioTrack[]
    subtitles?: SubtitleTrack[]
    has51Audio: boolean
}

export interface FormatInfo {
    filename: string
    formatName: string
    formatLongName: string
    duration: number
    size: number
    bitRate: number
    tags?: Record<string, string>
}

export interface StreamInfo {
    index: number
    codecName: string
    codecLongName: string
    codecType: "video" | "audio" | "subtitle" | "data"
    profile?: string
    width?: number
    height?: number
    aspectRatio?: string
    frameRate?: string
    bitRate?: number
    sampleRate?: number
    channels?: number
    channelLayout?: string
    language?: string
    title?: string
}

export interface ApiError {
    error: string
    message: string
    statusCode: number
}
