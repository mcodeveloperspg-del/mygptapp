# Voice Priority Planner

A simple browser-based daily planning app that captures voice notes and turns them into a prioritized to-do list.

## Features

- Request microphone permission before recording voice notes with the browser Speech Recognition API when available.
- Type or paste notes manually as a fallback.
- Split notes into task-sized items.
- Rank tasks by priority using deadline, urgency, and action-word signals.

## Run locally

Open `index.html` in a browser, or serve the folder locally:

```bash
python3 -m http.server 4173
```

Then visit `http://127.0.0.1:4173/index.html`. Microphone prompts require a secure browser context, such as localhost or HTTPS.
