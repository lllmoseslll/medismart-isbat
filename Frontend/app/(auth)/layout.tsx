const SIDE_IMAGE = 'https://images.pexels.com/photos/8248290/pexels-photo-8248290.jpeg?auto=compress&cs=tinysrgb&w=1200&q=80';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* ── Form panel ───────────────────────── */}
      <div className="flex-1 flex flex-col justify-center bg-white px-8 py-12 lg:px-16 overflow-y-auto">
        <div className="max-w-md w-full mx-auto">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 mb-10 group">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#0d9488,#0284c7)' }}>
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-brand-900 font-bold text-xl" style={{ fontFamily: 'Outfit,sans-serif' }}>MediSmart</span>
          </a>

          {children}
        </div>
      </div>

      {/* ── Image panel ──────────────────────── */}
      <div className="hidden lg:flex w-[44%] relative overflow-hidden flex-shrink-0">
        <img
          src={SIDE_IMAGE}
          alt="Doctor with patient"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(160deg, rgba(12,74,110,0.88) 0%, rgba(13,148,136,0.60) 60%, rgba(12,74,110,0.75) 100%)' }} />

        {/* Content over image */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Top badge */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2.5 w-fit">
            <div className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-white text-xs font-semibold">MediSmart AI is live</span>
          </div>

          {/* Bottom quote + trust badge */}
          <div>
            <blockquote className="mb-8">
              <p className="text-2xl font-bold text-white leading-snug mb-4"
                style={{ fontFamily: 'Outfit,sans-serif' }}>
                "The good physician treats the disease; the great physician treats the patient who has the disease."
              </p>
              <footer className="text-teal-300 text-sm font-medium">— William Osler</footer>
            </blockquote>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#0d9488,#0284c7)' }}>
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Secure & Private</p>
                <p className="text-white/55 text-xs">Your health data is encrypted and protected</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
