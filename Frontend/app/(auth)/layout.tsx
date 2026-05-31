const SIDE_IMAGE = 'https://images.pexels.com/photos/8248290/pexels-photo-8248290.jpeg?auto=compress&cs=tinysrgb&w=1600&q=80';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Form panel — full width on mobile, ~35% on desktop */}
      <div className="w-full md:w-[35%] md:min-w-[380px] flex flex-col justify-center bg-white px-6 sm:px-10 py-10 overflow-y-auto">
        <div className="max-w-sm w-full mx-auto">
          <a href="/" className="flex items-center gap-2 mb-10 group">
            <div className="h-8 w-8 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#0d9488,#0284c7)' }}>
              <svg className="h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-brand-900 font-bold text-lg" style={{ fontFamily: 'Outfit,sans-serif' }}>MediSmart</span>
          </a>
          {children}
        </div>
      </div>

      {/* Image panel — hidden on mobile */}
      <div className="hidden md:block flex-1 relative overflow-hidden">
        <img
          src={SIDE_IMAGE}
          alt="Doctor with patient"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Subtle overlay */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(160deg, rgba(12,74,110,0.35) 0%, rgba(13,148,136,0.20) 60%, rgba(12,74,110,0.30) 100%)' }} />

        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 px-4 py-2 w-fit">
            <div className="h-2 w-2 bg-teal-400 animate-pulse" />
            <span className="text-white text-xs font-semibold">MediSmart AI is live</span>
          </div>

          <div>
            <blockquote className="mb-8">
              <p className="text-3xl font-bold text-white leading-snug mb-4"
                style={{ fontFamily: 'Outfit,sans-serif' }}>
                "The good physician treats the disease; the great physician treats the patient who has the disease."
              </p>
              <footer className="text-teal-200 text-sm font-medium">William Osler</footer>
            </blockquote>
            <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm border border-white/25 p-4 w-fit">
              <div className="h-9 w-9 flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#0d9488,#0284c7)' }}>
                <svg className="h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Secure and Private</p>
                <p className="text-white/60 text-xs">Your health data is encrypted and protected</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
