import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  FlatList,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { EMOJI_CATEGORIES, EmojiCategory, EmojiItem } from '../data/emojiData';

const RECENTS_CATEGORY: EmojiCategory = {
  id: 'recent',
  name: 'recent',
  icon: '🕐',
  items: [],
};

interface Props {
  visible: boolean;
  recents: EmojiItem[];
  onUsed: (item: EmojiItem) => void;
  onReplace: (item: EmojiItem) => void;
  onAddAfter: (item: EmojiItem) => void;
  onClose: () => void;
  appendOnly?: boolean;
}

export function EmojiPicker({ visible, recents, onUsed, onReplace, onAddAfter, onClose, appendOnly }: Props) {
  const [activeCatId, setActiveCatId] = useState(EMOJI_CATEGORIES[0].id);

  const categories: EmojiCategory[] = recents.length > 0
    ? [{ ...RECENTS_CATEGORY, items: recents }, ...EMOJI_CATEGORIES]
    : EMOJI_CATEGORIES;

  useEffect(() => {
    if (visible) {
      setActiveCatId(recents.length > 0 ? 'recent' : EMOJI_CATEGORIES[0].id);
    }
  }, [visible]);

  const activeCategory = categories.find((c) => c.id === activeCatId) ?? categories[0];

  function handleSelectItem(item: EmojiItem) {
    onUsed(item);
    if (appendOnly) {
      onAddAfter(item);
    } else {
      onReplace(item);
    }
  }

  function handleClose() {
    onClose();
  }

  function handleCatChange(id: string) {
    setActiveCatId(id);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>pick an emoji</Text>
          <Pressable style={styles.closeBtn} onPress={handleClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        {/* Category tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          contentContainerStyle={styles.tabs}
        >
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              style={[styles.tab, activeCatId === cat.id && styles.tabActive]}
              onPress={() => handleCatChange(cat.id)}
            >
              <Text style={[styles.tabText, activeCatId === cat.id && styles.tabTextActive]}>
                {cat.icon} {cat.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Emoji grid */}
        <FlatList
          data={activeCategory.items}
          keyExtractor={(item) => item.emoji}
          numColumns={4}
          style={styles.grid}
          contentContainerStyle={styles.gridContent}
          renderItem={({ item }) => (
            <Pressable
              style={styles.gridItem}
              onPress={() => handleSelectItem(item)}
            >
              <Text style={styles.gridEmoji}>{item.emoji}</Text>
              <Text style={styles.gridLabel} numberOfLines={2}>{item.label}</Text>
            </Pressable>
          )}
        />

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F0',
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '500',
    color: '#3C3489',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D4537E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  tabScroll: {
    flexGrow: 0,
    marginBottom: 12,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#CECBF6',
    backgroundColor: 'white',
  },
  tabActive: {
    backgroundColor: '#534AB7',
    borderColor: '#534AB7',
  },
  tabText: {
    fontSize: 13,
    color: '#534AB7',
    fontWeight: '500',
  },
  tabTextActive: {
    color: 'white',
  },
  grid: {
    flex: 1,
  },
  gridContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  gridItem: {
    flex: 1,
    margin: 4,
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#EEEDFE',
    gap: 4,
  },
  gridItemSelected: {
    backgroundColor: '#EEEDFE',
    borderColor: '#534AB7',
  },
  gridEmoji: {
    fontSize: 28,
  },
  gridLabel: {
    fontSize: 9,
    color: '#534AB7',
    textAlign: 'center',
    lineHeight: 12,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEDFE',
  },
  footerBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
  },
  replaceBtn: {
    backgroundColor: '#534AB7',
  },
  replaceBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  addBtn: {
    backgroundColor: '#EAF3DE',
    borderWidth: 1.5,
    borderColor: '#97C459',
  },
  addBtnText: {
    color: '#3B6D11',
    fontWeight: '600',
    fontSize: 15,
  },
});
