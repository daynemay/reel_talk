import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EmojiItem } from '../data/emojiData';

const STORAGE_KEY = 'saywhat:recents';
const MAX_RECENTS = 12;

export function useRecents() {
  const [recents, setRecents] = useState<EmojiItem[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setRecents(JSON.parse(raw));
    });
  }, []);

  function addRecent(item: EmojiItem) {
    setRecents((prev) => {
      const next = [item, ...prev.filter((r) => r.emoji !== item.emoji)].slice(0, MAX_RECENTS);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  return { recents, addRecent };
}
