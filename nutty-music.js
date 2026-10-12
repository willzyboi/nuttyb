(() => {
  'use strict';
  const videoId = 'OaMACADqMMQ';
  const open = document.getElementById('music-open');
  const panel = document.getElementById('music-panel');
  const toggle = document.getElementById('music-toggle');
  const volume = document.getElementById('music-volume');
  const status = document.getElementById('music-status');
  if (!open || !panel) return;
  let player, ready = false, playing = false, requested = false;
  const level = () => Math.max(0, Math.min(100, Number(volume.value) || 0));
  function createPlayer() {
    if (player || !window.YT?.Player) return;
    player = new YT.Player('music-player', {
      width: '320', height: '200', videoId,
      playerVars: { playsinline: 1, loop: 1, playlist: videoId, origin: location.origin },
      events: {
        onReady(event) {
          ready = true;
          event.target.setVolume(level());
          toggle.disabled = false;
          status.textContent = 'Quiet volume · 15% by default';
          if (requested) event.target.playVideo();
        },
        onStateChange(event) {
          playing = event.data === YT.PlayerState.PLAYING;
          toggle.textContent = playing ? 'Pause music' : 'Play music';
          if (playing) status.textContent = 'Playing quietly';
        },
        onAutoplayBlocked() { status.textContent = 'Press Play music to start.'; },
        onError() { status.textContent = 'This track cannot play here. Use the YouTube link below.'; }
      }
    });
  }
  open.onclick = () => {
    panel.hidden = false;
    open.setAttribute('aria-expanded', 'true');
    requested = true;
    if (ready) { player.setVolume(level()); player.playVideo(); return; }
    if (window.YT?.Player) { createPlayer(); return; }
    if (document.getElementById('music-youtube-api')) return;
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (typeof previous === 'function') previous(); createPlayer(); };
    const script = document.createElement('script');
    script.id = 'music-youtube-api'; script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => { status.textContent = 'Music could not load. Try the YouTube link.'; };
    document.head.appendChild(script);
  };
  toggle.onclick = () => { if (!ready) return; if (playing) player.pauseVideo(); else { player.setVolume(level()); player.playVideo(); } };
  volume.oninput = () => { document.getElementById('music-level').textContent = level() + '%'; if (ready) player.setVolume(level()); };
  document.getElementById('music-close').onclick = () => { requested = false; if (ready) player.pauseVideo(); panel.hidden = true; open.setAttribute('aria-expanded', 'false'); };
})();
