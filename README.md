<!-- esasim: cover -->
![Text to Speech](assets/cover.svg)
<!-- /esasim: cover -->

# Text to Speech

Turn text into a spoken voice with open-source Hugging Face models, on an NVIDIA GPU or any CPU, then shape the result with voice filters.

## How to use
1. Open flow **1 · Speak and filter** and its View.
2. In **START HERE · Text to Speech Studio**, type exactly the words to say, then pick a model, one or more voices, and *Run on* (Auto, NVIDIA GPU or CPU).
3. Click a filter preset (Ctrl/⌘-click several to compare them side by side). You can also open *Your own adjustments* to add pitch, speed, reverb, echo, EQ, distortion, ring modulation, tremolo, hiss, chorus, phaser, crackle or compression on top.
4. Press **Speak**. Listen to and download the takes in **3a · Original** and **3b · Filtered**. Panels 4 and 5 show the waveforms, the voice/seed/device of each take and the filter chain applied to each file.
5. **Re-apply filters** reruns with new filter settings. The speech comes from the worker's cache, so only the filters are computed again.

## Models (all open, downloaded once per machine)
| Model | Licence | Strengths | Voices |
|---|---|---|---|
| Kokoro 82M (`hexgrad/Kokoro-82M`) | Apache-2.0 | Best quality, fast even on CPU | `am_michael`, `am_adam`, `bm_george` (male) · `af_heart`, `af_bella`, `bf_emma` (female) · `im_nicola`, `if_sara` (Italian) · French, Spanish, Portuguese, Hindi |
| Bark small / Bark (`suno/bark-small`, `suno/bark`) | MIT | Expressive, different on every seed; `[laughs]`, `[sighs]`, `…` | `v2/en_speaker_0` … `v2/en_speaker_9`, `v2/it_speaker_0` … |
| MMS-TTS (`facebook/mms-tts-<lang>`) | CC-BY-NC-4.0 (non-commercial) | Light, 1,100+ languages | language codes: `eng`, `ita`, `fra`, `deu`, `spa` … |

## Filter presets (43)
- **Clean & broadcast:** None, Studio voice, Podcast, Broadcast announcer, Warm narrator, Whisper-soft
- **Devices:** Telephone, Mobile call, AM radio, Old radio (1940s), Vinyl record, Walkie-talkie, Intercom, Drive-thru speaker, Megaphone, Stadium PA, Space helmet
- **Spaces:** Small room, Bathroom, Concert hall, Cathedral, Cave, Canyon echo, Distant voice, Next room, Underwater
- **Characters & sci-fi:** Deep voice, Giant, Demon, Robot, Cyborg, Alien, Ghost, Chipmunk, Helium, Sci-fi computer
- **Creative & lo-fi:** Lo-fi, 8-bit arcade, Dreamy, Slow motion, Fast forward, Tremolo, Phaser sweep

Filters use Spotify's open-source *pedalboard* and run on any CPU.

## Notes
- This project is for **speech**. For sound effects (thunder, rain, engines) use *Text to Sound Generation*. Those models cannot say words.
- The first run on a machine installs the Python packages (~1 min) and downloads the model.

<!-- esasim: files of the project -->

---

An [EsaSim](https://esacode.com/) project of the workspace Gianluca De Novi's workspace (ai).

### Blueprints in this repository

- [1 · Speak and filter](blueprints/1-speak-and-filter.json) · 8 blocks · version 3

### Workspace blocks it uses

- [Text to Speech Studio](blocks/ws-text-to-speech-studio) · version 2
- [Text to speech](blocks/ws-text-to-speech) · version 2
- [Voice filters](blocks/ws-voice-filters) · version 4
- [Sound takes with downloads](blocks/ws-sound-takes-with-downloads) · version 2

Keys pasted in blocks (secret settings) are not saved here. Datasets, results and the team stay in EsaSim.
