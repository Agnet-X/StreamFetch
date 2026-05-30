import { useState, useEffect, useRef, useCallback } from "react";
import { DOWNLOAD_URL, WELCOME_AD_DELAY, DOWNLOAD_AD_DELAY as DL_AD_DELAY } from "./config";

type Lang = "ar" | "en";

const t = (ar: string, en: string, lang: Lang) => (lang === "ar" ? ar : en);

export default function App() {
  const [lang, setLang] = useState<Lang>("ar");
  const [showAdBlocker, setShowAdBlocker] = useState(false);
  const [showWelcomeAd, setShowWelcomeAd] = useState(false);
  const [showDlAd, setShowDlAd] = useState(false);
  const [welcomeSeconds, setWelcomeSeconds] = useState(WELCOME_AD_DELAY);
  const [dlSeconds, setDlSeconds] = useState(DL_AD_DELAY);
  const [welcomeCanSkip, setWelcomeCanSkip] = useState(false);
  const [dlCanSkip, setDlCanSkip] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const ringPosRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("lang", lang);
    html.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    html.setAttribute("data-lang", lang);
    document.title =
      lang === "ar"
        ? "StreamFetch — حمّل أي فيديو من الإنترنت"
        : "StreamFetch — Download Any Video From The Internet";
  }, [lang]);

  useEffect(() => {
    const bait = document.createElement("div");
    bait.setAttribute("class", "ad ads adsbox adsbygoogle");
    bait.style.cssText = "width:1px;height:1px;position:absolute;left:-9999px;top:-9999px;";
    document.body.appendChild(bait);
    const id = setTimeout(() => {
      const blocked =
        bait.offsetParent === null || bait.offsetHeight === 0 || bait.offsetWidth === 0;
      document.body.removeChild(bait);
      if (blocked) {
        setShowAdBlocker(true);
      } else {
        setTimeout(() => setShowWelcomeAd(true), 1200);
      }
    }, 300);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!showWelcomeAd) return;
    setWelcomeSeconds(WELCOME_AD_DELAY);
    setWelcomeCanSkip(false);
    let s = WELCOME_AD_DELAY;
    const iv = setInterval(() => {
      s--;
      setWelcomeSeconds(s);
      if (s <= 0) { clearInterval(iv); setWelcomeCanSkip(true); }
    }, 1000);
    return () => clearInterval(iv);
  }, [showWelcomeAd]);

  useEffect(() => {
    if (!showDlAd) return;
    setDlSeconds(DL_AD_DELAY);
    setDlCanSkip(false);
    let s = DL_AD_DELAY;
    const iv = setInterval(() => {
      s--;
      setDlSeconds(s);
      if (s <= 0) { clearInterval(iv); setDlCanSkip(true); }
    }, 1000);
    return () => clearInterval(iv);
  }, [showDlAd]);

  useEffect(() => {
    const isTouch = "ontouchstart" in window;
    if (isTouch) {
      if (dotRef.current) dotRef.current.style.display = "none";
      if (ringRef.current) ringRef.current.style.display = "none";
      document.body.style.cursor = "auto";
      return;
    }
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      if (dotRef.current) {
        dotRef.current.style.left = e.clientX + "px";
        dotRef.current.style.top = e.clientY + "px";
      }
    };
    const loop = () => {
      ringPosRef.current.x += (mouseRef.current.x - ringPosRef.current.x) * 0.15;
      ringPosRef.current.y += (mouseRef.current.y - ringPosRef.current.y) * 0.15;
      if (ringRef.current) {
        ringRef.current.style.left = ringPosRef.current.x + "px";
        ringRef.current.style.top = ringPosRef.current.y + "px";
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    document.addEventListener("mousemove", onMove);
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal,.reveal-left,.reveal-right");
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); } }),
      { threshold: 0.1 }
    );
    els.forEach((el) => obs.observe(el));
    setTimeout(() => {
      els.forEach((el) => { if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("visible"); });
    }, 80);
    return () => obs.disconnect();
  }, [lang]);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onInteractive = useCallback((enter: boolean) => {
    if (!ringRef.current || !dotRef.current) return;
    if (enter) {
      ringRef.current.style.width = ringRef.current.style.height = "50px";
      ringRef.current.style.borderColor = "rgba(14,165,233,.9)";
      dotRef.current.style.opacity = "0";
    } else {
      ringRef.current.style.width = ringRef.current.style.height = "36px";
      ringRef.current.style.borderColor = "rgba(14,165,233,.45)";
      dotRef.current.style.opacity = "1";
    }
  }, []);

  const triggerDownload = useCallback(() => setShowDlAd(true), []);

  const startDownload = useCallback(() => {
    setShowDlAd(false);
    const a = document.createElement("a");
    a.href = DOWNLOAD_URL;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  const ih = { onMouseEnter: () => onInteractive(true), onMouseLeave: () => onInteractive(false) };

  return (
    <>
      <div id="cursor-dot" ref={dotRef} />
      <div id="cursor-ring" ref={ringRef} />

      {/* Ad Blocker Overlay */}
      <div className={`overlay-panel ${showAdBlocker ? "show" : ""}`}>
        <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-10 max-w-md w-full mx-4 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-white text-xl font-bold mb-3">
            {t("تم اكتشاف مانع الإعلانات", "Ad Blocker Detected", lang)}
          </h2>
          <p className="text-[#666] text-sm leading-relaxed">
            {t(
              "نحن نقدم StreamFetch مجاناً بالكامل. الإعلانات هي الطريقة الوحيدة التي تساعدنا على الاستمرار. من فضلك أوقف مانع الإعلانات وأعد تحميل الصفحة.",
              "We offer StreamFetch 100% free. Ads are our only way to keep the lights on. Please disable your ad blocker and reload the page.",
              lang
            )}
          </p>
          <button
            {...ih}
            onClick={() => window.location.reload()}
            className="mt-8 w-full bg-[#0ea5e9] hover:bg-[#38bdf8] text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {t("أعدت التعطيل — أعد تحميل الصفحة", "I've disabled it — Reload Page", lang)}
          </button>
        </div>
      </div>

      {/* Welcome Ad Overlay */}
      <div className={`overlay-panel ${showWelcomeAd && !showAdBlocker ? "show" : ""}`}>
        <div className="bg-[#111] border border-[#222] rounded-2xl w-full max-w-lg mx-4 overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e1e1e]">
            <span className="text-xs text-[#555]">{t("مدعوم", "Sponsored", lang)}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#555]">
                {welcomeCanSkip
                  ? t("تخطي ✕", "Skip ✕", lang)
                  : <>Skip in <b className="text-[#0ea5e9]">{welcomeSeconds}</b>s</>}
              </span>
              <button
                {...ih}
                disabled={!welcomeCanSkip}
                onClick={() => setShowWelcomeAd(false)}
                className="text-[#555] hover:text-white transition-colors disabled:opacity-30 text-lg leading-none"
              >✕</button>
            </div>
          </div>
          {/* ★ Replace the block below with your Google AdSense <ins> tag */}
          <div className="ad-slot" style={{ minHeight: 300 }}>
            <div className="text-center py-16">
              <p className="text-[#2a2a2a] text-sm mb-1">[ Ad ]</p>
              <p className="text-[#1e1e1e] text-xs">Replace with AdSense code</p>
            </div>
          </div>
          {/* ★ End ad slot */}
          <div className="h-0.5 bg-[#1a1a1a]">
            <div
              className="h-full bg-[#0ea5e9] fill-bar"
              style={{ width: "0%", animationDuration: `${WELCOME_AD_DELAY}s` }}
            />
          </div>
        </div>
      </div>

      {/* Download Ad Overlay */}
      <div className={`overlay-panel ${showDlAd ? "show" : ""}`}>
        <div className="bg-[#111] border border-[#222] rounded-2xl w-full max-w-lg mx-4 overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e1e1e]">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#0ea5e9] animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="text-xs text-[#666]">{t("جاري تجهيز التنزيل…", "Preparing your download…", lang)}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#555]">
                {dlCanSkip
                  ? t("تنزيل الآن ⬇", "Download Now ⬇", lang)
                  : <>Skip in <b className="text-[#0ea5e9]">{dlSeconds}</b>s</>}
              </span>
              <button
                {...ih}
                disabled={!dlCanSkip}
                onClick={startDownload}
                className="text-[#555] hover:text-white transition-colors disabled:opacity-30 text-lg leading-none"
              >✕</button>
            </div>
          </div>
          {/* ★ Replace the block below with your Google AdSense <ins> tag */}
          <div className="ad-slot" style={{ minHeight: 300 }}>
            <div className="text-center py-16">
              <p className="text-[#2a2a2a] text-sm mb-1">[ Ad ]</p>
              <p className="text-[#1e1e1e] text-xs">Replace with AdSense code</p>
            </div>
          </div>
          {/* ★ End ad slot */}
          <div className="h-0.5 bg-[#1a1a1a]">
            <div
              className="h-full bg-[#0ea5e9] fill-bar"
              style={{ width: "0%", animationDuration: `${DL_AD_DELAY}s` }}
            />
          </div>
        </div>
      </div>

      {/* Navbar */}
      <header
        id="navbar"
        className={`nav-blur fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 border-b transition-all duration-300 ${navScrolled ? "border-[#222]" : "border-transparent"}`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <a href="#" {...ih} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#0ea5e9] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
              <svg style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 4v12m0 0l-4-4m4 4l4-4" />
              </svg>
            </div>
            <span className="text-white font-bold text-[16px] tracking-wide">StreamFetch</span>
          </a>

          <nav className="hidden md:flex items-center gap-8">
            {[
              { href: "#features", ar: "المميزات", en: "Features" },
              { href: "#platforms", ar: "المنصات", en: "Platforms" },
              { href: "#how", ar: "كيف يعمل", en: "How It Works" },
            ].map((link) => (
              <a key={link.href} href={link.href} {...ih} className="text-sm text-[#888] hover:text-white transition-colors">
                {t(link.ar, link.en, lang)}
              </a>
            ))}
            <button
              {...ih}
              onClick={triggerDownload}
              className="text-sm text-white font-semibold bg-[#0ea5e9]/10 hover:bg-[#0ea5e9]/20 border border-[#0ea5e9]/30 hover:border-[#0ea5e9]/60 rounded-full px-5 py-1.5 transition-all"
            >
              {t("تنزيل مجاني", "Download Free", lang)}
            </button>
            <button
              id="lang-toggle"
              {...ih}
              onClick={() => setLang((l) => (l === "ar" ? "en" : "ar"))}
            >
              <svg style={{ width: 13, height: 13, opacity: .6 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span>{lang === "ar" ? "EN" : "عر"}</span>
            </button>
          </nav>

          <div className="flex items-center gap-3 md:hidden">
            <button
              {...ih}
              onClick={() => setLang((l) => (l === "ar" ? "en" : "ar"))}
              className="text-xs text-[#666] hover:text-white border border-[#222] rounded-full px-3 py-1.5 transition-colors font-semibold"
            >
              {lang === "ar" ? "EN" : "عر"}
            </button>
            <button
              {...ih}
              onClick={() => setMobileOpen((o) => !o)}
              className="p-2 text-[#888] hover:text-white"
            >
              {mobileOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-[#111] border-t border-[#1e1e1e]">
            <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-4">
              {[
                { href: "#features", ar: "المميزات", en: "Features" },
                { href: "#platforms", ar: "المنصات", en: "Platforms" },
                { href: "#how", ar: "كيف يعمل", en: "How It Works" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  {...ih}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm text-[#888] hover:text-white py-1"
                >
                  {t(link.ar, link.en, lang)}
                </a>
              ))}
              <button
                {...ih}
                onClick={() => { setMobileOpen(false); triggerDownload(); }}
                className="text-sm text-white font-medium text-start"
              >
                {t("تنزيل مجاني", "Download Free", lang)}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="hero-glow relative pt-40 pb-28 px-6 text-center overflow-hidden">
        <div className="orb orb-a" style={{ width: 500, height: 500, background: "#0ea5e9", top: -120, right: -80 }} />
        <div className="orb orb-b" style={{ width: 350, height: 350, background: "#38bdf8", top: 150, left: -60 }} />
        <div className="orb orb-c" style={{ width: 280, height: 280, background: "#0284c7", bottom: -60, left: "45%" }} />
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(to right,#fff 1px,transparent 1px)", backgroundSize: "64px 64px" }} />

        <div className="relative max-w-4xl mx-auto">
          <p className="reveal inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-[#0ea5e9]/80 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9] animate-pulse" />
            Free · v1.0 · Windows
          </p>

          <h1 className="reveal reveal-d1 text-5xl sm:text-6xl md:text-7xl font-black text-white leading-[1.1] tracking-tight mb-3">
            {t("حمّل أي فيديو", "Download Any Video", lang)}
          </h1>
          <h1 className="reveal reveal-d2 text-4xl sm:text-5xl md:text-6xl font-black leading-[1.1] tracking-tight mb-8">
            <span className="gradient-text">{t("من أي مكان", "From Anywhere", lang)}</span>
          </h1>

          <p className="reveal reveal-d2 text-lg text-[#777] leading-relaxed max-w-2xl mx-auto mb-3">
            {t(
              "يوتيوب، تيك توك، انستجرام، فيسبوك، تويتر وأكثر من ١٠٠٠ موقع آخر — بجودة عالية وبضغطة واحدة.",
              "YouTube, TikTok, Instagram, Facebook, Twitter and 1000+ more sites — in full quality with a single click.",
              lang
            )}
          </p>
          <p className="reveal reveal-d2 text-sm text-[#555] mb-12">YouTube · TikTok · Instagram · Facebook · Twitter · Twitch · Vimeo · Reddit · 1000+ sites</p>

          <div className="reveal reveal-d3 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              {...ih}
              onClick={triggerDownload}
              className="cta-btn inline-flex items-center gap-3 bg-[#0ea5e9] hover:bg-[#38bdf8] text-white font-bold text-sm px-10 py-4 rounded-full shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 4v12m0 0l-4-4m4 4l4-4" />
              </svg>
              {t("تنزيل مجاني — Windows", "Download Free — Windows", lang)}
            </button>
            <a
              href="#how"
              {...ih}
              className="inline-flex items-center gap-2 text-sm text-[#888] hover:text-white px-8 py-4 rounded-full border border-[#222] hover:border-[#444] transition-all"
            >
              <span>{t("كيف يعمل؟", "How does it work?", lang)}</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </a>
          </div>

          <div className="reveal reveal-d4 mt-16 flex flex-wrap items-center justify-center gap-8 text-[#444]">
            {[
              { num: t("+١٠٠٠", "1000+", lang), label: t("موقع مدعوم", "Supported Sites", lang) },
              { num: t("مجاني ١٠٠٪", "100% Free", lang), label: t("بدون اشتراك", "No subscription", lang) },
              { num: "4K", label: t("أعلى جودة", "Max Quality", lang) },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-8">
                {i > 0 && <div className="w-px h-8 bg-[#1e1e1e]" />}
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{stat.num}</p>
                  <p className="text-xs uppercase tracking-wider mt-1 text-[#555]">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider max-w-6xl mx-auto" />

      {/* Features */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="reveal text-[11px] font-bold uppercase tracking-[0.25em] text-[#0ea5e9]/70 mb-4">
              {t("المميزات الأساسية", "Core Features", lang)}
            </p>
            <h2 className="reveal reveal-d1 text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              {t("كل اللي تحتاجه في برنامج واحد", "Everything You Need in One App", lang)}
            </h2>
            <p className="reveal reveal-d2 text-[#555] mt-4 max-w-xl mx-auto leading-relaxed">
              {t("سريع، خفيف، مجاني — وبيدعم أكثر من ١٠٠٠ موقع بدون تعقيد", "Fast, lightweight, free — supporting 1000+ sites with zero complexity", lang)}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />,
                ar: "تنزيل فائق السرعة", en: "Lightning Fast Downloads",
                dar: "تنزيل بأقصى سرعة اتصالك بدون حدود أو تقييد",
                den: "Download at your full connection speed with no limits or throttling",
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />,
                ar: "كل الجودات متاحة", en: "All Resolutions Available",
                dar: "من ٣٦٠p لـ ٤K — اختار الجودة اللي تناسب مساحتك",
                den: "From 360p to 4K — pick the quality that fits your storage",
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />,
                ar: "استخراج الصوت MP3", en: "MP3 Audio Extraction",
                dar: "حوّل أي فيديو لملف MP3 بجودة عالية بضغطة واحدة",
                den: "Convert any video to high-quality MP3 with a single click",
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />,
                ar: "قائمة تنزيل منظمة", en: "Organized Download Queue",
                dar: "تابع كل تنزيلاتك مع شريط تقدم حي والسرعة والوقت المتبقي",
                den: "Track all downloads with a live progress bar, speed, and ETA",
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
                ar: "تحديثات تلقائية", en: "Automatic Updates",
                dar: "البرنامج يحدّث نفسه في الخلفية — دايماً على أحدث إصدار",
                den: "Silent background updates — always on the latest version",
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />,
                ar: "خفيف وسريع الاستجابة", en: "Lightweight & Responsive",
                dar: "لا يستهلك موارد جهازك — يشتغل بسلاسة حتى على الأجهزة القديمة",
                den: "Minimal resource usage — runs smoothly even on older hardware",
              },
            ].map((f, i) => (
              <div
                key={i}
                className={`feat-card reveal reveal-d${(i % 3) + 1} bg-[#111] border border-[#1e1e1e] rounded-2xl p-7`}
              >
                <div className="w-11 h-11 rounded-xl bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 flex items-center justify-center mb-5">
                  <svg className="w-5 h-5 text-[#0ea5e9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>{f.icon}</svg>
                </div>
                <h3 className="text-white font-bold text-[16px] mb-2">{t(f.ar, f.en, lang)}</h3>
                <p className="text-[#555] text-sm leading-relaxed">{t(f.dar, f.den, lang)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider max-w-6xl mx-auto" />

      {/* Platforms */}
      <section id="platforms" className="py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="reveal text-[11px] font-bold uppercase tracking-[0.25em] text-[#0ea5e9]/70 mb-4">
            {t("المنصات المدعومة", "Supported Platforms", lang)}
          </p>
          <h2 className="reveal reveal-d1 text-3xl sm:text-4xl font-black text-white mb-4">
            {t("يدعم أكثر من ١٠٠٠ موقع", "Supports 1000+ Sites", lang)}
          </h2>
          <p className="reveal reveal-d2 text-[#555] mb-14">
            {t("أشهر المنصات التي يدعمها StreamFetch", "The most popular platforms supported by StreamFetch", lang)}
          </p>

          <div className="reveal reveal-d2 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                name: "YouTube",
                icon: (
                  <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
                  </svg>
                ),
              },
              {
                name: "TikTok",
                icon: (
                  <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.55V6.79a4.85 4.85 0 01-1.07-.1z" />
                  </svg>
                ),
              },
              {
                name: "Instagram",
                icon: (
                  <svg className="w-8 h-8 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                ),
              },
              {
                name: "Facebook",
                icon: (
                  <svg className="w-8 h-8 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                ),
              },
              {
                name: "X / Twitter",
                icon: (
                  <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                ),
              },
              {
                name: "Twitch",
                icon: (
                  <svg className="w-8 h-8 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
                  </svg>
                ),
              },
              {
                name: "Vimeo",
                icon: (
                  <svg className="w-8 h-8 text-sky-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 2.4a9.6 9.6 0 110 19.2A9.6 9.6 0 0112 2.4zm0 2.4a7.2 7.2 0 100 14.4A7.2 7.2 0 0012 4.8zm-2.4 4.8h4.8v4.8h-4.8V9.6z" />
                  </svg>
                ),
              },
              {
                name: "Reddit",
                icon: <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center"><span className="text-white font-black text-xs">R</span></div>,
              },
            ].map((p) => (
              <div key={p.name} className="bg-[#111] border border-[#1e1e1e] rounded-xl py-5 px-4 flex flex-col items-center gap-2 hover:border-[#333] transition-colors">
                {p.icon}
                <span className="text-sm font-semibold text-white">{p.name}</span>
              </div>
            ))}
          </div>

          <p className="reveal mt-8 text-[#444] text-sm">
            {t("… وأكثر من ١٠٠٠ موقع آخر مدعوم تلقائياً", "… and 1000+ more sites supported automatically", lang)}
          </p>
        </div>
      </section>

      <div className="divider max-w-6xl mx-auto" />

      {/* How It Works */}
      <section id="how" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="reveal text-[11px] font-bold uppercase tracking-[0.25em] text-[#0ea5e9]/70 mb-4">
              {t("كيف يعمل", "How It Works", lang)}
            </p>
            <h2 className="reveal reveal-d1 text-3xl sm:text-4xl font-black text-white">
              {t("ثلاث خطوات بس", "Just Three Steps", lang)}
            </h2>
          </div>
          <div className="space-y-5">
            {[
              {
                n: "1",
                ar: "انسخ رابط الفيديو", en: "Copy the video URL",
                dar: "من أي موقع — يوتيوب، تيك توك، انستجرام، فيسبوك أو غيرها",
                den: "From any site — YouTube, TikTok, Instagram, Facebook or any other",
              },
              {
                n: "2",
                ar: "الصقه في StreamFetch واضغط Fetch", en: "Paste it into StreamFetch and click Fetch",
                dar: "البرنامج هيجيب معلومات الفيديو وكل الجودات المتاحة في ثواني",
                den: "The app fetches video info and all available qualities in seconds",
              },
              {
                n: "3",
                ar: "اختار الجودة واضغط Download", en: "Choose quality and click Download",
                dar: "هيتنزل على جهازك بأقصى سرعة مع شريط تقدم حي",
                den: "Downloads to your device at max speed with a live progress bar",
              },
            ].map((step, i) => (
              <div
                key={i}
                className={`reveal reveal-d${i} flex gap-5 items-start bg-[#111] border border-[#1e1e1e] rounded-2xl p-7`}
              >
                <div className="w-10 h-10 rounded-xl bg-[#0ea5e9] flex items-center justify-center flex-shrink-0 font-black text-white">
                  {step.n}
                </div>
                <div>
                  <h3 className="text-white font-bold text-[16px] mb-1">{t(step.ar, step.en, lang)}</h3>
                  <p className="text-[#555] text-sm">{t(step.dar, step.den, lang)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider max-w-6xl mx-auto" />

      {/* Bottom CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="reveal text-3xl sm:text-4xl font-black text-white mb-4">
            {t("جاهز تبدأ؟", "Ready to start?", lang)}
          </h2>
          <p className="reveal reveal-d1 text-[#555] mb-10">
            {t("مجاني تماماً — بدون تسجيل — بدون اشتراك", "Completely free — no sign up — no subscription", lang)}
          </p>
          <button
            {...ih}
            onClick={triggerDownload}
            className="reveal reveal-d2 cta-btn inline-flex items-center gap-3 bg-[#0ea5e9] hover:bg-[#38bdf8] text-white font-bold text-sm px-12 py-4 rounded-full shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 4v12m0 0l-4-4m4 4l4-4" />
            </svg>
            {t("تنزيل StreamFetch مجاناً", "Download StreamFetch Free", lang)}
          </button>
          <p className="reveal reveal-d3 text-[#333] text-xs mt-5">Windows 10/11 · Free Forever</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[#333] text-sm">
            {t("© 2025 StreamFetch. جميع الحقوق محفوظة.", "© 2025 StreamFetch. All rights reserved.", lang)}
          </span>
          <div className="flex items-center gap-6">
            {[
              { ar: "الخصوصية", en: "Privacy" },
              { ar: "الشروط", en: "Terms" },
            ].map((l) => (
              <a key={l.ar} href="#" {...ih} className="text-[#333] hover:text-white text-sm transition-colors">
                {t(l.ar, l.en, lang)}
              </a>
            ))}
            <a href="mailto:support@streamfetch.com" {...ih} className="text-[#333] hover:text-white text-sm transition-colors">
              {t("تواصل معنا", "Contact Us", lang)}
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
