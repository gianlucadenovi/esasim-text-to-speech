# ── EsaSim block ──────────────────────────────────────────────────────
# Voice filters (ws-voice-filters) · version 4 · worker block, Python: def run(ctx)
# Voice effects on audio files: 43 presets in 5 groups (broadcast, devices, spaces, characters & sci-fi, creative) plus EQ, pitch, speed, reverb, echo, distortion, phaser, tremolo, hiss, crackle and fad
# Workspace: Gianluca De Novi's workspace · Author: Gianluca De Novi
# Saved: 2026-11-27
#
# Inputs   ctx.inputs["id"] is a list of files: .path .name .size .read_text() .read_json()
#   audio       Files (wav, flac, ogg)    Audio (WAV) · several
# Outputs  ctx.output("id", "name.ext") is the path to write; ctx.write_json / ctx.write_text
#   filtered    Files (wav)               Filtered (WAV)
#   mp3         Files (mp3)               MP3 copies
#   table       Table (csv)               Filter chain
#   telemetry   Live telemetry            ctx.telemetry("channel", data) while it runs
# Settings ctx.params["key"]
#   preset      select    Preset = "Studio voice" of None | Studio voice | Podcast | Broadcast announcer | Warm narrator | Wh…
#   compare     text      Compare presets (comma-separated, optional) = ""
#   gain_db     number    Gain (dB) = 0
#   highpass_hz number    High-pass (Hz, 0 = off) = 0
#   lowpass_hz  number    Low-pass (Hz, 0 = off) = 0
#   pitch       number    Pitch (semitones) = 0
#   speed       number    Speed (keeps the pitch) = 1
#   reverb      number    Reverb (0-1) = 0
#   echo_ms     number    Echo delay (ms, 0 = off) = 0
#   echo_feedback number    Echo feedback (0-0.9) = 0.3
#   distortion_db number    Distortion drive (dB, 0 = off) = 0
#   robot_hz    number    Robot ring modulation (Hz, 0 = off) = 0
#   tremolo_hz  number    Tremolo (Hz, 0 = off) = 0
#   noise_db    number    Tape hiss (dB below the voice, 0 = off) = 0
#   chorus      bool      Chorus = false
#   phaser      bool      Phaser = false
#   crackle     bool      Vinyl crackle = false
#   compress    bool      Compressor = false
#   trim        bool      Trim leading/trailing silence = true
#   normalize   bool      Normalize to -1 dBFS = true
#   fade_in_ms  number    Fade in (ms) = 10
#   fade_out_ms number    Fade out (ms) = 50
# Runs on  Any worker. Return a dict to fill the "result" output.
# Packages pedalboard>=0.9, soundfile>=0.12, numpy, scipy (installed by the worker with pip when missing)
# EsaSim rewrites these lines from the block's definition each time it is saved: change the definition, not them.
# ── end of EsaSim block header ────────────────────────────────────────

"""Voice filters: presets plus your own settings, applied to every input file with pedalboard (open source, CPU)."""
import csv
import os
import re

