import React, { useRef, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { EmojiItem } from '../data/emojiData';

interface Props {
  item: EmojiItem;
  onTap: () => void;
  onLongPress: () => void;
  onDragStart: (absX: number, absY: number) => void;
  onDragMove: (absX: number, absY: number) => void;
  onDragEnd: () => void;
  isDragging?: boolean;
  isDropTarget?: boolean;
  isSpinning?: boolean;
}

const LONG_PRESS_MS = 480;
const SPIN_INTERVAL_MS = 100;

export const EmojiSlot = React.forwardRef<View, Props>(
  ({ item, onTap, onLongPress, onDragStart, onDragMove, onDragEnd, isDragging, isDropTarget, isSpinning }, ref) => {
    const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const spinInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const didLongPress = useRef(false);
    const [spinning, setSpinning] = useState(false);
    const spinningRef = useRef(false);
    const emojiScale = useRef(new Animated.Value(1)).current;
    const onTapRef = useRef(onTap);
    onTapRef.current = onTap;

    const dragCbs = useRef({ onDragStart, onDragMove, onDragEnd });
    dragCbs.current = { onDragStart, onDragMove, onDragEnd };

    // Pop animation on each new emoji while spinning (internally or externally)
    useEffect(() => {
      if (!spinningRef.current && !isSpinning) return;
      emojiScale.setValue(0.6);
      Animated.timing(emojiScale, {
        toValue: 1.0,
        duration: 70,
        useNativeDriver: true,
      }).start();
    }, [item]);

    // Settle animation when external spin ends
    const wasExternallySpinning = useRef(false);
    useEffect(() => {
      if (isSpinning) {
        wasExternallySpinning.current = true;
      } else if (wasExternallySpinning.current) {
        wasExternallySpinning.current = false;
        Animated.sequence([
          Animated.timing(emojiScale, { toValue: 1.2, duration: 80, useNativeDriver: true }),
          Animated.timing(emojiScale, { toValue: 1.0, duration: 80, useNativeDriver: true }),
        ]).start();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }, [isSpinning]);

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

    function startSpin() {
      didLongPress.current = true;
      spinningRef.current = true;
      setSpinning(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onTapRef.current();
      spinInterval.current = setInterval(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onTapRef.current();
      }, SPIN_INTERVAL_MS);
    }

    function stopSpin() {
      if (spinInterval.current) {
        clearInterval(spinInterval.current);
        spinInterval.current = null;
      }
      spinningRef.current = false;
      setSpinning(false);
      Animated.sequence([
        Animated.timing(emojiScale, { toValue: 1.2, duration: 80, useNativeDriver: true }),
        Animated.timing(emojiScale, { toValue: 1.0, duration: 80, useNativeDriver: true }),
      ]).start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    function handlePressIn() {
      didLongPress.current = false;
      holdTimer.current = setTimeout(startSpin, LONG_PRESS_MS);
    }

    function handlePressOut() {
      if (holdTimer.current) {
        clearTimeout(holdTimer.current);
        holdTimer.current = null;
      }
      if (didLongPress.current) {
        stopSpin();
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onLongPress();
      }
    }

    return (
      <View ref={ref} style={styles.container}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={({ pressed }) => [
            styles.bubble,
            pressed && !isDragging && !spinning && !isSpinning && styles.bubblePressed,
            isDragging && styles.bubbleDragging,
            isDropTarget && styles.bubbleDropTarget,
            (spinning || isSpinning) && styles.bubbleSpinning,
          ]}
        >
          <Animated.Text style={[styles.emoji, { transform: [{ scale: emojiScale }] }]}>
            {item.emoji}
          </Animated.Text>
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
  bubbleSpinning: {
    backgroundColor: 'rgba(83, 74, 183, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(83, 74, 183, 0.35)',
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
