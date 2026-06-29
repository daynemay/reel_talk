import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  FlatList,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import * as Speech from 'expo-speech';

interface Props {
  visible: boolean;
  selectedVoice: Speech.Voice | null;
  onSelect: (voice: Speech.Voice | null) => void;
  onClose: () => void;
}

function qualityLabel(quality: Speech.VoiceQuality): string {
  return quality === Speech.VoiceQuality.Enhanced ? 'Enhanced' : '';
}

function qualityRank(quality: Speech.VoiceQuality): number {
  return quality === Speech.VoiceQuality.Enhanced ? 1 : 0;
}

function langDisplayName(code: string): string {
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) ?? code;
  } catch {
    return code;
  }
}

const PREVIEW_TEXT = 'Oh my gosh... a talking emoji!';

export function VoicePicker({ visible, selectedVoice, onSelect, onClose }: Props) {
  const [voices, setVoices] = useState<Speech.Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLang, setActiveLang] = useState('en');
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    Speech.getAvailableVoicesAsync().then((available) => {
      if (cancelled) return;
      available.sort((a, b) => {
        const la = a.language.split('-')[0];
        const lb = b.language.split('-')[0];
        if (la !== lb) return la.localeCompare(lb);
        if (b.quality !== a.quality) return qualityRank(b.quality) - qualityRank(a.quality);
        return a.name.localeCompare(b.name);
      });
      setVoices(available);
      setActiveLang(selectedVoice?.language.split('-')[0] ?? 'en');
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [visible]);

  const langCodes = [...new Set(voices.map((v) => v.language.split('-')[0]))].sort((a, b) => {
    if (a === 'en') return -1;
    if (b === 'en') return 1;
    return a.localeCompare(b);
  });

  const filteredVoices = voices.filter((v) => v.language.split('-')[0] === activeLang);

  async function handlePreview(voice: Speech.Voice) {
    if (previewingId === voice.identifier) {
      await Speech.stop();
      setPreviewingId(null);
      return;
    }
    await Speech.stop();
    setPreviewingId(voice.identifier);
    Speech.speak(PREVIEW_TEXT, {
      voice: voice.identifier,
      rate: 0.85,
      pitch: 1.2,
      onDone: () => setPreviewingId(null),
      onStopped: () => setPreviewingId(null),
      onError: () => setPreviewingId(null),
    });
  }

  function handleSelect(voice: Speech.Voice | null) {
    Speech.stop();
    setPreviewingId(null);
    onSelect(voice);
    onClose();
  }

  function handleClose() {
    Speech.stop();
    setPreviewingId(null);
    onClose();
  }

  const isDefaultSelected = selectedVoice === null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>pick a voice</Text>
          <Pressable style={styles.closeBtn} onPress={handleClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator style={styles.loader} size="large" color="#534AB7" />
        ) : (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tabScroll}
              contentContainerStyle={styles.tabs}
            >
              {langCodes.map((lang) => (
                <Pressable
                  key={lang}
                  style={[styles.tab, activeLang === lang && styles.tabActive]}
                  onPress={() => setActiveLang(lang)}
                >
                  <Text style={[styles.tabText, activeLang === lang && styles.tabTextActive]}>
                    {langDisplayName(lang)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <FlatList
              data={filteredVoices}
              keyExtractor={(v) => v.identifier}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={activeLang === 'en' ? (
                <Pressable
                  style={[styles.voiceRow, isDefaultSelected && styles.voiceRowSelected]}
                  onPress={() => handleSelect(null)}
                >
                  <View style={styles.voiceInfo}>
                    <Text style={[styles.voiceName, isDefaultSelected && styles.voiceNameSelected]}>
                      System Default
                    </Text>
                    <Text style={styles.voiceMeta}>uses device default voice</Text>
                  </View>
                  {isDefaultSelected && <Text style={styles.checkmark}>✓</Text>}
                </Pressable>
              ) : null}
              renderItem={({ item }) => {
                const isSelected = selectedVoice?.identifier === item.identifier;
                const isPreviewing = previewingId === item.identifier;
                const badge = qualityLabel(item.quality);
                return (
                  <Pressable
                    style={[styles.voiceRow, isSelected && styles.voiceRowSelected]}
                    onPress={() => handleSelect(item)}
                  >
                    <View style={styles.voiceInfo}>
                      <Text style={[styles.voiceName, isSelected && styles.voiceNameSelected]}>
                        {item.name}
                      </Text>
                      <Text style={styles.voiceMeta}>
                        {item.language}{badge ? ` · ${badge}` : ''}
                      </Text>
                    </View>
                    <Pressable
                      style={[styles.previewBtn, isPreviewing && styles.previewBtnActive]}
                      onPress={() => handlePreview(item)}
                      hitSlop={10}
                    >
                      <Text style={[styles.previewBtnText, isPreviewing && styles.previewBtnTextActive]}>
                        {isPreviewing ? '■' : '▶'}
                      </Text>
                    </Pressable>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </Pressable>
                );
              }}
            />
          </>
        )}
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
  loader: {
    flex: 1,
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
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 8,
  },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#EEEDFE',
    gap: 10,
  },
  voiceRowSelected: {
    backgroundColor: '#EEEDFE',
    borderColor: '#534AB7',
  },
  voiceInfo: {
    flex: 1,
    gap: 2,
  },
  voiceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3C3489',
  },
  voiceNameSelected: {
    color: '#534AB7',
  },
  voiceMeta: {
    fontSize: 12,
    color: '#888780',
  },
  previewBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEEDFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBtnActive: {
    backgroundColor: '#534AB7',
  },
  previewBtnText: {
    fontSize: 12,
    color: '#534AB7',
    fontWeight: '700',
  },
  previewBtnTextActive: {
    color: 'white',
  },
  checkmark: {
    fontSize: 16,
    color: '#534AB7',
    fontWeight: '700',
    width: 20,
    textAlign: 'center',
  },
});
