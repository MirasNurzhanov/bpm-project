import { File } from 'expo-file-system';

/**
 * How the BPM backend takes task attachments.
 *
 * There is NO separate upload endpoint. The web app sends the files inline in the
 * same `POST /api/processes/simpletask/create/` JSON body, under `new_files`:
 *
 *   new_files: [{ name: "photo.jpeg", file: "data:image/jpeg;base64,...", type, size }]
 *
 * i.e. each file is base64-encoded on the client and embedded as a data URL.
 *
 * NOTE: the inner key that holds the base64 payload (`FILE_KEY` below) still needs
 * confirming against a real request — expand `new_files[0]` in the web app's
 * Network → Payload view and adjust if it is not `file`.
 */
const FILE_KEY = 'file';

async function readBase64(asset) {
  // Web: DocumentPicker already hands us base64 (or a data: URI in `uri`).
  if (asset.base64) return asset.base64;
  if (typeof asset.uri === 'string' && asset.uri.startsWith('data:')) {
    return asset.uri.split(',')[1] ?? '';
  }
  // Native: read the local cache file.
  return new File(asset.uri).base64();
}

/**
 * Turns picked files into the `new_files` array the create endpoint expects.
 * Reads each file as base64; rejects if any file can't be read.
 * @param {Array<{ uri: string, name?: string, size?: number, mimeType?: string, base64?: string }>} assets
 */
export async function buildNewFiles(assets) {
  return Promise.all(
    (assets ?? []).map(async (asset) => {
      const base64 = await readBase64(asset);
      const mime = asset.mimeType ?? 'application/octet-stream';
      return {
        name: asset.name ?? 'file',
        [FILE_KEY]: `data:${mime};base64,${base64}`,
        type: mime,
        size: asset.size,
      };
    })
  );
}
