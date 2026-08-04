import { useSyncExternalStore, useCallback } from 'react';
import { Binar } from '../core/BinarCore';
import type { HttpCall } from '../types';

export function useBinarCalls(): HttpCall[] {
  const subscribe = useCallback((cb: () => void) => Binar.store.subscribe(cb), []);
  const getSnapshot = useCallback(() => Binar.store.getAll(), []);
  return useSyncExternalStore(subscribe, getSnapshot);
}

interface BinarUiState {
  visible: boolean;
  unseenCount: number;
  showNotification: boolean;
  showScreenLabel: boolean;
  screen: string | null;
}

let cachedUiState: BinarUiState | null = null;

function readUiState(): BinarUiState {
  const next: BinarUiState = {
    visible: Binar.isOpen(),
    unseenCount: Binar.getUnseenCount(),
    showNotification: Binar.config.showNotification,
    showScreenLabel: Binar.config.showScreenLabel,
    screen: Binar.getScreen(),
  };
  // Keep referential stability so useSyncExternalStore does not loop.
  if (
    cachedUiState &&
    cachedUiState.visible === next.visible &&
    cachedUiState.unseenCount === next.unseenCount &&
    cachedUiState.showNotification === next.showNotification &&
    cachedUiState.showScreenLabel === next.showScreenLabel &&
    cachedUiState.screen === next.screen
  ) {
    return cachedUiState;
  }
  cachedUiState = next;
  return next;
}

export function useBinarUiState(): BinarUiState {
  const subscribe = useCallback((cb: () => void) => Binar.subscribeUi(cb), []);
  return useSyncExternalStore(subscribe, readUiState);
}
