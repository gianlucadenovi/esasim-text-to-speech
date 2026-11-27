// ── EsaSim block ──────────────────────────────────────────────────────
// Text to Speech Studio (ws-text-to-speech-studio) · version 3 · view, JavaScript: function render(ctx)
// Type a text, pick model, voices, GPU or CPU and the voice effects, and press Speak: starts a run with those settings and shows its live progress.
// Workspace: Gianluca De Novi's workspace · Author: Gianluca De Novi
// Saved: 2026-11-27
//
// Inputs   ctx.input("id") gives { files, stream }; ctx.rows("id"), ctx.json("id"), ctx.text("id")
//   status      Live telemetry            Live progress · several · optional
// Settings ctx.params.key
//   tts_node    text      Text to speech node id = "tts"
//   fx_node     text      Voice filters node id = "fx"
// EsaSim rewrites these lines from the block's definition each time it is saved: change the definition, not them.
// ── end of EsaSim block header ────────────────────────────────────────

function render(ctx) {
  var TTS = ctx.params.tts_node || 'tts', FX = ctx.params.fx_node || 'fx';

  // ---------- catalogues
  function nums(prefix, label) { var a = []; for (var i = 0; i < 10; i++) a.push([prefix + i, label + ' ' + i]); return a; }
  var VOICES = {
    'Kokoro 82M': [
      ['American · male', [['am_michael', 'Michael'], ['am_adam', 'Adam'], ['am_eric', 'Eric'], ['am_liam', 'Liam'], ['am_onyx', 'Onyx'], ['am_fenrir', 'Fenrir'], ['am_echo', 'Echo'], ['am_puck', 'Puck']]],
      ['American · female', [['af_heart', 'Heart'], ['af_bella', 'Bella'], ['af_nicole', 'Nicole'], ['af_sarah', 'Sarah'], ['af_sky', 'Sky'], ['af_nova', 'Nova'], ['af_jessica', 'Jessica'], ['af_river', 'River']]],
      ['British · male', [['bm_george', 'George'], ['bm_lewis', 'Lewis'], ['bm_daniel', 'Daniel'], ['bm_fable', 'Fable']]],
      ['British · female', [['bf_emma', 'Emma'], ['bf_isabella', 'Isabella'], ['bf_alice', 'Alice'], ['bf_lily', 'Lily']]],
      ['Italian', [['im_nicola', 'Nicola (m)'], ['if_sara', 'Sara (f)']]],
      ['French', [['ff_siwis', 'Siwis (f)']]],
      ['Spanish', [['em_alex', 'Alex (m)'], ['ef_dora', 'Dora (f)']]],
      ['Portuguese (BR)', [['pm_alex', 'Alex (m)'], ['pf_dora', 'Dora (f)']]],
      ['Hindi', [['hm_omega', 'Omega (m)'], ['hf_alpha', 'Alpha (f)']]]
    ],
    'Bark small': [['English', nums('v2/en_speaker_', 'Speaker')], ['Italian', nums('v2/it_speaker_', 'Speaker')], ['French', nums('v2/fr_speaker_', 'Speaker')], ['German', nums('v2/de_speaker_', 'Speaker')], ['Spanish', nums('v2/es_speaker_', 'Speaker')]],
    'MMS-TTS': [['Languages', [['eng', 'English'], ['ita', 'Italian'], ['fra', 'French'], ['deu', 'German'], ['spa', 'Spanish'], ['por', 'Portuguese'], ['nld', 'Dutch'], ['pol', 'Polish'], ['ron', 'Romanian'], ['swe', 'Swedish']]]]
  };
  VOICES['Bark'] = VOICES['Bark small'];
  var MODEL_INFO = {
    'Kokoro 82M': 'Best quality · fast on CPU · Apache-2.0',
    'Bark small': 'Expressive, new take every seed · write [laughs], [sighs] · GPU recommended · MIT',
    'Bark': 'Larger Bark: richer, slower · GPU recommended · MIT',
    'MMS-TTS': 'Light, 1,100+ languages · non-commercial licence'
  };
  var DEFAULT_VOICES = { 'Kokoro 82M': ['am_michael'], 'Bark small': ['v2/en_speaker_6'], 'Bark': ['v2/en_speaker_6'], 'MMS-TTS': ['eng'] };
  var CATALOGUE = [
    ['Clean & broadcast', [['None', 'The voice as the model made it.'], ['Studio voice', 'Rumble removed, gently compressed: clear and even.'], ['Podcast', 'Close-mic podcast: tight, compressed, no room.'], ['Broadcast announcer', 'Slightly deeper, compressed, a touch of booth.'], ['Warm narrator', 'Lower and softer, for audiobooks.'], ['Whisper-soft', 'Airy and intimate.']]],
    ['Devices', [['Telephone', 'Landline call, 300–3400 Hz.'], ['Mobile call', 'Crunchy cellphone codec.'], ['AM radio', 'Narrow, saturated radio.'], ['Old radio (1940s)', 'Valve radio with hiss and crackle.'], ['Vinyl record', 'Warm record with surface crackle.'], ['Walkie-talkie', 'Two-way radio: narrow, distorted, hissy.'], ['Intercom', 'Building or ship intercom.'], ['Drive-thru speaker', 'Cheap outdoor speaker.'], ['Megaphone', 'Bullhorn outdoors.'], ['Stadium PA', 'Slap-back echo in a huge space.'], ['Space helmet', 'Astronaut radio inside a helmet.']]],
    ['Spaces', [['Small room', 'A furnished room.'], ['Bathroom', 'Tiled, bright reflections.'], ['Concert hall', 'Long, smooth tail.'], ['Cathedral', 'Stone nave, huge and echoing.'], ['Cave', 'Dark rock with distinct echoes.'], ['Canyon echo', 'Long repeating echo.'], ['Distant voice', 'Far away in a big space.'], ['Next room', 'Heard through a wall.'], ['Underwater', 'Muffled and wobbly.']]],
    ['Characters & sci-fi', [['Deep voice', 'Four semitones lower.'], ['Giant', 'A huge creature.'], ['Demon', 'Dark, doubled, growling.'], ['Robot', 'Classic metallic robot.'], ['Cyborg', 'Half human, half machine.'], ['Alien', 'Higher, warbling, phased.'], ['Ghost', 'Thin, trembling, endless space.'], ['Chipmunk', 'Seven semitones higher.'], ['Helium', 'Squeaky.'], ['Sci-fi computer', 'A ship\'s computer.']]],
    ['Creative & lo-fi', [['Lo-fi', 'Dull, low bit depth.'], ['8-bit arcade', 'Retro game console.'], ['Dreamy', 'Soft, wide, floating.'], ['Slow motion', 'Slowed down and lowered.'], ['Fast forward', 'Faster, same pitch.'], ['Tremolo', 'Pulsing volume.'], ['Phaser sweep', 'Swirling jet phaser.']]]
  ];
  var DESC = {}, CAT_OF = {};
  CATALOGUE.forEach(function (g) { g[1].forEach(function (p) { DESC[p[0]] = p[1]; CAT_OF[p[0]] = g[0]; }); });
  var SLIDERS = [
    ['pitch', 'Pitch', -12, 12, 0.5, 0, ' st'], ['fspeed', 'Speed', 0.5, 2, 0.05, 1, '×'], ['reverb', 'Reverb', 0, 1, 0.05, 0, ''],
    ['echo_ms', 'Echo delay', 0, 1500, 10, 0, ' ms'], ['echo_feedback', 'Echo feedback', 0, 0.9, 0.05, 0.3, ''], ['highpass_hz', 'Low cut', 0, 2000, 10, 0, ' Hz'],
    ['lowpass_hz', 'High cut', 0, 16000, 100, 0, ' Hz'], ['distortion_db', 'Distortion', 0, 40, 1, 0, ' dB'], ['robot_hz', 'Robot (ring mod)', 0, 300, 5, 0, ' Hz'],
    ['tremolo_hz', 'Tremolo', 0, 30, 0.5, 0, ' Hz'], ['noise_db', 'Tape hiss', -80, 0, 1, 0, ' dB'], ['gain_db', 'Gain', -20, 20, 1, 0, ' dB']
  ];
  var TOGGLES = [['chorus', 'Chorus'], ['phaser', 'Phaser'], ['crackle', 'Vinyl crackle'], ['compress', 'Compressor']];

  // ---------- state
  var defaults = { text: 'Physical AI.', model: 'Kokoro 82M', voiceList: ['am_michael', 'am_adam', 'bm_george'], takes: 1, seed: 1, speed: 1, device: 'Auto (GPU if present)',
    category: 'Clean & broadcast', preset: 'Studio voice', compareList: [] };
  SLIDERS.forEach(function (s) { defaults[s[0]] = s[5]; });
  TOGGLES.forEach(function (t) { defaults[t[0]] = false; });
  var st = Object.assign({}, defaults, (ctx.state && ctx.state.settings) || {});
  if (!Array.isArray(st.voiceList)) st.voiceList = String(st.voices || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  if (!Array.isArray(st.compareList)) st.compareList = String(st.compare || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  if (!CAT_OF[st.preset]) st.preset = 'Studio voice';
  st.category = CAT_OF[st.preset];
  var busy = false, msg = '';
  function persist(sync) { if (ctx.saveState) ctx.saveState({ settings: st }, !!sync); }

  // ---------- layout
  var css = '<style>'
    + '.tts{display:flex;flex-direction:column;gap:14px;padding:16px;box-sizing:border-box;font-size:13px}'
    + '.tts *{box-sizing:border-box}'
    + '.tts-card{border:1px solid var(--line,#8894a033);border-radius:12px;padding:14px 16px;background:var(--panel,transparent);display:flex;flex-direction:column;gap:12px}'
    + '.tts-h{display:flex;align-items:center;gap:8px;font-weight:700;font-size:14px}'
    + '.tts-step{width:22px;height:22px;border-radius:50%;background:var(--accent,#2f4ae0);color:#fff;font-size:12px;display:inline-flex;align-items:center;justify-content:center}'
    + '.tts-sub{font-weight:400;color:var(--muted,#8894a0);font-size:12px;margin-left:auto}'
    + '.tts-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px}'
    + '.tts-f{display:flex;flex-direction:column;gap:5px;min-width:0}'
    + '.tts-f>span{font-size:12px;color:var(--muted,#8894a0);font-weight:600}'
    + '.tts select,.tts input[type=number],.tts textarea{width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--line,#8894a055);background:var(--bg,transparent);color:inherit;font:inherit}'
    + '.tts textarea{font-size:15px;line-height:1.5;resize:vertical;min-height:84px}'
    + '.tts-hint{font-size:12px;color:var(--muted,#8894a0)}'
    + '.tts-chips{display:flex;flex-wrap:wrap;gap:6px;min-height:30px;align-items:center}'
    + '.tts-chip{display:inline-flex;align-items:center;gap:6px;padding:4px 6px 4px 10px;border-radius:999px;background:var(--panel-2,#90909020);border:1px solid var(--line,#8894a033);font-size:12px}'
    + '.tts-chip button{border:0;background:transparent;color:inherit;cursor:pointer;opacity:.6;font-size:14px;line-height:1;padding:0 2px}'
    + '.tts-chip button:hover{opacity:1}'
    + '.tts-desc{padding:9px 12px;border-radius:8px;background:var(--panel-2,#90909018);font-size:12.5px;border-left:3px solid var(--accent,#2f4ae0)}'
    + '.tts details{border-top:1px solid var(--line,#8894a022);padding-top:10px}'
    + '.tts summary{cursor:pointer;font-weight:600;font-size:12.5px}'
    + '.tts-sl{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px 18px;padding-top:12px}'
    + '.tts-s{display:flex;flex-direction:column;gap:3px}'
    + '.tts-s>div{display:flex;justify-content:space-between;font-size:12px}'
    + '.tts-s b{font-weight:600;font-variant-numeric:tabular-nums}'
    + '.tts-s input{width:100%;accent-color:var(--accent,#2f4ae0)}'
    + '.tts-tg{display:flex;flex-wrap:wrap;gap:8px;padding-top:12px;align-items:center}'
    + '.tts-tg label{display:inline-flex;gap:6px;align-items:center;padding:5px 10px;border-radius:8px;border:1px solid var(--line,#8894a033);cursor:pointer;font-size:12px}'
    + '.tts-bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap}'
    + '.tts-go{padding:11px 26px!important;font-size:14px!important;font-weight:700!important;border-radius:10px!important}'
    + '.tts-prog{height:6px;background:var(--panel-2,#90909025);border-radius:6px;overflow:hidden}'
    + '.tts-prog>div{height:100%;width:0;background:var(--accent,#2f4ae0);transition:width .3s}'
    + '.tts-spin{width:18px;height:18px;border:2.5px solid var(--line,#8894a045);border-top-color:var(--accent,#2f4ae0);border-radius:50%;animation:tts-spin 1s linear infinite;display:none;flex-shrink:0}'
    + '@keyframes tts-spin{to{transform:rotate(360deg)}}'
    + '</style>';
  function field(label, inner, span) { return '<label class="tts-f"' + (span ? ' style="grid-column:span ' + span + '"' : '') + '><span>' + label + '</span>' + inner + '</label>'; }
  ctx.el.innerHTML = css + '<div class="tts">'
    + '<div style="display:flex;justify-content:space-between;align-items:flex-end;gap:10px;flex-wrap:wrap"><div><div style="font-size:22px;font-weight:800;letter-spacing:-.03em">Text to Speech Studio</div><div class="tts-hint">Open Hugging Face voices on your GPU or CPU, with effects on the result.</div></div><span class="tts-hint" data-o="run"></span></div>'
    // 1 · text & voice
    + '<div class="tts-card"><div class="tts-h"><span class="tts-step">1</span>Text &amp; voice<span class="tts-sub" data-o="minfo"></span></div>'
    + '<textarea data-k="text" placeholder="Exactly the words to say, e.g. Physical AI."></textarea><div class="tts-hint" data-o="count" style="text-align:right;margin-top:-8px"></div>'
    + '<div class="tts-row">' + field('Model', '<select data-k="model"><option>Kokoro 82M</option><option>Bark small</option><option>Bark</option><option>MMS-TTS</option></select>')
    + field('Add a voice', '<select data-o="vpick"></select>', 2)
    + field('Run on', '<select data-k="device"><option>Auto (GPU if present)</option><option>NVIDIA GPU</option><option>CPU</option></select>') + '</div>'
    + '<div class="tts-chips" data-o="vchips"></div>'
    + '<details><summary>Takes, seed &amp; speed</summary><div class="tts-row" style="padding-top:10px">'
    + field('Takes per voice', '<input type="number" data-k="takes" min="1" max="20" step="1">')
    + field('First seed (0 = random)', '<input type="number" data-k="seed" min="0" max="2147483647" step="1">')
    + '<div class="tts-s" data-sl="speed"></div></div></details></div>'
    // 2 · effects
    + '<div class="tts-card"><div class="tts-h"><span class="tts-step">2</span>Effects<span class="tts-sub">43 presets in 5 categories</span></div>'
    + '<div class="tts-row">' + field('Category', '<select data-o="cat"></select>') + field('Preset', '<select data-o="preset"></select>') + field('Compare with…', '<select data-o="cmp"></select>') + '</div>'
    + '<div class="tts-desc" data-o="pdesc"></div>'
    + '<div class="tts-chips" data-o="cchips"></div>'
    + '<details data-o="adj"><summary>Fine-tune (added on top of the preset)</summary><div class="tts-sl" data-o="sliders"></div><div class="tts-tg" data-o="toggles"></div></details></div>'
    // actions & progress
    + '<div class="tts-card"><div class="tts-bar"><button class="viz-btn primary tts-go" data-o="go">▶ Speak</button><button class="viz-btn" data-o="refx" title="Same speech, new effects: the takes come from the worker cache">Re-apply effects</button><span class="tts-hint" style="margin-left:auto">Ctrl + Enter</span></div>'
    + '<div style="display:flex;gap:10px;align-items:center"><div class="tts-spin" data-o="spin"></div><div style="flex:1;min-width:0"><div data-o="phase" style="font-weight:650">Ready</div><div class="tts-hint" data-o="detail">Type a text and press Speak.</div></div><b class="tts-hint" data-o="pct">0%</b></div>'
    + '<div class="tts-prog"><div data-o="bar"></div></div><div class="tts-hint" data-o="events" style="max-height:110px;overflow:auto;display:flex;flex-direction:column;gap:2px"></div></div>'
    + '</div>';
  function o(k) { return ctx.el.querySelector('[data-o="' + k + '"]'); }
  function k(key) { return ctx.el.querySelector('[data-k="' + key + '"]'); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ---------- plain fields
  ['text', 'model', 'device', 'takes', 'seed'].forEach(function (key) {
    var e = k(key); e.value = st[key];
    function upd() {
      var v = e.type === 'number' ? Number(e.value) : e.value;
      if (key === 'model' && v !== st.model) { st.model = v; st.voiceList = DEFAULT_VOICES[v].slice(); syncVoices(); }
      st[key] = v; persist(); if (key === 'text') syncCount();
    }
    e.addEventListener('input', upd); e.addEventListener('change', upd);
  });
  function syncCount() { var n = String(st.text || '').trim().length; o('count').textContent = n + ' character' + (n === 1 ? '' : 's'); }

  // ---------- voices: dropdown + chips
  function voiceLabel(id) {
    var found = id;
    (VOICES[st.model] || []).forEach(function (g) { g[1].forEach(function (v) { if (v[0] === id) found = v[1] + ' · ' + g[0]; }); });
    return found;
  }
  function chip(text, onRemove, title) {
    var c = document.createElement('span'); c.className = 'tts-chip'; c.title = title || '';
    var t = document.createElement('span'); t.textContent = text;
    var b = document.createElement('button'); b.type = 'button'; b.textContent = '×'; b.setAttribute('aria-label', 'Remove ' + text); b.onclick = onRemove;
    c.append(t, b); return c;
  }
  function syncVoices() {
    o('minfo').textContent = MODEL_INFO[st.model] || '';
    var html = '<option value="">＋ Choose a voice…</option>';
    (VOICES[st.model] || []).forEach(function (g) {
      html += '<optgroup label="' + esc(g[0]) + '">' + g[1].map(function (v) { return '<option value="' + esc(v[0]) + '"' + (st.voiceList.indexOf(v[0]) >= 0 ? ' disabled' : '') + '>' + esc(v[1]) + '</option>'; }).join('') + '</optgroup>';
    });
    o('vpick').innerHTML = html;
    var box = o('vchips'); box.replaceChildren();
    if (!st.voiceList.length) { var h = document.createElement('span'); h.className = 'tts-hint'; h.textContent = 'No voice chosen: the model\'s default will be used.'; box.appendChild(h); }
    st.voiceList.forEach(function (id) {
      box.appendChild(chip(voiceLabel(id), function () { st.voiceList = st.voiceList.filter(function (x) { return x !== id; }); persist(); syncVoices(); }, id));
    });
    var hint = document.createElement('span'); hint.className = 'tts-hint'; hint.style.marginLeft = 'auto';
    hint.textContent = st.voiceList.length > 1 ? st.voiceList.length + ' voices → one take each' : '';
    box.appendChild(hint);
  }
  o('vpick').addEventListener('change', function () {
    var v = o('vpick').value; if (v && st.voiceList.indexOf(v) < 0) { st.voiceList.push(v); persist(); } syncVoices();
  });

  // ---------- effects: category → preset, compare dropdown + chips
  o('cat').innerHTML = CATALOGUE.map(function (g) { return '<option>' + esc(g[0]) + '</option>'; }).join('');
  function syncPresets() {
    o('cat').value = st.category;
    var group = CATALOGUE.filter(function (g) { return g[0] === st.category; })[0] || CATALOGUE[0];
    o('preset').innerHTML = group[1].map(function (p) { return '<option>' + esc(p[0]) + '</option>'; }).join('');
    if (CAT_OF[st.preset] !== st.category) st.preset = group[1][0][0];
    o('preset').value = st.preset;
    var all = [st.preset].concat(st.compareList.filter(function (x) { return x !== st.preset; }));
    var html = '<option value="">＋ Add a preset to compare…</option>';
    CATALOGUE.forEach(function (g) {
      html += '<optgroup label="' + esc(g[0]) + '">' + g[1].map(function (p) { return '<option' + (all.indexOf(p[0]) >= 0 ? ' disabled' : '') + '>' + esc(p[0]) + '</option>'; }).join('') + '</optgroup>';
    });
    o('cmp').innerHTML = html;
    var box = o('cchips'); box.replaceChildren();
    if (st.compareList.length) {
      var lab = document.createElement('span'); lab.className = 'tts-hint'; lab.textContent = 'Comparing:'; box.appendChild(lab);
      all.forEach(function (name) {
        box.appendChild(chip(name, function () {
          if (name === st.preset) { var rest = st.compareList.filter(function (x) { return x !== name; }); st.preset = rest.shift(); st.category = CAT_OF[st.preset]; st.compareList = rest; }
          else st.compareList = st.compareList.filter(function (x) { return x !== name; });
          persist(); syncPresets();
        }, DESC[name]));
      });
      o('pdesc').textContent = (st.compareList.length + 1) + ' presets will be rendered for every take — ' + all.join(' · ');
    } else {
      o('pdesc').innerHTML = '<b>' + esc(st.preset) + '</b> — ' + esc(DESC[st.preset] || '');
    }
  }
  o('cat').addEventListener('change', function () { st.category = o('cat').value; st.preset = ''; persist(); syncPresets(); });
  o('preset').addEventListener('change', function () { st.preset = o('preset').value; st.compareList = st.compareList.filter(function (x) { return x !== st.preset; }); persist(); syncPresets(); });
  o('cmp').addEventListener('change', function () { var v = o('cmp').value; if (v && st.compareList.indexOf(v) < 0 && v !== st.preset) st.compareList.push(v); persist(); syncPresets(); });

  // ---------- sliders & toggles
  function fmt(v, unit, def) { return (v === def && def === 0 && unit !== '×') ? 'off' : (Math.round(v * 100) / 100) + unit; }
  function slider(host, s) {
    host.innerHTML = '<div><span>' + s[1] + '</span><b></b></div><input type="range" min="' + s[2] + '" max="' + s[3] + '" step="' + s[4] + '">';
    var r = host.querySelector('input'), b = host.querySelector('b');
    r.value = st[s[0]]; b.textContent = fmt(+st[s[0]], s[6], s[5]);
    r.addEventListener('input', function () { st[s[0]] = Number(r.value); b.textContent = fmt(+r.value, s[6], s[5]); persist(); syncAdjCount(); });
    r.addEventListener('dblclick', function () { st[s[0]] = s[5]; r.value = s[5]; b.textContent = fmt(s[5], s[6], s[5]); persist(); syncAdjCount(); });
    host._reset = function () { st[s[0]] = s[5]; r.value = s[5]; b.textContent = fmt(s[5], s[6], s[5]); };
  }
  slider(ctx.el.querySelector('[data-sl="speed"]'), ['speed', 'Speaking speed', 0.5, 2, 0.05, 1, '×']);
  var sliderHosts = SLIDERS.map(function (s) { var d = document.createElement('div'); d.className = 'tts-s'; slider(d, s); o('sliders').appendChild(d); return d; });
  TOGGLES.forEach(function (t) {
    var l = document.createElement('label'); l.innerHTML = '<input type="checkbox"> ' + t[1];
    var c = l.querySelector('input'); c.checked = !!st[t[0]];
    c.addEventListener('change', function () { st[t[0]] = c.checked; persist(); syncAdjCount(); });
    l._reset = function () { st[t[0]] = false; c.checked = false; };
    o('toggles').appendChild(l);
  });
  var reset = document.createElement('button'); reset.className = 'viz-btn'; reset.type = 'button'; reset.textContent = 'Reset fine-tuning'; reset.style.marginLeft = 'auto';
  reset.onclick = function () { sliderHosts.forEach(function (h) { h._reset(); }); Array.prototype.forEach.call(o('toggles').querySelectorAll('label'), function (l) { if (l._reset) l._reset(); }); persist(); syncAdjCount(); };
  o('toggles').appendChild(reset);
  function syncAdjCount() {
    var n = SLIDERS.filter(function (s) { return +st[s[0]] !== s[5]; }).length + TOGGLES.filter(function (t) { return st[t[0]]; }).length;
    o('adj').querySelector('summary').textContent = 'Fine-tune (added on top of the preset)' + (n ? ' · ' + n + ' change' + (n > 1 ? 's' : '') : '');
  }

  // ---------- run
  function params() {
    var tts = { text: String(st.text || '').trim(), model: st.model, voices: st.voiceList.join(', '), takes: Math.max(1, Math.floor(+st.takes || 1)), seed: Math.max(0, Math.floor(+st.seed || 0)), speed: +st.speed || 1, device: st.device, use_cache: true };
    var fx = { preset: st.preset, compare: st.compareList.length ? [st.preset].concat(st.compareList).join(', ') : '', speed: +st.fspeed || 1 };
    SLIDERS.forEach(function (s) { if (s[0] !== 'fspeed') fx[s[0]] = +st[s[0]] || 0; });
    fx.echo_feedback = +st.echo_feedback;
    TOGGLES.forEach(function (t) { fx[t[0]] = !!st[t[0]]; });
    var out = {}; out[TTS] = tts; out[FX] = fx; return out;
  }
  function start() {
    if (busy || (ctx.run && ctx.run.active)) return;
    if (!String(st.text || '').trim()) { msg = 'Type the text to speak.'; k('text').focus(); refresh(); return; }
    persist(true); busy = true; msg = ''; refresh();
    ctx.run({ params: params() }).then(function () { busy = false; refresh(); }, function (e) { busy = false; msg = e && e.message ? e.message : 'Could not start the run.'; refresh(); });
  }
  o('go').addEventListener('click', start);
  o('refx').addEventListener('click', start);
  k('text').addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); start(); } });

  function refresh() {
    var active = !!(busy || (ctx.run && ctx.run.active));
    o('go').disabled = active; o('refx').disabled = active;
    o('run').textContent = ctx.run && ctx.run.id ? 'Run #' + ctx.run.id + ' · ' + (ctx.run.status || '') : '';
    var items = [];
    ((ctx.input('status') || {}).stream || []).forEach(function (it) { if (it.channel === 'studio_status' && it.data && typeof it.data === 'object') items.push(it.data); });
    var last = items.length ? items[items.length - 1] : null;
    var pct = last ? (last.block === 'fx' ? 90 + 0.1 * (+last.percent || 0) : 0.9 * (+last.percent || 0)) : 0;
    var failed = !active && ctx.run && ['failed', 'canceled', 'lost'].indexOf(ctx.run.status) >= 0;
    var done = !active && ctx.run && ctx.run.status === 'succeeded';
    if (done) pct = 100;
    o('spin').style.display = active ? 'block' : 'none';
    o('phase').textContent = msg ? msg : failed ? 'Run ' + ctx.run.status : done ? '✓ Done — listen in the players' : active ? (last && last.block === 'fx' ? 'Applying effects' : 'Speaking') : 'Ready';
    o('detail').textContent = failed ? 'Open the run log for the error.' : last ? last.message : (active ? 'Waiting for the worker…' : 'Type a text and press Speak.');
    o('bar').style.width = Math.round(pct) + '%'; o('pct').textContent = Math.round(pct) + '%';
    o('events').replaceChildren.apply(o('events'), items.filter(function (d) { return d.message; }).slice(-6).reverse().map(function (d) { var x = document.createElement('div'); x.textContent = '• ' + d.message; return x; }));
  }
  ctx.on('update', refresh);
  ctx.on('run', function () { msg = ''; refresh(); });
  syncCount(); syncVoices(); syncPresets(); syncAdjCount(); refresh();
}
