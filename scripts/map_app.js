// Runs INSIDE the WebView (Leaflet). Talks to React Native via window.ReactNativeWebView.postMessage / window.cmd(name, payload).
(function () {
  var RN = window.ReactNativeWebView;
  function post(o) { try { RN.postMessage(JSON.stringify(o)); } catch (e) {} }
  window.onerror = function (m) { post({ type: 'log', msg: 'JS error: ' + m }); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var map = L.map('map', { zoomControl: false, attributionControl: false, preferCanvas: true, minZoom: 5, maxZoom: 17, zoomSnap: 0.5, tap: true }).setView([-18.9, 31.8], 7);
  L.control.zoom({ position: 'topleft' }).addTo(map);
  // panes: base (offline outline) < tiles(200) < overlay raster < vectors < services < selection
  ['base', 'ov', 'vec', 'svc', 'sel'].forEach(function (n, i) { map.createPane(n).style.zIndex = [150, 300, 450, 460, 470][i]; });
  var R = { vec: L.canvas({ pane: 'vec' }), svc: L.canvas({ pane: 'svc' }), sel: L.canvas({ pane: 'sel' }) };
  var g = { roads: L.layerGroup(), towns: L.layerGroup(), rivers: L.layerGroup(), svc: {}, pin: L.layerGroup().addTo(map), overlay: null, tiles: null };
  var show = { roads: true, rivers: true };

  function apply() {
    function set(layer, on) { if (on) { if (!map.hasLayer(layer)) layer.addTo(map); } else if (map.hasLayer(layer)) map.removeLayer(layer); }
    set(g.roads, !!show.roads); set(g.towns, !!show.roads); set(g.rivers, !!show.rivers);
    Object.keys(g.svc).forEach(function (k) { set(g.svc[k], !!show[k]); });
  }

  var H = {
    init: function (d) {
      L.polygon(d.country, { pane: 'base', color: '#7A8B7D', weight: 2, fillColor: '#EAF0E3', fillOpacity: 1, interactive: false }).addTo(map);
      d.roads.forEach(function (r) { L.polyline(r, { pane: 'vec', renderer: R.vec, color: '#A8844A', weight: 2, interactive: false }).addTo(g.roads); });
      d.towns.forEach(function (t) {
        L.circleMarker([t.la, t.lo], { pane: 'vec', renderer: R.vec, radius: 3, color: '#333', fillColor: '#333', fillOpacity: 1, weight: 1, interactive: false })
          .bindTooltip(t.n, { permanent: true, direction: 'right', offset: [4, 0], className: 'tn' }).addTo(g.towns);
      });
      d.rivers.forEach(function (r) { L.polyline(r.map(function (p) { return [p[1], p[0]]; }), { pane: 'vec', renderer: R.vec, color: '#1E88E5', weight: 1.6, interactive: false }).addTo(g.rivers); });
      d.services.forEach(function (s) {
        var m = L.circleMarker([s.la, s.lo], { pane: 'svc', renderer: R.svc, radius: 6, color: '#fff', weight: 2, fillColor: s.c, fillOpacity: 1, bubblingMouseEvents: false });
        m.bindPopup('<b>' + esc(s.n) + '</b><br>' + esc(s.st) + (s.t ? ' &middot; ' + esc(s.t) : '') + '<br><i>' + 'approximate location' + '</i>');
        (g.svc[s.k] = g.svc[s.k] || L.layerGroup()).addLayer(m);
      });
      apply(); post({ type: 'inited' });
    },
    show: function (p) { show = p; apply(); },
    base: function (mode) {
      if (g.tiles) { map.removeLayer(g.tiles); g.tiles = null; }
      if (mode === 'osm') g.tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 17, crossOrigin: true }).addTo(map);
    },
    overlay: function (p) {
      if (g.overlay) { map.removeLayer(g.overlay); g.overlay = null; }
      if (!p) return;
      g.overlay = L.imageOverlay(p.uri, [[p.s, p.w], [p.n, p.e]], { pane: 'ov', opacity: p.o, interactive: false }).addTo(map);
      var el = g.overlay.getElement(); if (el) el.style.imageRendering = 'pixelated'; // crisp cells instead of a blurry smear
    },
    pin: function (p) {
      g.pin.clearLayers(); if (!p) return;
      if (p.cell) L.polygon(p.cell, { pane: 'sel', renderer: R.sel, color: '#000', weight: 2, fillColor: '#000', fillOpacity: 0.06, interactive: false }).addTo(g.pin);
      if (p.ring) L.polygon(p.ring, { pane: 'sel', renderer: R.sel, color: '#1B8A3E', weight: 2, fillColor: '#1B8A3E', fillOpacity: 0.08, interactive: false }).addTo(g.pin);
      (p.routes || []).forEach(function (r) { L.polyline(r.coords, { pane: 'sel', renderer: R.sel, color: r.color, weight: 3, dashArray: '8 6', interactive: false }).addTo(g.pin); });
      L.circleMarker([p.lat, p.lon], { pane: 'sel', renderer: R.sel, radius: 8, color: '#fff', weight: 3, fillColor: '#1B8A3E', fillOpacity: 1, interactive: false }).addTo(g.pin);
    },
    fly: function (p) { map.flyTo([p.lat, p.lon], p.z, { duration: 0.6 }); }
  };
  window.cmd = function (name, p) { try { H[name](p); } catch (e) { post({ type: 'log', msg: name + ' failed: ' + e }); } };
  map.on('click', function (e) { post({ type: 'tap', lat: e.latlng.lat, lon: e.latlng.lng }); });
  post({ type: 'ready', leaflet: L.version });
})();
