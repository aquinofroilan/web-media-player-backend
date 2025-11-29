import { getSecureFilePath, isValidFilename } from '../src/security.js';
import { config } from '../src/config.js';
import path from 'path';

describe('Security', () => {
  describe('getSecureFilePath', () => {
    it('should return valid path for simple filename', () => {
      const result = getSecureFilePath('video.mp4');
      expect(result).toBe(path.join(config.mediaDir, 'video.mp4'));
    });

    it('should reject path traversal attempts with ../', () => {
      const result = getSecureFilePath('../etc/passwd');
      expect(result).toBeNull();
    });

    it('should reject path traversal attempts with /', () => {
      const result = getSecureFilePath('/etc/passwd');
      expect(result).toBeNull();
    });

    it('should reject path traversal attempts with backslash', () => {
      const result = getSecureFilePath('..\\windows\\system32');
      expect(result).toBeNull();
    });

    it('should reject null byte injection', () => {
      const result = getSecureFilePath('video.mp4\x00.txt');
      expect(result).toBeNull();
    });

    it('should reject embedded path separators', () => {
      const result = getSecureFilePath('subdir/video.mp4');
      expect(result).toBeNull();
    });

    it('should handle empty string', () => {
      const result = getSecureFilePath('');
      // Empty string should be considered invalid
      expect(result).toBeNull();
    });
  });

  describe('isValidFilename', () => {
    it('should return true for valid filename', () => {
      expect(isValidFilename('video.mp4')).toBe(true);
    });

    it('should return false for path traversal', () => {
      expect(isValidFilename('../video.mp4')).toBe(false);
    });

    it('should return false for absolute path', () => {
      expect(isValidFilename('/video.mp4')).toBe(false);
    });
  });
});
