# Sound takes with downloads

Plays every generated take, each with its own Download WAV and Download MP3 buttons.

Connect the WAV files to Sounds and, optionally, MP3 copies with the same names to MP3. Each take gets a player, a Download WAV button and a Download MP3 button (greyed out when there is no MP3 copy).

An [EsaSim](https://esacode.com/) blueprint block: a view that draws in the browser, in JavaScript (`frontend.js`, `function render(ctx)`).

| | |
|---|---|
| Block | `ws-sound-takes-with-downloads` · version 2 |
| Workspace | Gianluca De Novi's workspace |
| Author | Gianluca De Novi |

## Inputs

| Port | Type | Description |
|---|---|---|
| `sounds` Sounds (WAV) | Files (wav, ogg, flac) | Several connections. |
| `mp3` MP3 copies | Files (mp3) | Several connections. Optional. |

## Settings

| Key | Type | Default | Description |
|---|---|---|---|
| `autoplay` Play new files by themselves | bool | `false` |  |
| `volume` Volume (%) | number | `80` |  |

## Use it in EsaSim

In a workspace, open **Projects > Blocks > New block**, choose this kind of block, copy the ports and settings above and paste the code; or ask an AI assistant connected to EsaSim (MCP) to create it from this folder.
