// Registro de escenas, artistas, sellos e influencias del sonido distópico del sintetizador británico según Dark Waves de Neil O’Connor. Cada fichero de capítulo (data/NN-*.js,
// escritos a mano leyendo el libro) llama a DARKWAVES.chapter({...}) y DARKWAVES.add([...], n).
// Los datos se fusionan por id: los arrays se unen y cada capítulo puede añadir
// discos, citas (refs) y una nota propia sobre una escena ya definida en otro.
window.DARKWAVES = (function () {
  const genres = new Map();
  const chapters = [];

  const FAMILIES = {
    distopia:   { name: 'Imaginario distópico: literatura, cine, televisión, Ballard y Burroughs', color: '#94a3b8' },
    britania:   { name: 'Gran Bretaña en crisis: política, ciudades, huelgas y subculturas', color: '#78716c' },
    vanguardia: { name: 'Vanguardias: Dada, futurismo, situacionismo, performance', color: '#f472b6' },
    pioneros:   { name: 'Pioneros electrónicos: concreta, Radiophonic Workshop, EMS, máquinas', color: '#facc15' },
    europa:     { name: 'Influencias: krautrock, Bowie, Eno, prog y disco electrónica', color: '#60a5fa' },
    industrial: { name: 'Industrial y ruido: Throbbing Gristle, Cabaret Voltaire, Sheffield', color: '#ef4444' },
    indie:      { name: 'Postpunk electrónico y sellos independientes: Mute, Factory, Fast', color: '#2dd4bf' },
    synthpop:   { name: 'Synth pop en las listas: Human League, Numan, OMD, Depeche Mode', color: '#a78bfa' },
    romanticos: { name: 'Nuevos románticos: Blitz, Visage, Ultravox, Duran Duran', color: '#fb923c' },
    legado:     { name: 'Legado: EBM, industrial americano, house, techno y electrónica actual', color: '#4ade80' },
  };


  const key = (t) => (t.a + '|' + t.t).toLowerCase();

  function mergeArr(a = [], b = [], k = (x) => (typeof x === 'string' ? x.toLowerCase() : JSON.stringify(x))) {
    const seen = new Set(a.map(k));
    const out = a.slice();
    for (const x of b) if (!seen.has(k(x))) { seen.add(k(x)); out.push(x); }
    return out;
  }

  // Anota en cada disco los capítulos que lo citan.
  function cite(tracks, t, ch) {
    const m = tracks.find((x) => key(x) === key(t));
    if (m && ch != null) m.chs = mergeArr(m.chs, [ch]);
  }

  function add(list, chapter) {
    for (const g of list) {
      let cur = genres.get(g.id);
      if (!cur) {
        cur = { id: g.id, aka: [], influences: [], artists: [], tracks: [], labels: [], refs: [], notes: [], chapters: [] };
        genres.set(g.id, cur);
      }
      for (const f of ['aka', 'influences', 'artists', 'labels']) cur[f] = mergeArr(cur[f], g[f]);
      cur.tracks = mergeArr(cur.tracks, (g.tracks || []).map((t) => ({ ...t })), key);
      for (const t of g.tracks || []) {
        if (t.ess) { const m = cur.tracks.find((x) => key(x) === key(t)); if (m) m.ess = 1; }
        cite(cur.tracks, t, chapter);
      }
      cur.refs = mergeArr(cur.refs, (g.refs || []).map((r) => ({ ch: chapter, ...r })), (r) => r.q);
      for (const f of ['name', 'family', 'start', 'end', 'place', 'desc']) if (g[f] != null && cur[f] == null) cur[f] = g[f];
      if (g.desc != null) cur.descCh = cur.descCh ?? chapter;
      if (g.note) cur.notes.push({ ch: chapter, text: g.note });
      if (chapter != null && !cur.chapters.includes(chapter)) cur.chapters.push(chapter);
    }
  }

  return {
    FAMILIES,
    chapters,
    genres,
    chapter(meta) { chapters.push(meta); },
    add,
  };
})();
