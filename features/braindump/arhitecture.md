# Personal Log — Technical Architecture & Implementation Plan

## 1. Architectural principles

The architecture should be built around four independent concerns:

```text
                    ┌──────────────────────┐
                    │      Personal Log    │
                    │       Application    │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
         Recording        Transcription      Persistence
          Core             Plugins            Plugins
              │                │                │
              ▼                ▼                ▼
         Audio source      Text artifacts     Destinations
```

The recording system is core functionality.

Transcription and persistence are plugin systems.

The application should not depend on a specific transcription engine or storage provider.

---

# 2. Proposed technology

## Application

Recommended baseline:

- TypeScript
- React
- Vite
- PWA
- Web APIs wherever possible
- IndexedDB for application metadata
- OPFS for application-managed persistent files
- File System Access API for explicit user-selected filesystem locations
- Web Workers for CPU-intensive processing

The application should be installable as a PWA. A web app manifest and HTTPS are required for normal PWA installation, while service workers can provide offline functionality.

## Audio recording

Use the browser's native media APIs rather than making recording itself a plugin.

Conceptually:

```ts
interface Recorder {
  start(): Promise<void>
  pause(): Promise<void>
  resume(): Promise<void>
  stop(): Promise<Recording>
}
```

The recording implementation should produce an immutable audio artifact.

The exact encoding should be selected based on browser/device capabilities rather than assuming one universal codec.

---

# 3. Data model

A log should have a stable identity.

```ts
type LogId = string

interface Log {
  id: LogId
  createdAt: string
  durationMs: number
  audio: AudioArtifact
  transcriptions: TranscriptionArtifact[]
}
```

The audio artifact is the source of truth.

```ts
interface AudioArtifact {
  id: string
  mimeType: string
  size: number
  createdAt: string
  path: string
}
```

A transcription is derived:

```ts
interface TranscriptionArtifact {
  id: string
  logId: LogId
  providerId: string
  language?: string
  createdAt: string
  text: string
}
```

The important property is that a transcription references the recording rather than replacing it.

This permits:

```text
Recording
   │
   ├── Native transcription
   │
   ├── Whisper transcription
   │
   ├── Custom transcription
   │
   └── Future transcription
```

Multiple transcriptions can therefore coexist.

---

# 4. Local storage

There should be two concepts of local storage.

## Application-private storage

Use OPFS for recordings and other larger application-managed files.

OPFS is private to the application's origin and is designed for persistent file storage and efficient file access. It is not directly visible to the user as their normal filesystem.

Suggested structure:

```text
OPFS/
  logs/
    <log-id>/
      recording.<extension>
      metadata.json
      artifacts/
        transcription-native.json
        transcription-whisper.json
```

## Application metadata

Use IndexedDB for:

- Plugin configuration
- Selected plugins
- Log metadata
- Artifact metadata
- Synchronization state
- User preferences

For example:

```text
IndexedDB
  ├── logs
  ├── artifacts
  ├── plugins
  ├── plugin-config
  └── sync-state
```

## User-visible files

The File System Access API can additionally be used when the user explicitly wants to select a directory or save files to a visible location.

This should be considered an export/synchronization feature rather than the fundamental storage layer because browser support and permission requirements differ.

---

# 5. Transcription plugin system

Transcription should have a deliberately small interface.

```ts
interface TranscriptionPlugin {
  id: string
  name: string

  capabilities(): TranscriptionCapabilities

  initialize(
    config: unknown
  ): Promise<void>

  transcribe(
    input: AudioInput,
    options: TranscriptionOptions
  ): Promise<TranscriptionResult>

  dispose(): Promise<void>
}
```

For live transcription:

```ts
interface LiveTranscriptionPlugin extends TranscriptionPlugin {
  startLive(
    options: TranscriptionOptions
  ): Promise<LiveTranscriptionSession>
}

interface LiveTranscriptionSession {
  onPartialResult(
    callback: (text: string) => void
  ): void

  onFinalResult(
    callback: (text: string) => void
  ): void

  stop(): Promise<TranscriptionResult>
}
```

This separates:

- Recording
- Live transcription
- Final transcription
- Artifact persistence

---

# 6. Native transcription plugin

The first plugin should wrap the browser's Web Speech API.

The browser now exposes APIs for requesting on-device speech recognition, including `processLocally`, and APIs for checking/installing language packs. However, `SpeechRecognition` remains limited-availability and browser support is not uniform.

Therefore the plugin should explicitly report capabilities:

```ts
interface TranscriptionCapabilities {
  live: boolean
  local: boolean
  languages: string[]
  offline: boolean
}
```

The native plugin should behave approximately like:

```text
Can browser provide speech recognition?
        │
        ├── no ──> unavailable
        │
        └── yes
             │
             ▼
      Is local processing available?
             │
        ┌────┴────┐
        │         │
       yes        no
        │         │
        ▼         ▼
   use locally   unavailable
```

