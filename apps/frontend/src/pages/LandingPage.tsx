import { useNavigate } from 'react-router-dom';
import { 
  MapPin, Users, MessageCircle, Shield, Heart, Briefcase, 
  Plane, Calendar, Star, ChevronRight, Sparkles, Globe,
  Check, Zap, Eye, Lock, UserCheck
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-pink-500/20 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[150px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              Map & Mingle
            </span>
          </div>
          <div className="flex items-center gap-4">
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
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-16 pb-24">
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
                  for anything.
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-xl text-white/60 leading-relaxed max-w-xl">
                Friends, dating, meetups, networking, travel companions, and meeting people while traveling — all on one real-time map.
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
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
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
                    
                    {/* Map Preview */}
                    <div className="relative h-full bg-gradient-to-b from-emerald-900/30 to-slate-900 p-4">
                      {/* Map Pins */}
                      <div className="absolute top-16 left-8 animate-bounce" style={{ animationDelay: '0s' }}>
                        <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/50">
                          <Heart className="w-5 h-5 text-white" />
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-pink-500 rotate-45" />
                      </div>
                      
                      <div className="absolute top-24 right-12 animate-bounce" style={{ animationDelay: '0.3s' }}>
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-purple-500 rotate-45" />
                      </div>
                      
                      <div className="absolute top-44 left-16 animate-bounce" style={{ animationDelay: '0.6s' }}>
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50">
                          <Briefcase className="w-5 h-5 text-white" />
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 rotate-45" />
                      </div>
                      
                      <div className="absolute top-36 right-8 animate-bounce" style={{ animationDelay: '0.9s' }}>
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50">
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-green-500 rotate-45" />
                      </div>
                      
                      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 animate-bounce" style={{ animationDelay: '1.2s' }}>
                        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/50">
                          <Plane className="w-5 h-5 text-white" />
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-orange-500 rotate-45" />
                      </div>

                      {/* Preview Card */}
                      <div className="absolute bottom-4 left-4 right-4 bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full" />
                          <div className="flex-1">
                            <div className="font-semibold text-white">Sarah M.</div>
                            <div className="text-sm text-white/60">0.3 mi away • Friends</div>
                          </div>
                          <button className="px-3 py-1.5 bg-pink-500 rounded-full text-sm font-medium">
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

          {/* Mini Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-20">
            {[
              { icon: Eye, title: 'See Who\'s Around', desc: 'Real-time map of nearby people' },
              { icon: Zap, title: 'Choose Your Mode', desc: 'Dating, friends, networking, events, travel' },
              { icon: MessageCircle, title: 'Connect Instantly', desc: 'Profiles, chat, and meetups' },
            ].map((feature, i) => (
              <div key={i} className="group p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all hover:scale-105">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-pink-400" />
                </div>
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-white/60">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 px-6 py-24 bg-gradient-to-b from-transparent to-purple-950/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              How It Works
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              One app. Every type of connection. Wherever you go.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Set your mode',
                desc: 'Choose what you\'re here for — dating, friends, meetups, networking, or travel connections. Switch anytime.',
                icon: Zap,
              },
              {
                step: '02',
                title: 'See who\'s around you',
                desc: 'Explore a real-time map showing people, events, and travelers nearby. Filter by interests, distance, or purpose.',
                icon: MapPin,
              },
              {
                step: '03',
                title: 'Connect instantly',
                desc: 'Open profiles, start chatting, and plan meetups. You decide what you share and when.',
                icon: MessageCircle,
              },
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

      {/* Why People Love It */}
      <section className="relative z-10 px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Why People Love{' '}
              <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                Map & Mingle
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Users,
                title: 'Real people, real connections',
                desc: 'See who\'s nearby, not just who\'s online. Verified profiles. Real humans.',
              },
              {
                icon: Globe,
                title: 'One app for every situation',
                desc: 'No more switching between five different platforms. Everything lives in one map-driven experience.',
              },
              {
                icon: Shield,
                title: 'Privacy you control',
                desc: 'Your exact location is never shared without permission. Safety built-in from the ground up.',
              },
              {
                icon: Sparkles,
                title: 'Built for spontaneity',
                desc: 'Meet someone for coffee, join a meetup, or link up with a traveler — all happening right now around you.',
              },
            ].map((item, i) => (
              <div key={i} className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Social Proof Strip */}
          <div className="flex flex-wrap justify-center gap-8 mt-16 py-8 border-y border-white/10">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <span className="text-white/80 font-semibold">4.9 average rating</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              <span className="text-white/80 font-semibold">Thousands of connections weekly</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              <span className="text-white/80 font-semibold">Active worldwide</span>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshots & Feature Highlights */}
      <section className="relative z-10 px-6 py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              See It In Action
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Built for speed, simplicity, and real-life connection.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Phone Mockups */}
            <div className="relative flex justify-center">
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 blur-[100px]" />
              
              {/* Three phones */}
              <div className="relative flex items-end gap-4">
                {/* Left phone - smaller */}
                <div className="hidden md:block w-[180px] bg-gradient-to-b from-slate-800 to-slate-900 rounded-[2rem] p-2 shadow-2xl -rotate-6 translate-y-8">
                  <div className="bg-slate-950 rounded-[1.5rem] overflow-hidden aspect-[9/19]">
                    <div className="h-full bg-gradient-to-b from-emerald-900/40 to-slate-900 p-3 flex flex-col">
                      <div className="text-xs font-bold text-white/80 mb-2">Chat</div>
                      <div className="space-y-2 flex-1">
                        <div className="flex gap-2">
                          <div className="w-6 h-6 bg-pink-500 rounded-full flex-shrink-0" />
                          <div className="bg-white/10 rounded-xl p-2 text-xs text-white/70">Hey! Saw you're nearby 👋</div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <div className="bg-pink-500/30 rounded-xl p-2 text-xs text-white/90">Yes! Coffee?</div>
                        </div>
                        <div className="flex gap-2">
                          <div className="w-6 h-6 bg-pink-500 rounded-full flex-shrink-0" />
                          <div className="bg-white/10 rounded-xl p-2 text-xs text-white/70">Perfect! See you in 10</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Center phone - main */}
                <div className="w-[240px] md:w-[280px] bg-gradient-to-b from-slate-800 to-slate-900 rounded-[2.5rem] p-3 shadow-2xl z-10">
                  <div className="bg-slate-950 rounded-[2rem] overflow-hidden aspect-[9/19]">
                    <div className="h-8 bg-slate-900 flex items-center justify-center">
                      <div className="w-16 h-4 bg-slate-800 rounded-full" />
                    </div>
                    <div className="h-full bg-gradient-to-b from-emerald-900/30 to-slate-900 p-4 relative">
                      {/* Map pins */}
                      <div className="absolute top-8 left-6">
                        <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center shadow-lg animate-bounce" style={{ animationDuration: '2s' }}>
                          <Heart className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="absolute top-16 right-8">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center shadow-lg animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.3s' }}>
                          <Users className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="absolute top-32 left-12">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce" style={{ animationDuration: '2.2s', animationDelay: '0.6s' }}>
                          <Calendar className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="absolute top-24 right-16">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg animate-bounce" style={{ animationDuration: '2.8s', animationDelay: '0.9s' }}>
                          <Briefcase className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      
                      {/* User card overlay */}
                      <div className="absolute bottom-4 left-3 right-3 bg-white/10 backdrop-blur-xl rounded-xl p-3 border border-white/20">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full" />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-white text-sm">Alex K.</div>
                            <div className="text-xs text-white/60">0.2 mi • Networking</div>
                          </div>
                          <button className="px-3 py-1 bg-pink-500 rounded-full text-xs font-medium">Connect</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right phone - smaller */}
                <div className="hidden md:block w-[180px] bg-gradient-to-b from-slate-800 to-slate-900 rounded-[2rem] p-2 shadow-2xl rotate-6 translate-y-8">
                  <div className="bg-slate-950 rounded-[1.5rem] overflow-hidden aspect-[9/19]">
                    <div className="h-full bg-gradient-to-b from-purple-900/40 to-slate-900 p-3 flex flex-col">
                      <div className="text-xs font-bold text-white/80 mb-2">Profile</div>
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full mb-2" />
                        <div className="text-sm font-bold text-white">Sarah M.</div>
                        <div className="text-xs text-white/60 mb-3">Denver, CO</div>
                        <div className="flex flex-wrap gap-1 justify-center">
                          <span className="px-2 py-0.5 bg-pink-500/30 rounded-full text-xs">Coffee</span>
                          <span className="px-2 py-0.5 bg-purple-500/30 rounded-full text-xs">Hiking</span>
                          <span className="px-2 py-0.5 bg-blue-500/30 rounded-full text-xs">Tech</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature List */}
            <div className="space-y-6">
              {[
                { icon: MapPin, title: 'Real-Time Map', desc: 'Your world, visualized. See who\'s around you right now.' },
                { icon: Zap, title: 'Smart Modes', desc: 'Switch between purposes instantly — dating, friends, networking, events.' },
                { icon: Eye, title: 'Instant Profiles', desc: 'Simple, signal-rich profiles that help you decide in seconds.' },
                { icon: MessageCircle, title: 'Built-In Chat', desc: 'Fast conversations, zero friction. Go from map to message instantly.' },
                { icon: Shield, title: 'Safety & Controls', desc: 'Privacy settings you control. Block, report, and hide with one tap.' },
              ].map((feature, i) => (
                <div key={i} className="flex gap-4 items-start group">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:from-pink-500/30 group-hover:to-purple-500/30 transition-all">
                    <feature.icon className="w-6 h-6 text-pink-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{feature.title}</h3>
                    <p className="text-white/60">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="relative z-10 px-6 py-24 bg-gradient-to-b from-transparent to-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Who It's For
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Whether you're here for connection, opportunity, or adventure — you'll find your people.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Heart,
                title: 'People looking to date',
                desc: 'Meet people nearby and connect in real life — not after endless swiping.',
                gradient: 'from-pink-500 to-rose-500',
              },
              {
                icon: Users,
                title: 'People building friendships',
                desc: 'Find locals who actually live around you and want to connect.',
                gradient: 'from-purple-500 to-indigo-500',
              },
              {
                icon: Briefcase,
                title: 'Professionals networking',
                desc: 'Meet creators, remote workers, and entrepreneurs near you.',
                gradient: 'from-blue-500 to-cyan-500',
              },
              {
                icon: Plane,
                title: 'Travelers and digital nomads',
                desc: 'See fellow travelers, locals, and events as soon as you land in a new city.',
                gradient: 'from-orange-500 to-amber-500',
              },
              {
                icon: Calendar,
                title: 'Community seekers',
                desc: 'Discover meetups, gatherings, and things to do — all plotted on your map.',
                gradient: 'from-green-500 to-emerald-500',
              },
              {
                icon: Sparkles,
                title: 'Everyone else',
                desc: 'Whatever brings you here, there\'s a mode for you. Start exploring.',
                gradient: 'from-violet-500 to-purple-500',
              },
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
      <section className="relative z-10 px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Real Stories, Real People
            </h2>
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
              <h2 className="text-4xl md:text-5xl font-black mb-4">
                Ready to find your people?
              </h2>
              <p className="text-xl text-white/60 mb-8 max-w-xl mx-auto">
                Join thousands of people connecting in real life, every day. It's free to start.
              </p>
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

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white/80">Map & Mingle</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-white/50">
              <button onClick={() => navigate('/legal/privacy')} className="hover:text-white transition-colors">Privacy Policy</button>
              <button onClick={() => navigate('/legal/terms')} className="hover:text-white transition-colors">Terms of Service</button>
              <button onClick={() => navigate('/legal/community-guidelines')} className="hover:text-white transition-colors">Community Guidelines</button>
            </div>
            <div className="text-sm text-white/40">
              © 2025 Map & Mingle. All rights reserved.
            </div>
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
