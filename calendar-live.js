// Read the helper's local output. OAuth credentials never enter the homepage.
(() => {
  let loading = false;
  function refresh() {
    if (loading || document.hidden) return;
    loading = true;
    const script = document.createElement('script');
    script.src = 'calendar-data.js?t=' + Date.now();
    const done = () => {
      loading = false;
      script.remove();
      document.dispatchEvent(new Event('daybreak-calendar-update'));
    };
    script.onload = done;
    script.onerror = done;
    document.head.append(script);
  }
  setInterval(refresh, 30000);
  document.addEventListener('visibilitychange', refresh);
  document.addEventListener('daybreak-calendar-refresh', refresh);
})();
