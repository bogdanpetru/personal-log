function downloadFile(file: File): void {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function shareBackupFile(file: File): void {
  if (navigator.canShare === undefined || !navigator.canShare({ files: [file] })) {
    downloadFile(file);
    return;
  }
  void navigator
    .share({ files: [file], title: file.name })
    .catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        downloadFile(file);
      }
    });
}
