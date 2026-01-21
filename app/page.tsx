"use client";

import { useState, useCallback } from "react";
import { CameraFeed } from "./components/camera";
import { FaceDetectionOverlay, type DetectedFace } from "./components/overlay";
import { checkTodayAttendance, submitAttendanceAction } from "./hooks/action";
import { Toaster, toast } from "sonner";

export default function AttendancePage() {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [detectedFace, setDetectedFace] = useState<DetectedFace | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<DetectedFace[]>(
    [],
  );

  const [alreadyAttended, setAlreadyAttended] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selfieLight, setSelfieLight] = useState(false);

  const handleVideoReady = useCallback((videoElement: HTMLVideoElement) => {
    setVideo(videoElement);
  }, []);

  const handleFaceDetected = useCallback(async (face: DetectedFace) => {
    setDetectedFace(face);
    const isAttended = await checkTodayAttendance(face.name);
    setAlreadyAttended(isAttended);
  }, []);

  const handleAttendanceSubmit = async () => {
    if (!detectedFace || alreadyAttended) return;

    setIsSubmitting(true);

    let photoBase64 = "";
    if (video) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0);
      photoBase64 = canvas.toDataURL("image/jpeg", 0.8);
    }

    const result = await submitAttendanceAction({
      name: detectedFace.name,
      position: detectedFace.position,
      photo: photoBase64,
    });

    setIsSubmitting(false);

    if (result.success) {
      const newRecord = {
        ...detectedFace,
        photo: result.photoUrl || photoBase64,
      };
      setAttendanceHistory([...attendanceHistory, newRecord]);
      setAlreadyAttended(true);
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const handleFaceLost = useCallback(() => {
    setDetectedFace((prev) => {
      if (prev !== null) {
        setAlreadyAttended(false);
        return null;
      }
      return prev;
    });
  }, []);

  return (
    <main
      className={`min-h-screen p-4 md:p-8 relative overflow-hidden transition-colors duration-500 ${selfieLight ? "bg-white" : "bg-linear-to-br from-gray-50 via-white to-gray-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-gray-900"}`}
    >
      <Toaster position="top-center" />

      {selfieLight && (
        <div className="fixed inset-0 bg-white z-0 pointer-events-none opacity-90 mix-blend-soft-light"></div>
      )}

      {!selfieLight && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-linear-to-br from-orange-400/10 to-amber-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-linear-to-tr from-gray-200/20 to-orange-200/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
      )}

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-6">
          <div className="inline-flex items-center gap-2 bg-linear-to-r from-orange-500 to-amber-600 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-orange-500/20">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            AI Powered System
          </div>
          <button
            onClick={() => setSelfieLight(!selfieLight)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${selfieLight ? "bg-yellow-400 text-black border-yellow-500" : "bg-transparent text-gray-500 border-gray-300"}`}
          >
            {selfieLight ? "💡 Layar Terang: ON" : "💡 Layar Terang: OFF"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative group">
              <div
                className={`absolute inset-0 bg-linear-to-br rounded-3xl blur-xl transition-all duration-300 ${detectedFace ? "from-green-400/50 to-emerald-400/50" : "from-gray-200/50 to-orange-200/50"}`}
              ></div>

              <div className="relative bg-white dark:bg-zinc-900 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-zinc-800 p-3">
                <div className="relative bg-black rounded-2xl overflow-hidden aspect-3/4 md:aspect-video lg:aspect-auto lg:h-125">
                  <CameraFeed onVideoReady={handleVideoReady} />
                  {video && (
                    <FaceDetectionOverlay
                      video={video}
                      onFaceDetected={handleFaceDetected}
                      onFaceLost={handleFaceLost} 
                      alreadyAttended={alreadyAttended}
                    />
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleAttendanceSubmit}
              disabled={!detectedFace || alreadyAttended || isSubmitting}
              className={`w-full relative overflow-hidden group rounded-2xl font-black text-lg md:text-xl py-5 px-8 transition-all duration-300 shadow-xl ${
                !detectedFace
                  ? "bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-600 cursor-not-allowed"
                  : alreadyAttended
                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 cursor-not-allowed border-2 border-emerald-500/20"
                    : "bg-linear-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white hover:shadow-2xl hover:shadow-orange-500/20 transform hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Menyimpan Data...</span>
                  </>
                ) : !detectedFace ? (
                  <>
                    <svg
                      className="w-6 h-6 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span>Menunggu Deteksi Wajah...</span>
                  </>
                ) : alreadyAttended ? (
                  <>
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Sudah Presensi Hari Ini</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span>Konfirmasi Presensi</span>
                  </>
                )}
              </span>
            </button>
          </div>

          <div className="space-y-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-linear-to-br from-gray-200/50 to-orange-100/50 rounded-3xl blur-lg group-hover:blur-xl transition-all"></div>
              <div className="relative bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <span className="text-xl">📋</span>
                  </div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">
                    Status Deteksi
                  </h3>
                </div>

                {detectedFace ? (
                  <div className="space-y-4 animate-in slide-in-from-bottom duration-300">
                    <div
                      className={`p-3 rounded-xl border font-bold text-center text-sm flex items-center justify-center gap-2 ${
                        alreadyAttended
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                          : "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800"
                      }`}
                    >
                      {alreadyAttended ? (
                        <>✅ Sudah Presensi</>
                      ) : (
                        <>👋 Wajah Terdeteksi</>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="bg-gray-50 dark:bg-zinc-950/50 p-3 rounded-2xl border border-gray-100 dark:border-zinc-800">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Nama Lengkap
                        </p>
                        <p className="font-bold text-gray-900 dark:text-white text-base truncate">
                          {detectedFace.name}
                        </p>
                      </div>

                      <div className="bg-gray-50 dark:bg-zinc-950/50 p-3 rounded-2xl border border-gray-100 dark:border-zinc-800">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Jabatan
                        </p>
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${alreadyAttended ? "bg-emerald-500" : "bg-orange-500"}`}
                          ></span>
                          <p className="font-bold text-gray-900 dark:text-white text-sm">
                            {detectedFace.position}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 dark:bg-zinc-950/50 p-3 rounded-2xl border border-gray-100 dark:border-zinc-800">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                            Waktu
                          </p>
                          <p className="font-mono font-bold text-gray-900 dark:text-white">
                            {detectedFace.detectionTime}
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-zinc-950/50 p-3 rounded-2xl border border-gray-100 dark:border-zinc-800">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                            Tanggal
                          </p>
                          <p className="font-bold text-gray-900 dark:text-white text-xs">
                            {detectedFace.detectionDate}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4 relative">
                      <span className="text-3xl opacity-50">🔍</span>
                      <div className="absolute inset-0 border-2 border-orange-500/20 rounded-full animate-ping"></div>
                    </div>
                    <p className="text-gray-900 dark:text-white font-bold mb-1">
                      Menunggu Scan
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Arahkan wajah ke kamera
                    </p>
                  </div>
                )}
              </div>
            </div>

            {attendanceHistory.length > 0 && (
              <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-zinc-800">
                <h4 className="font-bold text-sm text-gray-500 uppercase mb-3">
                  Baru saja absen
                </h4>
                <div className="space-y-3">
                  {attendanceHistory
                    .slice(-3)
                    .reverse()
                    .map((record, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">
                          ✓
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white line-clamp-1">
                            {record.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {record.detectionTime}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
