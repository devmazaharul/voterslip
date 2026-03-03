"use client"
// ComingSoon.tsx
import { useState, useEffect } from 'react';

const ComingSoon = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [progressWidth, setProgressWidth] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // ============ Launch Date: 22 May 2026 ============
  const LAUNCH_DATE = new Date('2026-05-22T00:00:00').getTime();

  // ============ Countdown Logic ============
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = LAUNCH_DATE - now;

      if (distance < 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [LAUNCH_DATE]);

  // ============ Mount Animations ============
  useEffect(() => {
    setIsVisible(true);
    const progressTimer = setTimeout(() => setProgressWidth(95), 1000);
    return () => clearTimeout(progressTimer);
  }, []);

  const pad = (num: number): string => String(num).padStart(2, '0');

  const features = [
    { icon: '🔍', name: 'ভোটার সার্চ' },
    { icon: '📋', name: 'সম্পূর্ণ তালিকা' },
    { icon: '📱', name: 'মোবাইল ফ্রেন্ডলি' },
    { icon: '🔒', name: 'নিরাপদ ডাটা' },
    { icon: '⚡', name: 'দ্রুত গতি' },
    { icon: '🌐', name: 'অনলাইন অ্যাক্সেস' },
  ];

  const countdownItems = [
    { value: timeLeft.days, label: 'দিন' },
    { value: timeLeft.hours, label: 'ঘণ্টা' },
    { value: timeLeft.minutes, label: 'মিনিট' },
    { value: timeLeft.seconds, label: 'সেকেন্ড' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden relative font-sans">

      {/* ============ Animated Background Blobs ============ */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[10%] left-[15%] w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-[50%] right-[10%] w-96 h-96 bg-purple-600/[0.08] rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-[10%] left-[40%] w-80 h-80 bg-pink-600/[0.08] rounded-full blur-3xl animate-blob animation-delay-4000" />
        <div className="absolute top-[30%] left-[60%] w-64 h-64 bg-cyan-500/[0.06] rounded-full blur-3xl animate-blob animation-delay-3000" />
      </div>

      {/* ============ Grid Pattern ============ */}
      <div
        className="fixed inset-0 z-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* ============ Floating Particles ============ */}
      <div className="fixed inset-0 z-0">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-twinkle"
            style={{
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: [
                'rgba(99,102,241,0.5)',
                'rgba(139,92,246,0.5)',
                'rgba(168,85,247,0.4)',
                'rgba(236,72,153,0.3)',
                'rgba(34,211,238,0.3)',
              ][Math.floor(Math.random() * 5)],
              animationDuration: `${Math.random() * 4 + 2}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* ============ Main Content ============ */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-10">

        {/* ============ Logo ============ */}
        <div
          className={`mb-8 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'
          }`}
        >
          <div className="relative w-24 h-24 mx-auto mb-4 group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity animate-pulse" />
            <div className="relative w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shine" />
              <svg
                className="w-12 h-12 text-white relative z-10"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-bold text-center bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            ভোটার তালিকা
          </h2>
        </div>

        {/* ============ Main Card ============ */}
        <div
          className={`w-full max-w-2xl transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="relative bg-[#0f0f19]/80 backdrop-blur-2xl border border-indigo-500/15 rounded-3xl p-8 md:p-12 overflow-hidden">
            {/* Top gradient line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-pulse" />

            {/* ============ Development Badge ============ */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-5 py-2.5 rounded-full">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
                </span>
                <span className="text-amber-400 text-sm font-medium">🛠️ ডেভেলপমেন্ট চলছে...</span>
              </div>
            </div>

            {/* ============ Heading ============ */}
            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl font-extrabold mb-5 leading-tight">
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  ওয়েবসাইট তৈরি
                </span>
                <br />
                <span className="text-white">হচ্ছে! ⚙️</span>
              </h1>
              <p className="text-gray-400 text-base md:text-lg leading-relaxed max-w-lg mx-auto">
                আমরা আপনাদের জন্য একটি অসাধারণ ভোটার তালিকা সিস্টেম তৈরি করছি।
                ওয়েবসাইটটি বর্তমানে ডেভেলপমেন্টে আছে।
              </p>

              {/* ============ Open Date Badge ============ */}
              <div className="mt-6 inline-flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 px-6 py-3 rounded-2xl">
                <span className="text-2xl">📅</span>
                <div className="text-left">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">ওপেন হবে</p>
                  <p className="text-indigo-400 font-bold text-lg">২২ মে, ২০২৬</p>
                </div>
              </div>
            </div>

            {/* ============ Countdown ============ */}
            <div className="mb-10">
              <p className="text-center text-gray-500 text-xs font-semibold uppercase tracking-[3px] mb-5">
                ওপেন হতে বাকি
              </p>
              <div className="flex justify-center gap-3 md:gap-4 flex-wrap">
                {countdownItems.map((item, index) => (
                  <div
                    key={item.label}
                    className="group bg-indigo-500/[0.06] border border-indigo-500/15 rounded-2xl p-4 md:p-5 min-w-[78px] md:min-w-[100px] text-center hover:bg-indigo-500/[0.12] hover:border-indigo-500/30 hover:-translate-y-1 transition-all duration-300"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <span className="block text-3xl md:text-4xl font-extrabold bg-gradient-to-b from-indigo-400 to-purple-400 bg-clip-text text-transparent leading-none">
                      {pad(item.value)}
                    </span>
                    <span className="block mt-2 text-[10px] md:text-xs text-gray-500 uppercase tracking-[2px] font-semibold">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ============ Separator ============ */}
            <div className="flex items-center gap-4 mb-10">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-indigo-500/20" />
              <div className="w-2 h-2 bg-indigo-500/30 rounded-full animate-pulse" />
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-indigo-500/20" />
            </div>

            {/* ============ Progress Bar ============ */}
            <div className="mb-10">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-400">ডেভেলপমেন্ট প্রগ্রেস</span>
                <span className="text-sm font-bold text-indigo-400">95%</span>
              </div>
              <div className="w-full h-2.5 bg-indigo-500/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-[2000ms] ease-out relative"
                  style={{ width: `${progressWidth}%` }}
                >
                  <div className="absolute right-0 top-0 w-5 h-full bg-white/30 rounded-full blur-sm" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-gray-600">শুরু</span>
                <span className="text-[10px] text-gray-600">সম্পন্ন</span>
              </div>
            </div>

            {/* ============ Development Steps ============ */}
            <div className="mb-10">
              <p className="text-center text-gray-500 text-xs font-semibold uppercase tracking-[3px] mb-5">
                ডেভেলপমেন্ট স্টেপ
              </p>
              <div className="space-y-3">
                {[
                  { step: 'ডিজাইন তৈরি', status: 'done', icon: '🎨' },
                  { step: 'ডাটাবেজ সেটআপ', status: 'done', icon: '🗄️' },
                  { step: 'ফ্রন্টএন্ড ডেভেলপমেন্ট', status: 'done', icon: '💻' },
                  { step: 'ব্যাকএন্ড ডেভেলপমেন্ট', status: 'done', icon: '⚙️' },
                  { step: 'টেস্টিং ও লঞ্চ', status: 'pending', icon: '🚀' },
                ].map((item, index) => (
                  <div
                    key={item.step}
                    className={`flex items-center gap-4 p-3.5 rounded-xl border transition-all duration-300 ${
                      item.status === 'done'
                        ? 'bg-green-500/[0.06] border-green-500/20'
                        : item.status === 'progress'
                        ? 'bg-amber-500/[0.06] border-amber-500/20'
                        : 'bg-white/[0.02] border-white/[0.06]'
                    } ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                    style={{ transitionDelay: `${600 + index * 150}ms` }}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="flex-1 text-sm text-gray-300">{item.step}</span>
                    {item.status === 'done' && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full font-medium">
                        ✅ সম্পন্ন
                      </span>
                    )}
                    {item.status === 'progress' && (
                      <span className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                        চলছে
                      </span>
                    )}
                    {item.status === 'pending' && (
                      <span className="text-xs bg-gray-500/20 text-gray-500 px-3 py-1 rounded-full font-medium">
                        ⏳ বাকি
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ============ Separator ============ */}
            <div className="flex items-center gap-4 mb-10">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-purple-500/20" />
              <span className="text-xs text-gray-600">✨</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-purple-500/20" />
            </div>

            {/* ============ Features Grid ============ */}
            <div className="mb-6">
              <p className="text-center text-gray-500 text-xs font-semibold uppercase tracking-[3px] mb-5">
                যা যা থাকবে
              </p>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {features.map((feature, index) => (
                  <div
                    key={feature.name}
                    className={`bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-center 
                      hover:bg-indigo-500/[0.08] hover:border-indigo-500/20 hover:-translate-y-1 
                      transition-all duration-300 cursor-default
                      ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                    style={{
                      transitionDelay: `${900 + index * 120}ms`,
                    }}
                  >
                    <div className="text-2xl mb-2">{feature.icon}</div>
                    <div className="text-[11px] text-gray-400 font-medium leading-tight">
                      {feature.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ============ Bottom Info ============ */}
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 text-gray-600 text-xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>ওয়েবসাইটটি ২২ মে ২০২৬ তারিখে সবার জন্য উন্মুক্ত হবে</span>
              </div>
            </div>
          </div>
        </div>

        {/* ============ Footer ============ */}
        <div
          className={`mt-10 text-center transition-all duration-1000 delay-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <p className="text-gray-600 text-xs flex items-center justify-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            তৈরি হচ্ছে ভালোবাসা দিয়ে ❤️ &copy; 2026 ভোটার তালিকা
          </p>
        </div>
      </div>

      {/* ============ Custom Animations ============ */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(20px, 50px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 15s ease-in-out infinite;
        }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-3000 { animation-delay: 3s; }
        .animation-delay-4000 { animation-delay: 4s; }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        .animate-twinkle {
          animation: twinkle ease-in-out infinite;
        }
        
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-shine {
          animation: shine 3s ease-in-out infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default ComingSoon;