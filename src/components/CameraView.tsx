import React, { useRef, useEffect, useState } from 'react';
import { Camera, RefreshCw, Sparkles, SwitchCamera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CameraViewProps {
  onCapture: (base64: string) => void;
  isAnalyzing: boolean;
}

export const CameraView: React.FC<CameraViewProps> = ({ onCapture, isAnalyzing }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      await getDevices();
      await startCamera();
    };
    init();
    
    return () => {
      stopStream();
    };
  }, []);

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const getDevices = async () => {
    try {
      // Request permission first to get labels
      const initialStream = await navigator.mediaDevices.getUserMedia({ video: true });
      initialStream.getTracks().forEach(track => track.stop());
      
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      
      if (videoDevices.length > 0 && !currentDeviceId) {
        // Try to find a built-in camera first (avoiding common virtual camera names)
        const builtIn = videoDevices.find(d => 
          !d.label.toLowerCase().includes('virtual') && 
          !d.label.toLowerCase().includes('iriun') && 
          !d.label.toLowerCase().includes('droidcam') &&
          !d.label.toLowerCase().includes('obs')
        );
        
        setCurrentDeviceId(builtIn ? builtIn.deviceId : videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error("Error enumerating devices:", err);
    }
  };

  const startCamera = async (deviceId?: string) => {
    stopStream();
    const targetId = deviceId || currentDeviceId;
    
    try {
      const constraints: MediaStreamConstraints = {
        video: targetId 
          ? { deviceId: { exact: targetId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("카메라 접근이 거부되었거나 장치를 찾을 수 없습니다. 권한을 확인해 주세요.");
    }
  };

  const switchCamera = async () => {
    if (devices.length < 2) return;
    
    const currentIndex = devices.findIndex(d => d.deviceId === currentDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDevice = devices[nextIndex];
    
    setCurrentDeviceId(nextDevice.deviceId);
    await startCamera(nextDevice.deviceId);
  };

  const handleDeviceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setCurrentDeviceId(newId);
    await startCamera(newId);
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(base64);
      }
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto aspect-video rounded-3xl overflow-hidden glass border-black/5 shadow-2xl">
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 text-black p-6 text-center">
          <Camera className="w-12 h-12 mb-4 text-red-500" />
          <p className="text-lg font-medium mb-4">{error}</p>
          <button 
            onClick={() => startCamera()}
            className="px-6 py-2 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition-colors"
          >
            다시 시도
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          
          <AnimatePresence>
            {isAnalyzing && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-10"
              >
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-black/10 border-t-black rounded-full animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-black animate-pulse" />
                </div>
                <div className="absolute bottom-12 text-black font-mono text-sm tracking-widest uppercase animate-pulse">
                  컬러 프로필 분석 중...
                </div>
                <div className="absolute inset-0 scan-line pointer-events-none" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute inset-x-0 bottom-8 flex justify-center items-center gap-4 z-20">
            {devices.length > 1 && (
              <button
                onClick={switchCamera}
                disabled={isAnalyzing}
                className="p-3 bg-white/40 backdrop-blur-md rounded-full text-black hover:bg-white/60 transition-colors border border-black/5 disabled:opacity-50"
                title="카메라 전환"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={captureFrame}
              disabled={isAnalyzing}
              className="group relative flex items-center justify-center w-16 h-16 bg-black rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
            >
              <div className="absolute inset-0 rounded-full border-4 border-black/10 group-hover:scale-125 transition-transform duration-500" />
              <Camera className="w-8 h-8 text-white" />
            </button>
            
            <button
              onClick={() => startCamera()}
              disabled={isAnalyzing}
              className="p-3 bg-white/40 backdrop-blur-md rounded-full text-black hover:bg-white/60 transition-colors border border-black/5 disabled:opacity-50"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute top-6 left-6 flex items-center gap-3 z-20">
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-black/5 shadow-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <select 
                value={currentDeviceId || ''} 
                onChange={handleDeviceChange}
                disabled={isAnalyzing}
                className="text-[10px] font-mono uppercase tracking-widest text-black/80 bg-transparent border-none focus:ring-0 cursor-pointer outline-none max-w-[150px] truncate"
              >
                {devices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId} className="bg-white text-black">
                    {device.label || `카메라 ${device.deviceId.slice(0, 5)}`}
                  </option>
                ))}
                {devices.length === 0 && <option>카메라를 찾을 수 없음</option>}
              </select>
            </div>
          </div>
        </>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
