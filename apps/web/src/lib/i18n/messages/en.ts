const messages = {
  "nav.new": "New",
  "nav.settings": "Settings",
  "nav.back": "Back",

  "recorder.start": "Start recording",
  "recorder.pause": "Pause recording",
  "recorder.resume": "Resume recording",
  "recorder.stop": "Stop recording",
  "recorder.title": "Recording title",
  "recorder.language": "Transcription language",
  "recorder.searchLanguages": "Search languages",
  "recorder.noLanguages": 'No languages match "{query}"',
  "recorder.notFound": "Recording not found.",

  "play.play": "Play recording",
  "play.pause": "Pause playback",
  "play.position": "Playback position",

  "log.share": "Share recording",
  "log.format": "Download format",
  "log.preparing": "Preparing {format}…",
  "log.convertFailed": "Could not convert to {format}. Sharing the original.",

  "list.delete": "Delete recording",
  "list.deleteTitle": "Delete recording?",
  "list.deleteDescription":
    "This cannot be undone. The recording and its transcript will be removed permanently.",
  "list.cancel": "Cancel",
  "list.deleteConfirm": "Delete",

  "settings.appLanguage": "App language",
  "settings.appLanguageHint": "Used for the interface on this device.",
  "settings.transcriptionLanguage": "Transcription language",
  "settings.transcriptionLanguageHint":
    "Used when starting a new recording.",
  "settings.theme": "Theme",
  "settings.themeHint": "Follow the system or pick a theme for this device.",
  "settings.downloadFormat": "Download format",
  "settings.downloadFormatHint":
    "Used by the share button and by the format picker in view mode.",

  "theme.system": "System",
  "theme.light": "Light",
  "theme.dark": "Dark",
  "theme.switch": "Theme: {current}. Switch to {next}.",

  "format.original": "Original",
};

export type Messages = typeof messages;

export default messages;
