<!-- esasim: cover -->
![Text to Speech](assets/cover.svg)
<!-- /esasim: cover -->

<div align="center">

<!-- Banner: upload a picture named banner.png under Data › Readme pictures; it shows here. -->

# Text to Speech

**Turn text into spoken voice with open Hugging Face models (Kokoro 82M, Bark, MMS-TTS) on an NVIDIA GPU or the CPU, then shape it with filters (telephone, radio, robot, cathedral, pitch, reverb, echo…) and compare original and filtered takes.**

![type](https://img.shields.io/badge/type-ai-blue) ![language](https://img.shields.io/badge/language-Python-3776AB) ![runs on](https://img.shields.io/badge/runs%20on-CPU%20%7C%20NVIDIA-6f42c1) [![made with](https://img.shields.io/badge/made%20with-EsaSim-0b7285)](https://esacode.com/)

<!-- More badges: ![licence](https://img.shields.io/badge/licence-MIT-green) — label, value and colour, written in the address. -->

</div>

## Flows

- **1 · Speak and filter**: Text → speech takes (one per voice and seed) → voice filters → listen to original and filtered side by side, with waveforms and details.

## What you need

- A computer with the EsaSim worker (Project > Compute); it runs on any worker, faster with: NVIDIA GPU.
- Keys to paste in the blocks (kept encrypted, never saved to GitHub): **Hugging Face token** of *1 · Text to speech* (1 · Speak and filter).
- Python packages, installed by the worker the first time: `torch`, `transformers==4.47.1`, `huggingface_hub>=0.26,<1.0`, `tokenizers>=0.21,<0.22`, `kokoro>=0.9.4`, `misaki`, `soundfile>=0.12`, `numpy`, `scipy`, `accelerate`, `safetensors`, `sentencepiece`, `psutil`, `pedalboard>=0.9`.

## How to run it

1. Under **Compute**, check that a worker is available for this project.
2. Open the flow under **Blueprint** and fill in the settings listed above.
3. Press **Run**, choose the worker, and follow the run on the flow's **View** page.
4. The files it made are under **Results**; they stay on the worker until you save or download them.

## What you get

- On the **View** page: *START HERE · Text, voice, filters & Speak*, *3a · Original takes*, *3b · Filtered takes*, *4 · Waveforms (filtered)*, *5a · Takes: voice, seed, duration, device*, *5b · Filter chain of each file*.

<!-- esasim: files of the project -->

---

An [EsaSim](https://esacode.com/) project of the workspace Gianluca De Novi's workspace (ai).

### Blueprints in this repository

- [1 · Speak and filter](blueprints/1-speak-and-filter.json) · 8 blocks · version 1

### Workspace blocks it uses

- [Text to Speech Studio](blocks/ws-text-to-speech-studio) · version 2
- [Text to speech](blocks/ws-text-to-speech) · version 2
- [Voice filters](blocks/ws-voice-filters) · version 4
- [Sound takes with downloads](blocks/ws-sound-takes-with-downloads) · version 2

Keys pasted in blocks (secret settings) are not saved here. Datasets, results and the team stay in EsaSim.
