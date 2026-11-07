/** Stand-in for `virtual:pwa-register/react` in unit tests (the plugin is not loaded there). */
export function useRegisterSW() {
  return {
    needRefresh: [false, () => undefined] as const,
    offlineReady: [false, () => undefined] as const,
    updateServiceWorker: () => Promise.resolve(),
  };
}
