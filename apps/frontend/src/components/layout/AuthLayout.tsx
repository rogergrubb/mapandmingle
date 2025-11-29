import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';

// Animated Logo Component
function AnimatedLogo() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative w-32 h-32 mx-auto mb-6">
      {/* Outer glow ring */}
      <div 
        className={`absolute inset-0 rounded-full bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 
                    opacity-30 blur-xl transition-all duration-1000 ${mounted ? 'scale-110' : 'scale-0'}`}
      />
      
      {/* Main circle background */}
      <div 
        className={`absolute inset-2 rounded-full bg-gradient-to-br from-white/20 to-white/5 
                    backdrop-blur-sm border border-white/30 shadow-2xl
                    transition-all duration-700 ${mounted ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
      />
      
      {/* Map Pin Icon */}
      <svg
        viewBox="0 0 100 100"
        className={`absolute inset-0 w-full h-full transition-all duration-1000 delay-300
                   ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
      >
        {/* Map pin body */}
        <defs>
          <linearGradient id="pinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f0f0f0" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.2"/>
          </filter>
        </defs>
        
        {/* Main pin */}
        <path
          d="M50 18 C35 18 24 29 24 44 C24 60 50 78 50 78 C50 78 76 60 76 44 C76 29 65 18 50 18"
          fill="url(#pinGradient)"
          filter="url(#shadow)"
          className={`transition-all duration-700 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}
        />
        
        {/* Heart inside pin */}
        <path
          d="M50 38 C47 35 42 35 40 38 C38 41 38 45 40 48 L50 58 L60 48 C62 45 62 41 60 38 C58 35 53 35 50 38"
          fill="#ec4899"
          className={`transition-all duration-500 delay-700 ${mounted ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
          style={{ transformOrigin: '50px 46px' }}
        />
      </svg>

      {/* Floating people icons */}
      <div 
        className={`absolute -left-2 top-1/2 w-8 h-8 bg-white/90 rounded-full shadow-lg 
                    flex items-center justify-center transition-all duration-700 delay-500
                    ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}
      >
        <svg className="w-5 h-5 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="7" r="4"/>
          <path d="M12 14c-6 0-8 3-8 6v1h16v-1c0-3-2-6-8-6z"/>
        </svg>
      </div>
      
      <div 
        className={`absolute -right-2 top-1/3 w-8 h-8 bg-white/90 rounded-full shadow-lg 
                    flex items-center justify-center transition-all duration-700 delay-700
                    ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
      >
        <svg className="w-5 h-5 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="7" r="4"/>
          <path d="M12 14c-6 0-8 3-8 6v1h16v-1c0-3-2-6-8-6z"/>
        </svg>
      </div>

      {/* Sparkles */}
      <div 
        className={`absolute -top-1 left-1/4 w-2 h-2 bg-yellow-300 rounded-full 
                    transition-all duration-500 delay-1000 animate-pulse
                    ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}
      />
      <div 
        className={`absolute top-1/4 -right-1 w-1.5 h-1.5 bg-pink-300 rounded-full 
                    transition-all duration-500 delay-1100 animate-pulse
                    ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}
      />
      <div 
        className={`absolute bottom-1/4 -left-1 w-1.5 h-1.5 bg-purple-300 rounded-full 
                    transition-all duration-500 delay-1200 animate-pulse
                    ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}
      />
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
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating circles */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl animate-pulse" 
             style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-pink-300/10 rounded-full blur-2xl animate-pulse" 
             style={{ animationDelay: '2s' }} />
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
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
            <span className="inline-block mx-1 text-white/80 font-light">&</span>
            <span className="inline-block transform hover:scale-105 transition-transform">Mingle</span>
          </h1>
          
          {/* Tagline */}
          <p className="text-white/90 text-lg font-light tracking-wide">
            Meet people, discover places
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
