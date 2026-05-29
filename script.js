const COLLECTION = 'europe_2025';
const PAD = 8;

const $title = document.getElementById('title');
const $name = document.getElementById('name');
const $photo = document.getElementById('photo');
const $coords = document.getElementById('coords');
const $stage = document.getElementById('stage');
const $playBtn = document.getElementById('play-btn');
const $audio = document.getElementById('audio');

let images = [];
let currentIndex = 0;
let resizeTimer;

function parseCssLength(val) {
  if (!val) return Infinity;
  const s = String(val).trim();
  const n = parseFloat(s);
  if (s.endsWith('vh')) return (n * window.innerHeight) / 100;
  if (s.endsWith('vw')) return (n * window.innerWidth) / 100;
  return n;
}

function getSafeInsets() {
  const stage = $stage.getBoundingClientRect();
  const style = getComputedStyle($stage);
  const padL = parseFloat(style.paddingLeft);
  const padR = parseFloat(style.paddingRight);

  const titleRect = $title.getBoundingClientRect();
  const nameRect = $name.getBoundingClientRect();
  const safeTop = Math.max(titleRect.bottom, nameRect.bottom) + PAD;

  let safeBottom = stage.bottom - PAD;
  const bottomCandidates = [];
  if ($coords.textContent) {
    bottomCandidates.push($coords.getBoundingClientRect().top);
  }
  if (!$playBtn.hidden) {
    bottomCandidates.push($playBtn.getBoundingClientRect().top);
  }
  if (bottomCandidates.length) {
    safeBottom = Math.min(...bottomCandidates) - PAD;
  }

  return {
    safeTop,
    safeBottom,
    safeLeft: stage.left + padL,
    safeRight: stage.right - padR,
    stage,
  };
}

function computeMaxPhotoSize(naturalW, naturalH) {
  if (!naturalW || !naturalH) return { maxW: 0, maxH: 0 };

  const { safeTop, safeBottom, safeLeft, safeRight, stage } = getSafeInsets();
  const cx = stage.left + stage.width / 2;
  const cy = stage.top + stage.height / 2;

  let maxH = Math.min(2 * (cy - safeTop), 2 * (safeBottom - cy), stage.height);
  let maxW = Math.min(2 * (cx - safeLeft), 2 * (safeRight - cx), stage.width);
  maxH = Math.max(0, maxH);
  maxW = Math.max(0, maxW);

  if (!$playBtn.hidden) {
    const play = $playBtn.getBoundingClientRect();
    const photoTop = cy - maxH / 2;
    const photoBottom = cy + maxH / 2;
    if (photoBottom > play.top && photoTop < play.bottom) {
      maxW = Math.min(maxW, 2 * (cx - play.right - PAD));
      maxW = Math.max(0, maxW);
    }
  }

  const scale = Math.min(maxW / naturalW, maxH / naturalH);
  return { maxW: naturalW * scale, maxH: naturalH * scale };
}

function constrainPhoto(img) {
  const naturalW = $photo.naturalWidth;
  const naturalH = $photo.naturalHeight;
  if (!naturalW || !naturalH) return;

  let { maxW, maxH } = computeMaxPhotoSize(naturalW, naturalH);

  const style = img.style || {};
  if (style.maxHeight) maxH = Math.min(maxH, parseCssLength(style.maxHeight));
  if (style.maxWidth) maxW = Math.min(maxW, parseCssLength(style.maxWidth));

  const scale = Math.min(maxW / naturalW, maxH / naturalH);
  maxW = naturalW * scale;
  maxH = naturalH * scale;

  $photo.removeAttribute('style');
  const nonSize = { ...style };
  delete nonSize.maxWidth;
  delete nonSize.maxHeight;
  Object.assign($photo.style, nonSize);
  $photo.style.maxWidth = `${maxW}px`;
  $photo.style.maxHeight = `${maxH}px`;
}

function scheduleConstrain() {
  requestAnimationFrame(() => {
    if (images.length) constrainPhoto(images[currentIndex]);
  });
}

async function init() {
  const res = await fetch(`images/${COLLECTION}/config.json`);
  const config = await res.json();

  $title.textContent = config.title;
  images = config.images;

  if (config.music) {
    $audio.src = `images/${COLLECTION}/${config.music}`;
    $audio.volume = 0.5;
    $playBtn.hidden = false;

    $playBtn.addEventListener('click', () => {
      if ($audio.paused) {
        $audio.play();
        $playBtn.classList.add('playing');
        $playBtn.setAttribute('aria-label', 'Pause music');
      } else {
        $audio.pause();
        $playBtn.classList.remove('playing');
        $playBtn.setAttribute('aria-label', 'Play music');
      }
    });

    $audio.addEventListener('ended', () => {
      $playBtn.classList.remove('playing');
      $playBtn.setAttribute('aria-label', 'Play music');
    });
  }

  if (!images.length) return;

  render();

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(scheduleConstrain, 100);
  });

  $stage.addEventListener('click', (e) => {
    const rect = $stage.getBoundingClientRect();
    const x = e.clientX - rect.left;
    navigate(x < rect.width / 2 ? -1 : 1);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
  });

  $stage.addEventListener('mousemove', (e) => {
    const rect = $stage.getBoundingClientRect();
    const half = rect.width / 2;
    const x = e.clientX - rect.left;
    $stage.classList.toggle('hover-left', x < half);
    $stage.classList.toggle('hover-right', x >= half);
  });

  $stage.addEventListener('mouseleave', () => {
    $stage.classList.remove('hover-left', 'hover-right');
  });

  let touchStartX = 0;
  $stage.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  $stage.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) navigate(dx > 0 ? -1 : 1);
  });
}

function navigate(delta) {
  currentIndex = (currentIndex + delta + images.length) % images.length;
  render();
}

function render() {
  const img = images[currentIndex];

  if (img.coords && img.coords.length === 2) {
    const [lat, lng] = img.coords;
    const hemiLat = lat >= 0 ? 'N' : 'S';
    const hemiLng = lng >= 0 ? 'E' : 'W';
    $coords.textContent = `${Math.abs(lat).toFixed(4)}°${hemiLat}, ${Math.abs(lng).toFixed(4)}°${hemiLng}`;
    $coords.href = `https://www.google.com/maps?q=${lat},${lng}`;
  } else {
    $coords.textContent = '';
    $coords.removeAttribute('href');
  }

  $photo.onload = () => scheduleConstrain();
  $photo.src = `images/${COLLECTION}/${img.file}`;

  if ($photo.complete && $photo.naturalWidth) {
    scheduleConstrain();
  }

  preload(currentIndex + 1);
  preload(currentIndex - 1);
}

function preload(idx) {
  const i = (idx + images.length) % images.length;
  const img = new Image();
  img.src = `images/${COLLECTION}/${images[i].file}`;
}

init();
