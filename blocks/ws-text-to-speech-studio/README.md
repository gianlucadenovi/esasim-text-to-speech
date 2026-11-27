# Text to Speech Studio

Type a text, pick model, voices, GPU or CPU and the voice filters, and press Speak: starts a run with those settings and shows its live progress.

Wire the Live telemetry of the Text to speech block (node id tts) and of the Voice filters block (node id fx) into Live progress. The button starts a run with the settings typed here. 'Re-apply filters' reruns with the same speech settings: the takes come from the worker's cache, so only the filters are computed again.

An [EsaSim](https://esacode.com/) blueprint block: a view that draws in the browser, in JavaScript (`frontend.js`, `function render(ctx)`).

| | |
|---|---|
| Block | `ws-text-to-speech-studio` · version 2 |
| Workspace | Gianluca De Novi's workspace |
| Author | Gianluca De Novi |

## Inputs

| Port | Type | Description |
|---|---|---|
| `status` Live progress | Live telemetry | Several connections. Optional. |

## Settings

| Key | Type | Default | Description |
|---|---|---|---|
| `tts_node` Text to speech node id | text | `"tts"` |  |
| `fx_node` Voice filters node id | text | `"fx"` |  |

## Use it in EsaSim

In a workspace, open **Projects > Blocks > New block**, choose this kind of block, copy the ports and settings above and paste the code; or ask an AI assistant connected to EsaSim (MCP) to create it from this folder.
