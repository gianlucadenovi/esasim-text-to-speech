# Voice filters

Voice effects on audio files: 43 presets in 5 groups (broadcast, devices, spaces, characters & sci-fi, creative) plus EQ, pitch, speed, reverb, echo, distortion, phaser, tremolo, hiss, crackle and fad

Wire WAV files in. Pick a preset and add your own settings on top (pitch and gain add to the preset; the others replace its value). Order: trim → speed → pitch → high/low-pass → ring mod → tremolo → distortion → bit crush → chorus → phaser → echo → reverb → compressor → gain → hiss/crackle → normalize → fades. 'Compare presets' renders each take through several presets at once. Presets — Clean & broadcast: None, Studio voice, Podcast, Broadcast announcer, Warm narrator, Whisper-soft · Devices: Telephone, Mobile call, AM radio, Old radio (1940s), Vinyl record, Walkie-talkie, Intercom, Drive-thru speaker, Megaphone, Stadium PA, Space helmet · Spaces: Small room, Bathroom, Concert hall, Cathedral, Cave, Canyon echo, Distant voice, Next room, Underwater · Characters & sci-fi: Deep voice, Giant, Demon, Robot, Cyborg, Alien, Ghost, Chipmunk, Helium, Sci-fi computer · Creative & lo-fi: Lo-fi, 8-bit arcade, Dreamy, Slow motion, Fast forward, Tremolo, Phaser sweep.

An [EsaSim](https://esacode.com/) blueprint block: it runs on a worker, in Python (`backend.py`, `def run(ctx)`).

| | |
|---|---|
| Block | `ws-voice-filters` · version 4 |
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
| `tremolo_hz` Tremolo (Hz, 0 = off) | number | `0` |  |
| `noise_db` Tape hiss (dB below the voice, 0 = off) | number | `0` | e.g. -40 |
| `chorus` Chorus | bool | `false` |  |
| `phaser` Phaser | bool | `false` |  |
| `crackle` Vinyl crackle | bool | `false` |  |
| `compress` Compressor | bool | `false` |  |
| `trim` Trim leading/trailing silence | bool | `true` |  |
| `normalize` Normalize to -1 dBFS | bool | `true` |  |
| `fade_in_ms` Fade in (ms) | number | `10` |  |
| `fade_out_ms` Fade out (ms) | number | `50` |  |

## Use it in EsaSim

In a workspace, open **Projects > Blocks > New block**, choose this kind of block, copy the ports and settings above and paste the code; or ask an AI assistant connected to EsaSim (MCP) to create it from this folder.
