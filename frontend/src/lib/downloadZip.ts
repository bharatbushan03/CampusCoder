import JSZip from 'jszip';
import { toast } from 'sonner';

/**
 * Downloads a single photo directly to the student's device as a file.
 */
export async function downloadSinglePhoto(
  url: string,
  filename?: string
): Promise<void> {
  const toastId = toast.loading('Preparing photo download...');
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) {
      throw new Error(`Failed to fetch image (${response.statusText})`);
    }

    const blob = await response.blob();
    const cleanExt = blob.type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    const finalFilename = filename || `event-photo-${Date.now()}.${cleanExt}`;

    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = finalFilename.endsWith(`.${cleanExt}`) ? finalFilename : `${finalFilename}.${cleanExt}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);

    toast.success('Photo downloaded successfully!', { id: toastId });
  } catch (err: any) {
    console.error('Error downloading photo:', err);
    // Fallback direct link open if CORS restricts fetch
    try {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = filename || 'event-photo.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Opening photo for download...', { id: toastId });
    } catch {
      toast.error('Failed to download photo. Please try again.', { id: toastId });
    }
  }
}

export async function downloadSingleMedia(url: string, filename?: string): Promise<void> {
  const toastId = toast.loading('Preparing media download...');
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch media (${response.statusText})`);
    const blob = await response.blob();
    const extension = blob.type.split('/')[1]?.replace('jpeg', 'jpg') || 'mp4';
    const link = document.createElement('a');
    const blobUrl = URL.createObjectURL(blob);
    link.href = blobUrl;
    link.download = filename || `event-media-${Date.now()}.${extension}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
    toast.success('Media downloaded successfully!', { id: toastId });
  } catch (error) {
    console.error('Error downloading media:', error);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'event-media';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
    toast.success('Opening media for download...', { id: toastId });
  }
}

/**
 * Downloads all event photos packaged into a single .zip file client-side.
 */
export async function downloadEventPhotosZip(
  photos: string[],
  eventTitle: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  if (!photos || photos.length === 0) {
    toast.error('No photos available to download.');
    return;
  }

  const toastId = toast.loading(`Preparing ZIP archive for ${photos.length} photos...`);
  const safeSlug = eventTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'event';
  const zipFilename = `${safeSlug}-photos.zip`;

  try {
    const zip = new JSZip();
    const folderName = `${safeSlug}-photos`;
    const folder = zip.folder(folderName) || zip;

    let successfulDownloads = 0;

    for (let i = 0; i < photos.length; i++) {
      const photoUrl = photos[i];
      try {
        const res = await fetch(photoUrl, { mode: 'cors' });
        if (res.ok) {
          const blob = await res.blob();
          const ext = blob.type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
          const paddedIndex = String(i + 1).padStart(2, '0');
          const photoName = `photo-${paddedIndex}.${ext}`;
          folder.file(photoName, blob);
          successfulDownloads++;
        }
      } catch (fetchErr) {
        console.warn(`Could not include photo ${i + 1} in zip:`, fetchErr);
      }

      const percent = Math.round(((i + 1) / photos.length) * 80);
      onProgress?.(percent);
      toast.loading(`Gathering photos: ${i + 1}/${photos.length}...`, { id: toastId });
    }

    if (successfulDownloads === 0) {
      throw new Error('Unable to download photos due to network restrictions.');
    }

    toast.loading('Compressing photos into ZIP package...', { id: toastId });
    onProgress?.(90);

    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    onProgress?.(100);

    const downloadUrl = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = zipFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);

    toast.success(`Downloaded ${successfulDownloads} photos as ZIP!`, { id: toastId });
  } catch (err: any) {
    console.error('Error generating zip:', err);
    toast.error(err.message || 'Failed to generate ZIP file.', { id: toastId });
  }
}

export async function downloadEventMediaZip(
  photos: string[],
  videos: string[],
  eventTitle: string,
): Promise<void> {
  const media = [...photos.map((url) => ({ url, folder: 'photos' })), ...videos.map((url) => ({ url, folder: 'videos' }))];
  if (media.length === 0) {
    toast.error('No event media available to download.');
    return;
  }

  const safeSlug = eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'event';
  const toastId = toast.loading(`Preparing ZIP archive for ${media.length} media files...`);
  try {
    const zip = new JSZip();
    let successfulDownloads = 0;
    for (let index = 0; index < media.length; index++) {
      const item = media[index];
      const response = await fetch(item.url);
      if (response.ok) {
        const blob = await response.blob();
        const extension = blob.type.split('/')[1]?.replace('jpeg', 'jpg') || (item.folder === 'videos' ? 'mp4' : 'jpg');
        zip.file(`${safeSlug}-${item.folder}/${item.folder.slice(0, -1)}-${String(index + 1).padStart(2, '0')}.${extension}`, blob);
        successfulDownloads++;
      }
      toast.loading(`Gathering media: ${index + 1}/${media.length}...`, { id: toastId });
    }
    if (!successfulDownloads) throw new Error('Unable to download event media.');
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${safeSlug}-media.zip`;
    link.click();
    toast.success(`Downloaded ${successfulDownloads} media files as ZIP!`, { id: toastId });
  } catch (error: any) {
    toast.error(error.message || 'Failed to generate ZIP file.', { id: toastId });
  }
}
