import type { Log, LogId } from "./Log.js";

/**
 * A persistence destination for logs. The local plugin is mandatory in the
 * long run; every other destination (personal server, cloud) is an
 * independently configured implementation of this interface.
 */
export interface StoragePlugin {
  id: string;
  name: string;
  initialize(): Promise<void>;
  save(log: Log): Promise<void>;
  get(logId: LogId): Promise<Log | undefined>;
  list(): Promise<Log[]>;
  delete(logId: LogId): Promise<void>;
  dispose(): Promise<void>;
}