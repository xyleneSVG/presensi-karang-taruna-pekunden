'use client';

import { useEffect, useRef, useState } from 'react';
import * as tmImage from '@teachablemachine/image'; 
import { USER_DATABASE, TM_MODEL_URL } from '../constant/data';

export interface DetectedFace {
  name: string;
  position: string;
  detectionDate: string;
  detectionTime: string;
  photo?: string;
  confidence: number;
}

interface FaceDetectionOverlayProps {
  video: HTMLVideoElement | null;
  onFaceDetected: (face: DetectedFace) => void;
  onFaceLost: () => void; 
  alreadyAttended?: boolean;
}

export function FaceDetectionOverlay({ video, onFaceDetected, onFaceLost, alreadyAttended = false }: FaceDetectionOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detectedFace, setDetectedFace] = useState<DetectedFace | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isUnknown, setIsUnknown] = useState(false);
  
  const modelRef = useRef<tmImage.CustomMobileNet | null>(null);
  const lastPredictionTime = useRef<number>(0);
  const detectionStreak = useRef<number>(0); 
  const currentMatchClass = useRef<string | null>(null); 
  
  const CONFIDENCE_THRESHOLD = 0.95; 
  const REQUIRED_STREAK = 3;

  useEffect(() => {
    const loadModel = async () => {
      try {
        const modelURL = TM_MODEL_URL + "model.json";
        const metadataURL = TM_MODEL_URL + "metadata.json";

        const model = await tmImage.load(modelURL, metadataURL);
        modelRef.current = model;
        setIsModelLoading(false);
      } catch (error) {
        console.error(error);
        setIsModelLoading(false);
      }
    };

    loadModel();
  }, []);

  useEffect(() => {
    if (!video || !canvasRef.current || isModelLoading) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const predict = async () => {
      if (modelRef.current && video.readyState === 4) { 
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const now = Date.now();
        if (now - lastPredictionTime.current > 200) {
          lastPredictionTime.current = now;

          const predictions = await modelRef.current.predict(video);
          
          let highestProb = 0;
          let bestClass = "";

          predictions.forEach((p) => {
            if (p.probability > highestProb) {
              highestProb = p.probability;
              bestClass = p.className;
            }
          });

          if (highestProb > CONFIDENCE_THRESHOLD && USER_DATABASE[bestClass]) {
            if (currentMatchClass.current === bestClass) {
              detectionStreak.current += 1;
            } else {
              currentMatchClass.current = bestClass;
              detectionStreak.current = 1;
            }

            if (detectionStreak.current >= REQUIRED_STREAK) {
              const userData = USER_DATABASE[bestClass];
              const dateNow = new Date();

              const faceData: DetectedFace = {
                name: userData.name,
                position: userData.position,
                detectionDate: dateNow.toLocaleDateString('id-ID'),
                detectionTime: dateNow.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                confidence: highestProb
              };

              setDetectedFace(faceData);
              setIsUnknown(false);
              onFaceDetected(faceData);
            }

          } else {
            if (currentMatchClass.current !== null) {
                onFaceLost();
            }

            detectionStreak.current = 0;
            currentMatchClass.current = null;
            setDetectedFace(null);
            
            if (highestProb > CONFIDENCE_THRESHOLD && !USER_DATABASE[bestClass]) {
               if (bestClass !== "Class 2" && bestClass !== "Background") {
                 setIsUnknown(true);
               } else {
                 setIsUnknown(false);
               }
            } else {
               setIsUnknown(false);
            }
          }
        }
      }
      animationId = requestAnimationFrame(predict);
    };

    predict();
    
    return () => {
        cancelAnimationFrame(animationId);
    }
  }, [video, isModelLoading, onFaceDetected, onFaceLost]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />
      
      {isModelLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30">
          <div className="bg-black/60 backdrop-blur-md px-6 py-4 rounded-2xl flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-white font-medium text-sm">Memuat Model AI...</p>
          </div>
        </div>
      )}

      {!isModelLoading && !detectedFace && (
        <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
          <div className="bg-linear-to-t from-black/80 via-black/40 to-transparent pt-12 pb-6 px-6">
            <div className="flex items-center justify-center gap-3 animate-pulse">
              <div className={`w-2 h-2 rounded-full ${isUnknown ? 'bg-red-500' : 'bg-white/50'}`}></div>
              <p className={`${isUnknown ? 'text-red-400' : 'text-white/80'} font-medium text-sm tracking-wide`}>
                {isUnknown ? "Wajah Tidak Terdaftar" : "Mencari Wajah..."}
              </p>
              <div className={`w-2 h-2 rounded-full ${isUnknown ? 'bg-red-500' : 'bg-white/50'}`}></div>
            </div>
            <div className={`mt-4 h-0.5 w-full bg-linear-to-r from-transparent ${isUnknown ? 'via-red-500/50' : 'via-orange-500/50'} to-transparent`}></div>
          </div>
        </div>
      )}

      {!isModelLoading && detectedFace && (
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div className={`pt-8 pb-4 px-4 md:px-6 bg-linear-to-t ${
              alreadyAttended 
                ? 'from-emerald-900/90 via-emerald-900/70' 
                : 'from-black/90 via-black/70'
            } to-transparent transition-colors duration-500`}>
             <div className="flex items-center gap-4 animate-in slide-in-from-bottom duration-500">
                
                <div className="shrink-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                      alreadyAttended 
                        ? 'bg-linear-to-br from-emerald-500 to-green-500 shadow-emerald-500/20' 
                        : 'bg-linear-to-br from-orange-500 to-amber-500 shadow-orange-500/20'
                  }`}>
                    <span className="text-2xl">{alreadyAttended ? '✅' : '👤'}</span>
                  </div>
                </div>

                <div className="flex-1 min-w-0 text-white">
                   <div className="flex items-center gap-2 mb-1">
                      {alreadyAttended ? (
                          <div className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-white/20 border-white/50 text-white">
                            Sudah Presensi
                          </div>
                      ) : (
                          <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            detectedFace.confidence > 0.98 
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                              : 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                          }`}>
                            Akurasi {(detectedFace.confidence * 100).toFixed(0)}%
                          </div>
                      )}
                   </div>
                   
                   <h3 className="text-lg md:text-xl font-bold truncate leading-tight text-white">
                     {detectedFace.name}
                   </h3>
                   <p className="text-sm text-gray-200 truncate font-medium">
                     {detectedFace.position}
                   </p>
                </div>

                <div className="hidden xs:block text-right border-l border-white/10 pl-4">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Waktu Scan</p>
                    <p className="text-base font-mono font-bold text-white leading-none">
                      {detectedFace.detectionTime}
                    </p>
                </div>
             </div>
          </div>
        </div>
      )}
    </>
  );
}