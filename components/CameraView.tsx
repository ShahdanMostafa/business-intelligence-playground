
import React, { useRef, useEffect, useState } from 'react';

interface CameraViewProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Unable to access camera. Please check permissions.");
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        onCapture(dataUrl);
      }
    }
  };

  return (
    <div className="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden shadow-inner border border-slate-200">
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-white mb-4">{error}</p>
          <button onClick={onClose} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg">Close</button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Overlay Guide */}
          <div className="absolute inset-0 border-[30px] border-black/40 pointer-events-none">
            <div className="w-full h-full border-2 border-white/50 rounded-lg flex items-center justify-center">
              <span className="text-white/70 text-xs font-medium bg-black/50 px-3 py-1 rounded-full">
                Align ID Card Here
              </span>
            </div>
          </div>

          <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center space-x-8 px-6">
            <button
              onClick={onClose}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-all"
              title="Cancel"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <button
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full border-4 border-white bg-white/20 hover:bg-white/40 transition-all flex items-center justify-center group shadow-xl"
              title="Capture"
            >
              <div className="w-12 h-12 rounded-full bg-white group-active:scale-90 transition-transform shadow-inner"></div>
            </button>

            <div className="w-12 h-12"></div> {/* Spacer for symmetry */}
          </div>
        </>
      )}
    </div>
  );
};

export default CameraView;
