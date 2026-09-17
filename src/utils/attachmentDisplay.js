// Shared helpers for rendering attachment list items (used by task and
// approval detail screens). Attachment shape: { file: { name, url },
// thumbnail: { name, url } } — files are served as presigned URLs.
export function attachmentUrl(a) {
  return (
    a?.file?.url ??
    (typeof a?.file === 'string' ? a.file : null) ??
    a?.url ??
    a?.file_url ??
    a?.download_url ??
    a?.link ??
    a?.href ??
    null
  );
}

export function attachmentName(a) {
  return a?.file?.name ?? a?.name ?? a?.file_name ?? a?.title ?? 'Файл';
}

export function attachmentThumb(a) {
  return a?.thumbnail?.url ?? null;
}
