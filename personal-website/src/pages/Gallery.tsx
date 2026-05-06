import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Camera } from 'lucide-react';

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('revealed');
          obs.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;

export default function Gallery() {
  const ref1 = useScrollReveal();
  const ref2 = useScrollReveal();

  const photos = [
    { src: asset('hero-portrait.jpg'), title: 'Portrait', subtitle: 'Studio Session 01' },
    { src: asset('album-photo-1.jpg'), title: 'On the Road', subtitle: 'Desert Walk' },
    { src: asset('album-photo-2.png'), title: 'Cover Art', subtitle: 'Album Concept' },
    { src: asset('grid-shelf.jpg'), title: 'Collection', subtitle: 'Vinyl Shelf' },
    { src: asset('grid-coffee.jpg'), title: 'Morning', subtitle: 'Coffee & Vinyl' },
    { src: asset('hero-cover.jpg'), title: 'Shop', subtitle: 'Afterglow Store' },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#0f0c0a', color: '#f5e6d0' }}>
      <div className="warm-noise" />

      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center gap-4"
        style={{
          background: 'rgba(15, 12, 10, 0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(212, 165, 116, 0.1)',
        }}
      >
        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-[#f5e6d0]/60 hover:text-[#d4a574] transition-colors"
        >
          <ArrowLeft size={16} />
          返回首页
        </Link>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Camera size={16} className="text-[#d4a574]" />
          <span className="heading-serif text-sm font-bold text-[#f5e6d0]">Photo Archive</span>
        </div>
      </header>

      {/* Content */}
      <main className="pt-24 pb-20 px-6 lg:px-12 max-w-6xl mx-auto">
        {/* Title */}
        <div ref={ref1} className="reveal mb-12">
          <p className="eyebrow mb-3">Visual Collection</p>
          <h1 className="heading-serif text-3xl lg:text-5xl font-bold text-[#f5e6d0] mb-4">
            光影存档
          </h1>
          <p className="text-sm text-[#f5e6d0]/40 max-w-md">
            记录一些瞬间，像收藏唱片一样收藏影像。每一张照片都是一段未被播放的旋律。
          </p>
        </div>

        {/* Photo Grid */}
        <div ref={ref2} className="reveal grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((photo, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-md cursor-pointer"
              style={{ border: '1px solid rgba(212, 165, 116, 0.08)' }}
            >
              <div className={i === 0 || i === 3 ? 'aspect-[4/5]' : 'aspect-square'}>
                <img
                  src={photo.src}
                  alt={photo.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 card-image loaded"
                />
              </div>
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'linear-gradient(to top, rgba(15, 12, 10, 0.8) 0%, transparent 60%)' }}
              />
              <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4a574] mb-1">
                  {photo.subtitle}
                </p>
                <h3 className="text-base font-bold text-[#f5e6d0]">{photo.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
