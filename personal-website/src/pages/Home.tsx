import { Link } from 'react-router';
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import {
  Disc,
  FileText,
  Cpu,
  Fingerprint,
  Coffee,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Heart,
  ExternalLink,
} from 'lucide-react';

/* ────────── Scroll reveal hook ────────── */
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

/* ────────── Sidebar ────────── */
function Sidebar() {
  const [activeNav, setActiveNav] = useState('店长：邱家乐');
  const navItems = [
    { label: '店长：邱家乐', icon: Disc, targetId: 'hero' },
    { label: '隐藏身份：AIPM', icon: FileText, targetId: null },
    { label: '店长推荐歌单', icon: Fingerprint, targetId: 'playlist' },
    { label: '店长收集语录', icon: Cpu, targetId: 'quotes' },
  ];

  return (
    <aside className="fixed top-0 left-0 w-[260px] h-screen z-50 hidden lg:block">
      <div
        className="side-console h-full flex flex-col p-5"
      >
        {/* Brand */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="side-disc-mark w-10 h-10 rounded-full flex items-center justify-center">
              <Disc size={20} className="text-[#d4a574]" />
            </div>
            <div>
              <h1 className="heading-serif text-xl font-bold text-[#f5e6d0]">个人唱片店</h1>
            </div>
          </div>
          <p className="text-xs text-[#f5e6d0]/40 leading-relaxed">
            一间带夜色和暖光的唱片小店，把精选专辑和咖啡香揉进每一页。
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.label;
            return (
              <button
                key={item.label}
                onClick={() => {
                  setActiveNav(item.label);
                  if (item.targetId) {
                    const el = document.getElementById(item.targetId);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }
                }}
                className={`nav-item-warm w-full flex items-center gap-3 px-3 py-3 text-sm transition-all duration-200 ${
                  isActive ? 'active text-[#f5e6d0] font-medium' : 'text-[#f5e6d0]/40 hover:text-[#f5e6d0]/70'
                }`}
              >
                <Icon
                  size={17}
                  className={isActive ? 'text-[#d4a574]' : ''}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

      </div>
    </aside>
  );
}

/* ────────── Mobile Header ────────── */
function MobileHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(15, 12, 10, 0.95)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(212, 165, 116, 0.1)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(212, 165, 116, 0.15)' }}>
              <Disc size={16} className="text-[#d4a574]" />
            </div>
            <span className="heading-serif text-[#f5e6d0] font-bold">个人唱片店</span>
          </div>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-8 h-8 flex flex-col items-center justify-center gap-1.5"
          >
            <span className={`w-5 h-[1px] bg-[#d4a574] transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-[4px]' : ''}`} />
            <span className={`w-5 h-[1px] bg-[#d4a574] transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-[3px]' : ''}`} />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 pt-16 px-6"
          style={{ background: 'rgba(15, 12, 10, 0.98)' }}
        >
          <nav className="space-y-1 pt-6">
            {[
              { label: '店长：邱家乐', icon: Disc, targetId: 'hero' },
              { label: '隐藏身份：AIPM', icon: FileText, targetId: null },
              { label: '店长推荐歌单', icon: Fingerprint, targetId: 'playlist' },
              { label: '店长收集语录', icon: Cpu, targetId: 'quotes' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    setMenuOpen(false);
                    if (item.targetId) {
                      const el = document.getElementById(item.targetId);
                      if (el) {
                        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                      }
                    }
                  }}
                  className="w-full flex items-center gap-4 px-4 py-4 text-[#f5e6d0]/50 hover:text-[#f5e6d0] transition-colors"
                  style={{ borderBottom: '1px solid rgba(212, 165, 116, 0.06)' }}
                >
                  <Icon size={18} className="text-[#d4a574]/60" />
                  <span className="text-base">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}

/* ────────── Hero Section ────────── */
function HeroSection() {
  const ref = useScrollReveal();
  const [isHovering, setIsHovering] = useState(false);

  return (
    <section id="hero" ref={ref} className="reveal min-h-screen flex flex-col justify-center py-20 px-6 lg:px-12">
      {/* Main Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        {/* Left: Copy */}
        <div>
          <h2 className="heading-serif text-3xl lg:text-5xl font-bold mb-6 leading-tight whitespace-nowrap">
            <span className="text-[#f5e6d0]">少年心事</span>
            <span className="text-[#d4a574] ml-3">尽付弦歌</span>
          </h2>
          <p className="text-sm text-[#f5e6d0]/50 leading-relaxed max-w-md mb-8">
            我会让我的人生经历变得丰富，每张唱片都是一段精彩的故事，今天你想听哪一段故事呢？在这个角落里，黑胶转动，咖啡飘香。
          </p>

          <div className="flex items-center gap-4 mb-10">
            <Link
              to="/gallery"
              className="btn-warm flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-md"
            >
              <Play size={15} fill="currentColor" />
              Start Listening
            </Link>
          </div>

          {/* Social Links */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: 'AIPM', label: '人人都是产品经理', icon: ExternalLink, url: 'https://www.woshipm.com/u/1677397' },
              { value: 'RED', label: '小红书', icon: ExternalLink, url: 'https://www.xiaohongshu.com' },
              { value: 'CloudVillage', label: '网易云音乐', icon: ExternalLink, url: 'https://music.163.com/#/user/home?id=412157105' },
              { value: 'Github', label: 'Github仓库', icon: ExternalLink, url: 'https://github.com/s2447920817-boop/vibe-coding-/projects?query=is%3Aopen' },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <a
                  key={stat.label}
                  href={stat.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="warm-panel p-3 transition-all duration-300 hover:border-[#d4a574]/30 cursor-pointer group"
                >
                  <Icon size={14} className="text-[#d4a574] mb-1.5 group-hover:text-[#f5e6d0] transition-colors" />
                  <div className="text-lg font-bold text-[#f5e6d0]">{stat.value}</div>
                  <div className="text-[10px] text-[#f5e6d0]/30 tracking-wider mt-1">
                    {stat.label}
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        {/* Right: Disc showcase */}
        <div className="flex justify-center">
          <div
            className="relative"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >

            {/* Disc case with album cover */}
            <div
              className="vinyl-case-warm relative w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] lg:w-[520px] lg:h-[520px] rounded-lg overflow-hidden"
              style={{ perspective: '800px' }}
            >
              <img
                src={asset('hero-portrait.jpg')}
                alt="Featured Album"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Floating vinyl disc behind */}
            <div
              className={`absolute -right-16 top-8 w-[360px] h-[360px] sm:w-[460px] sm:h-[460px] lg:w-[560px] lg:h-[560px] -z-10 transition-all duration-700 ${
                isHovering ? 'translate-x-20 rotate-[20deg] scale-105' : ''
              }`}
            >
              <div className={`vinyl-disc w-full h-full ${isHovering ? 'animate-spin-slow' : ''}`} />
            </div>

            {/* Coffee cup decoration */}
            <div className="absolute -bottom-5 -left-8">
              <div
                className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(26, 20, 16, 0.9)', border: '1px solid rgba(212, 165, 116, 0.15)' }}
              >
                <Coffee size={22} className="text-[#d4a574]" />
                {/* Steam */}
                <div className="steam-line absolute -top-4 left-4" style={{ animationDelay: '0s' }} />
                <div className="steam-line absolute -top-5 left-6" style={{ animationDelay: '0.6s' }} />
              </div>
            </div>

            {/* Status badge */}
            <div
              className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-sm"
              style={{ background: 'rgba(15, 12, 10, 0.7)', border: '1px solid rgba(212, 165, 116, 0.15)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4a574] animate-pulse" />
              <span className="text-[10px] text-[#f5e6d0]/60">33 RPM</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────── Player Section ────────── */
function PlayerSection() {
  const ref = useScrollReveal();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(35);
  const [isDragging, setIsDragging] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPlaying || isDragging) return;
    const interval = setInterval(() => {
      setProgress((p) => (p >= 100 ? 0 : p + 0.35));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, isDragging]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setProgress(pct);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleProgressClick(e);
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!progressRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setProgress(pct);
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const albums = [
    { title: 'NEVERMIND', artist: 'Gummy B / 鹤 The Crane / 熊仔', accent: '#4a7abf', cover: asset('cover-nevermind.png'), url: 'https://music.163.com/#/search/m/?s=NEVERMIND%20Gummy%20B&type=1', duration: 285 },
    { title: '我想要做点流行音乐', artist: '回环 RingAgain', accent: '#8b5a3c', cover: asset('cover-pop-songs.png'), url: 'https://music.163.com/#/search/m/?s=%E6%88%91%E6%83%B3%E8%A6%81%E5%81%9A%E7%82%B9%E6%B5%81%E8%A1%8C%E9%9F%B3%E4%B9%90&type=1', duration: 305 },
    { title: '普通朋友', artist: '张叶蕾', accent: '#6b8fa3', cover: asset('cover-normal-friend.png'), url: 'https://music.163.com/#/search/m/?s=%E6%99%AE%E9%80%9A%E6%9C%8B%E5%8F%8B%20%E5%BC%A0%E5%8F%B6%E8%95%BE&type=1', duration: 234 },
    { title: '飞', artist: 'Matt吕彦良', accent: '#7a9abf', cover: asset('cover-fly.png'), url: 'https://music.163.com/#/search/m/?s=%E9%A3%9E%20Matt%E5%90%95%E5%BD%A6%E8%89%AF&type=1', duration: 220 },
  ];

  const [activeAlbum, setActiveAlbum] = useState(0);

  return (
    <section id="playlist" ref={ref} className="reveal py-14 px-6 lg:px-12">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#f5e6d0]">店长推荐歌单</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Album cards */}
        <div className="lg:col-span-3 warm-panel p-5">
          <div className="flex items-center justify-end mb-5">
            <a
              href="https://music.163.com/#/my/m/music/playlist?id=586749531"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-[#f5e6d0]/30 hover:text-[#d4a574] transition-colors"
            >
              See All &rarr;
            </a>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {albums.map((album, i) => {
              const cardContent = (
                <>
                  <div className="w-12 h-12 mb-3 rounded-sm overflow-hidden" style={{ border: '1px solid rgba(212, 165, 116, 0.15)' }}>
                    <img
                      src={album.cover}
                      alt={album.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h4 className="text-sm font-medium text-[#f5e6d0]">{album.title}</h4>
                  <p className="text-xs text-[#f5e6d0]/35 mt-0.5">{album.artist}</p>
                </>
              );

              if (album.url) {
                return (
                  <button
                    key={album.title}
                    onClick={() => setActiveAlbum(i)}
                    className={`record-card p-4 rounded-md text-left transition-all active:scale-[0.98] cursor-pointer ${
                      activeAlbum === i ? 'border-[#d4a574]/40' : ''
                    }`}
                    style={{
                      background: activeAlbum === i ? 'rgba(212, 165, 116, 0.08)' : 'rgba(26, 20, 16, 0.4)',
                      border: `1px solid ${activeAlbum === i ? 'rgba(212, 165, 116, 0.3)' : 'rgba(212, 165, 116, 0.06)'}`,
                    }}
                  >
                    {cardContent}
                  </button>
                );
              }

              return (
                <button
                  key={album.title}
                  onClick={() => setActiveAlbum(i)}
                  className={`record-card p-4 rounded-md text-left transition-all active:scale-[0.98] ${
                    activeAlbum === i ? 'border-[#d4a574]/40' : ''
                  }`}
                  style={{
                    background: activeAlbum === i ? 'rgba(212, 165, 116, 0.08)' : 'rgba(26, 20, 16, 0.4)',
                    border: `1px solid ${activeAlbum === i ? 'rgba(212, 165, 116, 0.3)' : 'rgba(212, 165, 116, 0.06)'}`,
                  }}
                >
                  {cardContent}
                </button>
              );
            })}
          </div>
        </div>

        {/* Player + Detail stacked */}
        <div className="lg:col-span-2 space-y-4">
          {/* Detail Panel */}
          <div className="warm-panel p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4a574]/50">Listening Room</p>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-16 h-16 rounded-sm overflow-hidden flex-shrink-0"
                style={{ border: '1px solid rgba(212, 165, 116, 0.15)' }}
              >
                <img
                  src={albums[activeAlbum].cover}
                  alt={albums[activeAlbum].title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#f5e6d0]">{albums[activeAlbum].title}</h4>
                <p className="text-xs text-[#f5e6d0]/35">{albums[activeAlbum].artist}</p>
              </div>
            </div>

            {/* Progress */}
            <div>
              <div className="flex items-center justify-between text-[10px] text-[#f5e6d0]/25 mb-1.5">
                <span>{(() => {
                  const elapsed = Math.floor((albums[activeAlbum].duration * progress) / 100);
                  const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
                  const s = (elapsed % 60).toString().padStart(2, '0');
                  return `${m}:${s}`;
                })()}</span>
                <span>{(() => {
                  const m = Math.floor(albums[activeAlbum].duration / 60).toString().padStart(2, '0');
                  const s = (albums[activeAlbum].duration % 60).toString().padStart(2, '0');
                  return `${m}:${s}`;
                })()}</span>
              </div>
              <div
                ref={progressRef}
                className="progress-warm cursor-pointer relative"
                onMouseDown={handleMouseDown}
              >
                <div className="progress-warm-fill" style={{ width: `${progress}%` }} />
                {/* Draggable thumb */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#d4a574] opacity-0 hover:opacity-100 transition-opacity"
                  style={{
                    left: `calc(${progress}% - 6px)`,
                    boxShadow: '0 0 8px rgba(212, 165, 116, 0.5)',
                    opacity: isDragging ? 1 : undefined,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Player Controls */}
          <div className="warm-panel p-5">
            <div className="flex items-center justify-center gap-5">
              <button className="text-[#f5e6d0]/25 hover:text-[#d4a574] transition-colors">
                <Volume2 size={16} />
              </button>
              <button 
                onClick={() => {
                  const prev = activeAlbum === 0 ? 3 : activeAlbum - 1;
                  setActiveAlbum(prev);
                  setProgress(0);
                }}
                className="text-[#f5e6d0]/40 hover:text-[#f5e6d0] transition-colors"
              >
                <SkipBack size={18} />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-11 h-11 flex items-center justify-center rounded-full transition-all active:scale-[0.95]"
                style={{ background: '#d4a574', color: '#0f0c0a' }}
              >
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
              </button>
              <button 
                onClick={() => {
                  const next = activeAlbum === 3 ? 0 : activeAlbum + 1;
                  setActiveAlbum(next);
                  setProgress(0);
                }}
                className="text-[#f5e6d0]/40 hover:text-[#f5e6d0] transition-colors"
              >
                <SkipForward size={18} />
              </button>
              <button className="text-[#e74c3c] hover:text-[#ff6b6b] transition-colors">
                <Heart size={16} fill="currentColor" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────── Grid Archive Section ────────── */
function GridArchiveSection() {
  const ref = useScrollReveal();

  const quotesA = [
    { no: '01', text: '自童年起，我便独自一人，照顾着历代星辰。', src: '白鹤林《孤独》', tag: '诗' },
    { no: '02', text: '我们兴许走得出一座苦难重重的书简湖，却未必能够走出一座处处美好的落魄山。若是所有心中美好，都成为了一种负担。那么美好的意义何在。', src: '《剑来》', tag: '小说' },
    { no: '03', text: '天天把死挂在嘴边的人，不是在期待死，而是在渴望爱。', src: '史铁生', tag: '文学' },
    { no: '04', text: '这世界没有真相，只有视角。', src: '尼采', tag: '哲学' },
    { no: '05', text: '如果你在意我的话，你就会在意我的话。', src: '佚名', tag: '碎片' },
    { no: '06', text: '他们都叫我少爷，但我知道，他们说的并不是我，而是年少时摸爬滚打的父亲。', src: '王朔', tag: '文学' },
    { no: '07', text: '一个太过文艺的人，注定不会太快乐，心里有爱、有善良，骨子里住着孩子般的纯真，但也往往多愁善感，容易感知美好，也更容易体会悲伤。', src: '三毛', tag: '文学' },
  ];

  const quotesB = [
    { no: '01', text: '我常常闻到一股恶臭，我走遍家中每一个角落却一无所获，最后我发现，枕头下曾经许下的梦发霉了，床下有一具尸体，是曾经追梦的自己。', src: '很爱吃小鱼', tag: '网络' },
    { no: '02', text: '什么是消费主义，因为消费而错觉自己获得了主义，这就叫作消费主义。', src: '熊浩', tag: '思辨' },
    { no: '03', text: '解构需要智慧，建构需要勇气。', src: '熊浩', tag: '思辨' },
    { no: '04', text: '不经过解构的建构，只是单纯在复制权力。', src: '黄执中', tag: '思辨' },
    { no: '05', text: '我们只对值得的人投入感情，那些不值得的，他们只是对象，做事路上需要不同处理和对待的对象。', src: '《一人之下》风正豪', tag: '动漫' },
    { no: '06', text: '真正好的爱情，不是只让我一时开心，而是让我在这一段关系里，慢慢变得更真诚、更勇敢、更有担当。我可以喜欢，但我不控制；我可以依赖，但不把你当成我全部的答案。', src: 'b站up子非秋月', tag: '情感' },
    { no: '07', text: '少年不识愁滋味，爱上层楼。爱上层楼，为赋新词强说愁。而今识尽愁滋味，欲说还休。欲说还休，却道天凉好个秋。', src: '辛弃疾《丑奴儿》', tag: '词' },
  ];

  return (
    <section id="quotes" ref={ref} className="reveal py-14 px-6 lg:px-12">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-[#f5e6d0]">店长收集语录</h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Side A */}
        <div className="flex-1">
          {/* Side label */}
          <div className="flex items-center gap-4 mb-6">
            <div className="vinyl-disc w-10 h-10 flex-shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#d4a574]/50">Vinyl Record</p>
              <h3 className="heading-serif text-lg font-bold text-[#d4a574]">Side A</h3>
            </div>
            <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(to right, rgba(212,165,116,0.2), transparent)' }} />
          </div>

          {/* Track list */}
          <div className="space-y-0">
            {quotesA.map((q, i) => (
              <div
                key={q.no}
                className="group flex items-start gap-4 py-4 px-3 transition-all duration-300 hover:bg-[rgba(212,165,116,0.04)] cursor-pointer"
                style={i < quotesA.length - 1 ? { borderBottom: '1px dashed rgba(212, 165, 116, 0.08)' } : {}}
              >
                {/* Track number */}
                <div className="flex-shrink-0 w-8 text-right">
                  <span className="text-[10px] text-[#d4a574]/40 font-mono">{q.no}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#d4a574]/20 mt-1 ml-auto group-hover:bg-[#d4a574] transition-colors" />
                </div>

                {/* Quote text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#f5e6d0]/70 leading-relaxed group-hover:text-[#f5e6d0] transition-colors">
                    {q.text}
                  </p>
                </div>

                {/* Meta */}
                <div className="flex-shrink-0 text-right">
                  <span className="text-[10px] text-[#f5e6d0]/25 block">{q.src}</span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 mt-1 inline-block"
                    style={{ border: '1px solid rgba(212,165,116,0.15)', color: 'rgba(212,165,116,0.5)' }}
                  >
                    {q.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider - vinyl spindle */}
        <div className="hidden lg:flex flex-col items-center justify-center">
          <div className="w-[2px] h-20 rounded-full" style={{ background: 'linear-gradient(to bottom, transparent, rgba(212,165,116,0.2), transparent)' }} />
          <div className="w-3 h-3 rounded-full border border-[#d4a574]/30 my-2" />
          <div className="w-[2px] h-20 rounded-full" style={{ background: 'linear-gradient(to bottom, rgba(212,165,116,0.2), transparent)' }} />
        </div>

        {/* Side B */}
        <div className="flex-1">
          {/* Side label */}
          <div className="flex items-center gap-4 mb-6">
            <div className="vinyl-disc w-10 h-10 flex-shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#d4a574]/50">Vinyl Record</p>
              <h3 className="heading-serif text-lg font-bold text-[#d4a574]">Side B</h3>
            </div>
            <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(to right, rgba(212,165,116,0.2), transparent)' }} />
          </div>

          {/* Track list */}
          <div className="space-y-0">
            {quotesB.map((q, i) => (
              <div
                key={q.no}
                className="group flex items-start gap-4 py-4 px-3 transition-all duration-300 hover:bg-[rgba(212,165,116,0.04)] cursor-pointer"
                style={i < quotesB.length - 1 ? { borderBottom: '1px dashed rgba(212, 165, 116, 0.08)' } : {}}
              >
                {/* Track number */}
                <div className="flex-shrink-0 w-8 text-right">
                  <span className="text-[10px] text-[#d4a574]/40 font-mono">{q.no}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#d4a574]/20 mt-1 ml-auto group-hover:bg-[#d4a574] transition-colors" />
                </div>

                {/* Quote text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#f5e6d0]/70 leading-relaxed group-hover:text-[#f5e6d0] transition-colors">
                    {q.text}
                  </p>
                </div>

                {/* Meta */}
                <div className="flex-shrink-0 text-right">
                  <span className="text-[10px] text-[#f5e6d0]/25 block">{q.src}</span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 mt-1 inline-block"
                    style={{ border: '1px solid rgba(212,165,116,0.15)', color: 'rgba(212,165,116,0.5)' }}
                  >
                    {q.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom vinyl deco */}
      <div className="flex items-center justify-center gap-4 mt-10">
        <div className="h-[1px] w-16" style={{ background: 'linear-gradient(to right, transparent, rgba(212,165,116,0.15))' }} />
        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ border: '1px solid rgba(212,165,116,0.2)' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-[#d4a574]/40" />
        </div>
        <div className="h-[1px] w-16" style={{ background: 'linear-gradient(to left, transparent, rgba(212,165,116,0.15))' }} />
      </div>
    </section>
  );
}

/* ────────── Bullet Message Data ────────── */
const STORAGE_KEY = 'afterglow-messages';

function loadMessages(): { name: string; content: string; time: string }[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  // Default sample messages
  return [
    { name: '过路人', content: '这间唱片店好有感觉，收藏了。', time: '2026.01.15' },
    { name: '黑胶爱好者', content: '普通朋友这首歌太戳了，谢谢推荐。', time: '2026.02.03' },
    { name: '深夜听众', content: '半夜刷到这个网站，听着 NEVERMIND，氛围感拉满。', time: '2026.02.20' },
    { name: '咖啡配唱片', content: '一杯手冲，一张黑胶，一个下午。', time: '2026.03.08' },
    { name: '路过的风', content: '少年心事尽付弦歌，这句话写进心里了。', time: '2026.03.22' },
    { name: '匿名', content: '店长品味不错，歌单我全收藏了。', time: '2026.04.01' },
  ];
}

function saveMessages(msgs: { name: string; content: string; time: string }[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
}

/* ────────── Bullet Wall ────────── */
function BulletWall({ messages }: { messages: { name: string; content: string; time: string }[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const lines = [
    { top: '5%', duration: 18, delay: 0 },
    { top: '25%', duration: 22, delay: 3 },
    { top: '45%', duration: 20, delay: 6 },
    { top: '65%', duration: 24, delay: 2 },
    { top: '85%', duration: 19, delay: 8 },
  ];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[200px] overflow-hidden mb-8 rounded-md"
      style={{ background: 'rgba(15, 12, 10, 0.6)', border: '1px solid rgba(212, 165, 116, 0.08)' }}
    >
      <p className="absolute top-3 left-4 text-[10px] uppercase tracking-[0.2em] text-[#d4a574]/40 z-10">Bullet Wall</p>

      {lines.map((line, lineIdx) => {
        const msgsForLine = messages.filter((_, i) => i % lines.length === lineIdx);
        if (msgsForLine.length === 0) return null;

        return (
          <div
            key={lineIdx}
            className="absolute whitespace-nowrap"
            style={{ top: line.top }}
          >
            {msgsForLine.map((msg, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 px-4 py-1.5 mr-12 text-sm text-[#f5e6d0]/60"
                style={{
                  animation: `bulletMove ${line.duration}s linear infinite`,
                  animationDelay: `${line.delay + i * 5}s`,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#d4a574]/40 flex-shrink-0" />
                <span className="text-[#d4a574]/50 text-xs">{msg.name}:</span>
                <span>{msg.content}</span>
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/* ────────── Journal Section (Message Board) ────────── */
function JournalSection() {
  const ref = useScrollReveal();
  const [messages, setMessages] = useState(loadMessages);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    const newMsg = {
      name: name.trim(),
      content: content.trim(),
      time: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.'),
    };
    const updated = [newMsg, ...messages];
    setMessages(updated);
    saveMessages(updated);
    setName('');
    setContent('');
  };

  return (
    <section id="journal" ref={ref} className="reveal py-14 px-6 lg:px-12">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#f5e6d0]">留言板</h2>
        <p className="text-xs text-[#f5e6d0]/30 mt-1">留下一句话，像在黑胶上刻下一道沟槽。</p>
      </div>

      {/* Bullet Wall */}
      <BulletWall messages={messages} />

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="warm-panel p-5 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="你的名字"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-shrink-0 w-full sm:w-36 px-3 py-2.5 text-sm text-[#f5e6d0] placeholder-[#f5e6d0]/20 bg-[rgba(15,12,10,0.5)] rounded-sm focus:outline-none focus:border-[#d4a574]/40 transition-colors"
            style={{ border: '1px solid rgba(212, 165, 116, 0.12)' }}
          />
          <input
            type="text"
            placeholder="写点什么..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 px-3 py-2.5 text-sm text-[#f5e6d0] placeholder-[#f5e6d0]/20 bg-[rgba(15,12,10,0.5)] rounded-sm focus:outline-none focus:border-[#d4a574]/40 transition-colors"
            style={{ border: '1px solid rgba(212, 165, 116, 0.12)' }}
          />
          <button
            type="submit"
            className="btn-warm px-5 py-2.5 text-sm font-medium rounded-sm flex-shrink-0"
          >
            发送
          </button>
        </div>
      </form>

      {/* Message List */}
      <div className="warm-panel" style={{ border: '1px solid rgba(212, 165, 116, 0.1)' }}>
        {messages.length === 0 && (
          <div className="p-8 text-center text-sm text-[#f5e6d0]/25">
            还没有留言，做第一个留言的人吧。
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={`${msg.time}-${i}`}
            className="p-5 transition-colors hover:bg-[rgba(212,165,116,0.03)]"
            style={i < messages.length - 1 ? { borderBottom: '1px solid rgba(212, 165, 116, 0.06)' } : {}}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-[#d4a574]">{msg.name}</span>
              <span className="text-[10px] text-[#f5e6d0]/20">{msg.time}</span>
            </div>
            <p className="text-sm text-[#f5e6d0]/55 leading-relaxed">{msg.content}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ────────── Footer ────────── */
function Footer() {
  return (
    <footer className="py-10 px-6 lg:px-12" style={{ borderTop: '1px solid rgba(212, 165, 116, 0.08)' }}>
      <div className="flex flex-col lg:flex-row items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <Coffee size={15} className="text-[#d4a574]" />
          <span className="text-sm text-[#f5e6d0]/30">
            店长: 邱家乐 &copy; 2026
          </span>
        </div>
      </div>
    </footer>
  );
}

/* ────────── Main Page ────────── */
export default function Home() {
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty('--pointer-x', `${event.clientX}px`);
    event.currentTarget.style.setProperty('--pointer-y', `${event.clientY}px`);
  };

  return (
    <div
      className="site-shell min-h-screen"
      style={{
        color: '#f5e6d0',
        '--vinyl-background-url': `url("${asset('vinyl-background-image2.png')}")`,
      } as CSSProperties}
      onPointerMove={handlePointerMove}
    >
      <div className="site-background" aria-hidden="true" />
      <div className="vinyl-cursor-glow" aria-hidden="true" />

      {/* Warm noise texture */}
      <div className="warm-noise" />

      {/* Sidebar - desktop only */}
      <Sidebar />

      {/* Mobile header */}
      <MobileHeader />

      {/* Main content */}
      <main className="relative z-10 lg:ml-[260px] pt-16 lg:pt-0">
        <HeroSection />
        <PlayerSection />
        <GridArchiveSection />
        <JournalSection />
        <Footer />
      </main>
    </div>
  );
}
