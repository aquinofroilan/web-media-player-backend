export interface VideoFile {
  name: string;
  path: string;
  size: number;
  extension: string;
  createdAt: Date;
  modifiedAt: Date;
}

export interface MediaMetadata {
  filename: string;
  format: FormatInfo;
  streams: StreamInfo[];
  duration: number;
  size: number;
  bitRate: number;
}

export interface FormatInfo {
  filename: string;
  formatName: string;
  formatLongName: string;
  duration: number;
  size: number;
  bitRate: number;
  tags?: Record<string, string>;
}

export interface StreamInfo {
  index: number;
  codecName: string;
  codecLongName: string;
  codecType: 'video' | 'audio' | 'subtitle' | 'data';
  profile?: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  frameRate?: string;
  bitRate?: number;
  sampleRate?: number;
  channels?: number;
  channelLayout?: string;
  language?: string;
  title?: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
