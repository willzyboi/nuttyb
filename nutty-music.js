(() => {
  'use strict';
  const audio = document.getElementById('background-music');
  const button = document.getElementById('music-open');
  const slider = document.getElementById('music-volume');
  const output = document.getElementById('music-level');
  if (!audio || !button || !slider) return;
  const read = (key, fallback) => { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
  let wanted = read('nutty-music-enabled', 'true') !== 'false';
  let waiting = false;
  const storedVolume = Number(read('nutty-music-volume', '15'));
  slider.value = Number.isFinite(storedVolume) ? Math.max(0, Math.min(100, storedVolume)) : 15;
  function setVolume() { audio.volume = Number(slider.value) / 100; output.textContent = slider.value + '%'; }
  function refresh() {
    const playing = !audio.paused;
    button.textContent = playing ? '♫ Music on · turn off' : waiting && wanted ? '♫ Play music' : '♫ Music off · turn on';
    button.setAttribute('aria-pressed', String(playing));
    button.title = 'Cosmic Family Flight · quiet background music';
  }
  async function play() {
    if (!wanted) return;
    setVolume();
    try { await audio.play(); waiting = false; } catch { waiting = true; }
    refresh();
  }
  button.onclick = () => {
    if (!audio.paused || (wanted && !waiting)) { wanted = false; waiting = false; audio.pause(); }
    else { wanted = true; play(); }
    save('nutty-music-enabled', String(wanted));
    refresh();
  };
  slider.oninput = () => { setVolume(); save('nutty-music-volume', slider.value); };
  audio.addEventListener('play', refresh);
  audio.addEventListener('pause', refresh);
  audio.addEventListener('error', () => { waiting = false; button.textContent = 'Music unavailable'; });
  document.addEventListener('pointerdown', event => { if (waiting && wanted && event.target !== button) play(); });
  setVolume(); refresh();
  if (wanted) play();
})();
