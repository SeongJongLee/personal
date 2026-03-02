/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Palette, Info, ArrowLeft, Download, Share2, CheckCircle2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CameraView } from './components/CameraView';
import { analyzePersonalColor, generateStylishImage } from './services/geminiService';
import { AnalysisResult } from './types';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export default function App() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFastMode, setIsFastMode] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkKey();
  }, []);

  const handleOpenKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleCapture = useCallback(async (base64: string) => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setGeneratedImage(null);

    try {
      // Step 1: Analyze personal color
      const analysis = await analyzePersonalColor(base64);
      setResult(analysis);
      
      // Step 2: Generate a stylish image matching the result
      // Skip image generation in Fast Mode for even quicker results
      if (!isFastMode) {
        try {
          const imageUrl = await generateStylishImage(analysis.imagePrompt);
          setGeneratedImage(imageUrl);
        } catch (err: any) {
          console.error("Image generation failed:", err);
          if (err.message?.includes("Requested entity was not found")) {
            setHasApiKey(false);
            setError("이미지 생성을 위해 API 키를 다시 연결해 주세요.");
          }
        }
      }

      // Success effect
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: analysis.palette
      });
    } catch (err) {
      console.error("Analysis failed:", err);
      setError("분석에 실패했습니다. 더 밝은 곳에서 다시 시도해 주세요.");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const reset = () => {
    setResult(null);
    setGeneratedImage(null);
    setError(null);
  };

  const SEASON_MAP: Record<string, string> = {
    Spring: '봄 웜톤',
    Summer: '여름 쿨톤',
    Autumn: '가을 웜톤',
    Winter: '겨울 쿨톤'
  };

  return (
    <div className="min-h-screen font-sans selection:bg-white selection:text-black">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 px-6 py-8 flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
            <Palette className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight uppercase text-black">컬러뷰티</h1>
            <p className="text-[10px] font-mono text-black/40 uppercase tracking-widest">AI Color Lab v2.5</p>
          </div>
        </div>
        
        <div className="pointer-events-auto">
          <button className="p-3 glass rounded-full hover:bg-black/5 transition-colors">
            <Info className="w-5 h-5 text-black" />
          </button>
        </div>
      </header>

      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="camera"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center"
            >
              <div className="text-center mb-12 max-w-xl">
                <h2 className="text-4xl md:text-6xl font-serif italic mb-6 leading-tight text-black">
                  당신만의 고유한 <span className="text-black underline decoration-black/10 underline-offset-8">컬러</span>를 찾아보세요.
                </h2>
                <p className="text-black/60 text-lg">
                  AI 엔진이 어떤 조명 아래에서도 당신의 특징을 분석하여 완벽한 퍼스널 컬러를 찾아드립니다.
                </p>
              </div>

              <CameraView onCapture={handleCapture} isAnalyzing={isAnalyzing} />

              <div className="mt-8 flex flex-col items-center gap-6">
                {!hasApiKey && !isFastMode && (
                  <button 
                    onClick={handleOpenKey}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg active:scale-95"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>고화질 이미지 생성을 위해 API 키 연결</span>
                  </button>
                )}

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsFastMode(!isFastMode)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${isFastMode ? 'bg-black' : 'bg-black/10'}`}
                    >
                      <motion.div 
                        animate={{ x: isFastMode ? 24 : 4 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                      />
                    </button>
                    <span className="text-xs font-mono uppercase tracking-widest text-black/60">Fast Mode</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-black/30">
                    <Info className="w-3 h-3" />
                    정확한 분석을 위해 자연광 아래에서 정면을 응시해 주세요.
                  </div>
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-full border border-red-400/20"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">{error}</span>
                </motion.div>
              )}

              <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
                {[
                  { icon: Sparkles, title: "AI 정밀 분석", desc: "정교한 얼굴 분석으로 정확한 결과를 제공합니다." },
                  { icon: CheckCircle2, title: "조명 보정", desc: "그림자와 조명 색상을 보정하여 정확도를 높입니다." },
                  { icon: Palette, title: "스타일 큐레이션", desc: "당신에게 어울리는 맞춤형 팔레트를 제안합니다." }
                ].map((item, i) => (
                  <div key={i} className="p-6 glass rounded-2xl border-black/5">
                    <item.icon className="w-6 h-6 mb-4 text-black/80" />
                    <h3 className="font-semibold mb-2 text-black">{item.title}</h3>
                    <p className="text-sm text-black/40 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start"
            >
              {/* Left: Visual Result */}
              <div className="space-y-8">
                <button 
                  onClick={reset}
                  className="flex items-center gap-2 text-black/60 hover:text-black transition-colors mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm font-medium uppercase tracking-wider">스튜디오로 돌아가기</span>
                </button>

                <div className={`relative aspect-square rounded-[2rem] overflow-hidden glass border-black/5 glow-${result.type?.toLowerCase()}`}>
                  {generatedImage ? (
                    <motion.img 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      src={generatedImage} 
                      alt="Personal Color Style"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : isFastMode ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                      <div className="w-full h-full rounded-2xl flex flex-wrap gap-2 p-4">
                        {result.palette.map((color, i) => (
                          <motion.div 
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex-1 min-w-[40%] rounded-xl shadow-inner"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-full border border-black/5 shadow-xl">
                          <span className="text-xl font-serif italic text-black">{SEASON_MAP[result.type || '']}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                      <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <p className="text-xs font-mono uppercase tracking-widest text-white/40">스타일 포트레이트 생성 중...</p>
                    </div>
                  )}
                  
                  <div className="absolute top-8 left-8">
                    <div className="px-4 py-2 bg-white/60 backdrop-blur-xl rounded-full border border-black/5">
                      <span className="text-xs font-mono uppercase tracking-[0.2em] text-black">
                        {isFastMode ? '컬러 팔레트' : 'AI 포트레이트'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button className="flex-1 py-4 glass rounded-2xl flex items-center justify-center gap-2 hover:bg-black/5 transition-all active:scale-95 text-black">
                    <Download className="w-5 h-5" />
                    <span className="font-semibold">결과 저장하기</span>
                  </button>
                  <button className="p-4 glass rounded-2xl hover:bg-black/5 transition-all active:scale-95 text-black">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Right: Analysis Details */}
              <div className="space-y-10">
                <div>
                  <h2 className="text-sm font-mono uppercase tracking-[0.3em] text-black/40 mb-2">분석 완료</h2>
                  <h3 className="text-7xl md:text-8xl font-serif italic leading-none text-black">
                    {result.type ? SEASON_MAP[result.type] : ''}
                  </h3>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-mono uppercase tracking-widest text-black/40">퍼스널 컬러 팔레트</h4>
                  <div className="flex gap-3">
                    {result.palette.map((color, i) => (
                      <motion.div 
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="w-12 h-12 rounded-xl shadow-lg border border-black/5"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                <div className="p-8 glass rounded-[2rem] border-black/5 space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-mono uppercase tracking-widest text-black/40">AI 분석 결과</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-black/40">신뢰도</span>
                      <div className="w-16 h-1.5 bg-black/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(result.confidence || 0) * 100}%` }}
                          className="h-full bg-black/40"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-black/80 leading-relaxed font-light italic">
                      "{result.reasoning}"
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-8 pt-6 border-t border-black/5">
                    <div>
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 mb-3">베스트 컬러</h4>
                      <ul className="space-y-2">
                        {result.bestColors.map((c, i) => (
                          <li key={i} className="text-sm text-black/60 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-red-600 mb-3">피해야 할 컬러</h4>
                      <ul className="space-y-2">
                        {result.worstColors.map((c, i) => (
                          <li key={i} className="text-sm text-black/60 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-black/5">
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-black/30">
                      <CheckCircle2 className="w-3 h-3" />
                      조명 보정 완료: {result.lightingCondition}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Decoration */}
      <footer className="fixed bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-black/5 to-transparent pointer-events-none" />
    </div>
  );
}
