# Voice filters

Effects on audio files: presets (telephone, radio, robot, cathedral, megaphone…) plus EQ, pitch, speed, reverb, echo, distortion, compression and fades.

Wire WAV files in. Pick a preset (or None) and add your own settings on top: they are applied after the preset, in this order: trim silence → speed → pitch → high-pass / low-pass → robot (ring modulation) → distortion → bit crush → chorus → echo → reverb → compressor → gain → normalize → fades. 'Compare presets' renders each take through several presets at once (comma-separated names). Runs on any CPU (Spotify's open-source pedalboard).

An [EsaSim](https://esacode.com/) blueprint block: it runs on a worker, in Python (`backend.py`, `def run(ctx)`).

| | |
|---|---|
| Block | `ws-voice-filters` · version 2 |
| Workspace | Gianluca De Novi's workspace |
| Author | Gianluca De Novi |
| Runs on | Any worker |

## Inputs

| Port | Type | Description |
|---|---|---|
| `audio` Audio (WAV) | Files (wav, flac, ogg) | Several connections. |

## Outputs

| Port | Type | Description |
|---|---|---|
| `filtered` Filtered (WAV) | Files (wav) |  |
| `mp3` MP3 copies | Files (mp3) |  |
| `table` Filter chain | Table (csv) |  |

## Settings

| Key | Type | Default | Description |
|---|---|---|---|
| `preset` Preset | select | `"Studio voice"` |  |
| `compare` Compare presets (comma-separated, optional) | text | `""` | e.g. Telephone, Robot, Cathedral: each take is rendered with each of them (your settings below are added to each). |
| `gain_db` Gain (dB) | number | `0` |  |
| `highpass_hz` High-pass (Hz, 0 = off) | number | `0` |  |
| `lowpass_hz` Low-pass (Hz, 0 = off) | number | `0` |  |
| `pitch` Pitch (semitones) | number | `0` |  |
| `speed` Speed (keeps the pitch) | number | `1` |  |
| `reverb` Reverb (0-1) | number | `0` |  |
| `echo_ms` Echo delay (ms, 0 = off) | number | `0` |  |
| `echo_feedback` Echo feedback (0-0.9) | number | `0.3` |  |
| `distortion_db` Distortion drive (dB, 0 = off) | number | `0` |  |
| `robot_hz` Robot ring modulation (Hz, 0 = off) | number | `0` |  |
| `chorus` Chorus | bool | `false` |  |
| `compress` Compressor | bool | `false` |  |
| `trim` Trim leading/trailing silence | bool | `true` |  |
| `normalize` Normalize to -1 dBFS | bool | `true` |  |
| `fade_in_ms` Fade in (ms) | number | `10` |  |
| `fade_out_ms` Fade out (ms) | number | `50` |  |

## Use it in EsaSim

In a workspace, open **Projects > Blocks > New block**, choose this kind of block, copy the ports and settings above and paste the code; or ask an AI assistant connected to EsaSim (MCP) to create it from this folder.