# The preset catalogue: name -> (category, what it sounds like, settings). The Studio view shows the same list.
CATALOGUE = [
    # ---- Clean & broadcast
    ("None", "Clean & broadcast", "The voice as the model made it (only trim, normalize and fades).", {}),
    ("Studio voice", "Clean & broadcast", "Rumble removed and gently compressed: clear and even.", {"highpass_hz": 80, "compress": True, "gain_db": 1}),
    ("Podcast", "Clean & broadcast", "Close-mic podcast sound: tight low end, compressed, no room.", {"highpass_hz": 90, "lowpass_hz": 14000, "compress": True, "gain_db": 2}),
    ("Broadcast announcer", "Clean & broadcast", "Slightly deeper, compressed, with a touch of booth.", {"highpass_hz": 70, "pitch": -1, "compress": True, "reverb": 0.08, "room_size": 0.2}),
    ("Warm narrator", "Clean & broadcast", "Lower and softer, for audiobooks and documentaries.", {"pitch": -2, "lowpass_hz": 9000, "compress": True}),
    ("Whisper-soft", "Clean & broadcast", "Airy and intimate: lows cut, a little room.", {"highpass_hz": 250, "reverb": 0.12, "room_size": 0.15, "compress": True}),
    # ---- Devices
    ("Telephone", "Devices", "Landline call: 300-3400 Hz band, slight grit.", {"highpass_hz": 300, "lowpass_hz": 3400, "distortion_db": 6, "compress": True}),
    ("Mobile call", "Devices", "Compressed cellphone codec: band-limited and crunchy.", {"highpass_hz": 250, "lowpass_hz": 3800, "bits": 9, "compress": True}),
    ("AM radio", "Devices", "Narrow, saturated broadcast radio.", {"highpass_hz": 500, "lowpass_hz": 4500, "distortion_db": 10, "bits": 10, "compress": True}),
    ("Old radio (1940s)", "Devices", "Vintage valve radio with hiss and crackle.", {"highpass_hz": 400, "lowpass_hz": 3200, "distortion_db": 12, "noise_db": -36, "crackle": True, "compress": True}),
    ("Vinyl record", "Devices", "Warm record with surface crackle.", {"highpass_hz": 60, "lowpass_hz": 9000, "crackle": True, "noise_db": -50}),
    ("Walkie-talkie", "Devices", "Two-way radio: very narrow, distorted, hissy.", {"highpass_hz": 700, "lowpass_hz": 3000, "distortion_db": 18, "bits": 8, "noise_db": -40, "compress": True}),
    ("Intercom", "Devices", "Building or ship intercom speaker.", {"highpass_hz": 400, "lowpass_hz": 3500, "distortion_db": 8, "reverb": 0.1, "room_size": 0.1, "noise_db": -45}),
    ("Drive-thru speaker", "Devices", "Cheap outdoor speaker, crushed and noisy.", {"highpass_hz": 600, "lowpass_hz": 3800, "distortion_db": 20, "bits": 8, "noise_db": -38}),
    ("Megaphone", "Devices", "Bullhorn: honky, driven, a little outdoor space.", {"highpass_hz": 900, "lowpass_hz": 5000, "distortion_db": 14, "reverb": 0.15, "compress": True}),
    ("Stadium PA", "Devices", "Public address in a stadium: slap-back echo and a huge space.", {"highpass_hz": 300, "lowpass_hz": 7000, "distortion_db": 6, "echo_ms": 260, "echo_feedback": 0.35, "reverb": 0.5, "room_size": 0.95}),
    ("Space helmet", "Devices", "Astronaut radio inside a helmet.", {"highpass_hz": 250, "lowpass_hz": 4000, "reverb": 0.15, "room_size": 0.05, "noise_db": -42, "compress": True}),
    # ---- Spaces
    ("Small room", "Spaces", "A furnished room.", {"reverb": 0.25, "room_size": 0.25}),
    ("Bathroom", "Spaces", "Tiled, bright, short reflections.", {"reverb": 0.45, "room_size": 0.3, "damping": 0.1}),
    ("Concert hall", "Spaces", "A large hall with a long, smooth tail.", {"reverb": 0.5, "room_size": 0.85, "damping": 0.4}),
    ("Cathedral", "Spaces", "Stone nave: huge and echoing.", {"reverb": 0.6, "room_size": 0.95, "echo_ms": 180, "echo_feedback": 0.25}),
    ("Cave", "Spaces", "Dark rock cave with distinct echoes.", {"reverb": 0.55, "room_size": 1.0, "echo_ms": 320, "echo_feedback": 0.4, "lowpass_hz": 6000}),
    ("Canyon echo", "Spaces", "Shouting across a canyon: long repeating echo.", {"echo_ms": 650, "echo_feedback": 0.55, "reverb": 0.2, "room_size": 0.6, "highpass_hz": 150}),
    ("Distant voice", "Spaces", "Someone speaking far away in a big space.", {"lowpass_hz": 2500, "reverb": 0.7, "room_size": 0.8, "highpass_hz": 200}),
    ("Next room", "Spaces", "Heard through a wall.", {"lowpass_hz": 900, "reverb": 0.2, "room_size": 0.3}),
    ("Underwater", "Spaces", "Muffled and wobbly, as if under water.", {"lowpass_hz": 600, "chorus": True, "reverb": 0.35, "pitch": -1}),
    # ---- Characters & sci-fi
    ("Deep voice", "Characters & sci-fi", "Four semitones lower, full and smooth.", {"pitch": -4, "lowpass_hz": 9000, "compress": True}),
    ("Giant", "Characters & sci-fi", "Huge, slow-sounding creature.", {"pitch": -9, "distortion_db": 6, "reverb": 0.3, "room_size": 0.7, "lowpass_hz": 6000}),
    ("Demon", "Characters & sci-fi", "Dark, doubled and growling.", {"pitch": -7, "chorus": True, "distortion_db": 10, "reverb": 0.4, "room_size": 0.9}),
    ("Robot", "Characters & sci-fi", "Classic metallic robot (ring modulation).", {"robot_hz": 55, "chorus": True, "echo_ms": 25, "echo_feedback": 0.4, "lowpass_hz": 8000}),
    ("Cyborg", "Characters & sci-fi", "Half human, half machine: phased and digitised.", {"pitch": -2, "robot_hz": 30, "phaser": True, "bits": 12, "compress": True}),
    ("Alien", "Characters & sci-fi", "Higher, warbling and phased.", {"pitch": 4, "phaser": True, "chorus": True, "tremolo_hz": 28}),
    ("Ghost", "Characters & sci-fi", "Thin, trembling voice in an endless space.", {"pitch": 2, "highpass_hz": 300, "reverb": 0.8, "room_size": 1.0, "echo_ms": 400, "echo_feedback": 0.5, "tremolo_hz": 5}),
    ("Chipmunk", "Characters & sci-fi", "Seven semitones higher.", {"pitch": 7}),
    ("Helium", "Characters & sci-fi", "Squeaky, as after breathing helium.", {"pitch": 5, "highpass_hz": 200}),
    ("Sci-fi computer", "Characters & sci-fi", "Ship's computer: clean, phased, short echo.", {"phaser": True, "echo_ms": 120, "echo_feedback": 0.3, "highpass_hz": 150, "compress": True}),
    # ---- Creative & lo-fi
    ("Lo-fi", "Creative & lo-fi", "Dull, low bit depth.", {"lowpass_hz": 6000, "bits": 6, "highpass_hz": 150}),
    ("8-bit arcade", "Creative & lo-fi", "Retro game console voice.", {"bits": 4, "lowpass_hz": 5000, "highpass_hz": 200}),
    ("Dreamy", "Creative & lo-fi", "Soft, wide, floating.", {"chorus": True, "reverb": 0.6, "room_size": 0.8, "echo_ms": 350, "echo_feedback": 0.3, "lowpass_hz": 7000}),
    ("Slow motion", "Creative & lo-fi", "Slowed down and lowered, with space.", {"speed": 0.7, "pitch": -3, "reverb": 0.3}),
    ("Fast forward", "Creative & lo-fi", "Faster, same pitch.", {"speed": 1.5}),
    ("Tremolo", "Creative & lo-fi", "Pulsing volume.", {"tremolo_hz": 6}),
    ("Phaser sweep", "Creative & lo-fi", "Swirling jet-like phaser.", {"phaser": True}),
]
PRESETS = {name: settings for name, _cat, _desc, settings in CATALOGUE}
DEFAULTS = {"gain_db": 0, "highpass_hz": 0, "lowpass_hz": 0, "pitch": 0, "speed": 1, "reverb": 0, "room_size": 0.5,
            "damping": 0.5, "echo_ms": 0, "echo_feedback": 0.3, "distortion_db": 0, "robot_hz": 0, "bits": 0,
            "chorus": False, "phaser": False, "tremolo_hz": 0, "noise_db": 0, "crackle": False, "compress": False}
