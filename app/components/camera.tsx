/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/ban-ts-comment */
'use client';

import { useEffect, useRef } from 'react';

interface CameraFeedProps {
  onVideoReady: (video: HTMLVideoElement) => void;
}

export function CameraFeed({ onVideoReady }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let wakeLock: any = null;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
            // @ts-ignore
            advanced: [{ exposureMode: 'continuous' }] 
          },
        });

        if ('wakeLock' in navigator) {
            try {
                // @ts-ignore
                wakeLock = await navigator.wakeLock.request('screen');
            } catch (err) {
                console.log(err);
            }
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            onVideoReady(videoRef.current!);
          };
        }
      } catch (error) {
        console.error(error);
      }
    };

    startCamera();

    return () => {
      const tracks = (videoRef.current?.srcObject as MediaStream)?.getTracks();
      tracks?.forEach(track => track.stop());
      if (wakeLock) wakeLock.release();
    };
  }, [onVideoReady]);

  return (
    <video
      ref={videoRef}
      className="w-full h-full object-cover rounded-lg transform scale-x-[-1] filter brightness-110 contrast-110"
      muted
      playsInline
    />
  );
}