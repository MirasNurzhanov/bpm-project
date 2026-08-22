import { request } from './client';
import { unwrapList } from '../utils/unwrapList';

export async function getProjects() {
  return unwrapList(await request('/api/bpm/project/'));
}
