const COLLECTION = 'europe_2025';

const $title = document.getElementById('title');
const $photo = document.getElementById('photo');
const $coords = document.getElementById('coords');
const $stage = document.getElementById('stage');
const $playBtn = document.getElementById('play-btn');
const $audio = document.getElementById('audio');

let images = [];
let currentIndex = 0;

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

  $photo.removeAttribute('style');
  if (img.style) Object.assign($photo.style, img.style);

  $photo.src = `images/${COLLECTION}/${img.file}`;

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

  preload(currentIndex + 1);
  preload(currentIndex - 1);
}

function preload(idx) {
  const i = (idx + images.length) % images.length;
  const img = new Image();
  img.src = `images/${COLLECTION}/${images[i].file}`;
}

init();
