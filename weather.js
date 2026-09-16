(() => {
  'use strict';
  const KEY = 'daybreak.weather.v1',
    CACHE = 'daybreak.weather.cache.v1',
    INTERVAL = 15 * 60 * 1000;
  const host = document.querySelector('#weather-widget');
  const element = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };
  const button = (text, fn, label) => {
    const b = element('button', 'text-button', text);
    b.type = 'button';
    if (label) b.setAttribute('aria-label', label);
    b.onclick = fn;
    return b;
  };
  const validLocation = (l) =>
    l &&
    typeof l.name === 'string' &&
    l.name.length > 0 &&
    l.name.length < 160 &&
    Number.isFinite(l.latitude) &&
    Math.abs(l.latitude) <= 90 &&
    Number.isFinite(l.longitude) &&
    Math.abs(l.longitude) <= 180;
  const placeKey = (l) => (l ? `${l.latitude},${l.longitude}` : '');
  let settings = { location: null, unit: 'celsius' },
    cached = null,
    busy = false,
    error = '',
    controller = null,
    searchController = null,
    requestId = 0,
    lastAttempt = 0,
    canSave = true;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved) {
      settings = {
        location: validLocation(saved.location) ? saved.location : null,
        unit: saved.unit === 'fahrenheit' ? 'fahrenheit' : 'celsius',
      };
    }
  } catch {}
  if (!settings.location && validLocation(window.DAYBREAK_WEATHER_LOCATION))
    settings.location = window.DAYBREAK_WEATHER_LOCATION;
  try {
    const saved = JSON.parse(localStorage.getItem(CACHE));
    if (
      saved &&
      saved.place === placeKey(settings.location) &&
      Number.isFinite(saved.fetchedAt) &&
      saved.fetchedAt <= Date.now() + 60000 &&
      validForecast(saved.data)
    )
      cached = saved;
  } catch {}
  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
      if (cached) localStorage.setItem(CACHE, JSON.stringify(cached));
      else localStorage.removeItem(CACHE);
      canSave = true;
    } catch {
      canSave = false;
    }
  }
  function validForecast(d) {
    return (
      d &&
      [d.temp, d.feels, d.high, d.low, d.code, d.observedAt].every(Number.isFinite) &&
      d.temp >= -100 &&
      d.temp <= 65 &&
      typeof d.date === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(d.date) &&
      typeof d.timezone === 'string' &&
      [true, false].includes(d.day)
    );
  }
  function dateAt(timezone) {
    try {
      const p = new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(new Date());
      return ['year', 'month', 'day'].map((k) => p.find((x) => x.type === k).value).join('-');
    } catch {
      return '';
    }
  }
  function temperature(t) {
    return Math.round(settings.unit === 'fahrenheit' ? (t * 9) / 5 + 32 : t) + '°';
  }
  function condition(code, day) {
    if (code === 0) return [day ? 'Clear sky' : 'Clear night', day ? 'sun' : 'moon'];
    if (code === 1) return ['Mostly clear', day ? 'sun' : 'moon'];
    if (code === 2) return ['Partly cloudy', 'cloud'];
    if (code === 3) return ['Overcast', 'cloud'];
    if ([45, 48].includes(code)) return ['Foggy', 'fog'];
    if ([51, 53, 55, 56, 57].includes(code)) return ['Drizzle', 'rain'];
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return ['Rain', 'rain'];
    if ([71, 73, 75, 77, 85, 86].includes(code)) return ['Snow', 'snow'];
    if ([95, 96, 99].includes(code)) return ['Thunderstorms', 'storm'];
    return ['Weather conditions', 'cloud'];
  }
  function icon(kind) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 48 48');
    svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('weather-icon');
    const paths = {
      sun: 'M24 4v5m0 30v5M4 24h5m30 0h5M10 10l4 4m20 20l4 4M10 38l4-4m20-20l4-4M33 24a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
      moon: 'M34 31A16 16 0 0 1 17 9a17 17 0 1 0 22 22 16 16 0 0 1-5 0',
      cloud: 'M13 34h23a8 8 0 0 0 0-16h-1a12 12 0 0 0-23 3 7 7 0 0 0 1 13',
      rain: 'M12 29h25a7 7 0 0 0-1-14 11 11 0 0 0-21 1 7 7 0 0 0-3 13m3 6-2 5m11-5-2 5m11-5-2 5',
      snow: 'M12 27h25a7 7 0 0 0-1-14 11 11 0 0 0-21 1 7 7 0 0 0-3 13m3 7v6m-3-3h6m12-3v6m-3-3h6',
      fog: 'M12 26h25a7 7 0 0 0-1-14 11 11 0 0 0-21 1 7 7 0 0 0-3 13M10 33h28M15 39h18',
      storm: 'M12 28h25a7 7 0 0 0-1-14 11 11 0 0 0-21 1 7 7 0 0 0-3 13m13 2-6 9h7l-4 6',
    };
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', paths[kind]);
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', 'currentColor');
    p.setAttribute('stroke-width', '1.5');
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('stroke-linejoin', 'round');
    svg.append(p);
    return svg;
  }
  function render() {
    host.replaceChildren();
    const top = element('div', 'weather-top');
    top.append(
      element('span', 'weather-place', settings.location?.name || 'A glance outside'),
      button(
        settings.location ? 'Change' : 'Choose a city',
        openSettings,
        'Choose weather location',
      ),
    );
    host.append(top);
    if (!settings.location) {
      const blank = element('div', 'weather-empty');
      blank.append(icon('sun'), element('p', '', 'Your local weather, at a glance.'));
      host.append(blank);
      return;
    }
    if (cached) {
      const d = cached.data,
        [label, kind] = condition(d.code, d.day),
        main = element('div', 'weather-main');
      main.append(
        icon(kind),
        element('span', 'weather-temp', temperature(d.temp)),
        element('div', 'weather-description', label),
      );
      host.append(main);
      const detail = element('div', 'weather-detail');
      const today = d.date === dateAt(d.timezone);
      detail.textContent = `Feels like ${temperature(d.feels)} · ${today ? 'Today' : 'Saved day'} ↑ ${temperature(d.high)}  ↓ ${temperature(d.low)}`;
      host.append(detail);
    } else
      host.append(
        element(
          'div',
          'weather-empty',
          busy
            ? 'Checking the sky…'
            : error
              ? 'Weather is unavailable right now.'
              : 'Ready to check the weather.',
        ),
      );
    const bottom = element('div', 'weather-bottom');
    let status = busy
      ? 'Updating…'
      : error
        ? 'Offline or unavailable'
        : cached
          ? 'Updated ' +
            new Date(cached.fetchedAt).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'Not loaded';
    if (
      cached &&
      (error ||
        Date.now() - cached.fetchedAt > INTERVAL * 2 ||
        cached.data.date !== dateAt(cached.data.timezone))
    )
      status =
        'Saved ' +
        new Date(cached.fetchedAt).toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) +
        (error ? ' · offline' : ' · outdated');
    if (!canSave) status += ' · not saved';
    bottom.append(element('span', 'weather-status', status));
    const actions = element('span', 'weather-actions');
    const refresh = button('↻', () => refreshWeather(true), 'Refresh weather');
    refresh.disabled = busy;
    const unit = button(
      settings.unit === 'celsius' ? '°C' : '°F',
      () => {
        settings.unit = settings.unit === 'celsius' ? 'fahrenheit' : 'celsius';
        persist();
        render();
      },
      'Change temperature unit',
    );
    actions.append(unit, refresh);
    bottom.append(actions);
    host.append(bottom);
    const credit = element('a', 'weather-credit', 'Weather by Open-Meteo');
    credit.href = 'https://open-meteo.com/';
    credit.target = '_blank';
    credit.rel = 'noopener noreferrer';
    host.append(credit);
  }
  async function refreshWeather(force = false) {
    if (!settings.location || document.hidden) return;
    if (
      !force &&
      (busy ||
        Date.now() - lastAttempt < INTERVAL ||
        (cached &&
          Date.now() - cached.fetchedAt < INTERVAL &&
          cached.data.date === dateAt(cached.data.timezone)))
    )
      return;
    controller?.abort();
    const token = ++requestId;
    controller = new AbortController();
    const signal = controller.signal;
    const timer = setTimeout(() => controller?.signal === signal && controller.abort(), 12000);
    busy = true;
    error = '';
    lastAttempt = Date.now();
    render();
    const loc = { ...settings.location };
    try {
      const url = new URL('https://api.open-meteo.com/v1/forecast');
      url.search = new URLSearchParams({
        latitude: loc.latitude,
        longitude: loc.longitude,
        current: 'temperature_2m,apparent_temperature,weather_code,is_day',
        daily: 'temperature_2m_max,temperature_2m_min',
        forecast_days: '1',
        timezone: 'auto',
        timeformat: 'unixtime',
      });
      const response = await fetch(url, {
        signal,
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
      });
      if (!response.ok) throw Error('Weather unavailable');
      const j = await response.json();
      const d = {
        temp: j.current?.temperature_2m,
        feels: j.current?.apparent_temperature,
        code: j.current?.weather_code,
        day: j.current?.is_day === 1,
        observedAt: j.current?.time,
        high: j.daily?.temperature_2m_max?.[0],
        low: j.daily?.temperature_2m_min?.[0],
        timezone: j.timezone,
        date: '',
      };
      if (typeof d.timezone !== 'string' || !Number.isFinite(j.daily?.time?.[0]))
        throw Error('Incomplete forecast');
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: d.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(new Date(j.daily.time[0] * 1000));
      d.date = ['year', 'month', 'day'].map((k) => parts.find((p) => p.type === k).value).join('-');
      if (!validForecast(d)) throw Error('Incomplete forecast');
      if (token !== requestId) return;
      cached = { place: placeKey(loc), fetchedAt: Date.now(), data: d };
      persist();
    } catch (e) {
      if (token !== requestId) return;
      error = e.message || 'Weather unavailable';
    } finally {
      clearTimeout(timer);
      if (token === requestId) {
        busy = false;
        render();
      }
    }
  }
  const dialog = element('dialog');
  dialog.id = 'weather-dialog';
  dialog.setAttribute('aria-labelledby', 'weather-dialog-heading');
  const head = element('div', 'dialog-head'),
    heading = element('h2', '', 'Weather, where you are');
  heading.id = 'weather-dialog-heading';
  head.append(
    heading,
    button('×', () => dialog.close(), 'Close weather settings'),
  );
  const body = element('div', 'dialog-body');
  const form = element('form', 'weather-search');
  const input = element('input');
  input.type = 'search';
  input.required = true;
  input.minLength = 2;
  input.maxLength = 100;
  input.placeholder = 'Town or city';
  input.setAttribute('aria-label', 'Weather city');
  const find = element('button', 'primary', 'Find');
  find.type = 'submit';
  form.append(input, find);
  const message = element(
    'p',
    'muted',
    'Search by town or city. No precise location access needed.',
  );
  message.setAttribute('role', 'status');
  const results = element('div', 'weather-results');
  body.append(form, message, results);
  dialog.append(head, body);
  document.body.append(dialog);
  function openSettings() {
    dialog.showModal();
    input.focus();
  }
  let searchVersion = 0;
  form.onsubmit = async (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (query.length < 2) return;
    searchController?.abort();
    const controller = new AbortController();
    searchController = controller;
    const version = ++searchVersion;
    const timeout = setTimeout(() => controller.abort(), 10000);
    message.textContent = 'Finding places…';
    results.replaceChildren();
    find.disabled = true;
    try {
      const u = new URL('https://geocoding-api.open-meteo.com/v1/search');
      u.search = new URLSearchParams({ name: query, count: '6', language: 'en', format: 'json' });
      const r = await fetch(u, {
        signal: controller.signal,
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
      });
      if (!r.ok) throw Error();
      const data = await r.json();
      if (version !== searchVersion) return;
      const places = (Array.isArray(data.results) ? data.results : []).filter(validLocation);
      message.textContent = places.length
        ? 'Choose your location:'
        : 'No places found. Try a nearby town or a longer name.';
      places.forEach((p) => {
        const name = [p.name, p.admin1, p.country].filter(Boolean).join(', ');
        const choose = button(
          name,
          () => {
            settings.location = { name: p.name, latitude: p.latitude, longitude: p.longitude };
            cached = null;
            error = '';
            persist();
            dialog.close();
            lastAttempt = 0;
            render();
            refreshWeather(true);
          },
          'Use ' + name,
        );
        choose.className = 'weather-result';
        results.append(choose);
      });
    } catch {
      if (version === searchVersion)
        message.textContent = 'Could not search right now. Check your connection and try again.';
    } finally {
      clearTimeout(timeout);
      if (version === searchVersion) find.disabled = false;
    }
  };
  document.querySelector('#weather-settings').onclick = openSettings;
  render();
  refreshWeather();
  setInterval(() => {
    render();
    refreshWeather();
  }, 60000);
  window.addEventListener('online', () => refreshWeather(true));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      render();
      refreshWeather();
    }
  });
})();
