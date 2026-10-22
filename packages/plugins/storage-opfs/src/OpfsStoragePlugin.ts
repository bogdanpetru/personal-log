import type {
  Log,
  LogData,
  LogId,
  LogQuery,
  StoragePlugin,
} from "@personal-log/plugin-api";
import { matchesFilter } from "./matchesFilter.js";
import { recordingFile } from "./recordingFile.js";

const LOGS_DIR = "logs";
const METADATA_FILE = "metadata.json";

/**
 * Local persistence in the browser's origin-private file system, with one
 * directory per log:
 *
 *   logs/<log-id>/recording.<ext>   the audio, the source of truth
 *   logs/<log-id>/metadata.json     the Log metadata incl. transcriptions
 *
 * Listing reads the metadata files and applies sort → filter → skip/limit in
 * memory — logs are small enough locally that this stays trivial, while the
 * interface leaves room for a backend that pages server-side.
 */
export class OpfsStoragePlugin implements StoragePlugin {
  readonly id = "opfs";
  readonly name = "OPFS storage (origin private file system)";

  // The logs directory handle, opened once and shared by every operation.
  private logsDirPromise: Promise<FileSystemDirectoryHandle> | null = null;

  async initialize(): Promise<void> {
    await this.logsDir();
  }

  async getLogs(query: LogQuery = {}): Promise<Log[]> {
    const { skip = 0, limit = 50, filter, include } = query;
    const logsDir = await this.logsDir();
    const logs: Log[] = [];
    for await (const [, handle] of logsDir.entries()) {
      if (handle.kind !== "directory") {
        continue;
      }
      const log = await this.readLogMetadata(handle as FileSystemDirectoryHandle);
      if (log !== undefined) {
        logs.push(log);
      }
    }
    const matched = logs
      .filter((log) => matchesFilter(log, filter))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(skip, skip + limit);
    // A cheap listing for consumers that only want metadata; text is tiny
    // locally, but a remote backend saves a fetch by being asked this way.
    return include?.transcriptions === false
      ? matched.map((log) => ({ ...log, transcriptions: [] }))
      : matched;
  }

  async get(logId: LogId): Promise<Log | undefined> {
    try {
      const dir = await this.logDir(logId, false);
      return await this.readMetadata(dir);
    } catch (error) {
      return missing(error) ? undefined : throwStoredError(error);
    }
  }

  async getLogData(logId: LogId): Promise<LogData | undefined> {
    try {
      const dir = await this.logDir(logId, false);
      const log = await this.readMetadata(dir);
      const handle = await dir.getFileHandle(recordingFile(log.audio.mimeType));
      const file = await handle.getFile();
      return {
        logId,
        audio: new Blob([file], { type: log.audio.mimeType }),
      };
    } catch (error) {
      return missing(error) ? undefined : throwStoredError(error);
    }
  }

  async save(log: Log, data: LogData): Promise<void> {
    const dir = await this.logDir(log.id, true);

    const metadataHandle = await dir.getFileHandle(METADATA_FILE, {
      create: true,
    });
    const metadataWritable = await metadataHandle.createWritable();
    await metadataWritable.write(JSON.stringify(log));
    await metadataWritable.close();

    const audioHandle = await dir.getFileHandle(
      recordingFile(log.audio.mimeType),
      { create: true },
    );
    const audioWritable = await audioHandle.createWritable();
    await audioWritable.write(data.audio);
    await audioWritable.close();
  }

  async delete(logId: LogId): Promise<void> {
    try {
      const logsDir = await this.logsDir();
      await logsDir.removeEntry(logId, { recursive: true });
    } catch (error) {
      // Deleting a log that does not exist is a no-op, like every backend.
      if (!missing(error)) {
        throwStoredError(error);
      }
    }
  }

  async dispose(): Promise<void> {
    // Nothing to close in OPFS — dropping the handle is all there is. A later
    // operation re-opens lazily.
    this.logsDirPromise = null;
  }

  private logsDir(): Promise<FileSystemDirectoryHandle> {
    this.logsDirPromise ??= navigator.storage
      .getDirectory()
      .then((root) => root.getDirectoryHandle(LOGS_DIR, { create: true }));
    return this.logsDirPromise;
  }

  private async logDir(
    logId: LogId,
    create: boolean,
  ): Promise<FileSystemDirectoryHandle> {
    const logsDir = await this.logsDir();
    return logsDir.getDirectoryHandle(logId, { create });
  }

  // The metadata of one log directory, or undefined when the directory does
  // not hold a readable log (a stray directory, or a half-written metadata
  // file). One broken entry must not break the whole listing.
  private async readLogMetadata(
    dir: FileSystemDirectoryHandle,
  ): Promise<Log | undefined> {
    try {
      return await this.readMetadata(dir);
    } catch (error) {
      if (missing(error) || error instanceof SyntaxError) {
        return undefined;
      }
      throwStoredError(error);
    }
  }

  private async readMetadata(dir: FileSystemDirectoryHandle): Promise<Log> {
    const handle = await dir.getFileHandle(METADATA_FILE);
    const file = await handle.getFile();
    return JSON.parse(await file.text()) as Log;
  }
}

/** A missing file/directory is the only error that maps to "not found". */
function missing(error: unknown): boolean {
  return (error as { name?: string }).name === "NotFoundError";
}

function throwStoredError(error: unknown): never {
  throw error;
}