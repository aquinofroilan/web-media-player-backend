import path from "path"
import { config } from "./config.js"

/**
 * Validates and sanitizes a filename to prevent path traversal attacks.
 * Returns the safe absolute path if valid, or null if the filename is malicious.
 */
export function getSecureFilePath(filename: string): string | null {
    // Reject empty filename
    if (filename === "") {
        return null
    }

    // Reject if filename contains any path separators or parent directory references
    if (
        filename.includes("/") ||
        filename.includes("\\") ||
        filename.includes("..") ||
        filename.includes("\0")
    ) {
        return null
    }

    // Normalize and resolve the full path
    const fullPath = path.resolve(config.mediaDir, filename)

    // Ensure the resolved path is within the media directory
    const normalizedMediaDir = path.resolve(config.mediaDir)

    // Must be within the media directory (with a path separator) or equal to media dir
    // We require a separator to ensure we're not accessing partial directory names
    if (normalizedMediaDir !== fullPath && !fullPath.startsWith(normalizedMediaDir + path.sep)) {
        return null
    }

    // Reject if the path equals the media directory itself (we want files, not the directory)
    if (normalizedMediaDir === fullPath) {
        return null
    }

    return fullPath
}

/**
 * Validates that a filename is safe (no path traversal attempts)
 */
export function isValidFilename(filename: string): boolean {
    return getSecureFilePath(filename) !== null
}
