import React, { useState } from 'react';
import { Modal, SafeAreaView, StyleSheet, View } from 'react-native';
import { Davina } from '../core/DavinaCore';
import { useDavinaUiState, useDavinaCalls } from './hooks';
import { CallListScreen } from './CallListScreen';
import { CallDetailScreen } from './CallDetailScreen';
import { NotificationBubble } from './NotificationBubble';
import type { HttpCall } from '../types';

/**
 * The inspector itself: list + detail. Usable standalone (e.g. registered as
 * a react-navigation route) — pass onClose to control dismissal.
 */
export function DavinaScreen({ onClose }: { onClose?: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const calls = useDavinaCalls();
  const selected: HttpCall | undefined = selectedId
    ? calls.find((c) => c.id === selectedId)
    : undefined;

  if (selected) {
    return <CallDetailScreen call={selected} onBack={() => setSelectedId(null)} />;
  }
  return (
    <CallListScreen
      onSelect={(c) => setSelectedId(c.id)}
      onClose={onClose ?? (() => Davina.close())}
    />
  );
}

/**
 * Wrap your app once, near the root:
 *
 *   <DavinaProvider>
 *     <App />
 *   </DavinaProvider>
 *
 * Renders your app, the floating notification bubble, and the inspector as a
 * Modal overlay — no navigator required. Renders children untouched when
 * Davina is disabled.
 */
export function DavinaProvider({ children }: { children: React.ReactNode }) {
  const ui = useDavinaUiState();

  if (!Davina.config.enabled) {
    return <>{children}</>;
  }

  return (
    <View style={styles.host}>
      {children}
      {ui.showNotification && !ui.visible && <NotificationBubble count={ui.unseenCount} />}
      <Modal
        visible={ui.visible}
        animationType="slide"
        onRequestClose={() => Davina.close()}
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modal}>
          <DavinaScreen onClose={() => Davina.close()} />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { flex: 1 },
  modal: { flex: 1, backgroundColor: '#fff' },
});
