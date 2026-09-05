import { request } from './client';
import { unwrapList } from '../utils/unwrapList';

// Tag: { pk, id, title, color }  (color is a hex string, e.g. "#4400ff")
export async function getTags() {
  return unwrapList(await request('/api/bpm/tag/'));
}

export function createTag({ title, color }) {
  return request('/api/bpm/tag/create/', {
    method: 'POST',
    body: { title, color },
  });
}

// NOTE: no delete from the app. /api/bpm/tag/delete/ only accepts a real DELETE
// (405 on POST + X-HTTP-Method-Override), and React Native's fetch cannot send
// DELETE to this server ("Network request failed"). Needs the backend to accept
// POST on that endpoint before delete can be added here.
