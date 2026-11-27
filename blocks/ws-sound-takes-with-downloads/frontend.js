// ── EsaSim block ──────────────────────────────────────────────────────
// Sound takes with downloads (ws-sound-takes-with-downloads) · version 2 · view, JavaScript: function render(ctx)
// Plays every generated take, each with its own Download WAV and Download MP3 buttons.
// Workspace: Gianluca De Novi's workspace · Author: Gianluca De Novi
// Saved: 2026-11-14
//
// Inputs   ctx.input("id") gives { files, stream }; ctx.rows("id"), ctx.json("id"), ctx.text("id")
//   sounds      Files (wav, ogg, flac)    Sounds (WAV) · several
//   mp3         Files (mp3)               MP3 copies · several · optional
// Settings ctx.params.key
//   autoplay    bool      Play new files by themselves = false
//   volume      number    Volume (%) = 80
// EsaSim rewrites these lines from the block's definition each time it is saved: change the definition, not them.
// ── end of EsaSim block header ────────────────────────────────────────

/* Sound takes: one card per generated take with a player and Download WAV / Download MP3 buttons.
 * The MP3 copies come on their own input and are matched to the WAV takes by file name. */
function render(ctx) {
  var p = ctx.params;
  ctx.el.innerHTML = '<div class="viz-pad" style="display:flex;flex-direction:column;gap:10px">'
    + '<div class="viz-row" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">'
    + '<label class="viz-small viz-muted">Volume <input class="vol" type="range" min="0" max="100" style="vertical-align:middle"></label>'
    + '<span class="viz-small viz-muted count" style="margin-left:auto"></span></div>'
    + '<div class="takes" style="display:flex;flex-direction:column;gap:8px"></div></div>';
  var vol = ctx.el.querySelector('.vol'), list = ctx.el.querySelector('.takes'), countEl = ctx.el.querySelector('.count');
  var cards = {};
  vol.value = p.volume == null ? 80 : +p.volume;
  vol.oninput = function () { Object.keys(cards).forEach(function (k) { cards[k].audio.volume = vol.value / 100; }); };

  function stem(name) { return String(name || '').replace(/\.[^.]+$/, ''); }
  function audioFiles(port) {
    var x = ctx.input(port) || { files: [] };
    return (x.files || []).filter(function (f) { return /\.(wav|mp3|ogg|flac|m4a|webm)$/i.test(f.name || ''); });
  }
  function download(file, name, mime, btn) {
    // Views run in a sandboxed frame where a plain <a download> is blocked: hand the file to the page
    // with ctx.save, which offers it as a download (as the built-in Camera view does).
    var label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Preparing…';
    ctx.files.buffer(file).then(function (buf) {
      var blob = new Blob([buf], { type: mime });
      if (typeof ctx.save === 'function') return ctx.save(name, blob);
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a'); a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 20000);
    }).then(function () { btn.textContent = '✓ ' + label.replace(/^↓ /, ''); setTimeout(function () { btn.textContent = label; }, 1500); },
      function (e) { btn.textContent = label; ctx.status('Download failed: ' + (e && e.message ? e.message : 'the file could not be fetched')); })
      .then(function () { btn.disabled = false; });
  }
  function button(text, primary) {
    var b = document.createElement('button'); b.type = 'button';
    b.className = 'viz-btn' + (primary ? ' primary' : ''); b.textContent = text; b.style.padding = '6px 12px';
    return b;
  }

  function update() {
    var wavs = audioFiles('sounds'), mp3s = audioFiles('mp3');
    var byStem = {};
    mp3s.forEach(function (f) { byStem[stem(f.name)] = f; });
    var keep = {};
    wavs.forEach(function (f) {
      var key = stem(f.name); keep[key] = 1;
      var c = cards[key];
      if (!c) {
        var tile = document.createElement('div'); tile.className = 'viz-tile';
        tile.style.cssText = 'padding:10px 12px;display:flex;flex-direction:column;gap:8px;min-width:0';
        var title = document.createElement('div'); title.className = 'viz-small';
        title.style.cssText = 'font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
        title.textContent = f.name;
        var audio = document.createElement('audio'); audio.controls = true; audio.preload = 'metadata'; audio.style.width = '100%';
        audio.volume = vol.value / 100;
        var row = document.createElement('div'); row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;align-items:center';
        var wavBtn = button('↓ Download WAV', true), mp3Btn = button('↓ Download MP3', false);
        row.append(wavBtn, mp3Btn);
        tile.append(title, audio, row);
        list.appendChild(tile);
        c = cards[key] = { tile: tile, audio: audio, wavBtn: wavBtn, mp3Btn: mp3Btn, wav: null, mp3: null };
        audio.addEventListener('play', function () {
          Object.keys(cards).forEach(function (k) { if (cards[k].audio !== audio && !cards[k].audio.paused) cards[k].audio.pause(); });
        });
        wavBtn.onclick = function () { if (c.wav) download(c.wav, c.wav.name, 'audio/wav', wavBtn); };
        mp3Btn.onclick = function () { if (c.mp3) download(c.mp3, c.mp3.name, 'audio/mpeg', mp3Btn); };
      }
      if (!c.wav || c.wav.id !== f.id) {
        c.wav = f;
        ctx.files.url(f).then(function (u) { c.audio.src = u; if (p.autoplay && !ctx.sample) c.audio.play().catch(function () {}); });
      }
      c.mp3 = byStem[key] || null;
      c.mp3Btn.disabled = !c.mp3;
      c.mp3Btn.title = c.mp3 ? '' : 'No MP3 copy for this take (older run, or the machine cannot encode MP3)';
    });
    Object.keys(cards).forEach(function (k) {
      if (!keep[k]) { cards[k].audio.pause(); cards[k].tile.remove(); delete cards[k]; }
    });
    countEl.textContent = wavs.length ? wavs.length + ' take' + (wavs.length === 1 ? '' : 's') : '';
    ctx.status(wavs.length || ctx.sample ? '' : 'No sounds yet: press Generate sounds in the Sound Studio.');
  }
  ctx.on('update', update);
  update();
}
