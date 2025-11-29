import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';

// Animated Logo Component - Friendly pin with diverse figures gathering
function AnimatedLogo() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Diverse figures - different shapes representing all walks of life
  const figures = [
    { id: 1, delay: 0.3, startX: -60, startY: -20, endX: -28, endY: 8, size: 'w-6 h-6', color: 'from-blue-400 to-blue-500' },
    { id: 2, delay: 0.5, startX: 60, startY: -30, endX: 28, endY: 5, size: 'w-5 h-5', color: 'from-green-400 to-emerald-500' },
    { id: 3, delay: 0.7, startX: -50, startY: 50, endX: -22, endY: 28, size: 'w-5 h-5', color: 'from-orange-400 to-amber-500' },
    { id: 4, delay: 0.4, startX: 55, startY: 45, endX: 24, endY: 25, size: 'w-6 h-6', color: 'from-purple-400 to-violet-500' },
    { id: 5, delay: 0.6, startX: 0, startY: -55, endX: 0, endY: -18, size: 'w-5 h-5', color: 'from-pink-400 to-rose-500' },
    { id: 6, delay: 0.8, startX: -65, startY: 15, endX: -30, endY: 18, size: 'w-4 h-4', color: 'from-teal-400 to-cyan-500' },
    { id: 7, delay: 0.9, startX: 65, startY: 10, endX: 30, endY: 15, size: 'w-4 h-4', color: 'from-indigo-400 to-blue-500' },
    { id: 8, delay: 1.0, startX: 30, startY: 55, endX: 12, endY: 32, size: 'w-4 h-4', color: 'from-red-400 to-rose-500' },
  ];

  return (
    <div className="relative w-40 h-40 mx-auto mb-6">
      {/* Soft glow behind everything */}
      <div 
        className={`absolute inset-0 rounded-full bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300 
                    opacity-20 blur-2xl transition-all duration-1500 
                    ${mounted ? 'scale-125 opacity-30' : 'scale-0 opacity-0'}`}
      />
      
      {/* Connection lines from figures to center */}
      <svg 
        className={`absolute inset-0 w-full h-full transition-opacity duration-1000 delay-700
                   ${mounted ? 'opacity-100' : 'opacity-0'}`}
        viewBox="-50 -50 100 100"
      >
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.1" />
            <stop offset="50%" stopColor="white" stopOpacity="0.3" />
            <stop offset="100%" stopColor="white" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {figures.map((fig) => (
          <line
            key={`line-${fig.id}`}
            x1={mounted ? fig.endX : fig.startX}
            y1={mounted ? fig.endY : fig.startY}
            x2="0"
            y2="5"
            stroke="url(#lineGradient)"
            strokeWidth="0.5"
            className="transition-all duration-1000"
            style={{ transitionDelay: `${fig.delay + 0.5}s` }}
          />
        ))}
      </svg>

      {/* Central Map Pin - The gathering place */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className={`relative transition-all duration-700 ${mounted ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
        >
          <svg width="56" height="70" viewBox="0 0 56 70" className="drop-shadow-lg">
            <defs>
              <linearGradient id="pinBodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#f3f4f6" />
              </linearGradient>
              <filter id="pinShadow" x="-20%" y="-10%" width="140%" height="130%">
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.15"/>
              </filter>
            </defs>
            
            {/* Pin body */}
            <path
              d="M28 4 C14 4 4 14 4 28 C4 44 28 66 28 66 C28 66 52 44 52 28 C52 14 42 4 28 4"
              fill="url(#pinBodyGradient)"
              filter="url(#pinShadow)"
            />
            
            {/* Waving hand emoji style - friendly wave */}
            <g className={`origin-center ${mounted ? 'animate-wave' : ''}`} style={{ transformOrigin: '28px 28px' }}>
              {/* Simple friendly face */}
              <circle cx="20" cy="24" r="3" fill="#374151" /> {/* Left eye */}
              <circle cx="36" cy="24" r="3" fill="#374151" /> {/* Right eye */}
              
              {/* Smile */}
              <path
                d="M18 34 Q28 44 38 34"
                fill="none"
                stroke="#374151"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </g>
          </svg>
          
          {/* Wave lines - showing friendliness */}
          <div 
            className={`absolute -right-2 top-4 transition-all duration-500 delay-1000
                       ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20">
              <path d="M2 10 Q8 6 14 10 Q8 14 2 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6" className="animate-pulse" />
              <path d="M6 10 Q10 7 14 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.4" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
            </svg>
          </div>
        </div>
      </div>

      {/* Diverse figures gathering */}
      {figures.map((fig) => (
        <div
          key={fig.id}
          className={`absolute left-1/2 top-1/2 ${fig.size} rounded-full bg-gradient-to-br ${fig.color}
                      shadow-lg transition-all duration-1000 flex items-center justify-center
                      ${mounted ? 'opacity-100' : 'opacity-0'}`}
          style={{
            transform: mounted 
              ? `translate(calc(-50% + ${fig.endX}px), calc(-50% + ${fig.endY}px))` 
              : `translate(calc(-50% + ${fig.startX}px), calc(-50% + ${fig.startY}px))`,
            transitionDelay: `${fig.delay}s`,
          }}
        >
          {/* Simple person icon */}
          <svg viewBox="0 0 24 24" fill="white" className="w-3/5 h-3/5 opacity-90">
            <circle cx="12" cy="7" r="4"/>
            <path d="M12 14c-5 0-8 2.5-8 5v2h16v-2c0-2.5-3-5-8-5z"/>
          </svg>
        </div>
      ))}

      {/* Sparkle effects */}
      {[
        { top: '5%', left: '20%', delay: '0s', size: 'w-2 h-2' },
        { top: '15%', right: '15%', delay: '0.5s', size: 'w-1.5 h-1.5' },
        { bottom: '25%', left: '10%', delay: '1s', size: 'w-1.5 h-1.5' },
        { bottom: '20%', right: '10%', delay: '0.3s', size: 'w-2 h-2' },
      ].map((sparkle, i) => (
        <div
          key={i}
          className={`absolute ${sparkle.size} bg-white rounded-full transition-all duration-500
                      ${mounted ? 'opacity-60 scale-100' : 'opacity-0 scale-0'}`}
          style={{
            top: sparkle.top,
            left: sparkle.left,
            right: sparkle.right,
            bottom: sparkle.bottom,
            transitionDelay: `${1.2 + i * 0.1}s`,
            animation: mounted ? `twinkle 2s ease-in-out infinite ${sparkle.delay}` : 'none',
          }}
        />
      ))}
    </div>
  );
}

export default function AuthLayout() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 
                    flex items-center justify-center p-4 overflow-hidden relative">
      {/* CSS for animations */}
      <style>{`
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(5deg); }
          75% { transform: rotate(-5deg); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .animate-wave {
          animation: wave 2s ease-in-out infinite;
        }
      `}</style>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl animate-pulse" 
             style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-pink-300/10 rounded-full blur-2xl animate-pulse" 
             style={{ animationDelay: '2s' }} />
        
        {/* World map dots pattern - subtle */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Branding */}
        <div 
          className={`text-center mb-8 transition-all duration-700 
                     ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}
        >
          <AnimatedLogo />
          
          {/* App Name */}
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            <span className="inline-block transform hover:scale-105 transition-transform">Map</span>
            <span className="inline-block mx-2 text-white/80 font-light">&</span>
            <span className="inline-block transform hover:scale-105 transition-transform">Mingle</span>
          </h1>
          
          {/* Tagline - more inclusive */}
          <p className="text-white/90 text-lg font-light tracking-wide">
            Find your people, wherever you are
          </p>
          
          {/* Decorative line */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="w-8 h-0.5 bg-white/30 rounded-full" />
            <div className="w-2 h-2 bg-white/50 rounded-full" />
            <div className="w-8 h-0.5 bg-white/30 rounded-full" />
          </div>
        </div>

        {/* Auth Card */}
        <div 
          className={`transition-all duration-700 delay-300
                     ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <Outlet />
        </div>

        {/* Footer */}
        <div 
          className={`text-center mt-8 text-white/60 text-sm transition-all duration-700 delay-500
                     ${mounted ? 'opacity-100' : 'opacity-0'}`}
        >
          <p>© 2024 Map & Mingle. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
