import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Animated,
  Pressable,
  Text,
  StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { EmojiItem } from '../data/emojiData';
import { EmojiSlot } from './EmojiSlot';

interface DragState {
  fromIndex: number;
  toIndex: number;
  ghostItem: EmojiItem;
}

interface SlotLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  sentence: EmojiItem[];
  onTapSlot: (index: number) => void;
  onLongPressSlot: (index: number) => void;
  onRemoveSlot: (index: number) => void;
  onAdd: () => void;
  onLongPressAdd: () => void;
  onMoveSlot: (from: number, to: number) => void;
  maxLength?: number;
}

export function SentenceStrip({
  sentence,
  onTapSlot,
  onLongPressSlot,
  onRemoveSlot,
  onAdd,
  onLongPressAdd,
  onMoveSlot,
  maxLength = 8,
}: Props) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const dragStateRef = useRef<DragState | null>(null);

  const slotRefs = useRef<Array<View | null>>([]);
  const slotLayouts = useRef<Array<SlotLayout | null>>([]);
  const stripRef = useRef<View>(null);
  const stripOrigin = useRef({ x: 0, y: 0 });
  const sentenceLengthRef = useRef(sentence.length);
  sentenceLengthRef.current = sentence.length;

  const ghostX = useRef(new Animated.Value(0)).current;
  const ghostY = useRef(new Animated.Value(0)).current;
  const ghostOpacity = useRef(new Animated.Value(0)).current;

  function measureAll() {
    stripRef.current?.measureInWindow((x, y) => {
      stripOrigin.current = { x, y };
    });
    slotRefs.current.forEach((ref, i) => {
      ref?.measureInWindow((x, y, w, h) => {
        slotLayouts.current[i] = { x, y, width: w, height: h };
      });
    });
  }

  function findClosestSlot(absX: number, absY: number): number {
    let closest = dragStateRef.current?.fromIndex ?? 0;
    let minDist = Infinity;
    slotLayouts.current.slice(0, sentenceLengthRef.current).forEach((layout, i) => {
      if (!layout) return;
      const cx = layout.x + layout.width / 2;
      const cy = layout.y + layout.height / 2;
      const dist = Math.sqrt((absX - cx) ** 2 + (absY - cy) ** 2);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });
    return closest;
  }

  const handleDragStart = useCallback(
    (fromIndex: number, absX: number, absY: number) => {
      measureAll();
      const newState: DragState = { fromIndex, toIndex: fromIndex, ghostItem: sentence[fromIndex] };
      dragStateRef.current = newState;
      setDragState(newState);
      ghostX.setValue(absX - stripOrigin.current.x - 40);
      ghostY.setValue(absY - stripOrigin.current.y - 40);
      ghostOpacity.setValue(0.88);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    [sentence]
  );

  const handleDragMove = useCallback((absX: number, absY: number) => {
    if (!dragStateRef.current) return;
    ghostX.setValue(absX - stripOrigin.current.x - 40);
    ghostY.setValue(absY - stripOrigin.current.y - 40);
    const toIndex = findClosestSlot(absX, absY);
    if (toIndex !== dragStateRef.current.toIndex) {
      const next: DragState = { ...dragStateRef.current, toIndex };
      dragStateRef.current = next;
      setDragState(next);
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!dragStateRef.current) return;
    const { fromIndex, toIndex } = dragStateRef.current;
    ghostOpacity.setValue(0);
    dragStateRef.current = null;
    setDragState(null);
    if (fromIndex !== toIndex) {
      onMoveSlot(fromIndex, toIndex);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [onMoveSlot]);

  return (
    <View
      ref={stripRef}
      style={styles.strip}
      onLayout={() => {
        stripRef.current?.measureInWindow((x, y) => {
          stripOrigin.current = { x, y };
        });
      }}
    >
      {sentence.map((item, i) => (
        <EmojiSlot
          key={i}
          ref={(r) => { slotRefs.current[i] = r; }}
          item={item}
          onTap={() => onTapSlot(i)}
          onLongPress={() => onLongPressSlot(i)}
          onRemove={() => onRemoveSlot(i)}
          onDragStart={(ax, ay) => handleDragStart(i, ax, ay)}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          isDragging={dragState?.fromIndex === i}
          isDropTarget={dragState !== null && dragState.toIndex === i && dragState.fromIndex !== i}
        />
      ))}

      {sentence.length < maxLength && (
        <Pressable style={styles.addBtn} onPress={onLongPressAdd} onLongPress={onAdd} delayLongPress={480}>
          <Text style={styles.addText}>+</Text>
        </Pressable>
      )}

      {/* Ghost bubble follows the finger during drag */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ghostContainer,
          { left: ghostX, top: ghostY, opacity: ghostOpacity },
        ]}
      >
        <View style={styles.ghostBubble}>
          <Text style={styles.ghostEmoji}>{dragState?.ghostItem.emoji ?? ''}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  addBtn: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#97C459',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    fontSize: 32,
    color: '#3B6D11',
    lineHeight: 36,
  },
  ghostContainer: {
    position: 'absolute',
    zIndex: 100,
  },
  ghostBubble: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  ghostEmoji: {
    fontSize: 36,
  },
});
