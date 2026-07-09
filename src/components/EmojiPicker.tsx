import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  SectionList,
  ScrollView,
  StyleSheet,
  ViewabilityConfig,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EMOJI_CATEGORIES, EmojiCategory, EmojiItem } from '../data/emojiData';

const COLS = 4;
type GridRow = EmojiItem[];

interface Section {
  id: string;
  title: string;
  icon: string;
  data: GridRow[];
}

const RECENTS_CATEGORY: EmojiCategory = {
  id: 'recent',
  name: 'recent',
  icon: '🕐',
  items: [],
};

function chunkRows(items: EmojiItem[]): GridRow[] {
  const rows: GridRow[] = [];
  for (let i = 0; i < items.length; i += COLS) {
    rows.push(items.slice(i, i + COLS));
  }
  return rows;
}

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
  const { top: topInset } = useSafeAreaInsets();
  const [activeCatId, setActiveCatId] = useState(EMOJI_CATEGORIES[0].id);
  const listRef = useRef<SectionList<GridRow, Section>>(null);
  const programmaticScroll = useRef(false);

  const categories: EmojiCategory[] = recents.length > 0
    ? [{ ...RECENTS_CATEGORY, items: recents }, ...EMOJI_CATEGORIES]
    : EMOJI_CATEGORIES;

  const sections: Section[] = categories.map((cat) => ({
    id: cat.id,
    title: cat.name,
    icon: cat.icon,
    data: chunkRows(cat.items),
  }));

  useEffect(() => {
    if (visible) {
      setActiveCatId(recents.length > 0 ? 'recent' : EMOJI_CATEGORIES[0].id);
    }
  }, [visible]);

  function handleSelectItem(item: EmojiItem) {
    onUsed(item);
    if (appendOnly) {
      onAddAfter(item);
    } else {
      onReplace(item);
    }
  }

  function handleTabPress(id: string, sectionIndex: number) {
    setActiveCatId(id);
    programmaticScroll.current = true;
    listRef.current?.scrollToLocation({ sectionIndex, itemIndex: 0, animated: true });
    setTimeout(() => { programmaticScroll.current = false; }, 600);
  }

  const viewabilityConfig = useRef<ViewabilityConfig>({
    itemVisiblePercentThreshold: 20,
  }).current;

  // Stable callback required by SectionList
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    if (programmaticScroll.current) return;
    const first = viewableItems[0];
    if (!first) return;
    // Regular items carry first.section.id; section headers carry first.item.id
    const id = first.section?.id ?? first.item?.id;
    if (id) setActiveCatId(id);
  }).current;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: topInset + 16 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>pick an emoji</Text>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        {/* Jump tabs — scroll to section on press, highlight active on scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          contentContainerStyle={styles.tabs}
        >
          {sections.map((sec, index) => (
            <Pressable
              key={sec.id}
              style={[styles.tab, activeCatId === sec.id && styles.tabActive]}
              onPress={() => handleTabPress(sec.id, index)}
            >
              <Text style={[styles.tabText, activeCatId === sec.id && styles.tabTextActive]}>
                {sec.icon} {sec.title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <SectionList<GridRow, Section>
          ref={listRef}
          sections={sections}
          keyExtractor={(row, i) => `${row[0]?.emoji ?? 'empty'}-${i}`}
          stickySectionHeadersEnabled
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{section.icon}  {section.title}</Text>
            </View>
          )}
          renderItem={({ item: row }) => (
            <View style={styles.gridRow}>
              {row.map((item) => (
                <Pressable
                  key={item.emoji}
                  style={styles.gridItem}
                  onPress={() => handleSelectItem(item)}
                >
                  <Text style={styles.gridEmoji}>{item.emoji}</Text>
                  <Text style={styles.gridLabel} numberOfLines={2}>{item.label}</Text>
                </Pressable>
              ))}
              {row.length < COLS && Array.from({ length: COLS - row.length }).map((_item, i) => (
                <View key={`pad-${i}`} style={styles.gridItemPad} />
              ))}
            </View>
          )}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F0',
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
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  sectionHeader: {
    backgroundColor: '#FFF9F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEDFE',
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3C3489',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gridRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
  },
  gridItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#EEEDFE',
    gap: 4,
  },
  gridItemPad: {
    flex: 1,
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
});
