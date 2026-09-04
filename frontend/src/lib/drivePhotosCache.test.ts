import { describe, it, expect } from 'vitest';
import {
  extractDriveId,
  formatDriveImageUrl,
  formatDriveVideoPreviewUrl,
  ephemeralSession,
} from './drivePhotosCache';

describe('drivePhotosCache', () => {
  it('correctly extracts file ID from standard Google Drive share links', () => {
    const shareLink = 'https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j/view?usp=sharing';
    const { id, isFolder } = extractDriveId(shareLink);
    expect(id).toBe('1a2b3c4d5e6f7g8h9i0j');
    expect(isFolder).toBe(false);
  });

  it('correctly extracts folder ID from Google Drive folder share links', () => {
    const folderLink = 'https://drive.google.com/drive/folders/1XYZ987654321folder';
    const { id, isFolder } = extractDriveId(folderLink);
    expect(id).toBe('1XYZ987654321folder');
    expect(isFolder).toBe(true);
  });

  it('correctly extracts ID from open?id= format', () => {
    const openLink = 'https://drive.google.com/open?id=abc123DEF456';
    const { id, isFolder } = extractDriveId(openLink);
    expect(id).toBe('abc123DEF456');
    expect(isFolder).toBe(false);
  });

  it('formats Google Drive link into high-res thumbnail CDN URL', () => {
    const shareLink = 'https://drive.google.com/file/d/test1234567890/view';
    const formatted = formatDriveImageUrl(shareLink);
    expect(formatted).toBe('https://drive.google.com/thumbnail?id=test1234567890&sz=w1600');
  });

  it('preserves non-drive image URLs', () => {
    const directUrl = 'https://images.unsplash.com/photo-1234567';
    expect(formatDriveImageUrl(directUrl)).toBe(directUrl);
  });

  it('formats Google Drive link into video preview player URL', () => {
    const videoLink = 'https://drive.google.com/file/d/vid1234567890/view';
    const previewUrl = formatDriveVideoPreviewUrl(videoLink);
    expect(previewUrl).toBe('https://drive.google.com/file/d/vid1234567890/preview');
  });

  it('ephemeral session registers and revokes temporary blob URLs on cleanup', () => {
    // Register mock blob URLs
    const blob1 = ephemeralSession.registerBlob('blob:http://localhost:3000/uuid-1');
    const blob2 = ephemeralSession.registerBlob('blob:http://localhost:3000/uuid-2');
    expect(blob1).toBe('blob:http://localhost:3000/uuid-1');
    expect(blob2).toBe('blob:http://localhost:3000/uuid-2');
    expect(ephemeralSession.getActiveCount()).toBe(2);

    // Run cleanup
    ephemeralSession.cleanup();
    expect(ephemeralSession.getActiveCount()).toBe(0);
  });
});
