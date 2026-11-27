# Text to speech

Speak a text with open Hugging Face TTS models (Kokoro, Bark, MMS) on an NVIDIA GPU or the CPU: one WAV + MP3 per voice and seed.

Write the text to speak, pick a model and one or more voices (comma-separated). Each voice × take makes a WAV (with an MP3 copy). Kokoro 82M: best quality, fast on a CPU; voices like am_michael, am_adam, bm_george (male) or af_heart, af_bella, bf_emma (female), if_sara / im_nicola (Italian). Bark: expressive, can laugh [laughs] or hesitate (…), better on a GPU; voices v2/en_speaker_0 … v2/en_speaker_9, v2/it_speaker_0 …. MMS-TTS: light, 1,100+ languages; the voice is the ISO 639-3 language code (eng, ita, fra, deu, spa). Takes already made with the same settings are reused from the machine's cache, so changing only the filters is quick.

An [EsaSim](https://esacode.com/) blueprint block: it runs on a worker, in Python (`backend.py`, `def run(ctx)`).

| | |
|---|---|
| Block | `ws-text-to-speech` · version 1 |
| Workspace | Gianluca De Novi's workspace |
| Author | Gianluca De Novi |
| Runs on | Any worker, NVIDIA GPU |

## Outputs

| Port | Type | Description |
|---|---|---|
| `speech` Speech (WAV) | Files (wav) |  |
| `mp3` MP3 copies | Files (mp3) |  |
| `table` Takes | Table (csv) |  |
| `metadata` Manifest | Files (json) |  |

## Settings

| Key | Type | Default | Description |
|---|---|---|---|
| `text` Text to speak | textarea | `"Physical AI."` |  |
| `model` Model | select | `"Kokoro 82M"` |  |
| `voices` Voices (comma-separated) | text | `"am_michael, am_adam, bm_george"` | Kokoro: am_michael, am_adam, am_eric, bm_george, bm_lewis, af_heart, af_bella, bf_emma, if_sara, im_nicola … · Bark: v2/en_speaker_6, v2/en_speaker_9, v2/it_speaker_4 … · MMS-TTS: eng, ita, fra, deu, spa …. Empty = the model's default. |
| `takes` Takes per voice | number | `1` | Bark and MMS vary with the seed; Kokoro gives the same take for the same voice and speed. |
| `seed` First seed (0 = random) | number | `1` |  |
| `speed` Speaking speed | number | `1` | Kokoro and MMS-TTS (Bark ignores it; use the filter block's speed) |
| `device` Run on | select | `"Auto (GPU if present)"` |  |
| `use_cache` Reuse takes already made with the same settings | bool | `true` |  |
| `token` Hugging Face token | secret | (secret) | Not needed for these models; used if set (rate limits). |

## Use it in EsaSim

In a workspace, open **Projects > Blocks > New block**, choose this kind of block, copy the ports and settings above and paste the code; or ask an AI assistant connected to EsaSim (MCP) to create it from this folder.
