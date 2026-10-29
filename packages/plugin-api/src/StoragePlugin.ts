import type { Log, LogId } from "./Log.js";
import type { LogData } from "./LogData.js";
import type { LogQuery } from "./LogQuery.js";

/**
 * A persistence destination for logs. Async throughout, and opaque to
 * consumers: nothing in this interface reveals whether the backend is OPFS,
 * a remote server, or anything else. Listing is cheap metadata; the audio is
 * fetched separately on demand.
 */
export interface StoragePlugin {
  id: string;
  name: string;
  initialize(): Promise<void>;
  /** Paged log metadata, oldest-first. */
  getLogs(query?: LogQuery): Promise<Log[]>;
  get(logId: LogId): Promise<Log | undefined>;
  /** The heavy payload: the log's audio. */
  getLogData(logId: LogId): Promise<LogData | undefined>;
  save(log: Log, data: LogData): Promise<void>;
  updateMetadata(log: Log): Promise<void>;
  delete(logId: LogId): Promise<void>;
  dispose(): Promise<void>;
}