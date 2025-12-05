import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Heart, ArrowRight, X } from 'lucide-react';

interface WelcomeCardProps {
  onDismiss: () => void;
  onAddInterests: () => void;
}

export default function WelcomeCard({ onDismiss, onAddInterests }: WelcomeCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation after mount
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  const handleAddInterests = () => {
    setIsExiting(true);
    setTimeout(() => {
      onAddInterests();
    }, 300);
  };

  return (
    <div
      className={`
        fixed bottom-32 left-4 right-4 z-[1000] 
        max-w-sm mx-auto
        transition-all duration-500 ease-out
        ${isVisible && !isExiting 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-8 scale-95'
        }
      `}
    >
      {/* Card Container */}
      <div className="relative overflow-hidden rounded-3xl shadow-2xl">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-500 animate-gradient-shift" />
        
        {/* Sparkle decorations */}
        <div className="absolute top-3 left-4 animate-pulse delay-100">
          <Sparkles className="w-5 h-5 text-yellow-300/80" />
        </div>
        <div className="absolute top-6 right-8 animate-pulse delay-300">
          <Sparkles className="w-4 h-4 text-white/60" />
        </div>
        <div className="absolute bottom-16 left-6 animate-pulse delay-500">
          <Sparkles className="w-3 h-3 text-pink-200/70" />
        </div>
        
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 backdrop-blur-sm"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-white" />
        </button>
        
        {/* Content */}
        <div className="relative px-6 py-6 text-center">
          {/* Bouncing emoji */}
          <div className="mb-3 inline-block animate-bounce">
            <span className="text-4xl">👋</span>
          </div>
          
          {/* Main heading - happy font styling */}
          <h2 className="text-2xl font-black text-white mb-2 tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            Who wants to mingle?
          </h2>
          
          {/* Subtext */}
          <p className="text-white/90 text-sm mb-5 font-medium leading-relaxed">
            Get to know new people in your area! 
            <br />
            <span className="text-pink-200">Find your people. 💕</span>
          </p>
          
          {/* CTA Button */}
          <button
            onClick={handleAddInterests}
            className="
              group relative w-full py-3.5 px-6 
              bg-white rounded-2xl 
              font-bold text-transparent bg-clip-text 
              bg-gradient-to-r from-pink-500 to-purple-600
              shadow-lg hover:shadow-xl
              transition-all duration-300 ease-out
              hover:scale-[1.02] active:scale-[0.98]
              flex items-center justify-center gap-2
            "
          >
            <Heart className="w-5 h-5 text-pink-500 fill-pink-500 group-hover:animate-pulse" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
              Add Your Interests
            </span>
            <ArrowRight className="w-5 h-5 text-purple-500 group-hover:translate-x-1 transition-transform" />
          </button>
          
          {/* Skip text */}
          <button
            onClick={handleDismiss}
            className="mt-3 text-white/70 text-xs hover:text-white/90 transition-colors underline underline-offset-2"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
