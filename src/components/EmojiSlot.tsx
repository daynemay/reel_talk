import React, { useRef, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  GestureResponderEvent,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { EmojiItem } from '../data/emojiData';

interface Props {
  item: EmojiItem;
  onTap: () => void;
  onLongPress: () => void;
  onRemove: () => void;
  onDragStart: (absX: number, absY: number) => void;
  onDragMove: (absX: number, absY: number) => void;
  onDragEnd: () => void;
  isDragging?: boolean;
  isDropTarget?: boolean;
}

const LONG_PRESS_MS = 480;

export const EmojiSlot = React.forwardRef<View, Props>(
  ({ item, onTap, onLongPress, onRemove, onDragStart, onDragMove, onDragEnd, isDragging, isDropTarget }, ref) => {
    const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const didLongPress = useRef(false);

    const dragCbs = useRef({ onDragStart, onDragMove, onDragEnd });
    dragCbs.current = { onDragStart, onDragMove, onDragEnd };

    const drag = useMemo(
      () =>
        Gesture.Pan()
          .runOnJS(true)
          .onBegin((e) => dragCbs.current.onDragStart(e.absoluteX, e.absoluteY))
          .onUpdate((e) => dragCbs.current.onDragMove(e.absoluteX, e.absoluteY))
          .onEnd(() => dragCbs.current.onDragEnd())
          .onFinalize((_, success) => {
            if (!success) dragCbs.current.onDragEnd();
          }),
      []
    );

    function handlePressIn() {
      didLongPress.current = false;
      holdTimer.current = setTimeout(() => {
        didLongPress.current = true;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onTap();
      }, LONG_PRESS_MS);
    }

    function handlePressOut() {
      if (holdTimer.current) {
        clearTimeout(holdTimer.current);
        holdTimer.current = null;
      }
      if (!didLongPress.current) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onLongPress();
      }
    }

    function handleRemove(e: GestureResponderEvent) {
      e.stopPropagation();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onRemove();
    }

    return (
      <View ref={ref} style={styles.container}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={({ pressed }) => [
            styles.bubble,
            pressed && !isDragging && styles.bubblePressed,
            isDragging && styles.bubbleDragging,
            isDropTarget && styles.bubbleDropTarget,
          ]}
        >
          <Text style={styles.emoji}>{item.emoji}</Text>
        </Pressable>

        <Pressable style={styles.removeBadge} onPress={handleRemove} hitSlop={8}>
          <Text style={styles.removeText}>✕</Text>
        </Pressable>

        <Text style={styles.label} numberOfLines={2}>
          {item.label}
        </Text>

        <GestureDetector gesture={drag}>
          <View style={styles.dragHandle}>
            <Text style={styles.dragHandleText}>⠿</Text>
          </View>
        </GestureDetector>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4,
    position: 'relative',
  },
  bubble: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubblePressed: {
    backgroundColor: 'rgba(83, 74, 183, 0.15)',
    transform: [{ scale: 0.92 }],
  },
  bubbleDragging: {
    opacity: 0.3,
  },
  bubbleDropTarget: {
    backgroundColor: '#C7C2F5',
    borderWidth: 2.5,
    borderColor: '#534AB7',
  },
  emoji: {
    fontSize: 36,
  },
  label: {
    fontSize: 11,
    color: '#534AB7',
    textAlign: 'center',
    width: 80,
    lineHeight: 14,
  },
  removeBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D4537E',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  removeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  dragHandle: {
    paddingVertical: 4,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandleText: {
    fontSize: 14,
    color: '#B0ABE8',
    letterSpacing: 1,
  },
});
