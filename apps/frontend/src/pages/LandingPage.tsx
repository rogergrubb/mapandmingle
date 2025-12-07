import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  MapPin, Users, MessageCircle, Shield, Heart, Briefcase, 
  Plane, Calendar, Star, ChevronRight, Sparkles, Globe,
  Zap, Eye, Lock, UserCheck, Menu, X,
  Instagram, Twitter, Linkedin, Play, Apple, Flag
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { label: 'How It Works', id: 'how-it-works' },
    { label: 'Features', id: 'features' },
    { label: 'Who It\'s For', id: 'who-its-for' },
    { label: 'Safety', id: 'safety' },
    { label: 'Stories', id: 'testimonials' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-pink-500/20 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[150px]" />
      </div>

      {/* Navigation - Desktop & Mobile */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-slate-950/90 backdrop-blur-xl shadow-lg shadow-black/20 py-3' 
          : 'bg-transparent py-4'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              Map & Mingle
            </span>
          </button>

          {/* Desktop Center Links */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="text-white/70 hover:text-white transition-colors font-medium text-sm"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Desktop Right - Auth Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-white/80 hover:text-white transition-colors font-medium"
            >
              Log In
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full font-semibold hover:shadow-lg hover:shadow-pink-500/25 transition-all hover:scale-105"
            >
              Get Started — It's Free
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-white/80 hover:text-white transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-slate-950/95 backdrop-blur-xl border-t border-white/10">
            <div className="px-6 py-6 space-y-4">
              {/* Primary CTA at top */}
              <button 
                onClick={() => { navigate('/register'); setMobileMenuOpen(false); }}
                className="w-full px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-pink-500/25 transition-all"
              >
                Get Started — It's Free
              </button>
              <button 
                onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                className="w-full px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-medium text-white/80 hover:bg-white/10 transition-all"
              >
                Log In
              </button>
              <div className="border-t border-white/10 pt-4 space-y-1">
                {navLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => scrollToSection(link.id)}
                    className="w-full px-4 py-3 text-left text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-medium"
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-28 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span className="text-sm text-white/80">Real-time connections, real people</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight">
                Find the people around you —{' '}
                <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                  for anything.*
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-xl text-white/60 leading-relaxed max-w-xl">
                Friends, dating, meetups, networking, travel companions, and meeting people while traveling — all on one real-time map.
              </p>
              
              {/* Cheeky Disclaimer */}
              <p className="text-sm text-white/40 italic">
                *Anything legal, of course. We're cool, but not <span className="italic">that</span> cool.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => navigate('/register')}
                  className="group px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-pink-500/30 transition-all hover:scale-105 flex items-center justify-center gap-2"
                >
                  Get Started — It's Free
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => scrollToSection('how-it-works')}
                  className="px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl font-semibold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  Explore how it works
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-2 text-white/50">
                  <Lock className="w-4 h-4 text-green-400" />
                  <span className="text-sm">Location always private</span>
                </div>
                <div className="flex items-center gap-2 text-white/50">
                  <UserCheck className="w-4 h-4 text-blue-400" />
                  <span className="text-sm">Verified profiles</span>
                </div>
                <div className="flex items-center gap-2 text-white/50">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  <span className="text-sm">Free to join</span>
                </div>
              </div>
            </div>

            {/* Hero Visual - Phone Mockup */}
            <div className="relative lg:pl-12">
              <div className="relative mx-auto w-[300px] md:w-[350px]">
                {/* Phone Frame */}
                <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 rounded-[3rem] p-3 shadow-2xl shadow-purple-500/20">
                  <div className="bg-slate-950 rounded-[2.5rem] overflow-hidden aspect-[9/19]">
                    {/* Status Bar */}
                    <div className="h-12 bg-slate-900 flex items-center justify-center">
                      <div className="w-20 h-5 bg-slate-800 rounded-full" />
                    </div>
                    
                    {/* Map Preview - Simulated Map */}
                    <div className="relative h-full overflow-hidden">
                      {/* Map Base - Light colored like real maps */}
                      <div className="absolute inset-0 bg-[#e8e4df]">
                        {/* Water/River */}
                        <div className="absolute top-1/3 -left-8 w-[150%] h-16 bg-[#aadaff] rotate-12 opacity-60" />
                        
                        {/* Parks */}
                        <div className="absolute top-20 left-4 w-16 h-12 bg-[#c5e8c5] rounded-lg opacity-80" />
                        <div className="absolute bottom-40 right-8 w-20 h-16 bg-[#c5e8c5] rounded-xl opacity-80" />
                        <div className="absolute top-48 right-4 w-12 h-10 bg-[#c5e8c5] rounded-lg opacity-80" />
                        
                        {/* Major Roads */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-full bg-white" />
                        <div className="absolute top-1/2 left-0 w-full h-6 bg-white -translate-y-1/2" />
                        <div className="absolute top-1/4 left-0 w-full h-4 bg-[#fefefe] rotate-3" />
                        <div className="absolute top-2/3 left-0 w-full h-4 bg-[#fefefe] -rotate-2" />
                        
                        {/* Secondary Streets - Grid Pattern */}
                        <div className="absolute top-16 left-0 w-full h-2 bg-white/80" />
                        <div className="absolute top-32 left-0 w-full h-2 bg-white/80" />
                        <div className="absolute bottom-24 left-0 w-full h-2 bg-white/80" />
                        <div className="absolute bottom-48 left-0 w-full h-2 bg-white/80" />
                        
                        <div className="absolute top-0 left-8 w-2 h-full bg-white/80" />
                        <div className="absolute top-0 left-20 w-2 h-full bg-white/80" />
                        <div className="absolute top-0 right-8 w-2 h-full bg-white/80" />
                        <div className="absolute top-0 right-20 w-2 h-full bg-white/80" />
                        
                        {/* Buildings/Blocks - subtle shapes */}
                        <div className="absolute top-8 left-10 w-8 h-6 bg-[#d8d4cf] rounded-sm opacity-60" />
                        <div className="absolute top-8 right-12 w-10 h-8 bg-[#d8d4cf] rounded-sm opacity-60" />
                        <div className="absolute top-24 left-24 w-6 h-10 bg-[#d8d4cf] rounded-sm opacity-60" />
                        <div className="absolute bottom-56 left-6 w-8 h-6 bg-[#d8d4cf] rounded-sm opacity-60" />
                        <div className="absolute bottom-64 right-16 w-6 h-8 bg-[#d8d4cf] rounded-sm opacity-60" />
                      </div>

                      {/* Map Pins - Keep exactly as they were */}
                      <div className="absolute top-16 left-8 animate-bounce" style={{ animationDelay: '0s' }}>
                        <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/50 border-2 border-white">
                          <Heart className="w-5 h-5 text-white" />
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-pink-500 rotate-45" />
                      </div>
                      
                      <div className="absolute top-24 right-12 animate-bounce" style={{ animationDelay: '0.3s' }}>
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50 border-2 border-white">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-purple-500 rotate-45" />
                      </div>
                      
                      <div className="absolute top-44 left-16 animate-bounce" style={{ animationDelay: '0.6s' }}>
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50 border-2 border-white">
                          <Briefcase className="w-5 h-5 text-white" />
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 rotate-45" />
                      </div>
                      
                      <div className="absolute top-36 right-8 animate-bounce" style={{ animationDelay: '0.9s' }}>
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50 border-2 border-white">
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-green-500 rotate-45" />
                      </div>
                      
                      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 animate-bounce" style={{ animationDelay: '1.2s' }}>
                        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/50 border-2 border-white">
                          <Plane className="w-5 h-5 text-white" />
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-orange-500 rotate-45" />
                      </div>

                      {/* Preview Card */}
                      <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full" />
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">Sarah M.</div>
                            <div className="text-sm text-gray-500">0.3 mi away •</div>
                          </div>
                          <button className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full text-sm font-semibold text-white shadow-md">
                            Wave
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl shadow-lg animate-float">
                  <span className="text-sm font-semibold">Dating</span>
                </div>
                <div className="absolute top-20 -left-8 px-4 py-2 bg-blue-500 rounded-xl shadow-lg animate-float" style={{ animationDelay: '0.5s' }}>
                  <span className="text-sm font-semibold">Networking</span>
                </div>
                <div className="absolute bottom-32 -right-8 px-4 py-2 bg-green-500 rounded-xl shadow-lg animate-float" style={{ animationDelay: '1s' }}>
                  <span className="text-sm font-semibold">Events</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 px-6 py-24 bg-gradient-to-b from-transparent to-purple-950/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">How It Works</h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">One app. Every type of connection. Wherever you go.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Set your mode', desc: 'Choose what you\'re here for — dating, friends, meetups, networking, or travel connections. Switch anytime.', icon: Zap },
              { step: '02', title: 'See who\'s around you', desc: 'Explore a real-time map showing people, events, and travelers nearby. Filter by interests, distance, or purpose.', icon: MapPin },
              { step: '03', title: 'Connect instantly', desc: 'Open profiles, start chatting, and plan meetups. You decide what you share and when.', icon: MessageCircle },
            ].map((item, i) => (
              <div key={i} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-3xl blur opacity-0 group-hover:opacity-25 transition-opacity" />
                <div className="relative p-8 bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-3xl h-full">
                  <div className="text-6xl font-black text-white/10 mb-4">{item.step}</div>
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                  <p className="text-white/60 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Built for <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">Real Connections</span>
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">Speed, simplicity, and real-life connection — all in one app.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { icon: MapPin, title: 'Real-Time Map', desc: 'Your world, visualized' },
              { icon: Zap, title: 'Smart Modes', desc: 'Switch purposes instantly' },
              { icon: UserCheck, title: 'Signal-Rich Profiles', desc: 'Simple but meaningful' },
              { icon: MessageCircle, title: 'Built-In Chat', desc: 'Fast, zero friction' },
              { icon: Shield, title: 'Safety Controls', desc: 'Privacy you control' },
            ].map((feature, i) => (
              <div key={i} className="p-5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all group text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold mb-1">{feature.title}</h3>
                <p className="text-white/50 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety Section */}
      <section id="safety" className="relative z-10 px-6 py-24 bg-gradient-to-b from-transparent to-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-6">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400 font-medium">Your Safety Comes First</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-6">
                Privacy & Safety <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Built In</span>
              </h2>
              <p className="text-xl text-white/60 mb-8 leading-relaxed">
                Map & Mingle is designed with your safety at the core. Your exact location is never shared without your permission.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Lock, text: 'Location privacy controls — share what you want, when you want' },
                  { icon: UserCheck, text: 'Profile verification tools to build trust' },
                  { icon: Flag, text: 'Easy reporting and blocking for inappropriate behavior' },
                  { icon: Shield, text: 'Safety tips and guidelines built into the experience' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="w-4 h-4 text-green-400" />
                    </div>
                    <p className="text-white/70">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-3xl blur-3xl" />
              <div className="relative p-8 bg-slate-900/80 border border-white/10 rounded-3xl">
                <div className="space-y-6">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <Lock className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold">Location Privacy</div>
                        <div className="text-sm text-white/50">Only share approximate location</div>
                      </div>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" />
                    </div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <Eye className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold">Profile Visibility</div>
                          <div className="text-sm text-white/50">Control who sees you</div>
                        </div>
                      </div>
                      <div className="w-12 h-6 bg-green-500 rounded-full relative">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section id="who-its-for" className="relative z-10 px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">Who It's For</h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">Whether you're here for connection, opportunity, or adventure — you'll find your people.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Heart, title: 'People looking to date', desc: 'Meet people nearby and connect in real life — not after endless swiping.', gradient: 'from-pink-500 to-rose-500' },
              { icon: Users, title: 'People building friendships', desc: 'Find locals who actually live around you and want to connect.', gradient: 'from-purple-500 to-indigo-500' },
              { icon: Briefcase, title: 'Professionals networking', desc: 'Meet creators, remote workers, and entrepreneurs near you.', gradient: 'from-blue-500 to-cyan-500' },
              { icon: Plane, title: 'Travelers and digital nomads', desc: 'See fellow travelers, locals, and events as soon as you land in a new city.', gradient: 'from-orange-500 to-amber-500' },
              { icon: Calendar, title: 'Community seekers', desc: 'Discover meetups, gatherings, and things to do — all plotted on your map.', gradient: 'from-green-500 to-emerald-500' },
              { icon: Sparkles, title: 'Everyone else', desc: 'Whatever brings you here, there\'s a mode for you. Start exploring.', gradient: 'from-violet-500 to-purple-500' },
            ].map((item, i) => (
              <div key={i} className="group relative overflow-hidden rounded-2xl">
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
                <div className="relative p-6 border border-white/10 rounded-2xl h-full bg-slate-900/50">
                  <div className={`w-12 h-12 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative z-10 px-6 py-24 bg-gradient-to-b from-transparent to-purple-950/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">Real Stories, Real People</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { quote: "I moved to Denver knowing no one. Met two friends my first week.", name: "Sarah M.", location: "Denver, CO" },
              { quote: "Finally an app that shows people actually near me, not 40 miles away.", name: "Jamal R.", location: "Atlanta, GA" },
              { quote: "Used it while traveling in Portugal and met other backpackers instantly.", name: "Lina P.", location: "Lisbon, PT" },
              { quote: "Great for networking. Met a designer who became a business partner.", name: "Travis L.", location: "Austin, TX" },
              { quote: "The map makes it feel so natural. You just see someone nearby and connect.", name: "Bella T.", location: "NYC, NY" },
              { quote: "I feel safe using it because I control what people can see.", name: "Kevin H.", location: "Seattle, WA" },
            ].map((testimonial, i) => (
              <div key={i} className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-white/80 mb-4 leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full" />
                  <div>
                    <div className="font-semibold text-sm">{testimonial.name}</div>
                    <div className="text-white/50 text-xs">{testimonial.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 px-6 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-600/20 rounded-3xl blur-3xl" />
            <div className="relative p-12 bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-3xl">
              <h2 className="text-4xl md:text-5xl font-black mb-4">Ready to find your people?</h2>
              <p className="text-xl text-white/60 mb-8 max-w-xl mx-auto">Join thousands of people connecting in real life, every day. It's free to start.</p>
              <button 
                onClick={() => navigate('/register')}
                className="group px-10 py-5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl font-bold text-xl hover:shadow-xl hover:shadow-pink-500/30 transition-all hover:scale-105 inline-flex items-center gap-3"
              >
                Get Started — It's Free
                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Comprehensive Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 py-16">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-4 lg:col-span-1 mb-8 lg:mb-0">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                  Map & Mingle
                </span>
              </div>
              <p className="text-white/50 text-sm leading-relaxed mb-4">
                The real-time map for dating, friendships, networking, events, and travel connections near you.
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-9 h-9 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center transition-colors">
                  <Instagram className="w-4 h-4 text-white/60" />
                </a>
                <a href="#" className="w-9 h-9 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center transition-colors">
                  <Twitter className="w-4 h-4 text-white/60" />
                </a>
                <a href="#" className="w-9 h-9 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center transition-colors">
                  <Linkedin className="w-4 h-4 text-white/60" />
                </a>
              </div>
            </div>

            {/* Product Column */}
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-3">
                <li><button onClick={() => scrollToSection('how-it-works')} className="text-white/50 hover:text-white text-sm transition-colors">How It Works</button></li>
                <li><button onClick={() => scrollToSection('features')} className="text-white/50 hover:text-white text-sm transition-colors">Features</button></li>
                <li><button onClick={() => scrollToSection('who-its-for')} className="text-white/50 hover:text-white text-sm transition-colors">Who It's For</button></li>
                <li><button onClick={() => scrollToSection('safety')} className="text-white/50 hover:text-white text-sm transition-colors">Safety & Privacy</button></li>
                <li><span className="text-white/30 text-sm">Download App (Coming Soon)</span></li>
              </ul>
            </div>

            {/* Community Column */}
            <div>
              <h4 className="font-semibold text-white mb-4">Community</h4>
              <ul className="space-y-3">
                <li><button onClick={() => scrollToSection('testimonials')} className="text-white/50 hover:text-white text-sm transition-colors">Stories & Successes</button></li>
                <li><span className="text-white/30 text-sm">Events & Meetups (Soon)</span></li>
                <li><span className="text-white/30 text-sm">Blog (Coming Soon)</span></li>
                <li><span className="text-white/30 text-sm">Ambassador Program</span></li>
              </ul>
            </div>

            {/* Support Column */}
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-3">
                <li><span className="text-white/30 text-sm">Help Center (Soon)</span></li>
                <li><button onClick={() => scrollToSection('safety')} className="text-white/50 hover:text-white text-sm transition-colors">Safety & Privacy</button></li>
                <li><button onClick={() => navigate('/report-status')} className="text-white/50 hover:text-white text-sm transition-colors">Report a Problem</button></li>
                <li><a href="mailto:support@mapandmingle.com" className="text-white/50 hover:text-white text-sm transition-colors">Contact Us</a></li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><button onClick={() => navigate('/legal/privacy')} className="text-white/50 hover:text-white text-sm transition-colors">Privacy Policy</button></li>
                <li><button onClick={() => navigate('/legal/terms')} className="text-white/50 hover:text-white text-sm transition-colors">Terms of Use</button></li>
                <li><button onClick={() => navigate('/legal/community-guidelines')} className="text-white/50 hover:text-white text-sm transition-colors">Community Guidelines</button></li>
              </ul>
            </div>
          </div>

          {/* App Store Buttons */}
          <div className="flex flex-wrap justify-center gap-4 py-8 border-y border-white/10 mb-8">
            <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3 opacity-60">
              <Apple className="w-6 h-6 text-white" />
              <div>
                <div className="text-xs text-white/50">Coming soon to</div>
                <div className="font-semibold text-sm">App Store</div>
              </div>
            </div>
            <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3 opacity-60">
              <Play className="w-6 h-6 text-white" />
              <div>
                <div className="text-xs text-white/50">Coming soon to</div>
                <div className="font-semibold text-sm">Google Play</div>
              </div>
            </div>
          </div>

          {/* Safety Disclaimer */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-4">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400 font-medium">Your Safety Matters</span>
            </div>
            <p className="text-white/40 text-sm max-w-2xl mx-auto leading-relaxed">
              Always meet in public places and use your judgment. Your safety comes first. Location sharing is always optional and under your control.
            </p>
            <p className="text-white/30 text-xs mt-3 max-w-2xl mx-auto">
              Map & Mingle does not guarantee any specific outcomes from connections made on the platform. Please use common sense and follow local laws and safety guidelines.
            </p>
          </div>

          {/* Copyright */}
          <div className="text-center pt-8 border-t border-white/10">
            <p className="text-white/40 text-sm">© {new Date().getFullYear()} Map & Mingle. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Custom Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
