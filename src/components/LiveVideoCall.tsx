import React, { useEffect, useRef, useState, useCallback } from "react";
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { Video, Mic, MicOff, VideoOff, PhoneOff, Settings, User, Heart, Sparkles, Share2, Gift, MessageCircle, X, Users } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface LiveVideoCallProps {
  onClose: () => void;
}

interface Comment {
  id: string;
  user: string;
  text: string;
  color: string;
}

export default function LiveVideoCall({ onClose }: LiveVideoCallProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [hearts, setHearts] = useState<{ id: number; x: number }[]>([]);
  const [viewerCount, setViewerCount] = useState(Math.floor(Math.random() * 500) + 100);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const commentEndRef = useRef<HTMLDivElement>(null);

  const addComment = useCallback((user: string, text: string) => {
    const colors = ["text-pink-400", "text-blue-400", "text-green-400", "text-yellow-400", "text-purple-400"];
    const newComment = {
      id: Math.random().toString(36).substr(2, 9),
      user,
      text,
      color: colors[Math.floor(Math.random() * colors.length)]
    };
    setComments(prev => [...prev.slice(-15), newComment]);
  }, []);

  const triggerHeart = () => {
    const id = Date.now();
    const x = Math.random() * 40 - 20;
    setHearts(prev => [...prev, { id, x }]);
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== id));
    }, 2000);
  };

  const startCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are 'Mate', a popular TikTok live host. You are engaging, energetic, and love interacting with your 'viewers'. Keep your responses short, punchy, and use internet slang where appropriate. Acknowledge 'gifts' and 'likes' occasionally.",
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            addComment("System", "Mate is now LIVE!");
            startStreaming();
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts) {
              const audioPart = message.serverContent.modelTurn.parts.find(p => p.inlineData);
              if (audioPart?.inlineData?.data) {
                playAudio(audioPart.inlineData.data);
              }
              
              const textPart = message.serverContent.modelTurn.parts.find(p => p.text);
              if (textPart?.text) {
                setAiResponse(textPart.text);
                addComment("Mate", textPart.text);
              }
            }
          },
          onclose: onClose,
          onerror: (error) => {
            console.error("Live API Error:", error);
            setIsConnecting(false);
          }
        }
      });

      sessionRef.current = session;
    } catch (err) {
      console.error("Failed to start call:", err);
      setIsConnecting(false);
    }
  }, [onClose, addComment]);

  const startStreaming = () => {
    if (!mediaStreamRef.current || !sessionRef.current) return;
    audioContextRef.current = new AudioContext({ sampleRate: 16000 });
    const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
    const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
    source.connect(processor);
    processor.connect(audioContextRef.current.destination);

    processor.onaudioprocess = (e) => {
      if (isMuted) return;
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmData = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
      }
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
      sessionRef.current.sendRealtimeInput({
        audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
      });
    };

    const sendVideoFrame = () => {
      if (isVideoOff || !canvasRef.current || !videoRef.current || !sessionRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 320, 240);
        const base64Data = canvasRef.current.toDataURL('image/jpeg', 0.5).split(',')[1];
        sessionRef.current.sendRealtimeInput({
          video: { data: base64Data, mimeType: 'image/jpeg' }
        });
      }
      setTimeout(sendVideoFrame, 1000);
    };
    sendVideoFrame();
  };

  const playAudio = (base64Data: string) => {
    if (!audioContextRef.current) return;
    const binary = atob(base64Data);
    const bytes = new Int16Array(binary.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = (binary.charCodeAt(i * 2) | (binary.charCodeAt(i * 2 + 1) << 8));
    }
    const floatData = new Float32Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
        floatData[i] = bytes[i] / 0x7FFF;
    }
    const buffer = audioContextRef.current.createBuffer(1, floatData.length, 24000);
    buffer.getChannelData(0).set(floatData);
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.start();
  };

  useEffect(() => {
    startCall();
    const interval = setInterval(() => {
      setViewerCount(prev => Math.max(10, prev + Math.floor(Math.random() * 11) - 5));
    }, 5000);
    return () => {
      clearInterval(interval);
      mediaStreamRef.current?.getTracks().forEach(t => t.stop());
      sessionRef.current?.close();
      audioContextRef.current?.close();
    };
  }, [startCall]);

  useEffect(() => {
    commentEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white font-sans">
      {/* Main Video Background (AI / Mate) */}
      <div className="absolute inset-0 bg-neutral-900 overflow-hidden">
        <div className="absolute inset-0 atmosphere opacity-40" />
        
        {/* Mate Visualization */}
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {isConnecting ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="w-16 h-16 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                <p className="font-serif italic text-lg">Going Live...</p>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative w-full h-full flex items-center justify-center"
              >
                 <div className="flex items-center gap-1.5 h-48">
                    {[...Array(15)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ 
                          height: isConnected ? [30, 120, 60, 160, 30] : 30,
                          opacity: isConnected ? [0.4, 1, 0.4] : 0.4
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 1.2, 
                          delay: i * 0.08,
                          ease: "easeInOut"
                        }}
                        className="w-2.5 bg-orange-500 rounded-full shadow-[0_0_15px_rgba(255,99,33,0.5)]"
                      />
                    ))}
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Top Bar: Host Info & Viewers */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-start justify-between z-20">
        <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-full border-white/10">
          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center border border-white/20 bg-neutral-900">
            <img 
              src="https://picsum.photos/seed/nayourmate-logo/200/200" 
              alt="Host" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold leading-tight">Mate</span>
            <span className="text-[9px] text-white/60 font-mono uppercase tracking-tighter">1.2M Likes</span>
          </div>
          <button className="ml-2 px-3 py-1 bg-orange-600 rounded-full text-[10px] font-bold uppercase tracking-wide hover:bg-orange-500 transition-colors">
            Follow
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 glass px-3 py-1.5 rounded-full border-white/10">
            <Users className="w-3 h-3 text-white/80" />
            <span className="text-xs font-bold">{viewerCount}</span>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full glass flex items-center justify-center border-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* User Video (PiP) */}
      <div className="absolute top-20 right-4 w-28 h-40 rounded-xl overflow-hidden glass border-white/20 shadow-2xl z-20">
        {isVideoOff ? (
          <div className="w-full h-full flex items-center justify-center bg-neutral-800">
            <User className="w-8 h-8 text-white/20" />
          </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className="w-full h-full object-cover mirror"
          />
        )}
        <canvas ref={canvasRef} width="320" height="240" className="hidden" />
        <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/40 rounded text-[8px] font-bold uppercase">You</div>
      </div>

      {/* Bottom Area: Comments & Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-4 z-20">
        {/* Comments Section */}
        <div className="w-full max-w-[280px] h-48 overflow-y-auto lyric-viewport pr-4 flex flex-col gap-2 no-scrollbar">
          {comments.map((comment) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={comment.id} 
              className="flex flex-col bg-black/20 backdrop-blur-sm p-2 rounded-lg border-l-2 border-orange-500/30"
            >
              <span className={cn("text-[10px] font-bold", comment.color)}>{comment.user}</span>
              <span className="text-xs text-white/90 leading-snug">{comment.text}</span>
            </motion.div>
          ))}
          <div ref={commentEndRef} />
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 flex items-center gap-2 glass px-4 py-3 rounded-full border-white/10">
            <MessageCircle className="w-4 h-4 text-white/60" />
            <span className="text-xs text-white/40">Add comment...</span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center glass border-white/10 transition-all",
                isMuted && "bg-red-500/20 text-red-500 border-red-500/30"
              )}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button 
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center glass border-white/10 transition-all",
                isVideoOff && "bg-red-500/20 text-red-500 border-red-500/30"
              )}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>

            <button className="w-11 h-11 rounded-full flex items-center justify-center glass border-white/10 hover:bg-white/20 transition-colors">
              <Gift className="w-5 h-5 text-pink-400" />
            </button>

            <button 
              onClick={triggerHeart}
              className="w-11 h-11 rounded-full flex items-center justify-center bg-orange-600 hover:bg-orange-500 transition-all shadow-lg shadow-orange-600/20 relative"
            >
              <Heart className="w-5 h-5 text-white fill-white" />
              
              {/* Floating Hearts Animation */}
              <AnimatePresence>
                {hearts.map(heart => (
                  <motion.div
                    key={heart.id}
                    initial={{ y: 0, opacity: 1, scale: 1 }}
                    animate={{ y: -150, opacity: 0, scale: 1.5, x: heart.x }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute pointer-events-none"
                  >
                    <Heart className="w-6 h-6 text-orange-400 fill-orange-400" />
                  </motion.div>
                ))}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      {/* Screen Reader Status */}
      <div className="sr-only" role="status" aria-live="polite">
        {isConnecting ? "Going live" : "Live stream active"}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .mirror { transform: scaleX(-1); }
      `}</style>
    </div>
  );
}
