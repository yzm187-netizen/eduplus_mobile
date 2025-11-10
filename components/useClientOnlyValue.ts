// This function is web-only as native doesn't currently support server (or build-time) rendering.
// DEPRECATED: Not used. Safe to delete. Kept as shim.
export function useClientOnlyValue<S, C>(server: S, client: C): S | C {
  return client;
}
