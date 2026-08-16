/* ============================================================
   main.js — boots the CanvasEngine, drives the scroll-scrub via
   GSAP ScrollTrigger, and handles preloader / entrance reveals.
   ============================================================ */

(function () {
  'use strict';

  const CONFIG = {
    frameCount: 130,
    framePath: (i) => `./assets/frames/ezgif-frame-${String(i).padStart(3, '0')}.png`,
    scrub: 0.6, // higher = smoother catch-up, lower = tighter to scroll position
  };

  const canvasEl = document.getElementById('frame-canvas');
  const preloaderEl = document.getElementById('preloader');
  const fillEl = document.getElementById('preloader-fill');
  const countEl = document.getElementById('preloader-count');
  const scrollCueEl = document.getElementById('scroll-cue');

  const engine = new CanvasEngine({
    canvas: canvasEl,
    frameCount: CONFIG.frameCount,
    getFramePath: CONFIG.framePath,
  });

  engine
    .preload((loaded, total) => {
      const pct = Math.round((loaded / total) * 100);
      fillEl.style.width = pct + '%';
      countEl.textContent = pct + '%';
    })
    .then(() => {
      engine.init();
      startScrollAnimation();
      revealPage();
      hidePreloader();
    });

  function hidePreloader() {
    gsap.to(preloaderEl, {
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out',
      onComplete: () => {
        preloaderEl.style.display = 'none';
      },
    });
  }

  function startScrollAnimation() {
    gsap.registerPlugin(ScrollTrigger);

    // A plain object tween proxies the scroll position into a frame
    // index; ScrollTrigger's scrub smooths it, onUpdate paints it.
    const scrubTarget = { frame: 0 };

    gsap.to(scrubTarget, {
      frame: CONFIG.frameCount - 1,
      ease: 'none',
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: CONFIG.scrub,
      },
      onUpdate: () => engine.setFrame(scrubTarget.frame),
    });
  }

  function revealPage() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dur = reduceMotion ? 0 : 1.1;

    gsap.from('.hero__title', { opacity: 0, y: 40, duration: dur, ease: 'power3.out', delay: 0.1 });
    gsap.from('.hero__subtitle', { opacity: 0, y: 18, duration: dur, ease: 'power3.out', delay: 0.32 });
    gsap.from('.scroll-cue', { opacity: 0, duration: dur, ease: 'power3.out', delay: 0.55 });

    gsap.utils.toArray('.project-card').forEach((card) => {
      gsap.from(card, {
        opacity: 0,
        y: 36,
        duration: reduceMotion ? 0 : 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: card, start: 'top 88%' },
      });
    });

    gsap.from('.contact__text', {
      opacity: 0,
      y: 20,
      duration: reduceMotion ? 0 : 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.contact', start: 'top 80%' },
    });
    gsap.from('.contact__cta', {
      opacity: 0,
      y: 20,
      duration: reduceMotion ? 0 : 1,
      delay: 0.15,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.contact', start: 'top 80%' },
    });
  }

  scrollCueEl.addEventListener('click', () => {
    document.getElementById('work').scrollIntoView({ behavior: 'smooth' });
  });
})();
