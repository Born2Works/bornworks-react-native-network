import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Binar } from '../core/BinarCore';

/**
 * Small floating badge shown when new HTTP calls are captured.
 * Tapping it opens the inspector. Hidden when showNotification is false.
 */
export function NotificationBubble({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <Pressable style={styles.bubble} onPress={() => Binar.open()} hitSlop={8}>
      <Text style={styles.text}>{count > 99 ? '99+' : count} ⇅</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    right: 16,
    bottom: 48,
    backgroundColor: '#1565c0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 9999,
  },
  text: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
