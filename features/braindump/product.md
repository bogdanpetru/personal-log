# Personal Log

## Overview

Personal Log is a private, device-first voice journal designed around the simplicity of a Star Trek-style personal log.

Open the app, press record, and start talking.

The application records your voice and shows a live transcription underneath it. When you finish, the recording and its transcription are saved on your device.

The application is designed around privacy and ownership: **your recordings stay on your devices unless you explicitly configure another destination.**

## Core experience

### Record

The main screen is intentionally simple.

- Press **Record** to start a personal log.
- Speak naturally.
- See the transcription appear while you talk.
- Pause and resume the recording.
- Press **Stop** to finish.

The recording should feel immediate and frictionless. Opening the application and starting a log should require as little interaction as possible.

### Personal logs

Every completed log consists primarily of a voice recording.

A transcription is associated with the recording, but it is not considered the original source.

This distinction is important:

**Voice recording → source of truth**

**Transcription → derived artifact**

A transcription can therefore be deleted, replaced, or regenerated without affecting the original recording.

## Privacy

Personal Log is private by default.

- Recordings remain on the user's device.
- Transcriptions remain on the user's device.
- No account is required for the basic experience.
- No recording is uploaded automatically.
- Cloud storage is opt-in.
- External services are only used when the user explicitly configures them.

The application should make it clear when information is leaving the device.

## Offline use

The core recording experience should work without an internet connection whenever the device and selected transcription method support it.

The application should not require a cloud account simply to create personal logs.

## Transcription

Transcription is replaceable.

The application has a default built-in transcription option, but users can choose another transcription provider when they need different languages, models, accuracy, or capabilities.

Examples include:

- Browser/device speech recognition
- Whisper-based transcription
- A locally hosted transcription service
- Other compatible transcription engines

Changing the transcription method should not change or replace the original recording.

## Storage

Personal Log stores recordings and their associated artifacts locally.

The user can optionally configure additional storage destinations.

Possible destinations include:

- Device storage
- A personal server
- Google Drive
- Other personal cloud storage providers

Each storage destination is optional and independently configurable.

## Personal server

A particularly important option is a user-controlled personal server.

The user can configure:

- Server name
- Server address
- Authentication credentials

The server decides how and where the received logs are stored.

This could be a server running:

- At home
- On a VPS
- On a private network
- Behind Tailscale
- Anywhere else accessible to the user's device

The application does not need to dictate the server's storage implementation.

## Ownership

The application should avoid creating unnecessary dependencies on a central service.

A user should be able to:

1. Create recordings.
2. Keep them entirely local.
3. Export them.
4. Synchronize them with a server they control.
5. Change synchronization providers later.
6. Regenerate derived artifacts from the original recordings.

The user's recordings should remain usable independently of the application.

## Extensibility

Features that operate on recordings or their artifacts should be implemented as plugins.

Potential future plugins include:

- Alternative transcription engines
- Summarization
- Translation
- Topic extraction
- Search indexing
- AI analysis
- Personal knowledge-base integration
- Cloud synchronization
- Personal server synchronization
- Automatic tagging

The core application should remain small even as these capabilities grow.

## Design principles

### Local first

The application assumes that the user's device is the primary home of their data.

### Source of truth

The original recording is authoritative.

Derived data can always be recreated.

### Explicit data movement

Data should never leave the device unexpectedly.

### Replaceable components

Transcription and storage providers can be changed independently.

### Minimal interface

The primary action is recording.

The application should not turn a simple voice journal into a complicated productivity system.

### User-controlled infrastructure

Users should be able to connect their own infrastructure instead of being forced into a hosted service.

## Initial scope

The first version should focus on:

1. Recording
2. Pause/resume
3. Live transcription
4. Local persistence
5. Viewing previous recordings
6. Playing recordings
7. Viewing/editing generated transcriptions
8. Selecting a transcription plugin
9. Selecting a storage/synchronization plugin
10. Optional personal-server synchronization

Everything else can come later.