import type { Recording } from "@personal-log/plugin-api";
import type { Recorder } from "@personal-log/plugin-api";

/**
 * Default recorder: the browser's MediaRecorder. Captures audio while
 * started, builds one blob on stop, and releases the microphone afterwards.
 * Timekeeping lives in PersonalLog, not here.
 */
export class MediaRecorderRecorder implements Recorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private stopPromise: Promise<Recording> | null = null;

  async start(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.stream = stream;
    const recorder = new MediaRecorder(stream);
    this.mediaRecorder = recorder;

    // Chunks are captured per recorder instance, so a fast stop→start can
    // never mix two sessions.
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    recorder.start(1000);

    // onstop builds the blob and closes the mic tracks afterwards.
    this.stopPromise = new Promise<Recording>((resolve) => {
      recorder.onstop = () => {
        resolve({
          blob: new Blob(chunks, { type: recorder.mimeType || undefined }),
        });
        stream.getTracks().forEach((track) => track.stop());
      };
    });
  }

  pause(): void {
    this.mediaRecorder?.pause();
  }

  resume(): void {
    this.mediaRecorder?.resume();
  }

  async stop(): Promise<Recording> {
    this.mediaRecorder?.stop();
    const recording = await (this.stopPromise ??
      // Stopped before ever starting: an empty, unplayable recording.
      Promise.resolve({ blob: new Blob() })
    );
    this.mediaRecorder = null;
    this.stream = null;
    this.stopPromise = null;
    return recording;
  }

  getStream(): MediaStream | null {
    return this.stream;
  }

  dispose(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.mediaRecorder = null;
    this.stopPromise = null;
  }
}