Because privacy is a fundamental requirement, the application should **not silently fall back to a server-based recognition service**.

The Web Speech API can otherwise use server-based recognition depending on the browser.

---

# 7. Whisper plugin

A second plugin can provide Whisper-based transcription.

Possible implementations:

### Local browser Whisper

A model runs inside the browser using WebGPU/WASM or another browser-compatible runtime.

Advantages:

- Completely local
- Offline
- No external server
- Consistent privacy model

Disadvantages:

- Large model downloads
- CPU/GPU requirements
- Mobile performance varies

### Personal Whisper server

The browser sends the audio to a user-controlled endpoint.

```text
PWA
 │
 │ audio
 ▼
Personal Server
 │
 ▼
Whisper
 │
 ▼
transcription
```

This is still compatible with the project's privacy model because the server is explicitly configured by the user.

---

# 8. Persistence plugin system

Persistence should be independent from transcription.

```ts
interface StoragePlugin {
  id: string
  name: string

  initialize(
    config: unknown
  ): Promise<void>

  save(
    log: LogPackage
  ): Promise<StorageResult>

  delete(
    logId: LogId
  ): Promise<void>

  getStatus(): Promise<StorageStatus>

  dispose(): Promise<void>
}
```

Potential plugins:

```text
LocalStoragePlugin
PersonalServerPlugin
GoogleDrivePlugin
DropboxPlugin
OneDrivePlugin
FutureCloudPlugin
```

The local plugin is mandatory.

All others are optional.

---

# 9. Personal server plugin

This should probably be the first external persistence plugin.

Configuration:

```ts
interface PersonalServerConfig {
  name: string
  url: string
  identity: ClientIdentity
}
```

I would **not call the identity an SSH key** unless the application is actually using SSH.

Instead, use an application-level public/private key pair, preferably an Ed25519 key pair.

The client keeps:

```text
private key → device only
```

The server stores:

```text
public key → identifies this device
```

The client signs requests:

```text
request
   +
timestamp
   +
request body
        │
        ▼
private key
        │
        ▼
signature
```

The server verifies the signature using the stored public key.

This provides a much cleaner model than putting a long-lived bearer token into the application.

The server API could initially be extremely small:

```http
POST /v1/logs
POST /v1/logs/:id/artifacts
GET  /v1/logs
GET  /v1/logs/:id
DELETE /v1/logs/:id
```

The server should not need to know anything about transcription plugins.

It receives artifacts.

It decides how to persist them.

---

# 10. Synchronization model

Persistence should eventually become synchronization rather than simply "upload."

Each artifact should have:

```ts
interface ArtifactMetadata {
  id: string
  logId: string
  type: string
  version: number
  hash: string
  createdAt: string
}
```

This allows the system to determine:

```text
Local artifact
      │
      ▼
hash comparison
      │
 ┌────┴────┐
 │         │
same     different
 │         │
done    synchronize
```

This becomes important when the same logs exist on multiple devices.

---

# 11. Plugin registration

Avoid making the application depend on dynamic arbitrary JavaScript loaded from remote URLs.

For the initial architecture, plugins should be registered explicitly:

```ts
const plugins = {
  transcription: [
    nativeSpeechPlugin,
    whisperPlugin,
  ],

  storage: [
    localStoragePlugin,
    personalServerPlugin,
  ],
}
```

The application discovers capabilities through the plugin interface.

Later, a formal plugin package system can be introduced.

Possible future package model:

```ts
interface PersonalLogPlugin {
  manifest: PluginManifest
  activate(context: PluginContext): Promise<void>
}
```

But this should not be implemented prematurely.

---

# 12. Plugin configuration

IndexedDB stores configuration, not plugin implementations.

Example:

```ts
interface PluginSelection {
  transcription: string
  storage: string[]
}
```

Example:

```json
{
  "transcription": "native-speech",
  "storage": [
    "local",
    "personal-server"
  ]
}
```

Plugin-specific configuration is kept separately:

```text
plugin-config
  native-speech
  personal-server
  whisper
```

Secrets should receive special treatment and should not simply be dumped into ordinary application state.

---

# 13. Processing pipeline

A completed recording should follow this conceptual pipeline:

```text
                ┌───────────────┐
                │   Microphone  │
                └───────┬───────┘
                        │
                        ▼
                ┌───────────────┐
                │   Recording   │
                └───────┬───────┘
                        │
                 SOURCE OF TRUTH
                        │
             ┌──────────┴──────────┐
             │                     │
             ▼                     ▼
       Transcription          Local storage
             │                     │
             ▼                     ▼
       Text artifact         Persistence plugins
                                   │
                         ┌─────────┴─────────┐
                         ▼                   ▼
                   Personal server       Cloud storage
```

Later:

```text
Recording
   │
   ├── Transcription
   ├── Translation
   ├── Summary
   ├── Tags
   ├── Embeddings
   └── AI analysis
```

