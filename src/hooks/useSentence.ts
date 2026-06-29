import { useState, useCallback } from 'react';
import { EmojiItem, ALL_EMOJI, randomItem, randomSentence } from '../data/emojiData';

export function useSentence() {
  const [sentence, setSentence] = useState<EmojiItem[]>(() => randomSentence());

  const shuffle = useCallback(() => {
    setSentence(randomSentence());
  }, []);

  const spinSlot = useCallback((index: number) => {
    setSentence((prev) => {
      const next = [...prev];
      next[index] = randomItem(ALL_EMOJI);
      return next;
    });
  }, []);

  const replaceSlot = useCallback((index: number, item: EmojiItem) => {
    setSentence((prev) => {
      const next = [...prev];
      next[index] = item;
      return next;
    });
  }, []);

  const insertAfter = useCallback((index: number, item: EmojiItem) => {
    setSentence((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, item);
      return next;
    });
  }, []);

  const addRandom = useCallback(() => {
    if (sentence.length >= 8) return;
    setSentence((prev) => [...prev, randomItem(ALL_EMOJI)]);
  }, [sentence.length]);

  const removeSlot = useCallback((index: number) => {
    setSentence((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const moveSlot = useCallback((from: number, to: number) => {
    if (from === to) return;
    setSentence((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  return {
    sentence,
    shuffle,
    spinSlot,
    replaceSlot,
    insertAfter,
    addRandom,
    removeSlot,
    moveSlot,
  };
}
