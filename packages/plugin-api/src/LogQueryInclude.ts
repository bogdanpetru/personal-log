/** Which parts of a log a paged listing should include. */
export interface LogQueryInclude {
  /**
   * `false` → logs come back without their transcriptions (cheap metadata
   * listing for a remote backend). Default: included.
   */
  transcriptions?: boolean;
}