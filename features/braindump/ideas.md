# Ideas

Things to build later, grouped by the screen they belong to.

## Implemented

- **Audio format + settings page** — default language and download format in
  `/settings`, with a format picker next to Share and lazy FFmpeg.wasm
  conversion. Shipped in PL-15
  (`features/PL-15-settings-and-formats/spec.md`).

## Storage / Settings

- **Optional encryption at rest** — encrypt log entries (audio + transcripts)
  before they hit local storage and before they leave the device. Pairs with
  PL-20 (`features/PL-20-backup-restore/spec.md`): the whole app stays
  on-device-only, and an encrypted backup zip means whatever cloud the user
  stashes it in only ever sees ciphertext. Two key options:
  1. the app generates an encryption key and offers to save/export it
     (user responsibility to keep it safe), or
  2. key material comes from the user's existing password manager via
     **WebAuthn passkeys with the PRF extension** (`prf`/`hmac-secret`) —
     the generic, standardized protocol supported by iCloud Keychain,
     1Password, and Bitwarden — so the passkey already synced by their
     manager protects the logs, and no separate key file is needed.
  PRF support varies by platform/authenticator, so the manual key option is
  the baseline and passkey-derived keys are progressive enhancement.
