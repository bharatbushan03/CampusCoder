'use client';

import React from 'react';
import { ZipPhotoViewer } from './ZipPhotoViewer';

interface EventPhotoGalleryProps {
  photos?: string[];
  photosZipUrl?: string | null;
  photosDriveUrl?: string | null;
  eventTitle: string;
  className?: string;
}

export function EventPhotoGallery({
  photos = [],
  photosZipUrl,
  photosDriveUrl,
  eventTitle,
  className = '',
}: EventPhotoGalleryProps) {
  if ((!photos || photos.length === 0) && !photosZipUrl && !photosDriveUrl) {
    return null;
  }

  return (
    <ZipPhotoViewer
      photos={photos}
      photosZipUrl={photosZipUrl}
      photosDriveUrl={photosDriveUrl}
      eventTitle={eventTitle}
      className={className}
    />
  );
}