PRESET_ONLY = ("room_size", "bits", "damping")


def settings_for(preset, p):
    """The preset's values, with every setting the person moved away from its default on top."""
    s = dict(DEFAULTS)
    s.update(PRESETS.get(preset, {}))
    for k, d in DEFAULTS.items():
        if k in p and p[k] is not None and k not in PRESET_ONLY:
            v = type(d)(p[k]) if not isinstance(d, bool) else bool(p[k])
            if v != d:
                if k == "pitch":
                    s[k] = s[k] + v                       # pitch adds to the preset's
                elif k == "gain_db":
                    s[k] = s[k] + v
                else:
                    s[k] = v
    return s


def run(ctx):
    import numpy as np
    import soundfile as sf
    import pedalboard as pb

    p = ctx.params
    files = [f for f in ctx.inputs.get("audio", []) if re.search(r"\.(wav|flac|ogg)$", f.name, re.I)]
    if not files:
        raise ValueError("No audio files on the input.")
    names = [x.strip() for x in str(p.get("compare") or "").split(",") if x.strip()]
    for n in names:
        if n not in PRESETS:
            raise ValueError("Unknown preset %r. Presets: %s." % (n, ", ".join(PRESETS)))
    presets = names or [str(p.get("preset") or "None")]
    multi = len(presets) > 1
    rows, mp3_ok = [], True
    total = len(files) * len(presets)

    for fi, f in enumerate(sorted(files, key=lambda x: x.name)):
        audio, rate = sf.read(f.path, dtype="float32", always_2d=True)   # (samples, channels)
        x0 = audio.T.copy()                                              # (channels, samples)
        if p.get("trim", True) and x0.size:
            env = np.abs(x0).max(axis=0)
            thr = max(1e-4, env.max() * 10 ** (-45 / 20))
            idx = np.where(env > thr)[0]
            if idx.size:
                pad = int(0.05 * rate)
                x0 = x0[:, max(0, idx[0] - pad): idx[-1] + pad]
        for pi, preset in enumerate(presets):
            s = settings_for(preset, p)
            x = x0.copy()
            chain = []
            if abs(s["speed"] - 1) > 1e-3:
                try:
                    x = pb.time_stretch(x, rate, stretch_factor=float(s["speed"]))
                    if x.ndim == 1:
                        x = x[None, :]
                    chain.append("speed x%g" % s["speed"])
                except Exception as exc:
                    ctx.log("Speed change unavailable in this pedalboard (%s): skipped." % str(exc)[:100])
            fx = []
            if s["pitch"]:
                fx.append(pb.PitchShift(semitones=float(s["pitch"]))); chain.append("pitch %+g st" % s["pitch"])
            if s["highpass_hz"]:
                fx.append(pb.HighpassFilter(cutoff_frequency_hz=float(s["highpass_hz"]))); chain.append("HP %g Hz" % s["highpass_hz"])
            if s["lowpass_hz"]:
                lp = min(float(s["lowpass_hz"]), rate * 0.45)
                fx.append(pb.LowpassFilter(cutoff_frequency_hz=lp)); chain.append("LP %g Hz" % lp)
            if fx:
                x = pb.Pedalboard(fx)(x, rate)
            if s["robot_hz"]:
                t = np.arange(x.shape[1], dtype=np.float32) / rate
                x = x * np.sin(2 * np.pi * float(s["robot_hz"]) * t)[None, :]
                chain.append("ring mod %g Hz" % s["robot_hz"])
            if s["tremolo_hz"]:
                t = np.arange(x.shape[1], dtype=np.float32) / rate
                x = x * (0.65 + 0.35 * np.sin(2 * np.pi * float(s["tremolo_hz"]) * t))[None, :]
                chain.append("tremolo %g Hz" % s["tremolo_hz"])
            fx = []
            if s["distortion_db"]:
                fx.append(pb.Distortion(drive_db=float(s["distortion_db"]))); chain.append("drive %g dB" % s["distortion_db"])
            if s["bits"]:
                fx.append(pb.Bitcrush(bit_depth=float(s["bits"]))); chain.append("%g-bit" % s["bits"])
            if s["chorus"]:
                fx.append(pb.Chorus(rate_hz=1.2, depth=0.3, mix=0.4)); chain.append("chorus")
            if s["phaser"]:
                fx.append(pb.Phaser(rate_hz=0.6, depth=0.7, feedback=0.4, mix=0.6)); chain.append("phaser")
            if s["echo_ms"]:
                fx.append(pb.Delay(delay_seconds=float(s["echo_ms"]) / 1000, feedback=float(s["echo_feedback"]), mix=0.35))
                chain.append("echo %g ms fb %g" % (s["echo_ms"], s["echo_feedback"]))
            if s["reverb"]:
                r = float(s["reverb"])
                fx.append(pb.Reverb(room_size=float(s["room_size"]), wet_level=r, dry_level=1 - 0.5 * r, damping=float(s["damping"])))
                chain.append("reverb %g" % r)
            if s["compress"]:
                fx.append(pb.Compressor(threshold_db=-18, ratio=3.5, attack_ms=5, release_ms=120)); chain.append("compressor")
            if s["gain_db"]:
                fx.append(pb.Gain(gain_db=float(s["gain_db"]))); chain.append("gain %+g dB" % s["gain_db"])
            if fx:
                # a reverb or echo tail: give it room before the chain runs
                tail = int(rate * (1.5 * float(s["reverb"]) + (float(s["echo_ms"]) / 1000 * 4 if s["echo_ms"] else 0)))
                if tail:
                    x = np.concatenate([x, np.zeros((x.shape[0], tail), np.float32)], axis=1)
                x = pb.Pedalboard(fx)(x, rate)
            if s["noise_db"] or s["crackle"]:
                rng = np.random.default_rng(12345)
                ref = float(np.abs(x).max()) or 1.0
                if s["noise_db"]:
                    hiss = rng.standard_normal(x.shape[1]).astype(np.float32) * ref * 10 ** (float(s["noise_db"]) / 20)
                    x = x + hiss[None, :]
                    chain.append("hiss %g dB" % s["noise_db"])
                if s["crackle"]:
                    pops = np.zeros(x.shape[1], np.float32)
                    k = max(1, int(x.shape[1] / rate * 18))           # about 18 pops a second
                    pos = rng.integers(0, x.shape[1], k)
                    pops[pos] = rng.uniform(-1, 1, k).astype(np.float32) * ref * 0.25
                    x = x + pops[None, :]
                    chain.append("crackle")
            x = np.nan_to_num(x.astype(np.float32))
            if p.get("normalize", True):
                peak = float(np.abs(x).max()) if x.size else 0
                if peak > 0:
                    x *= 0.89 / peak
                chain.append("normalize")
            else:
                x = np.clip(x, -1, 1)
            n = x.shape[1]
            fi_n, fo_n = min(n, int(rate * float(p.get("fade_in_ms") or 0) / 1000)), min(n, int(rate * float(p.get("fade_out_ms") or 0) / 1000))
            if fi_n:
                x[:, :fi_n] *= np.linspace(0, 1, fi_n, dtype=np.float32)
            if fo_n:
                x[:, n - fo_n:] *= np.linspace(1, 0, fo_n, dtype=np.float32)
            stem = os.path.splitext(f.name)[0]
            tag = re.sub(r"[^A-Za-z0-9]+", "-", preset).strip("-").lower()
            name = "%s_fx-%s.wav" % (stem, tag) if (multi or preset != "None" or chain) else stem + ".wav"
            out = x.T
            sf.write(ctx.output("filtered", name), out, rate, subtype="PCM_16")
            if mp3_ok:
                mp3 = ctx.output("mp3", name[:-4] + ".mp3")
                try:
                    sf.write(mp3, out, rate, format="MP3")
                except Exception as exc:
                    mp3_ok = False
                    try:
                        os.remove(mp3)
                    except OSError:
                        pass
                    ctx.log("No MP3 copies on this machine (%s)." % str(exc)[:120])
            rows.append({"file": name, "source": f.name, "preset": preset, "chain": " → ".join(chain) or "(none)",
                         "seconds": round(n / rate, 2), "rate": rate})
            done = fi * len(presets) + pi + 1
            ctx.progress(100 * done / total, "Filtered %d of %d" % (done, total))
            ctx.telemetry("studio_status", {"phase": "filtering", "block": "fx", "percent": 100 * done / total,
                                            "message": "Filtered %s (%s)" % (f.name, preset)})
            ctx.log("%s: %s" % (name, " → ".join(chain) or "unchanged"))

    with open(ctx.output("table", "filters.csv"), "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)
    ctx.telemetry("studio_status", {"phase": "done", "block": "fx", "percent": 100,
                                    "message": "All %d filtered take%s are ready to play." % (len(rows), "s" * (len(rows) > 1))})
    return {"filtered": len(rows), "presets": presets}
