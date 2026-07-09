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

const LONG_PRESS_MS = 480;
const SPIN_INTERVAL_MS = 100;
const MIN_TRASH_HEIGHT = 80;
const TRASH_BOTTOM_MARGIN = 20;
const TRASH_TOP_GAP = 12;

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

  const trashZoneRef = useRef<View>(null);
  const trashZoneLayout = useRef<SlotLayout | null>(null);
  const trashOpacity = useRef(new Animated.Value(0)).current;
  const [isOverTrash, setIsOverTrash] = useState(false);
  const isOverTrashRef = useRef(false);
  const [wrapperHeight, setWrapperHeight] = useState(0);
  const [stripHeight, setStripHeight] = useState(0);
  const trashZoneHeight = wrapperHeight > 0 && stripHeight > 0
    ? Math.max(MIN_TRASH_HEIGHT, wrapperHeight - stripHeight - TRASH_BOTTOM_MARGIN - TRASH_TOP_GAP)
    : 96;

  const addHoldTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addSpinInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const addDidLongPress = useRef(false);
  const [addSpinTargetIndex, setAddSpinTargetIndex] = useState<number | null>(null);
  const onAddRef = useRef(onAdd);
  onAddRef.current = onAdd;
  const onTapSlotRef = useRef(onTapSlot);
  onTapSlotRef.current = onTapSlot;

  function handleAddPressIn() {
    addDidLongPress.current = false;
    addHoldTimer.current = setTimeout(() => {
      addDidLongPress.current = true;
      const newIndex = sentenceLengthRef.current;
      setAddSpinTargetIndex(newIndex);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onAddRef.current();
      addSpinInterval.current = setInterval(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onTapSlotRef.current(newIndex);
      }, SPIN_INTERVAL_MS);
    }, LONG_PRESS_MS);
  }

  function handleAddPressOut() {
    if (addHoldTimer.current) {
      clearTimeout(addHoldTimer.current);
      addHoldTimer.current = null;
    }
    if (addSpinInterval.current) {
      clearInterval(addSpinInterval.current);
      addSpinInterval.current = null;
    }
    setAddSpinTargetIndex(null);
    if (!addDidLongPress.current) {
      onLongPressAdd();
    }
  }

  function measureAll() {
    stripRef.current?.measureInWindow((x, y) => {
      stripOrigin.current = { x, y };
    });
    slotRefs.current.forEach((ref, i) => {
      ref?.measureInWindow((x, y, w, h) => {
        slotLayouts.current[i] = { x, y, width: w, height: h };
      });
    });
    trashZoneRef.current?.measureInWindow((x, y, w, h) => {
      trashZoneLayout.current = { x, y, width: w, height: h };
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
      Animated.timing(trashOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    [sentence]
  );

  const handleDragMove = useCallback((absX: number, absY: number) => {
    if (!dragStateRef.current) return;
    ghostX.setValue(absX - stripOrigin.current.x - 40);
    ghostY.setValue(absY - stripOrigin.current.y - 40);

    const tz = trashZoneLayout.current;
    const overTrash = !!tz &&
      absX >= tz.x && absX <= tz.x + tz.width &&
      absY >= tz.y && absY <= tz.y + tz.height;

    if (overTrash !== isOverTrashRef.current) {
      isOverTrashRef.current = overTrash;
      setIsOverTrash(overTrash);
      if (overTrash) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Clear any drop-target highlight from slots
        const next: DragState = { ...dragStateRef.current, toIndex: dragStateRef.current.fromIndex };
        dragStateRef.current = next;
        setDragState(next);
      }
    }

    if (!overTrash) {
      const toIndex = findClosestSlot(absX, absY);
      if (toIndex !== dragStateRef.current.toIndex) {
        const next: DragState = { ...dragStateRef.current, toIndex };
        dragStateRef.current = next;
        setDragState(next);
      }
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!dragStateRef.current) return;
    const { fromIndex, toIndex } = dragStateRef.current;
    ghostOpacity.setValue(0);
    Animated.timing(trashOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    dragStateRef.current = null;
    setDragState(null);

    if (isOverTrashRef.current) {
      isOverTrashRef.current = false;
      setIsOverTrash(false);
      onRemoveSlot(fromIndex);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else if (fromIndex !== toIndex) {
      onMoveSlot(fromIndex, toIndex);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [onMoveSlot, onRemoveSlot]);

  return (
    <View
      ref={stripRef}
      style={styles.wrapper}
      onLayout={(e) => {
        setWrapperHeight(e.nativeEvent.layout.height);
        stripRef.current?.measureInWindow((x, y) => {
          stripOrigin.current = { x, y };
        });
      }}
    >
      <View style={styles.strip} onLayout={(e) => setStripHeight(e.nativeEvent.layout.height)}>
        {sentence.map((item, i) => (
          <EmojiSlot
            key={i}
            ref={(r) => { slotRefs.current[i] = r; }}
            item={item}
            onTap={() => onTapSlot(i)}
            onLongPress={() => onLongPressSlot(i)}
            onDragStart={(ax, ay) => handleDragStart(i, ax, ay)}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            isDragging={dragState?.fromIndex === i}
            isDropTarget={dragState !== null && dragState.toIndex === i && dragState.fromIndex !== i}
            isSpinning={addSpinTargetIndex === i}
          />
        ))}

        {sentence.length < maxLength && (
          <Pressable
            style={[styles.addBtn, addSpinTargetIndex !== null && styles.addBtnSpinning]}
            onPressIn={handleAddPressIn}
            onPressOut={handleAddPressOut}
          >
            <Text style={styles.addText}>+</Text>
          </Pressable>
        )}
      </View>

      {/* Trash zone — fades in when a drag starts, drop here to delete */}
      <Animated.View
        ref={trashZoneRef}
        pointerEvents="none"
        style={[styles.trashZone, isOverTrash && styles.trashZoneActive, { opacity: trashOpacity, height: trashZoneHeight }]}
      >
        <Text style={styles.trashEmoji}>🗑️</Text>
      </Animated.View>

      {/* Ghost bubble — last child so it renders above the trash zone */}
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
  wrapper: {
    flex: 1,
  },
  strip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  trashZone: {
    position: 'absolute',
    bottom: TRASH_BOTTOM_MARGIN,
    left: 40,
    right: 40,
    borderRadius: 24,
    backgroundColor: 'rgba(212, 83, 126, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(212, 83, 126, 0.35)',
  },
  trashZoneActive: {
    backgroundColor: 'rgba(212, 83, 126, 0.28)',
    borderStyle: 'solid',
    borderColor: '#D4537E',
  },
  trashEmoji: {
    fontSize: 32,
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
  addBtnSpinning: {
    backgroundColor: 'rgba(151, 196, 89, 0.2)',
    borderStyle: 'solid',
    borderColor: '#97C459',
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
