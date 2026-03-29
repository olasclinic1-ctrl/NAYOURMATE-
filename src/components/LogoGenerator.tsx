import React, { useState, useEffect } from "react";
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Download, RefreshCw, Check } from "lucide-react";

export default function LogoGenerator() {
  const [prompt, setPrompt] = useState("A professional, minimalist logo for an adult social platform called 'NaYourMate'. The logo should feature a stylized, elegant silhouette of a sexy woman, integrated with a heart shape. Use a sophisticated color palette of deep red, gold, and black. High-quality, vector style, clean lines, luxury feel.");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateLogo = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
          },
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64Data = part.inlineData.data;
          setImageUrl(`data:image/png;base64,${base64Data}`);
          break;
        }
      }
    } catch (err) {
      console.error("Logo generation failed:", err);
      setError("Failed to generate logo. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 p-8 glass rounded-[32px] border-white/10 max-w-2xl mx-auto my-12">
      <div className="text-center">
        <h2 className="font-serif text-3xl italic mb-2">Logo Designer</h2>
        <p className="text-white/40 text-sm font-mono uppercase tracking-widest">AI-Powered Perfection</p>
      </div>

      <div className="relative w-64 h-64 rounded-2xl overflow-hidden bg-neutral-900 border border-white/5 flex items-center justify-center shadow-2xl">
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <RefreshCw className="w-12 h-12 text-orange-500 animate-spin" />
              <p className="text-xs font-mono text-orange-500/70 animate-pulse">Crafting...</p>
            </motion.div>
          ) : imageUrl ? (
            <motion.img 
              key="image"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={imageUrl} 
              alt="Generated Logo" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-white/10 flex flex-col items-center gap-2">
              <Sparkles className="w-12 h-12" />
              <p className="text-[10px] uppercase tracking-widest">Ready to create</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {error && <p className="text-red-500 text-xs font-mono">{error}</p>}

      <div className="w-full flex flex-col gap-4">
        <textarea 
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white/80 focus:border-orange-500/50 outline-none transition-colors min-h-[100px] resize-none"
          placeholder="Describe your perfect logo..."
        />
        
        <div className="flex gap-3">
          <button 
            onClick={generateLogo}
            disabled={isGenerating}
            className="flex-1 bg-orange-600 hover:bg-orange-500 disabled:bg-neutral-800 disabled:text-white/20 text-white py-4 rounded-xl font-serif italic text-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-orange-900/20"
          >
            {isGenerating ? "Generating..." : "Generate Perfect Logo"}
            <Sparkles className="w-5 h-5" />
          </button>
          
          {imageUrl && (
            <button 
              onClick={() => {
                const link = document.createElement('a');
                link.href = imageUrl;
                link.download = 'nayourmate-logo.png';
                link.click();
              }}
              className="w-16 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all border border-white/10"
              title="Download Logo"
            >
              <Download className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
