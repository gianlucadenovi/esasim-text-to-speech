# ── EsaSim block ──────────────────────────────────────────────────────
# Text to speech (ws-text-to-speech) · version 2 · worker block, Python: def run(ctx)
# Speak a text with open Hugging Face TTS models (Kokoro, Bark, MMS) on an NVIDIA GPU or the CPU: one WAV + MP3 per voice and seed.
# Workspace: Gianluca De Novi's workspace · Author: Gianluca De Novi
# Saved: 2026-11-27
#
# Inputs   ctx.inputs["id"] is a list of files: .path .name .size .read_text() .read_json()
#   (none)
# Outputs  ctx.output("id", "name.ext") is the path to write; ctx.write_json / ctx.write_text
#   speech      Files (wav)               Speech (WAV)
#   mp3         Files (mp3)               MP3 copies
#   table       Table (csv)               Takes
#   metadata    Files (json)              Manifest
#   telemetry   Live telemetry            ctx.telemetry("channel", data) while it runs
# Settings ctx.params["key"]
#   text        textarea  Text to speak = "Physical AI."
#   model       select    Model = "Kokoro 82M" of Kokoro 82M | Bark small | Bark | MMS-TTS
#   voices      text      Voices (comma-separated) = "am_michael, am_adam, bm_george"
#   takes       number    Takes per voice = 1
#   seed        number    First seed (0 = random) = 1
#   speed       number    Speaking speed = 1
#   device      select    Run on = "Auto (GPU if present)" of Auto (GPU if present) | NVIDIA GPU | CPU
#   use_cache   bool      Reuse takes already made with the same settings = true
#   token       secret    Hugging Face token = (environment variable ESASIM_SECRET_TOKEN)
# Runs on  Any worker, NVIDIA GPU. Return a dict to fill the "result" output.
# Packages torch[cuda], transformers==4.47.1, huggingface_hub>=0.26,<1.0, tokenizers>=0.21,<0.22, kokoro>=0.9.4, misaki[en]>=0.9.4, soundfile>=0.12, numpy, scipy, accelerate, safetensors, sentencepiece, psutil (installed by the worker with pip when missing)
# EsaSim rewrites these lines from the block's definition each time it is saved: change the definition, not them.
# ── end of EsaSim block header ────────────────────────────────────────

"""Text to speech with open Hugging Face models, on an NVIDIA GPU or the CPU.

Kokoro 82M (hexgrad/Kokoro-82M, Apache-2.0)  - the kokoro package, 24 kHz, many English voices + it/fr/es/pt/hi
Bark small / Bark (suno/bark-small, suno/bark, MIT) - transformers BarkModel, 24 kHz, expressive, seed-dependent
MMS-TTS (facebook/mms-tts-<lang>, CC-BY-NC 4.0)  - transformers VitsModel, 16 kHz, 1,100+ languages

transformers is pinned to the same version as the Text to sound effects block, since both share the worker's Python.
"""
import csv
import hashlib
import json
import os
import random
import re
import shutil
import time

MODELS = {
    "Kokoro 82M": ("hexgrad/Kokoro-82M", "kokoro", "am_michael"),
    "Bark small": ("suno/bark-small", "bark", "v2/en_speaker_6"),
    "Bark": ("suno/bark", "bark", "v2/en_speaker_6"),
    "MMS-TTS": ("facebook/mms-tts-{voice}", "mms", "eng"),
}
KOKORO_LANGS = {"a": "American English", "b": "British English", "e": "Spanish", "f": "French", "h": "Hindi",
                "i": "Italian", "p": "Portuguese (Brazil)", "j": "Japanese", "z": "Mandarin Chinese"}


def data_dir(sub):
    base = os.environ.get("ESASIM_DATA_DIR")
    if not base:
        here = os.path.abspath(os.getcwd())
        jobs = os.path.dirname(os.path.dirname(here))
        base = os.path.dirname(jobs) if os.path.basename(jobs) == "jobs" else here
    if "onedrive" in base.lower():          # OneDrive placeholders cannot be read by a service account
        base = os.path.join(os.path.expanduser("~"), ".cache", "esasim")
    d = os.path.join(base, "cache", sub)
    os.makedirs(d, exist_ok=True)
    return d


