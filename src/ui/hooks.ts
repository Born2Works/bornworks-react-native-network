import { useSyncExternalStore, useCallback, useEffect, useRef, useState } from 'react';
import { Binar } from '../core/BinarCore';
import type { DeliveryResult } from './deliver';
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

/**
 * Copy/share actions are silent on Android — the clipboard write shows nothing
 * and the share sheet may be dismissed — so the button has to say what it did.
 */
export function useDeliveryFeedback(): [string | null, (run: () => Promise<DeliveryResult>) => void] {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const deliver = useCallback((run: () => Promise<DeliveryResult>) => {
    run().then((result) => {
      setMessage(
        result === 'copied' ? 'Copied' : result === 'shared' ? 'Shared' : 'Could not copy',
      );
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setMessage(null), 2000);
    });
  }, []);

  return [message, deliver];
}
