export function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.object_list)) return data.object_list;
  if (data && Array.isArray(data.results)) return data.results;
  if (data && Array.isArray(data.data)) return data.data;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
}
