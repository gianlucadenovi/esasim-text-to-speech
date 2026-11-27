// ── EsaSim block ──────────────────────────────────────────────────────
// Text to Speech Studio (ws-text-to-speech-studio) · version 2 · view, JavaScript: function render(ctx)
// Type a text, pick model, voices, GPU or CPU and the voice filters, and press Speak: starts a run with those settings and shows its live progress.
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
  var VOICES = {
    'Kokoro 82M': ['am_michael', 'am_adam', 'am_eric', 'am_liam', 'am_onyx', 'am_fenrir', 'bm_george', 'bm_lewis', 'bm_daniel', 'af_heart', 'af_bella', 'af_nicole', 'af_sarah', 'bf_emma', 'bf_isabella', 'im_nicola', 'if_sara', 'ff_siwis', 'em_alex', 'ef_dora', 'pm_alex', 'pf_dora', 'hm_omega', 'hf_alpha'],
    'Bark small': ['v2/en_speaker_0', 'v2/en_speaker_1', 'v2/en_speaker_2', 'v2/en_speaker_3', 'v2/en_speaker_4', 'v2/en_speaker_5', 'v2/en_speaker_6', 'v2/en_speaker_7', 'v2/en_speaker_8', 'v2/en_speaker_9', 'v2/it_speaker_0', 'v2/it_speaker_4', 'v2/fr_speaker_0', 'v2/de_speaker_0', 'v2/es_speaker_0'],
    'MMS-TTS': ['eng', 'ita', 'fra', 'deu', 'spa', 'por', 'nld', 'pol', 'ron', 'swe']
  };
  VOICES['Bark'] = VOICES['Bark small'];
  var DEFAULT_VOICE = { 'Kokoro 82M': 'am_michael, am_adam, bm_george', 'Bark small': 'v2/en_speaker_6, v2/en_speaker_9', 'Bark': 'v2/en_speaker_6, v2/en_speaker_9', 'MMS-TTS': 'eng' };
  var CATALOGUE = [
    ['Clean & broadcast', [['None', 'The voice as the model made it.'], ['Studio voice', 'Rumble removed, gently compressed: clear and even.'], ['Podcast', 'Close-mic podcast: tight, compressed, no room.'], ['Broadcast announcer', 'Slightly deeper, compressed, a touch of booth.'], ['Warm narrator', 'Lower and softer, for audiobooks.'], ['Whisper-soft', 'Airy and intimate.']]],
    ['Devices', [['Telephone', 'Landline call, 300-3400 Hz.'], ['Mobile call', 'Crunchy cellphone codec.'], ['AM radio', 'Narrow, saturated radio.'], ['Old radio (1940s)', 'Valve radio with hiss and crackle.'], ['Vinyl record', 'Warm record with surface crackle.'], ['Walkie-talkie', 'Two-way radio: narrow, distorted, hissy.'], ['Intercom', 'Building or ship intercom.'], ['Drive-thru speaker', 'Cheap outdoor speaker.'], ['Megaphone', 'Bullhorn outdoors.'], ['Stadium PA', 'Slap-back echo in a huge space.'], ['Space helmet', 'Astronaut radio in a helmet.']]],
    ['Spaces', [['Small room', 'A furnished room.'], ['Bathroom', 'Tiled, bright reflections.'], ['Concert hall', 'Long smooth tail.'], ['Cathedral', 'Stone nave, huge and echoing.'], ['Cave', 'Dark rock with distinct echoes.'], ['Canyon echo', 'Long repeating echo.'], ['Distant voice', 'Far away in a big space.'], ['Next room', 'Heard through a wall.'], ['Underwater', 'Muffled and wobbly.']]],
    ['Characters & sci-fi', [['Deep voice', 'Four semitones lower.'], ['Giant', 'Huge creature.'], ['Demon', 'Dark, doubled, growling.'], ['Robot', 'Classic metallic robot.'], ['Cyborg', 'Half human, half machine.'], ['Alien', 'Higher, warbling, phased.'], ['Ghost', 'Thin, trembling, endless space.'], ['Chipmunk', 'Seven semitones higher.'], ['Helium', 'Squeaky.'], ['Sci-fi computer', 'Ship\'s computer.']]],
    ['Creative & lo-fi', [['Lo-fi', 'Dull, low bit depth.'], ['8-bit arcade', 'Retro game console.'], ['Dreamy', 'Soft, wide, floating.'], ['Slow motion', 'Slowed and lowered.'], ['Fast forward', 'Faster, same pitch.'], ['Tremolo', 'Pulsing volume.'], ['Phaser sweep', 'Swirling jet phaser.']]]
  ];
  var DESC = {}, PRESETS = [];
  CATALOGUE.forEach(function (g) { g[1].forEach(function (p) { DESC[p[0]] = p[1]; PRESETS.push(p[0]); }); });
  var defaults = { text: 'Physical AI.', model: 'Kokoro 82M', voices: DEFAULT_VOICE['Kokoro 82M'], takes: 1, seed: 1, speed: 1, device: 'Auto (GPU if present)',
    preset: 'Studio voice', compare: '', tremolo_hz: 0, noise_db: 0, phaser: false, crackle: false, pitch: 0, fspeed: 1, reverb: 0, echo_ms: 0, echo_feedback: 0.3, highpass_hz: 0, lowpass_hz: 0, distortion_db: 0, robot_hz: 0, gain_db: 0, chorus: false, compress: false };
  var st = Object.assign({}, defaults, (ctx.state && ctx.state.settings) || {});
  var busy = false, msg = '';
  function opt(list) { return list.map(function (o) { return '<option>' + o + '</option>'; }).join(''); }
  function num(id, label, min, max, step) { return '<label class="viz-small">' + label + '<input class="viz-in" data-k="' + id + '" type="number" min="' + min + '" max="' + max + '" step="' + step + '" style="display:block;width:100%;box-sizing:border-box;margin-top:4px"></label>'; }
  function sel(id, label, list) { return '<label class="viz-small">' + label + '<select class="viz-in" data-k="' + id + '" style="display:block;width:100%;margin-top:4px">' + opt(list) + '</select></label>'; }
  function chk(id, label) { return '<label class="viz-small" style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-k="' + id + '">' + label + '</label>'; }
  var grid = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px';
  ctx.el.innerHTML = '<div class="viz-pad" style="display:flex;flex-direction:column;gap:12px;padding:14px;box-sizing:border-box">'
    + '<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center"><div><div style="font-size:21px;font-weight:750;letter-spacing:-.03em">Text to Speech Studio</div><div class="viz-small viz-muted">Open Hugging Face voices on your GPU or CPU, with filters on the result.</div></div><span class="viz-small viz-muted" data-o="run"></span></div>'
    + '<div class="viz-tile" style="padding:14px;display:flex;flex-direction:column;gap:10px">'
    + '<label class="viz-small"><strong>Text to speak</strong></label><textarea class="viz-in" data-k="text" rows="4" style="width:100%;box-sizing:border-box;font-size:14px;line-height:1.5;padding:10px;resize:vertical" placeholder="Exactly the words to say, e.g. Physical AI."></textarea>'
    + '<div style="' + grid + '">' + sel('model', 'Model', ['Kokoro 82M', 'Bark small', 'Bark', 'MMS-TTS'])
    + '<label class="viz-small" style="grid-column:span 2">Voices (comma-separated)<input class="viz-in" data-k="voices" list="tts-voices" style="display:block;width:100%;box-sizing:border-box;margin-top:4px"><datalist id="tts-voices"></datalist></label>'
    + sel('device', 'Run on', ['Auto (GPU if present)', 'NVIDIA GPU', 'CPU']) + '</div>'
    + '<div class="viz-small viz-muted" data-o="vhelp"></div>'
    + '<div style="' + grid + '">' + num('takes', 'Takes per voice', 1, 20, 1) + num('seed', 'First seed (0 = random)', 0, 2147483647, 1) + num('speed', 'Speaking speed', 0.5, 2, 0.05) + '</div></div>'
    + '<div class="viz-tile" style="padding:14px;display:flex;flex-direction:column;gap:10px"><strong class="viz-small">Filters on the output</strong>'
    + '<div class="viz-small viz-muted">Click a preset to use it · Ctrl/⌘-click several to compare them side by side.</div>'
    + '<div data-o="gallery" style="display:flex;flex-direction:column;gap:8px;max-height:260px;overflow:auto"></div>'
    + '<div class="viz-small" data-o="pdesc" style="padding:8px 10px;border-radius:8px;background:var(--panel-2,#90909018)"></div>'
    + '<div style="' + grid + '">' + sel('preset', 'Preset', PRESETS) + '<label class="viz-small" style="grid-column:span 2">Compare presets (optional, comma-separated)<input class="viz-in" data-k="compare" placeholder="Telephone, Robot, Cathedral" style="display:block;width:100%;box-sizing:border-box;margin-top:4px"></label></div>'
    + '<details><summary class="viz-small" style="cursor:pointer">Your own adjustments (added to the preset)</summary><div style="' + grid + ';padding-top:10px">'
    + num('pitch', 'Pitch (semitones)', -12, 12, 0.5) + num('fspeed', 'Speed, same pitch', 0.5, 2, 0.05) + num('reverb', 'Reverb 0-1', 0, 1, 0.05) + num('echo_ms', 'Echo delay (ms)', 0, 2000, 10)
    + num('echo_feedback', 'Echo feedback', 0, 0.9, 0.05) + num('highpass_hz', 'High-pass (Hz)', 0, 8000, 10) + num('lowpass_hz', 'Low-pass (Hz)', 0, 22000, 100) + num('distortion_db', 'Distortion (dB)', 0, 40, 1)
    + num('robot_hz', 'Robot ring mod (Hz)', 0, 500, 5) + num('tremolo_hz', 'Tremolo (Hz)', 0, 40, 0.5) + num('noise_db', 'Tape hiss (dB, e.g. -40)', -80, 0, 1) + num('gain_db', 'Gain (dB)', -30, 30, 1) + chk('chorus', 'Chorus') + chk('phaser', 'Phaser') + chk('crackle', 'Vinyl crackle') + chk('compress', 'Compressor') + '<button class="viz-btn" data-o="reset" type="button">Reset adjustments</button></div></details>'
    + '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button class="viz-btn primary" data-o="go" style="padding:10px 20px;font-size:14px;font-weight:650">Speak</button><button class="viz-btn" data-o="refx" title="Same speech, new filters: the takes come from the worker cache">Re-apply filters</button><span class="viz-small viz-muted" data-o="msg" aria-live="polite"></span><span class="viz-small viz-muted" style="margin-left:auto">Ctrl + Enter</span></div></div>'
    + '<div class="viz-tile" style="padding:14px;display:flex;flex-direction:column;gap:8px" aria-live="polite"><div style="display:flex;gap:12px;align-items:center"><div data-o="spin" style="width:24px;height:24px;border:3px solid var(--line,#8894a045);border-top-color:var(--accent,#2f4ae0);border-radius:50%;animation:tts-spin 1s linear infinite;display:none"></div><div style="flex:1;min-width:0"><div data-o="phase" style="font-weight:650">Ready</div><div class="viz-small viz-muted" data-o="detail">Type a text and press Speak.</div></div><span class="viz-small viz-muted" data-o="pct">0%</span></div>'
    + '<div style="height:7px;background:var(--panel-2,#90909025);border-radius:6px;overflow:hidden"><div data-o="bar" style="height:100%;width:0;background:var(--accent,#2f4ae0);transition:width .25s"></div></div><div class="viz-small viz-muted" data-o="events" style="max-height:130px;overflow:auto;display:flex;flex-direction:column;gap:3px"></div><style>@keyframes tts-spin{to{transform:rotate(360deg)}}</style></div></div>';
  function o(k) { return ctx.el.querySelector('[data-o="' + k + '"]'); }
  var inputs = ctx.el.querySelectorAll('[data-k]');
  function persist(sync) { if (ctx.saveState) ctx.saveState({ settings: st }, !!sync); }
  inputs.forEach(function (e) {
    var k = e.getAttribute('data-k');
    if (e.type === 'checkbox') e.checked = !!st[k]; else e.value = st[k] == null ? '' : st[k];
    function upd() {
      var prevModel = st.model;
      st[k] = e.type === 'checkbox' ? e.checked : e.type === 'number' ? (e.value === '' ? '' : Number(e.value)) : e.value;
      if (k === 'model' && prevModel !== st.model) { st.voices = DEFAULT_VOICE[st.model]; ctx.el.querySelector('[data-k="voices"]').value = st.voices; }
      persist(); syncVoices(); syncGallery();
    }
    e.addEventListener('input', upd); e.addEventListener('change', upd);
  });
  function syncVoices() {
    ctx.el.querySelector('#tts-voices').innerHTML = opt(VOICES[st.model] || []);
    o('vhelp').textContent = st.model === 'Kokoro 82M' ? 'Kokoro: first letter = language (a American, b British, i Italian, f French, e Spanish, p Portuguese, h Hindi), second = f female / m male. Best quality; fast even on a CPU.'
      : st.model === 'MMS-TTS' ? 'MMS-TTS: the voice is a language code (eng, ita, fra …). Light and fast; licence non-commercial.'
      : 'Bark: expressive and different on every seed; write [laughs], [sighs] or … in the text. Much faster on a GPU.';
  }
  syncVoices();
  function compareList() { return String(st.compare || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean); }
  function setField(k, v) { st[k] = v; var e = ctx.el.querySelector('[data-k="' + k + '"]'); if (e) { if (e.type === 'checkbox') e.checked = !!v; else e.value = v; } }
  function syncGallery() {
    var g = o('gallery'), cmp = compareList();
    g.replaceChildren();
    CATALOGUE.forEach(function (grp) {
      var box = document.createElement('div');
      var h = document.createElement('div'); h.className = 'viz-small viz-muted'; h.style.cssText = 'font-weight:650;margin-bottom:4px'; h.textContent = grp[0];
      var row = document.createElement('div'); row.style.cssText = 'display:flex;flex-wrap:wrap;gap:5px';
      grp[1].forEach(function (p) {
        var b = document.createElement('button'); b.type = 'button'; b.textContent = p[0]; b.title = p[1];
        var on = cmp.length ? cmp.indexOf(p[0]) >= 0 : st.preset === p[0];
        b.className = 'viz-btn' + (on ? ' primary' : ''); b.style.cssText = 'padding:4px 9px;font-size:12px';
        b.onclick = function (ev) {
          if (ev.ctrlKey || ev.metaKey) {
            var l = compareList(); if (!l.length && st.preset) l = [st.preset];
            var i = l.indexOf(p[0]); if (i >= 0) l.splice(i, 1); else l.push(p[0]);
            setField('compare', l.join(', '));
          } else { setField('preset', p[0]); setField('compare', ''); }
          persist(); syncGallery();
        };
        row.appendChild(b);
      });
      box.append(h, row); g.appendChild(box);
    });
    o('pdesc').textContent = cmp.length ? 'Comparing ' + cmp.length + ' presets: ' + cmp.join(' · ') : st.preset + ' — ' + (DESC[st.preset] || '');
  }
  syncGallery();
  o('reset').addEventListener('click', function () {
    ['pitch', 'reverb', 'echo_ms', 'highpass_hz', 'lowpass_hz', 'distortion_db', 'robot_hz', 'tremolo_hz', 'noise_db', 'gain_db'].forEach(function (k) { setField(k, 0); });
    setField('fspeed', 1); setField('echo_feedback', 0.3); ['chorus', 'phaser', 'crackle', 'compress'].forEach(function (k) { setField(k, false); });
    persist();
  });
  function params(withTts) {
    var tts = { text: String(st.text || '').trim(), model: st.model, voices: String(st.voices || ''), takes: Math.max(1, Math.floor(+st.takes || 1)), seed: Math.max(0, Math.floor(+st.seed || 0)), speed: +st.speed || 1, device: st.device, use_cache: true };
    var fx = { preset: st.preset, compare: String(st.compare || ''), pitch: +st.pitch || 0, speed: +st.fspeed || 1, reverb: +st.reverb || 0, echo_ms: +st.echo_ms || 0, echo_feedback: +st.echo_feedback || 0, highpass_hz: +st.highpass_hz || 0, lowpass_hz: +st.lowpass_hz || 0, distortion_db: +st.distortion_db || 0, robot_hz: +st.robot_hz || 0, tremolo_hz: +st.tremolo_hz || 0, noise_db: +st.noise_db || 0, gain_db: +st.gain_db || 0, chorus: !!st.chorus, phaser: !!st.phaser, crackle: !!st.crackle, compress: !!st.compress };
    var out = {}; out[TTS] = tts; out[FX] = fx; return out;
  }
  function start() {
    if (busy || (ctx.run && ctx.run.active)) return;
    if (!String(st.text || '').trim()) { msg = 'Type the text to speak.'; refresh(); return; }
    persist(true); busy = true; msg = ''; refresh();
    ctx.run({ params: params(true) }).then(function () { busy = false; refresh(); }, function (e) { busy = false; msg = e && e.message ? e.message : 'Could not start the run.'; refresh(); });
  }
  o('go').addEventListener('click', start);
  o('refx').addEventListener('click', start);
  ctx.el.querySelector('[data-k="text"]').addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); start(); } });
  function refresh() {
    var active = !!(busy || (ctx.run && ctx.run.active));
    o('go').disabled = active; o('refx').disabled = active;
    o('run').textContent = ctx.run && ctx.run.id ? 'Run #' + ctx.run.id + ' · ' + (ctx.run.status || '') : '';
    o('msg').textContent = busy ? 'Starting…' : msg || (active ? 'Working — the takes appear in the player.' : '');
    var items = [];
    var inp = ctx.input('status') || { stream: [] };
    (inp.stream || []).forEach(function (it) { if (it.channel === 'studio_status' && it.data && typeof it.data === 'object') items.push(it.data); });
    var last = items.length ? items[items.length - 1] : null;
    var pct = 0;
    if (last) pct = last.block === 'fx' ? 90 + 0.1 * (+last.percent || 0) : 0.9 * (+last.percent || 0);
    var failed = !active && ctx.run && ['failed', 'canceled', 'lost'].indexOf(ctx.run.status) >= 0;
    var done = !active && ctx.run && ctx.run.status === 'succeeded';
    if (done) pct = 100;
    o('spin').style.display = active ? 'block' : 'none';
    o('phase').textContent = failed ? 'Run ' + ctx.run.status : done ? 'Done — listen in the player' : active ? (last && last.block === 'fx' ? 'Applying filters' : 'Speaking') : 'Ready';
    o('detail').textContent = failed ? 'Open the run log for the error.' : last ? last.message : (active ? 'Waiting for the worker…' : 'Type a text and press Speak.');
    o('bar').style.width = Math.round(pct) + '%'; o('pct').textContent = Math.round(pct) + '%';
    o('events').replaceChildren.apply(o('events'), items.slice(-8).reverse().map(function (d) { var x = document.createElement('div'); x.textContent = '• ' + d.message; return x; }));
  }
  ctx.on('update', refresh);
  ctx.on('run', function () { msg = ''; refresh(); });
  refresh();
}
