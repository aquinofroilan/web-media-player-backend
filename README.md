# web-media-player-backend

Express.js backend to serve, probe, and stream local media files with browser-compatible playback support.

## Features

- **List Video Files**: Browse video files from configured media directory
- **Metadata Extraction**: Get detailed video/audio metadata using ffprobe
- **Video Streaming**: Stream media files with Range request support
- **Audio Transcoding**: Transcode audio to AAC 5.1 for browser compatibility
- **Secure File Access**: Path traversal protection and input validation
- **CORS Support**: Configured for localhost development
- **Hardware Acceleration**: Optional GPU acceleration support (nvidia, vaapi, videotoolbox, qsv)
- **Strict TypeScript**: Fully typed codebase with strict mode enabled

## Requirements

- Node.js 18+
- FFmpeg and FFprobe installed and available in PATH

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Configure the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `MEDIA_DIR` | Path to your media files directory | `./media` |
| `PORT` | Server port | `3000` |
| `HWACCEL` | Hardware acceleration (nvidia, vaapi, videotoolbox, qsv) | disabled |
| `NODE_ENV` | Node environment | `development` |

## Usage

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

## API Endpoints

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### GET /api/files

List all video files in the media directory.

**Response:**
```json
{
  "files": [
    {
      "name": "video.mp4",
      "path": "video.mp4",
      "size": 1234567890,
      "extension": ".mp4",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "modifiedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

### GET /api/metadata/:filename

Get detailed metadata for a specific video file using ffprobe.

**Response:**
```json
{
  "filename": "video.mp4",
  "format": {
    "filename": "video.mp4",
    "formatName": "mov,mp4,m4a,3gp,3g2,mj2",
    "formatLongName": "QuickTime / MOV",
    "duration": 120.5,
    "size": 1234567890,
    "bitRate": 5000000
  },
  "streams": [
    {
      "index": 0,
      "codecName": "h264",
      "codecType": "video",
      "width": 1920,
      "height": 1080
    }
  ],
  "duration": 120.5,
  "size": 1234567890,
  "bitRate": 5000000
}
```

### GET /api/stream/:filename

Stream a video file with Range request support.

**Query Parameters:**
- `transcode=true`: Enable audio transcoding to AAC 5.1 (copies video, transcodes audio)

**Headers:**
- `Range`: Byte range for partial content (e.g., `bytes=0-1000000`)

**Response:**
- Direct streaming with proper Content-Type and Range headers
- Supports partial content (206) for seeking

## Security

- Path traversal protection prevents access to files outside media directory
- Input validation for all user-provided parameters
- CORS configured for localhost origins only

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Run production server |
| `npm run dev` | Run development server with hot reload |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm test` | Run tests |
| `npm run test:coverage` | Run tests with coverage |

## Supported Video Formats

- MP4, MKV, AVI, MOV, WMV, WebM, FLV, M4V, TS, MTS, M2TS

## License

MIT