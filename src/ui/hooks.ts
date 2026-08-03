import { useSyncExternalStore, useCallback } from 'react';
import { Davina } from '../core/DavinaCore';
import type { HttpCall } from '../types';

export function useDavinaCalls(): HttpCall[] {
  const subscribe = useCallback((cb: () => void) => Davina.store.subscribe(cb), []);
  const getSnapshot = useCallback(() => Davina.store.getAll(), []);
  return useSyncExternalStore(subscribe, getSnapshot);
}

interface DavinaUiState {
  visible: boolean;
  unseenCount: number;
  showNotification: boolean;
}

let cachedUiState: DavinaUiState | null = null;

function readUiState(): DavinaUiState {
  const next: DavinaUiState = {
    visible: Davina.isOpen(),
    unseenCount: Davina.getUnseenCount(),
    showNotification: Davina.config.showNotification,
  };
  // Keep referential stability so useSyncExternalStore does not loop.
  if (
    cachedUiState &&
    cachedUiState.visible === next.visible &&
    cachedUiState.unseenCount === next.unseenCount &&
    cachedUiState.showNotification === next.showNotification
  ) {
    return cachedUiState;
  }
  cachedUiState = next;
  return next;
}

export function useDavinaUiState(): DavinaUiState {
  const subscribe = useCallback((cb: () => void) => Davina.subscribeUi(cb), []);
  return useSyncExternalStore(subscribe, readUiState);
}
