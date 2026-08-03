import React from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text } from 'react-native';
import { Binar } from '../core/BinarCore';

const DRAG_SLOP = 6;

/**
 * Persistent floating badge; shows the unseen-call count when there is one.
 * Tapping it opens the inspector; dragging it moves it anywhere on screen.
 * Hidden only when showNotification is false or the inspector is open.
 */
export function NotificationBubble({ count }: { count: number }) {
  const pan = React.useRef(new Animated.ValueXY()).current;
  const responder = React.useRef(
    PanResponder.create({
      // Capture phase so the drag steals the gesture from the inner Pressable
      // once the finger actually moves; plain taps stay with the Pressable.
      onMoveShouldSetPanResponderCapture: (_evt, gesture) =>
        Math.abs(gesture.dx) > DRAG_SLOP || Math.abs(gesture.dy) > DRAG_SLOP,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => pan.extractOffset(),
      onPanResponderTerminate: () => pan.extractOffset(),
    }),
  ).current;

  // Always visible while showNotification is on — the bubble is the entry
  // point to the inspector, so it must survive the unseen count hitting 0
  // (e.g. right after the inspector is closed). Only the badge is conditional.
  return (
    <Animated.View
      style={[styles.bubble, { transform: pan.getTranslateTransform() }]}
      {...responder.panHandlers}
    >
      <Pressable onPress={() => Binar.open()} hitSlop={8}>
        <Text style={styles.text}>
          {count > 0 ? `${count > 99 ? '99+' : count} ⇅` : '⇅'}
        </Text>
      </Pressable>
    </Animated.View>
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
