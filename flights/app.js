/* Flight Checker — live flight tracking with the free OpenSky Network API.
   No API key needed. Anonymous users get a daily request allowance per IP,
   so after the first lookup we refresh only the one aircraft (a cheap request). */
(function () {
  'use strict';

  var API = 'https://opensky-network.org/api';
  var REFRESH_MS = 20000;
  var RECENT_KEY = 'flightChecker.recent';
  var D = window.FLIGHT_DATA;

  var $ = function (id) { return document.getElementById(id); };
  var el = {
    tabs: [$('tab-flight'), $('tab-airport')],
    paneFlight: $('pane-flight'), paneAirport: $('pane-airport'),
    flightInput: $('flightInput'), airportSelect: $('airportSelect'), radiusSelect: $('radiusSelect'),
    recent: $('recent'), status: $('status'),
    flightCard: $('flightCard'), airportCard: $('airportCard'), mapWrap: $('mapWrap'), help: $('help')
  };

  var state = { mode: null, timer: null, ticker: null, lastFetch: 0, flight: null, airport: null, trail: [] };
  var map = null, layer = null;

  /* ---------- Helpers ---------- */
  var fmt = function (n) { return Math.round(n).toLocaleString('en-US'); };
  var toRad = function (d) { return d * Math.PI / 180; };
  function distanceKm(lat1, lon1, lat2, lon2) {
    var dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  function bearing(lat1, lon1, lat2, lon2) {
    var y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
    var x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }
  var compass = function (deg) { return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(deg / 45) % 8]; };
  function ago(sec) {
    if (sec < 5) return 'just now';
    if (sec < 60) return sec + ' s ago';
    if (sec < 3600) return Math.floor(sec / 60) + ' min ago';
    return Math.floor(sec / 3600) + ' h ago';
  }

  /* OpenSky state vector -> object */
  function toPlane(s) {
    return {
      hex: s[0], callsign: (s[1] || '').trim(), country: s[2], time: s[3] || s[4], lon: s[5], lat: s[6],
      alt: s[13] != null ? s[13] : s[7], onGround: s[8], speed: s[9], track: s[10], vert: s[11], squawk: s[14]
    };
  }

  function planeStatus(p) {
    if (p.onGround) return { text: 'On the ground', cls: 'pill--ground' };
    if (p.vert > 2.5) return { text: 'In the air · climbing', cls: '' };
    if (p.vert < -2.5) return { text: 'In the air · descending', cls: 'pill--down' };
    return { text: 'In the air · cruising', cls: '' };
  }

  function nearestAirport(lat, lon) {
    var best = null;
    D.AIRPORTS.forEach(function (a) {
      var d = distanceKm(a[4], a[5], lat, lon);
      if (!best || d < best.d) best = { a: a, d: d };
    });
    return best;
  }

  /* Airline lookup by ICAO prefix (for display) */
  var ICAO_TO_AIRLINE = {};
  Object.keys(D.AIRLINES).forEach(function (iata) {
    ICAO_TO_AIRLINE[D.AIRLINES[iata][0]] = { iata: iata, name: D.AIRLINES[iata][1] };
  });
  function airlineFor(callsign) {
    var m = /^([A-Z]{3})(\d\w*)$/.exec(callsign || '');
    return m && ICAO_TO_AIRLINE[m[1]] ? { name: ICAO_TO_AIRLINE[m[1]].name, iata: ICAO_TO_AIRLINE[m[1]].iata + m[2] } : null;
  }

  /* Turn what the user typed into the callsign planes broadcast.
     "EK 0600" -> UAE600, "UAE600" stays, "9P740" -> FJL740 */
  function parseFlight(raw) {
    var q = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (q.length < 3) return { error: 'Please enter a flight number like EK600.' };
    var m = /^([A-Z]{3})0*(\d{1,4}[A-Z]{0,2})$/.exec(q);
    if (m) return { callsign: m[1] + m[2], label: q };
    m = /^([A-Z0-9]{2})0*(\d{1,4}[A-Z]?)$/.exec(q);
    if (m && /[A-Z]/.test(m[1])) {
      var al = D.AIRLINES[m[1]];
      if (!al) return { error: 'We don\'t know the airline code "' + m[1] + '" yet. Try the 3-letter radio callsign instead (for example UAE600 for Emirates EK600).' };
      return { callsign: al[0] + m[2], label: m[1] + m[2] };
    }
    if (q.length <= 8) return { callsign: q, label: q }; // private flights often use the registration
    return { error: 'That doesn\'t look like a flight number. Try something like EK600 or PK301.' };
  }

  /* ---------- Network ---------- */
  function api(path) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var t = setTimeout(function () { if (ctrl) ctrl.abort(); }, 20000);
    return fetch(API + path, ctrl ? { signal: ctrl.signal } : {}).then(function (r) {
      clearTimeout(t);
      if (r.status === 429) throw new Error('The free live-data allowance for your connection has been used up for now. Please try again later.');
      if (!r.ok) throw new Error('The live flight service answered with an error (' + r.status + '). Please try again in a minute.');
      return r.json();
    }, function (e) {
      clearTimeout(t);
      throw new Error(e && e.name === 'AbortError'
        ? 'The live flight service is taking too long to answer. Please try again.'
        : 'Couldn\'t reach the live flight service. Check your internet connection and try again.');
    });
  }

  /* ---------- UI state ---------- */
  function showStatus(html, kind) {
    el.status.className = 'status' + (kind ? ' status--' + kind : '');
    el.status.innerHTML = html;
    el.status.hidden = false;
  }
  function hideStatus() { el.status.hidden = true; }

  function setBusy(busy) {
    document.querySelectorAll('.search .btn').forEach(function (b) { b.disabled = busy; });
  }

  function stopRefresh() {
    clearInterval(state.timer); clearInterval(state.ticker);
    state.timer = state.ticker = null;
  }
  function startRefresh(fn, stampId) {
    stopRefresh();
    state.timer = setInterval(function () { if (!document.hidden) fn(true); }, REFRESH_MS);
    state.ticker = setInterval(function () {
      var s = $(stampId);
      if (s && state.lastFetch) s.textContent = 'Live · refreshed ' + ago(Math.round((Date.now() - state.lastFetch) / 1000)) + ' · updates every 20 s';
    }, 1000);
  }
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && state.timer && Date.now() - state.lastFetch > REFRESH_MS) {
      if (state.mode === 'flight') refreshFlight(true);
      else if (state.mode === 'airport') loadAirport(true);
    }
  });

  function setUrl(params) {
    try {
      var u = new URL(location.href);
      u.search = new URLSearchParams(params).toString();
      history.replaceState(null, '', u);
    } catch (e) { /* not important */ }
  }

  /* ---------- Map ---------- */
  function ensureMap() {
    el.mapWrap.hidden = false;
    if (map || !window.L) return !!map;
    map = L.map('map', { worldCopyJump: true, zoomControl: true }).setView([30, 60], 4);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 18, subdomains: 'abcd',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);
    layer = L.layerGroup().addTo(map);
    return true;
  }
  function planeIcon(track, highlight) {
    var c = highlight ? '#d6582e' : '#1b3c7a', size = highlight ? 34 : 24;
    return L.divIcon({
      className: 'plane-icon', iconSize: [size, size], iconAnchor: [size / 2, size / 2],
      html: '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" style="transform:rotate(' + (track || 0) + 'deg)">' +
        '<path fill="' + c + '" stroke="#fff" stroke-width=".8" d="M12 2c.8 0 1.3.9 1.3 2v5.2l7.7 4.6v2l-7.7-2.3v4.8l2.2 1.7v1.6L12 20.7l-3.5.9V20l2.2-1.7v-4.8L3 15.8v-2l7.7-4.6V4c0-1.1.5-2 1.3-2z"/></svg>'
    });
  }
  function airportIcon() {
    return L.divIcon({ className: 'plane-icon', iconSize: [18, 18], iconAnchor: [9, 9],
      html: '<svg width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="7" fill="#fff" stroke="#d6582e" stroke-width="3"/></svg>' });
  }
  function mapReady() { if (map) setTimeout(function () { map.invalidateSize(); }, 0); }

  /* ---------- Track a single flight ---------- */
  function trackFlight(raw) {
    var parsed = parseFlight(raw);
    if (parsed.error) { showStatus(escapeHtml(parsed.error), 'warn'); return; }
    stopRefresh();
    state.mode = 'flight'; state.trail = [];
    state.flight = { callsign: parsed.callsign, label: parsed.label, hex: null };
    el.airportCard.hidden = true;
    setBusy(true);
    showStatus('Searching every aircraft in the sky for <b>' + escapeHtml(parsed.label) + '</b>' +
      (parsed.label !== parsed.callsign ? ' (callsign ' + escapeHtml(parsed.callsign) + ')' : '') + '…');
    setUrl({ flight: parsed.label });
    saveRecent({ type: 'flight', q: parsed.label });

    api('/states/all').then(function (data) {
      var match = (data.states || []).map(toPlane).filter(function (p) { return p.callsign === parsed.callsign; })[0];
      if (!match) { notFound(parsed); return; }
      state.flight.hex = match.hex;
      showFlight(match, data.time);
      startRefresh(refreshFlight, 'fUpdated');
    }).catch(function (e) {
      el.flightCard.hidden = true; el.mapWrap.hidden = true;
      showStatus(escapeHtml(e.message), 'err');
    }).then(function () { setBusy(false); });
  }

  function trackHex(hex, callsign) {
    stopRefresh();
    state.mode = 'flight'; state.trail = [];
    state.flight = { callsign: callsign, label: (airlineFor(callsign) || {}).iata || callsign || hex.toUpperCase(), hex: hex };
    el.airportCard.hidden = true;
    if (callsign) setUrl({ flight: callsign });
    refreshFlight(false).then(function () { startRefresh(refreshFlight, 'fUpdated'); });
    window.scrollTo({ top: el.status.offsetTop - 20, behavior: 'smooth' });
  }

  function refreshFlight(silent) {
    var f = state.flight;
    if (!f || !f.hex) return Promise.resolve();
    return api('/states/all?icao24=' + encodeURIComponent(f.hex)).then(function (data) {
      var p = (data.states || []).map(toPlane).filter(function (x) { return x.hex === f.hex; })[0];
      if (!p) {
        stopRefresh();
        showStatus('<b>' + escapeHtml(f.label) + '</b> has stopped sending its position. It has most likely landed and switched off its transponder, or flown out of receiver range.', 'warn');
        return;
      }
      showFlight(p, data.time);
    }).catch(function (e) {
      if (!silent) showStatus(escapeHtml(e.message), 'err');
    });
  }

  function notFound(parsed) {
    el.flightCard.hidden = true; el.mapWrap.hidden = true;
    showStatus('<b>' + escapeHtml(parsed.label) + '</b> isn\'t broadcasting a position right now. This usually means:' +
      '<ul><li>it hasn\'t taken off yet, or has already landed</li>' +
      '<li>it\'s over an area with no ground receivers (open ocean, some deserts)</li>' +
      '<li>the airline uses a different radio callsign for this flight — check the number on FlightAware</li></ul>' +
      '<p style="margin:8px 0 0"><a target="_blank" rel="noopener" href="https://www.flightaware.com/live/flight/' + encodeURIComponent(parsed.callsign) + '">See schedule &amp; status on FlightAware ↗</a></p>', 'warn');
  }

  function showFlight(p, serverTime) {
    hideStatus();
    state.lastFetch = Date.now();
    var f = state.flight;
    var al = airlineFor(p.callsign);
    $('fAirline').textContent = al ? al.name : (p.callsign && p.callsign !== f.label ? 'Callsign ' + p.callsign : 'Flight');
    $('fNumber').textContent = al ? al.iata + (al.iata !== p.callsign ? ' · ' + p.callsign : '') : (p.callsign || f.label);
    var st = planeStatus(p);
    var pill = $('fState'); pill.textContent = st.text; pill.className = 'pill ' + st.cls;

    $('fAlt').innerHTML = p.onGround ? 'On ground' : p.alt != null ? fmt(p.alt * 3.28084) + ' ft <small>' + fmt(p.alt) + ' m</small>' : '—';
    $('fSpeed').innerHTML = p.speed != null ? fmt(p.speed * 1.94384) + ' kt <small>' + fmt(p.speed * 3.6) + ' km/h</small>' : '—';
    $('fHeading').textContent = p.track != null ? fmt(p.track) + '° ' + compass(p.track) : '—';
    $('fVert').textContent = p.vert != null && !p.onGround ? (p.vert > 0 ? '+' : '') + fmt(p.vert * 196.85) + ' ft/min' : '—';
    $('fCountry').textContent = p.country || '—';
    $('fHex').textContent = p.hex ? p.hex.toUpperCase() : '—';
    $('fSquawk').textContent = p.squawk || '—';

    if (p.lat != null && p.lon != null) {
      var n = nearestAirport(p.lat, p.lon);
      $('fNear').textContent = n && n.d < 400
        ? (n.d < 8 ? 'At ' + n.a[3] + ' (' + n.a[1] + ')' : fmt(n.d) + ' km ' + compass(bearing(n.a[4], n.a[5], p.lat, p.lon)) + ' of ' + n.a[3] + ' (' + n.a[1] + ')')
        : p.lat.toFixed(2) + '°, ' + p.lon.toFixed(2) + '°';
    } else {
      $('fNear').textContent = 'Position unknown';
    }

    var cs = encodeURIComponent(p.callsign || f.callsign || '');
    $('lnkFA').href = 'https://www.flightaware.com/live/flight/' + cs;
    $('lnkFR').href = 'https://www.flightradar24.com/data/flights/' + encodeURIComponent((al && al.iata) || p.callsign || '').toLowerCase();
    var age = serverTime && p.time ? Math.max(0, serverTime - p.time) : 0;
    $('fUpdated').textContent = 'Live · position ' + ago(age) + ' · updates every 20 s';
    el.flightCard.hidden = false;
    el.help.hidden = true;

    if (p.lat == null || p.lon == null || !ensureMap()) { if (!window.L) el.mapWrap.hidden = true; return; }
    var pos = [p.lat, p.lon];
    var last = state.trail[state.trail.length - 1];
    if (!last || last[0] !== pos[0] || last[1] !== pos[1]) state.trail.push(pos);
    layer.clearLayers();
    if (state.trail.length > 1) L.polyline(state.trail, { color: '#d6582e', weight: 3, opacity: .8, dashArray: '6 6' }).addTo(layer);
    L.marker(pos, { icon: planeIcon(p.track, true), title: p.callsign }).addTo(layer)
      .bindTooltip((al ? al.iata : p.callsign) + (p.alt != null && !p.onGround ? ' · ' + fmt(p.alt * 3.28084) + ' ft' : ''));
    mapReady();
    if (state.trail.length === 1) map.setView(pos, p.onGround ? 12 : 7);
    else if (!map.getBounds().pad(-0.15).contains(pos)) map.panTo(pos);
  }

  /* ---------- Planes near an airport ---------- */
  function airportByIcao(code) {
    return D.AIRPORTS.filter(function (a) { return a[0] === code; })[0];
  }

  function loadAirport(silent) {
    var a = state.airport;
    if (!a) return Promise.resolve();
    var r = a.r, lat = a.ap[4], lon = a.ap[5], rl = r / Math.max(0.2, Math.cos(toRad(lat)));
    if (!silent) { setBusy(true); showStatus('Looking for planes around <b>' + escapeHtml(a.ap[2]) + '</b>…'); }
    var q = '?lamin=' + (lat - r).toFixed(3) + '&lamax=' + (lat + r).toFixed(3) + '&lomin=' + (lon - rl).toFixed(3) + '&lomax=' + (lon + rl).toFixed(3);
    return api('/states/all' + q).then(function (data) {
      if (state.mode !== 'airport' || state.airport !== a) return;
      var planes = (data.states || []).map(toPlane).filter(function (p) { return p.lat != null; });
      planes.forEach(function (p) { p.d = distanceKm(lat, lon, p.lat, p.lon); });
      planes.sort(function (x, y) { return x.d - y.d; });
      showAirport(a, planes);
    }).catch(function (e) {
      if (!silent) { el.airportCard.hidden = true; showStatus(escapeHtml(e.message), 'err'); }
    }).then(function () { if (!silent) setBusy(false); });
  }

  function startAirport(code, r) {
    var ap = airportByIcao(code);
    if (!ap) return;
    stopRefresh();
    state.mode = 'airport';
    state.airport = { ap: ap, r: r };
    el.flightCard.hidden = true;
    setUrl({ airport: ap[1], r: r });
    saveRecent({ type: 'airport', q: ap[0], r: r, label: ap[1] + ' · ' + ap[3] });
    loadAirport(false).then(function () { if (state.mode === 'airport') startRefresh(loadAirport, 'aUpdated'); });
  }

  function showAirport(a, planes) {
    hideStatus();
    state.lastFetch = Date.now();
    var ap = a.ap;
    $('aCity').textContent = ap[3] + ' · ' + ap[1] + ' / ' + ap[0];
    $('aName').textContent = ap[2];
    $('aCount').textContent = planes.length + (planes.length === 1 ? ' plane' : ' planes') + ' nearby';
    $('aUpdated').textContent = 'Live · updates every 20 s';
    var tbody = $('aRows');
    tbody.textContent = '';
    if (!planes.length) {
      var tr = document.createElement('tr'), td = document.createElement('td');
      td.colSpan = 6; td.textContent = 'No planes with live positions in this area right now.';
      td.style.fontWeight = '400'; tr.appendChild(td); tbody.appendChild(tr);
    }
    planes.slice(0, 80).forEach(function (p) {
      var al = airlineFor(p.callsign);
      var tr = document.createElement('tr');
      var cells = [
        al ? al.iata : (p.callsign || p.hex.toUpperCase()),
        planeStatus(p).text.replace('In the air · ', ''),
        p.onGround ? '—' : p.alt != null ? fmt(p.alt * 3.28084) + ' ft' : '—',
        p.speed != null ? fmt(p.speed * 1.94384) + ' kt' : '—',
        fmt(p.d) + ' km'
      ];
      cells.forEach(function (c, i) {
        var td = document.createElement('td'); td.textContent = c;
        if (i === 0 && al) td.title = al.name + ' · ' + p.callsign;
        tr.appendChild(td);
      });
      var td = document.createElement('td'), b = document.createElement('button');
      b.className = 'chip'; b.type = 'button'; b.textContent = 'Track';
      b.addEventListener('click', function () { trackHex(p.hex, p.callsign); });
      td.appendChild(b); tr.appendChild(td);
      tbody.appendChild(tr);
    });
    el.airportCard.hidden = false;
    el.help.hidden = true;

    if (!ensureMap()) { el.mapWrap.hidden = true; return; }
    var first = !a.drawn;
    layer.clearLayers();
    L.marker([ap[4], ap[5]], { icon: airportIcon(), title: ap[2] }).addTo(layer).bindTooltip(ap[1] + ' · ' + ap[2]);
    planes.forEach(function (p) {
      var al = airlineFor(p.callsign);
      L.marker([p.lat, p.lon], { icon: planeIcon(p.track, false), title: p.callsign || p.hex })
        .addTo(layer)
        .bindTooltip((al ? al.iata + ' ' : '') + (p.callsign || p.hex.toUpperCase()) + (p.onGround ? ' · on ground' : p.alt != null ? ' · ' + fmt(p.alt * 3.28084) + ' ft' : ''))
        .on('click', function () { trackHex(p.hex, p.callsign); });
    });
    mapReady();
    if (first) {
      var r = a.r, rl = r / Math.max(0.2, Math.cos(toRad(ap[4])));
      map.fitBounds([[ap[4] - r, ap[5] - rl], [ap[4] + r, ap[5] + rl]]);
      a.drawn = true;
    }
  }

  /* ---------- Recent searches (per browser) ---------- */
  function loadRecent() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch (e) { return []; }
  }
  function saveRecent(item) {
    var list = loadRecent().filter(function (x) { return !(x.type === item.type && x.q === item.q); });
    list.unshift(item);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 6))); } catch (e) { /* storage off */ }
    renderRecent();
  }
  function renderRecent() {
    var list = loadRecent();
    el.recent.textContent = '';
    if (!list.length) { el.recent.hidden = true; return; }
    var lbl = document.createElement('span'); lbl.textContent = 'Recent:'; el.recent.appendChild(lbl);
    list.forEach(function (x) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'chip';
      b.textContent = x.type === 'flight' ? '✈ ' + x.q : '📍 ' + (x.label || x.q);
      b.addEventListener('click', function () {
        if (x.type === 'flight') { selectTab(0); el.flightInput.value = x.q; trackFlight(x.q); }
        else { selectTab(1); el.airportSelect.value = x.q; el.radiusSelect.value = String(x.r || 1); startAirport(x.q, x.r || 1); }
      });
      el.recent.appendChild(b);
    });
    el.recent.hidden = false;
  }

  /* ---------- Tabs & forms ---------- */
  function selectTab(i) {
    el.tabs.forEach(function (t, j) {
      t.setAttribute('aria-selected', String(i === j));
      t.tabIndex = i === j ? 0 : -1;
    });
    el.paneFlight.hidden = i !== 0;
    el.paneAirport.hidden = i !== 1;
  }
  el.tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(i); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        var n = (i + 1) % 2; selectTab(n); el.tabs[n].focus(); e.preventDefault();
      }
    });
  });

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }

  // Airport dropdown, grouped by country region order in data.js
  D.AIRPORTS.slice().sort(function (a, b) { return a[3].localeCompare(b[3]) || a[2].localeCompare(b[2]); }).forEach(function (a) {
    var o = document.createElement('option');
    o.value = a[0]; o.textContent = a[3] + ' — ' + a[2] + ' (' + a[1] + ')';
    el.airportSelect.appendChild(o);
  });
  el.airportSelect.value = 'OPIS';

  el.paneFlight.addEventListener('submit', function (e) { e.preventDefault(); trackFlight(el.flightInput.value); });
  el.paneAirport.addEventListener('submit', function (e) {
    e.preventDefault();
    startAirport(el.airportSelect.value, parseFloat(el.radiusSelect.value) || 1);
  });

  // Expose the parser for quick testing in the console
  window.FlightChecker = { parseFlight: parseFlight };

  /* ---------- Start from a shared link: ?flight=EK600 or ?airport=ISB ---------- */
  renderRecent();
  var params = new URLSearchParams(location.search);
  if (params.get('flight')) {
    el.flightInput.value = params.get('flight');
    trackFlight(params.get('flight'));
  } else if (params.get('airport')) {
    var code = params.get('airport').toUpperCase();
    var ap = D.AIRPORTS.filter(function (a) { return a[0] === code || a[1] === code; })[0];
    if (ap) {
      var r = [0.5, 1, 2].indexOf(parseFloat(params.get('r'))) >= 0 ? parseFloat(params.get('r')) : 1;
      selectTab(1); el.airportSelect.value = ap[0]; el.radiusSelect.value = String(r);
      startAirport(ap[0], r);
    }
  }
})();