All of these remain derived artifacts.

---

# 14. Suggested development phases

## Phase 1 — Recording prototype

Build only:

- PWA shell
- Microphone permission
- Record
- Pause
- Resume
- Stop
- Audio playback

No plugins yet.

Goal: establish that the core recording experience works reliably across target devices.

## Phase 2 — Local persistence

Add:

- OPFS
- IndexedDB
- Log metadata
- Recording list
- Playback
- Delete
- Export

At this point the application should already be useful without any network connection.

## Phase 3 — Native transcription

Implement the native transcription plugin.

Add:

- Live transcription
- Partial results
- Final results
- Language selection
- Capability detection
- Explicit local-processing requirement

Do not silently fall back to server recognition.

## Phase 4 — Plugin architecture

Extract formal interfaces for:

- Transcription
- Storage
- Future processing

Add plugin registration and configuration.

The core application should now be independent of concrete plugin implementations.

## Phase 5 — Personal server

Implement:

- Server configuration
- Device identity
- Public/private key authentication
- Upload
- Artifact synchronization
- Server status
- Retry handling

The server should initially remain intentionally simple.

## Phase 6 — Whisper

Add a Whisper plugin.

Initially decide between:

```text
Whisper in browser
        vs
Whisper on personal server
```

The plugin interface should allow both without changing the application.

## Phase 7 — Cloud storage

Implement cloud providers independently.

Potential order:

1. Google Drive
2. Other providers based on demand

Each provider remains an independent persistence plugin.

## Phase 8 — Derived artifacts

Once the core architecture is stable, add optional processing plugins:

- Summarization
- Translation
- Tagging
- Search indexing
- AI analysis
- Knowledge-base export

None of these should modify the original recording.

---

# 15. Initial repository structure

A possible structure:

```text
personal-log/
  apps/
    web/

  packages/
    core/
      recording/
      artifacts/
      logs/

    plugin-api/
      transcription/
      storage/
      processing/

    plugins/
      transcription-native/
      transcription-whisper/
      storage-local/
      storage-personal-server/

    ui/

  server/
    personal-log-server/
```

The important architectural boundary is:

```text
core
  ↓
plugin interfaces
  ↓
plugins
```

rather than:

```text
core
  ↓
Google Drive
  ↓
Whisper
  ↓
personal server
```

---

# 16. MVP definition

The MVP should be considered complete when a user can:

1. Install the PWA.
2. Open it without creating an account.
3. Press Record.
4. Speak.
5. Pause/resume.
6. See local transcription when supported.
7. Stop recording.
8. Have the audio persisted locally.
9. Have the transcription persisted locally.
10. Reopen the application later.
11. Play the original recording.
12. Read the transcription.
13. Delete the transcription without deleting the recording.
14. Regenerate the transcription using another plugin.
15. Configure an optional personal server.
16. Synchronize recordings to that server.

The fundamental invariant should remain:

> **No feature is allowed to make the original recording dependent on a derived artifact or external service.**

## 17. Important technical risks

### Browser speech recognition

The biggest risk to the original design is assuming that "Web Speech API" means "reliably local on every device."

It does not. `SpeechRecognition` has limited browser availability, and browser implementations can use remote recognition. On-device processing is available through newer APIs but also has compatibility limitations.

Therefore the architecture should treat native transcription as a capability-driven plugin rather than as a guaranteed platform primitive.

### Browser filesystem

Likewise, "save directly to the device filesystem" does not mean the same thing on every platform.

OPFS provides persistent application-private storage, while user-visible filesystem access requires explicit permissions and browser support.

The application should therefore distinguish:

```text
Private app storage
        ≠
User-visible filesystem
```

That distinction should be reflected in the UX and architecture.

### Mobile PWA limitations

The PWA should be tested independently on:

- iOS Safari
- Android Chrome
- Desktop Chrome/Edge
- Firefox
- Safari macOS

The goal should not be "all browsers behave identically." The goal should be graceful capability detection while preserving the same data model.

---

# 18. Long-term architectural direction

The interesting part of the project is not actually the voice recorder.

The recorder is the stable primitive.

The more interesting abstraction is:

```text
                    PERSONAL LOG
                         │
                   ┌─────┴─────┐
                   │   Source  │
                   │   Audio   │
                   └─────┬─────┘
                         │
                  derived artifacts
                         │
       ┌─────────┬───────┼────────┬──────────┐
       ▼         ▼       ▼        ▼          ▼
 transcription summary translation tags   embeddings
       │         │       │        │          │
       └─────────┴───────┴────────┴──────────┘
                         │
                       sync
                         │
            ┌────────────┼────────────┐
            ▼            ▼            ▼
          local       personal      cloud
          device       server       storage
```

This makes the project extensible without turning the core application into a collection of tightly coupled integrations.

The first implementation should therefore deliberately resist adding AI features. Get **recording → local artifact → pluggable transcription → pluggable persistence** correct first.