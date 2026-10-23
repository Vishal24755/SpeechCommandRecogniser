# Application 10: Simple Speech Command Recognizer

A voice command recognition interface for controlling document and notepad actions with built-in user data confirmation safety.

## Predefined Voice Commands
- **"Create a note"** / *"new note"* – Creates a note template. If text already exists, asks for confirmation before replacing user text.
- **"Read text aloud"** / *"read text"* – Speaks the current note aloud using browser speech synthesis.
- **"Clear text"** / *"delete text"* – Asks for explicit confirmation via a safety modal dialog before erasing note data.
- **"Summarize text"** / *"summarize note"* – Automatically generates an extractive summary of the note and appends it.

## Features
- **Spoken Word Display:** Shows the exact words captured by the microphone.
- **Matching Command Badge:** Highlights the matched command or displays an error notice if the command is unrecognized.
- **Data Protection Modal:** Prompts for confirmation before executing actions that change or delete user data.
- **Activity Log:** Keeps a live, timestamped audit trail of spoken phrases, matched commands, and executed actions.
- **Manual Simulation Buttons:** Allows testing all 4 commands without needing a microphone.

## Technical Requirements
- **Browser:** Google Chrome, Microsoft Edge, Brave, or Chromium-based browsers.
- **Microphone:** Requires microphone hardware permission.
- **Internet:** Uses Web Speech API for voice-to-text recognition, requiring an active internet connection.

## How to Run
Double-click `RUN.bat` or open `index.html` directly in Google Chrome or Microsoft Edge.
