import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Video, Users, Shield, Sparkles, ArrowRight, Globe } from "lucide-react";
import LiveVideoCall from "./components/LiveVideoCall";
import LogoGenerator from "./components/LogoGenerator";
import { cn } from "@/src/lib/utils";

export default function App() {
  const [isCalling, setIsCalling] = useState(false);

  return (
    <div className="min-h-screen relative overflow-hidden selection:bg-orange-500 selection:text-white">
      <div className="atmosphere" />
      
      <AnimatePresence>
        {!isCalling ? (
          <motion.main 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex flex-col min-h-screen"
          >
            {/* Navigation */}
            <nav className="flex items-center justify-between p-8 max-w-7xl mx-auto w-full">
              <div className="flex items-center gap-2 group cursor-pointer">
                <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform duration-500 bg-neutral-900 border border-white/10">
                  <img 
                    src="https://picsum.photos/seed/nayourmate-logo/200/200" 
                    alt="NaYourMate Logo" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="font-serif text-2xl italic tracking-tight">NaYourMate</span>
              </div>
              
              <div className="hidden md:flex items-center gap-8 text-sm uppercase tracking-widest font-medium text-white/60">
                <a href="#" className="hover:text-white transition-colors">Discover</a>
                <a href="#" className="hover:text-white transition-colors">Safety</a>
                <a href="#" className="hover:text-white transition-colors">Premium</a>
              </div>

              <button className="px-6 py-2 rounded-full glass border-white/20 text-sm font-medium hover:bg-white/10 transition-all duration-300">
                Sign In
              </button>
            </nav>

            {/* Hero Section */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-5xl mx-auto py-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full glass border-orange-500/20 text-orange-500 text-[10px] uppercase tracking-[0.2em] font-bold mb-8"
              >
                <Sparkles className="w-3 h-3" />
                New: AI-Powered Perfect Video Calls
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="font-serif text-6xl md:text-8xl italic leading-[0.9] tracking-tight mb-8"
              >
                Connect with <br />
                <span className="text-orange-500">Your Perfect Mate</span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg md:text-xl text-white/60 max-w-2xl mb-12 leading-relaxed"
              >
                Experience the future of companionship with our high-quality, accessible AI video interactions. Real-time, low-latency, and perfectly tailored to you.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row items-center gap-4"
              >
                <button 
                  onClick={() => setIsCalling(true)}
                  className="group relative px-10 py-5 bg-orange-600 hover:bg-orange-500 text-white rounded-full font-serif italic text-2xl transition-all duration-500 shadow-2xl shadow-orange-900/40 hover:scale-105 active:scale-95 flex items-center gap-3"
                >
                  <Video className="w-6 h-6" />
                  Start Perfect Call
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="px-10 py-5 glass border-white/10 hover:bg-white/5 rounded-full font-serif italic text-2xl transition-all duration-500">
                  Learn More
                </button>
              </motion.div>
            </div>

            {/* Logo Generator Section */}
            <LogoGenerator />

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 max-w-7xl mx-auto w-full mb-20">
              {[
                { icon: Globe, title: "Global Reach", desc: "Connect with mates from all over the world, instantly." },
                { icon: Shield, title: "Safe & Secure", desc: "Your privacy is our priority. Encrypted calls and data." },
                { icon: Users, title: "Real Connections", desc: "Human-like AI interactions that feel genuine and warm." }
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="p-8 rounded-[32px] glass border-white/5 hover:border-white/20 transition-all duration-500 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-orange-500/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-orange-500" />
                  </div>
                  <h3 className="font-serif text-2xl italic mb-3">{feature.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <footer className="p-8 border-t border-white/5 text-center text-[10px] uppercase tracking-widest text-white/30 font-mono">
              &copy; 2026 NaYourMate. All Rights Reserved. Designed for Perfection.
            </footer>
          </motion.main>
        ) : (
          <div key="call">
            <LiveVideoCall onClose={() => setIsCalling(false)} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
