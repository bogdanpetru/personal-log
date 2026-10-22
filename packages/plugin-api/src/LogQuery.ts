import type { LogFilter } from "./LogFilter.js";
import type { LogQueryInclude } from "./LogQueryInclude.js";

/** Paged listing parameters for `StoragePlugin.getLogs`. */
export interface LogQuery {
  /** How many logs to skip; default 0. */
  skip?: number;
  /** Page size; default 50. */
  limit?: number;
  include?: LogQueryInclude;
  filter?: LogFilter;
}