(function () {
  var standalone = navigator.standalone === true ||
    (window.matchMedia && (matchMedia('(display-mode: standalone)').matches ||
                           matchMedia('(display-mode: fullscreen)').matches));
  if (!standalone) return;

  var root = document.documentElement;
  root.classList.add('alw-standalone');

  function apply() {
    var longSide = Math.max(screen.width, screen.height);
    var shortSide = Math.min(screen.width, screen.height);
    var portrait = window.innerHeight >= window.innerWidth;
    var target = Math.max(window.innerHeight, portrait ? longSide : shortSide);
    root.style.setProperty('--alw-vh', target + 'px');
  }

  apply();
  addEventListener('orientationchange', function () { setTimeout(apply, 250); });
})();
