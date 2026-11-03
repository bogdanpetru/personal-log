import type {
  LiveTranscriptionPlugin,
  TranscriptionOptions,
} from "@personal-log/plugin-api";
import { settingsService } from "../settingsService";

type LiveSession = Awaited<ReturnType<LiveTranscriptionPlugin["startLive"]>>;

export class TranscriptionEngineSelector implements LiveTranscriptionPlugin {
  private readonly native: LiveTranscriptionPlugin;
  private readonly whisper: LiveTranscriptionPlugin;

  constructor(
    native: LiveTranscriptionPlugin,
    whisper: LiveTranscriptionPlugin,
  ) {
    this.native = native;
    this.whisper = whisper;
  }

  private selected(): LiveTranscriptionPlugin {
    return settingsService.get().transcriptionEngine === "whisper"
      ? this.whisper
      : this.native;
  }

  get id(): string {
    return this.selected().id;
  }

  get name(): string {
    return this.selected().name;
  }

  capabilities() {
    return this.selected().capabilities();
  }

  initialize(config: unknown): Promise<void> {
    return this.selected().initialize(config);
  }

  async dispose(): Promise<void> {
    await this.selected().dispose();
  }

  async startLive(options?: TranscriptionOptions): Promise<LiveSession> {
    return this.selected().startLive(options);
  }
}
