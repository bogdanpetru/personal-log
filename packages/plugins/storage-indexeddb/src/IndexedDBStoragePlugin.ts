import type { Log, LogId, StoragePlugin } from "@personal-log/plugin-api";

const DB_NAME = "personal-log";
const DB_VERSION = 1;
const STORE = "logs";

/**
 * Local persistence: logs (audio blob included) stored in one IndexedDB
 * database. The connection opens lazily on first use and stays open until
 * dispose. Blobs are structured-cloneable, so each log is stored as-is.
 */
export class IndexedDBStoragePlugin implements StoragePlugin {
  readonly id = "indexeddb";
  readonly name = "IndexedDB storage";

  private dbPromise: Promise<IDBDatabase> | null = null;

  async initialize(): Promise<void> {
    await this.db();
  }

  async save(log: Log): Promise<void> {
    await this.withStore("readwrite", (store) => store.put(log));
  }

  async get(logId: LogId): Promise<Log | undefined> {
    return this.withStore("readonly", (store) => store.get(logId));
  }

  async list(): Promise<Log[]> {
    // Oldest first, so a recordings list reads chronologically.
    const logs = await this.withStore("readonly", (store) => store.getAll());
    return [...logs].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async delete(logId: LogId): Promise<void> {
    await this.withStore("readwrite", (store) => store.delete(logId));
  }

  async dispose(): Promise<void> {
    if (this.dbPromise === null) {
      return;
    }
    const db = await this.dbPromise;
    db.close();
    this.dbPromise = null;
  }

  // Opens (and upgrades) the database once; every operation awaits the same
  // promise so the connection is shared.
  private db(): Promise<IDBDatabase> {
    this.dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id" });
        }
      };
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error ?? new Error("failed to open IndexedDB"));
      };
    });
    return this.dbPromise;
  }

  // Runs one IDB request inside a single-store transaction, resolving with
  // the request result (a full structured clone of the stored log).
  private withStore<T>(
    mode: IDBTransactionMode,
    run: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    return this.db().then(
      (db) =>
        new Promise<T>((resolve, reject) => {
          const transaction = db.transaction(STORE, mode);
          const request = run(transaction.objectStore(STORE));
          request.onsuccess = () => {
            resolve(request.result);
          };
          request.onerror = () => {
            reject(request.error ?? new Error("IndexedDB request failed"));
          };
          transaction.onabort = () => {
            reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
          };
        }),
    );
  }
}