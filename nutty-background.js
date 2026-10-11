(() => {
  const video = document.getElementById('battle-background');
  const faction = document.getElementById('background-faction');
  const pause = document.getElementById('background-pause');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pausedByUser = reducedMotion.matches;
  video.muted = true;
  function update() {
    pause.textContent = pausedByUser ? 'Play background' : 'Pause background';
    if (pausedByUser || document.hidden || reducedMotion.matches) video.pause();
    else video.play().catch(() => {
      pausedByUser = true;
      pause.textContent = 'Play background';
    });
  }
  pause.addEventListener('click', () => { pausedByUser = !pausedByUser; update(); });
  faction.addEventListener('change', () => {
    const name = faction.value === 'Cortex' ? 'Cortex' : 'Armada';
    video.src = `https://ixstudiosdata.nl/BAR/BAR_BG_${name}_Animated_1080P.mp4`;
    video.load();
    update();
  });
  document.addEventListener('visibilitychange', update);
  reducedMotion.addEventListener('change', update);
  update();
})();
