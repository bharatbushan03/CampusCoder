'use client';

import React from 'react';
import { ZipPhotoViewer } from './ZipPhotoViewer';

interface EventPhotoGalleryProps {
  photos?: string[];
  videos?: string[];
  photosZipUrl?: string | null;
  eventTitle: string;
  className?: string;
}

export function EventPhotoGallery({
  photos = [],
  videos = [],
  photosZipUrl,
  eventTitle,
  className = '',
}: EventPhotoGalleryProps) {
  if ((!photos || photos.length === 0) && (!videos || videos.length === 0) && !photosZipUrl) {
    return null;
  }

  return (
    <ZipPhotoViewer
      photos={photos}
      videos={videos}
      photosZipUrl={photosZipUrl}
      eventTitle={eventTitle}
      className={className}
    />
  );
}
