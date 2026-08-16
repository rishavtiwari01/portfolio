/* ============================================================
   CanvasEngine
   Owns the <canvas>: preloads the frame sequence, resizes with
   devicePixelRatio, and draws whichever frame is "current" using
   background-size:cover math (crop-to-fill, no stretching).
   ============================================================ */

class CanvasEngine {
  /**
   * @param {Object} opts
   * @param {HTMLCanvasElement} opts.canvas
   * @param {number} opts.frameCount
   * @param {(index: number) => string} opts.getFramePath  1-indexed
   */
  constructor({ canvas, frameCount, getFramePath }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.frameCount = frameCount;
    this.getFramePath = getFramePath;

    this.images = [];
    this.currentFrame = 0;

    this._resizeTimer = null;
    this._onResize = this._onResize.bind(this);
  }

  /**
   * Loads every frame, reporting progress as it goes.
   * Resolves once all frames have settled (loaded OR failed —
   * a single missing/corrupt frame should never hang the preloader).
   * @param {(loaded: number, total: number) => void} [onProgress]
   */
  preload(onProgress) {
    let loaded = 0;
    const loaders = [];

    for (let i = 1; i <= this.frameCount; i++) {
      const img = new Image();
      const settled = new Promise((resolve) => {
        img.onload = img.onerror = () => {
          loaded += 1;
          if (onProgress) onProgress(loaded, this.frameCount);
          resolve();
        };
      });
      img.src = this.getFramePath(i);
      this.images[i - 1] = img;
      loaders.push(settled);
    }

    return Promise.all(loaders).then(() => this.images);
  }

  /** Call once, after preload() resolves. */
  init() {
    window.addEventListener('resize', this._onResize, { passive: true });
    this._resizeCanvas();
    this.render();
  }

  _onResize() {
    clearTimeout(this._resizeTimer);
    this._resizeTimer = setTimeout(() => {
      this._resizeCanvas();
      this.render();
    }, 120);
  }

  _resizeCanvas() {
    // Cap DPR at 2 — 3x on a 151-frame sequence is wasted paint cost.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';

    // Work in CSS-pixel space from here on.
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /** Set the active frame (clamped + rounded) and redraw. */
  setFrame(index) {
    const clamped = Math.max(0, Math.min(this.frameCount - 1, index));
    this.currentFrame = Math.round(clamped);
    this.render();
  }

  render() {
    const img = this.images[this.currentFrame];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    this.ctx.clearRect(0, 0, w, h);
    this._drawCover(img, w, h);
  }

  /** Emulates CSS `object-fit: cover` / `background-size: cover`. */
  _drawCover(img, canvasW, canvasH) {
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = canvasW / canvasH;

    let renderW, renderH, offsetX, offsetY;

    if (imgRatio > canvasRatio) {
      // Image is relatively wider than the viewport — match height, crop sides.
      renderH = canvasH;
      renderW = canvasH * imgRatio;
      offsetX = (canvasW - renderW) / 2;
      offsetY = 0;
    } else {
      // Image is relatively taller — match width, crop top/bottom.
      renderW = canvasW;
      renderH = canvasW / imgRatio;
      offsetX = 0;
      offsetY = (canvasH - renderH) / 2;
    }

    this.ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
  }

  destroy() {
    window.removeEventListener('resize', this._onResize);
    clearTimeout(this._resizeTimer);
  }
}
