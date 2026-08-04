import React from 'react';
import { Animated, PanResponder, StyleSheet, Text } from 'react-native';

/**
 * Floating pill showing the active app screen (Alice-style), fed by
 * Binar.setScreen from the host app's navigator. Draggable like the bubble.
 */
export function ScreenLabel({ name }: { name: string }) {
  const pan = React.useRef(new Animated.ValueXY()).current;
  const responder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => pan.extractOffset(),
      onPanResponderTerminate: () => pan.extractOffset(),
    }),
  ).current;

  return (
    <Animated.View
      style={[styles.pill, { transform: pan.getTranslateTransform() }]}
      {...responder.panHandlers}
      pointerEvents="box-only"
    >
      <Text style={styles.text} numberOfLines={1}>
        /{name}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    top: 40,
    alignSelf: 'center',
    maxWidth: '70%',
    backgroundColor: 'rgba(21, 101, 192, 0.85)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 9999,
  },
  text: { color: '#fff', fontWeight: '600', fontSize: 12 },
});
