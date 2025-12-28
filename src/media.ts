import fs from 'fs';
import path from 'path';
import ffmpeg, { FfprobeData, FfprobeStream } from 'fluent-ffmpeg';
import { config, SUPPORTED_VIDEO_EXTENSIONS } from './config.js';
import { VideoFile, MediaMetadata, StreamInfo } from './types.js';
import { getSecureFilePath } from './security.js';

/**
 * Lists all video files in the configured media directory
 */
export async function listVideoFiles(): Promise<VideoFile[]> {
  return new Promise((resolve, reject) => {
    fs.readdir(config.mediaDir, (err, files) => {
      if (err !== null) {
        reject(new Error(`Failed to read media directory: ${err.message}`));
        return;
      }

      const videoFiles: VideoFile[] = [];

      const processFile = (filename: string): void => {
        const ext = path.extname(filename).toLowerCase();
        if (!SUPPORTED_VIDEO_EXTENSIONS.includes(ext)) {
          return;
        }

        const filePath = path.join(config.mediaDir, filename);
        try {
          const stats = fs.statSync(filePath);
          if (stats.isFile()) {
            videoFiles.push({
              name: filename,
              path: filename,
              size: stats.size,
              extension: ext,
              createdAt: stats.birthtime,
              modifiedAt: stats.mtime,
            });
          }
        } catch {
          // Skip files that can't be accessed
        }
      };

      files.forEach(processFile);
      resolve(videoFiles);
    });
  });
}

/**
 * Gets metadata for a specific video file using ffprobe
 */
export async function getVideoMetadata(filename: string): Promise<MediaMetadata> {
  const filePath = getSecureFilePath(filename);
  if (filePath === null) {
    throw new Error('Invalid filename');
  }

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new Error('File not found');
  }

  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err: Error | null, data: FfprobeData) => {
      if (err !== null) {
        reject(new Error(`Failed to probe file: ${err.message}`));
        return;
      }

      const format = data.format;
      const streams: StreamInfo[] = data.streams.map((stream: FfprobeStream, index: number) => ({
        index,
        codecName: stream.codec_name ?? 'unknown',
        codecLongName: stream.codec_long_name ?? 'unknown',
        codecType: (stream.codec_type ?? 'data') as StreamInfo['codecType'],
        profile: stream.profile !== undefined ? String(stream.profile) : undefined,
        width: stream.width,
        height: stream.height,
        aspectRatio: stream.display_aspect_ratio,
        frameRate: stream.r_frame_rate,
        bitRate:
          stream.bit_rate !== undefined ? parseInt(stream.bit_rate, 10) : undefined,
        sampleRate:
          stream.sample_rate !== undefined ? stream.sample_rate : undefined,
        channels: stream.channels,
        channelLayout: stream.channel_layout,
        language: (stream.tags as Record<string, string> | undefined)?.language,
        title: (stream.tags as Record<string, string> | undefined)?.title,
      }));

      const metadata: MediaMetadata = {
        filename,
        format: {
          filename: format.filename ?? filename,
          formatName: format.format_name ?? 'unknown',
          formatLongName: format.format_long_name ?? 'unknown',
          duration: format.duration ?? 0,
          size: format.size ?? 0,
          bitRate: format.bit_rate ?? 0,
          tags: format.tags as Record<string, string> | undefined,
        },
        streams,
        duration: format.duration ?? 0,
        size: format.size ?? 0,
        bitRate: format.bit_rate ?? 0,
      };

      resolve(metadata);
    });
  });
}

/**
 * Checks if a video file exists and returns its stats
 */
export function getFileStats(filename: string): fs.Stats | null {
  const filePath = getSecureFilePath(filename);
  if (filePath === null) {
    return null;
  }

  try {
    return fs.statSync(filePath);
  } catch {
    return null;
  }
}
