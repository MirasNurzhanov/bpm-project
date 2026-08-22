// Confirmed via real API responses: this backend is a Django form-based JSON
// API (not plain DRF pagination) — list endpoints wrap results as
// {paginator, page_obj, is_paginated, object_list: [...], field_types, filter}.
export function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.object_list)) return data.object_list;
  if (data && Array.isArray(data.results)) return data.results;
  if (data && Array.isArray(data.data)) return data.data;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
}