def sentences(text, limit):
    """Split into chunks of whole sentences of at most ~limit characters."""
    parts = [s.strip() for s in re.split(r"(?<=[.!?;:…])\s+|\n+", text) if s.strip()]
    out, cur = [], ""
    for s in parts:
        if cur and len(cur) + 1 + len(s) > limit:
            out.append(cur)
            cur = s
        else:
            cur = (cur + " " + s).strip()
    if cur:
        out.append(cur)
    return out or [text]


def run(ctx):
    p = ctx.params
    os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
    os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")
    os.environ.setdefault("TRANSFORMERS_VERBOSITY", "error")
    hf = data_dir("huggingface")
    if "onedrive" not in hf.lower():
        os.environ.setdefault("HF_HOME", hf)
    import warnings
    warnings.filterwarnings("ignore")
    import numpy as np
    import soundfile as sf

    def status(phase, message, pct=None, **extra):
        if pct is not None:
            ctx.progress(int(pct), message)
        d = {"phase": phase, "message": message, "percent": int(pct or 0), "block": "tts"}
        d.update(extra)
        ctx.telemetry("studio_status", d)
        ctx.log("[tts] " + message)

    text = str(p.get("text") or "").strip()
    if not text:
        raise ValueError("Enter the text to speak.")
    preset = str(p.get("model") or "Kokoro 82M")
    if preset not in MODELS:
        raise ValueError("Unknown model %r." % preset)
    repo_tpl, family, default_voice = MODELS[preset]
    voices = [v.strip() for v in str(p.get("voices") or "").split(",") if v.strip()] or [default_voice]
    takes = max(1, min(20, int(p.get("takes") or 1)))
    seed0 = int(p.get("seed") or 0) or random.SystemRandom().randint(1, 2 ** 30)
    speed = max(0.5, min(2.0, float(p.get("speed") or 1.0)))
    want = str(p.get("device") or "Auto")
    use_cache = bool(p.get("use_cache", True))
    token = None
    if p.get("token_env"):
        token = os.environ.get(str(p["token_env"])) or None
    token = token or os.environ.get("HF_TOKEN") or None

    if family == "kokoro":
        for v in voices:
            if v[:1] not in KOKORO_LANGS or v[1:2] not in ("f", "m") or v[2:3] != "_":
                raise ValueError("%r is not a Kokoro voice: use names like am_michael, af_heart, bm_george, if_sara." % v)
            if v[0] in "jz":
                raise ValueError("Japanese and Chinese Kokoro voices need extra language packs: use an English, Italian, "
                                 "French, Spanish, Portuguese or Hindi voice.")
    if family == "bark":
        for v in voices:
            if not re.match(r"^(v2/)?[a-z]{2}_speaker_\d$", v):
                raise ValueError("%r is not a Bark voice: use v2/en_speaker_0 … v2/en_speaker_9 (or v2/it_speaker_0 …)." % v)
    if family == "mms":
        for v in voices:
            if not re.match(r"^[a-z]{3}$", v):
                raise ValueError("%r is not an ISO 639-3 language code for MMS-TTS (eng, ita, fra, deu, spa …)." % v)

    # ---- the plan: one take per voice and seed; takes already made come from the cache
    cache = data_dir("tts-takes")
    plan = []
    for v in voices:
        for k in range(takes):
            seed = seed0 + k
            key = json.dumps([preset, v, text, round(speed, 3), seed if family != "kokoro" else 0], ensure_ascii=False)
            h = hashlib.sha1(key.encode("utf-8")).hexdigest()[:16]
            safe = re.sub(r"[^A-Za-z0-9]+", "-", v).strip("-")
            name = "speech_%02d_%s_seed%d.wav" % (len(plan) + 1, safe, seed)
            plan.append({"voice": v, "seed": seed, "hash": h, "name": name,
                         "cached": use_cache and os.path.exists(os.path.join(cache, h + ".wav"))})
    todo = [t for t in plan if not t["cached"]]
    status("preparing", "%d take%s planned (%d from the cache)." % (len(plan), "s" * (len(plan) > 1), len(plan) - len(todo)), 1)

    where, device, loaded = "cache", "cpu", 0.0
    versions = {}
    if todo:
        import torch
        import transformers
        versions = {"torch": torch.__version__, "transformers": transformers.__version__}
        if torch.cuda.is_available() and not want.startswith("CPU"):
            device, where = "cuda", torch.cuda.get_device_name(0)
        else:
            why = ""
            try:
                torch.cuda.init()
            except Exception as exc:
                why = str(exc).splitlines()[0][:200]
            ctx.log("GPU check: torch CUDA build %s, devices seen %d%s" % (torch.version.cuda, torch.cuda.device_count(),
                    (", " + why) if why else ""))
            if want.startswith("NVIDIA"):
                raise RuntimeError("No usable NVIDIA GPU on this worker (torch %s). Choose CPU or Auto." % torch.__version__)
            threads = max(1, min(8, (os.cpu_count() or 4) // 2))
            torch.set_num_threads(threads)
            try:
                import psutil
                psutil.Process().nice(psutil.BELOW_NORMAL_PRIORITY_CLASS if os.name == "nt" else 10)
            except Exception:
                pass
            where = "CPU (%d threads)" % threads
        ctx.log("torch %s, transformers %s, device %s" % (torch.__version__, transformers.__version__, where))

        t_load = time.monotonic()
        status("loading", "Loading %s on %s (the first time downloads it)…" % (preset, where), 3)
        engines = {}

        if family == "kokoro":
            import kokoro
            from kokoro import KPipeline, KModel
            versions["kokoro"] = getattr(kokoro, "__version__", "?")
            model = KModel(repo_id=repo_tpl).to(device).eval()

            def engine_for(v):
                lang = v[0]
                if lang not in engines:
                    engines[lang] = KPipeline(lang_code=lang, repo_id=repo_tpl, model=model)
                return engines[lang]

            def synth(v, seed):
                pipe = engine_for(v)
                chunks = []
                for res in pipe(text, voice=v, speed=speed, split_pattern=r"\n+"):
                    a = res.audio if hasattr(res, "audio") else res[2]
                    if a is not None:
                        chunks.append(a.detach().float().cpu().numpy() if hasattr(a, "detach") else np.asarray(a))
                if not chunks:
                    raise RuntimeError("Kokoro produced no audio for voice %s." % v)
                return np.concatenate(chunks), 24000

        elif family == "bark":
            from transformers import AutoProcessor, BarkModel
            dtype = torch.float16 if device == "cuda" else torch.float32
            processor = AutoProcessor.from_pretrained(repo_tpl, token=token)
            model = BarkModel.from_pretrained(repo_tpl, torch_dtype=dtype, token=token).to(device).eval()
            rate = int(model.generation_config.sample_rate)

            def synth(v, seed):
                preset_v = v if v.startswith("v2/") else "v2/" + v
                out, gap = [], np.zeros(int(0.2 * rate), np.float32)
                for i, chunk in enumerate(sentences(text, 180)):
                    torch.manual_seed(seed * 1000 + i)
                    inputs = processor(chunk, voice_preset=preset_v).to(device)
                    with torch.inference_mode():
                        a = model.generate(**inputs, do_sample=True, pad_token_id=processor.tokenizer.pad_token_id)
                    out += [a[0].float().cpu().numpy(), gap]
                return np.concatenate(out[:-1]), rate

        else:  # mms
            from transformers import VitsModel, AutoTokenizer

            def synth(v, seed):
                if v not in engines:
                    repo = repo_tpl.format(voice=v)
                    try:
                        tok = AutoTokenizer.from_pretrained(repo, token=token)
                        m = VitsModel.from_pretrained(repo, token=token).to(device).eval()
                    except OSError:
                        raise ValueError("No MMS-TTS model for language %r (%s)." % (v, repo)) from None
                    engines[v] = (tok, m)
                tok, m = engines[v]
                m.speaking_rate = speed
                rate = int(m.config.sampling_rate)
                out, gap = [], np.zeros(int(0.15 * rate), np.float32)
                for i, chunk in enumerate(sentences(text, 300)):
                    torch.manual_seed(seed * 1000 + i)
                    ids = tok(chunk, return_tensors="pt").to(device)
                    if ids["input_ids"].shape[-1] == 0:
                        continue
                    with torch.inference_mode():
                        a = m(**ids).waveform[0]
                    out += [a.float().cpu().numpy(), gap]
                if not out:
                    raise ValueError("MMS-TTS (%s) could not read this text: it may need another script (uroman)." % v)
                return np.concatenate(out[:-1]), rate

        loaded = round(time.monotonic() - t_load, 1)
        status("model_ready", "%s ready on %s in %.0f s." % (preset, where, loaded), 8)

        for n, t in enumerate(todo):
            status("generating", "Speaking take %d of %d — voice %s, seed %d…" % (n + 1, len(todo), t["voice"], t["seed"]),
                   8 + 88 * n / len(todo), current=n + 1, total=len(todo))
            t0 = time.monotonic()
            audio, rate = synth(t["voice"], t["seed"])
            audio = np.nan_to_num(np.asarray(audio, np.float32).reshape(-1))
            peak = float(np.abs(audio).max()) if audio.size else 0.0
            if peak > 0:
                audio = audio * (0.89 / peak)                       # -1 dBFS
            sf.write(os.path.join(cache, t["hash"] + ".wav"), audio, rate, subtype="PCM_16")
            t["made_in_s"] = round(time.monotonic() - t0, 1)
            ctx.log("%s: %.1f s of speech in %.1f s" % (t["name"], len(audio) / rate, t["made_in_s"]))
            if device == "cuda":
                torch.cuda.empty_cache()

    # ---- outputs (from the cache, so cached and new takes are treated the same)
    rows, mp3_ok = [], True
    for t in plan:
        src = os.path.join(cache, t["hash"] + ".wav")
        dst = ctx.output("speech", t["name"])
        shutil.copyfile(src, dst)
        audio, rate = sf.read(src, dtype="float32")
        if mp3_ok:
            mp3 = ctx.output("mp3", t["name"][:-4] + ".mp3")
            try:
                sf.write(mp3, audio, rate, format="MP3")
            except Exception as exc:
                mp3_ok = False
                try:
                    os.remove(mp3)
                except OSError:
                    pass
                ctx.log("No MP3 copies on this machine (%s): WAV only." % str(exc)[:120])
        rows.append({"take": len(rows) + 1, "file": t["name"], "model": preset, "voice": t["voice"], "seed": t["seed"],
                     "speed": speed, "seconds": round(len(audio) / rate, 2), "rate": rate,
                     "from_cache": "yes" if t["cached"] else "no", "made_in_s": t.get("made_in_s", 0), "device": where})
    with open(ctx.output("table", "takes.csv"), "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)
    ctx.write_json("metadata", "speech.json", {
        "model": preset, "repo": repo_tpl, "text": text, "voices": voices, "takes_per_voice": takes, "first_seed": seed0,
        "speed": speed, "device": where, "model_load_s": loaded, "versions": versions, "takes": rows,
        "license_note": "Kokoro: Apache-2.0 · Bark: MIT · MMS-TTS: CC-BY-NC-4.0 (non-commercial)."})
    status("tts_done", "%d take%s of speech ready." % (len(rows), "s" * (len(rows) > 1)), 100)
    return {"takes": len(rows), "model": preset, "device": where}
