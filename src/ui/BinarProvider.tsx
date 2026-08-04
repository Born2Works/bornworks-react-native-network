import React, { useState } from 'react';
import { Modal, SafeAreaView, StyleSheet, View } from 'react-native';
import { Binar } from '../core/BinarCore';
import { useBinarUiState, useBinarCalls } from './hooks';
import { CallListScreen } from './CallListScreen';
import { CallDetailScreen } from './CallDetailScreen';
import { NotificationBubble } from './NotificationBubble';
import { ScreenLabel } from './ScreenLabel';
import type { HttpCall } from '../types';

/**
 * The inspector itself: list + detail. Usable standalone (e.g. registered as
 * a react-navigation route) — pass onClose to control dismissal.
 */
export function BinarScreen({ onClose }: { onClose?: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const calls = useBinarCalls();
  const selected: HttpCall | undefined = selectedId
    ? calls.find((c) => c.id === selectedId)
    : undefined;

  if (selected) {
    return <CallDetailScreen call={selected} onBack={() => setSelectedId(null)} />;
  }
  return (
    <CallListScreen
      onSelect={(c) => setSelectedId(c.id)}
      onClose={onClose ?? (() => Binar.close())}
    />
  );
}

/**
 * Wrap your app once, near the root:
 *
 *   <BinarProvider>
 *     <App />
 *   </BinarProvider>
 *
 * Renders your app, the floating notification bubble, and the inspector as a
 * Modal overlay — no navigator required. Renders children untouched when
 * Binar is disabled.
 */
export function BinarProvider({ children }: { children: React.ReactNode }) {
  const ui = useBinarUiState();

  if (!Binar.config.enabled) {
    return <>{children}</>;
  }

  return (
    <View style={styles.host}>
      {children}
      {ui.showScreenLabel && !ui.visible && ui.screen != null && <ScreenLabel name={ui.screen} />}
      {ui.showNotification && !ui.visible && <NotificationBubble count={ui.unseenCount} />}
      <Modal
        visible={ui.visible}
        animationType="slide"
        onRequestClose={() => Binar.close()}
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modal}>
          <BinarScreen onClose={() => Binar.close()} />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { flex: 1 },
  modal: { flex: 1, backgroundColor: '#fff' },
});
