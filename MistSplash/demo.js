// Standalone demo only. Native hosts handle the same event through the bridge.
window.addEventListener('mist:enter', () => {
  if (window.webkit?.messageHandlers?.mistSplash) return;
  window.mistSplashStop?.();
  const root = document.getElementById('mist-living-water');
  const panel = document.createElement('div');
  panel.className = 'mist-demo-end';
  const title = document.createElement('p');
  title.textContent = '雾散了。';
  const restart = document.createElement('button');
  restart.type = 'button';
  restart.textContent = '再看一次';
  restart.addEventListener('click', () => location.reload());
  panel.append(title, restart);
  root.replaceChildren(panel);
  restart.focus();
}, { once: true });
