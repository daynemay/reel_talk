import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

import { useSentence } from '../hooks/useSentence';
import { useRecents } from '../hooks/useRecents';
import { SentenceStrip } from '../components/SentenceStrip';
import { EmojiPicker } from '../components/EmojiPicker';
import { VoicePicker } from '../components/VoicePicker';
import { EmojiItem } from '../data/emojiData';

export default function HomeScreen() {
  const {
    sentence,
    shuffle,
    spinSlot,
    replaceSlot,
    insertAfter,
    addRandom,
    removeSlot,
    moveSlot,
  } = useSentence();

  const { recents, addRecent } = useRecents();

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTargetIdx, setPickerTargetIdx] = useState<number | null>(null);
  const [pickerAppendOnly, setPickerAppendOnly] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [looping, setLooping] = useState(false);
  const [voicePickerVisible, setVoicePickerVisible] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<Speech.Voice | null>(null);
  const loopingRef = useRef(false);
  const sentenceRef = useRef(sentence);
  sentenceRef.current = sentence;

  function toggleLoop() {
    const next = !loopingRef.current;
    loopingRef.current = next;
    setLooping(next);
  }

  function speakSentence() {
    const text = sentenceRef.current.map((s) => s.label).join('... ');
    Speech.speak(text, {
      rate: 0.85,
      pitch: 1.2,
      voice: selectedVoice?.identifier,
      onDone: () => { loopingRef.current ? speakSentence() : setSpeaking(false); },
      onStopped: () => { setSpeaking(false); },
      onError: () => { setSpeaking(false); },
    });
  }

  function handleLongPressSlot(index: number) {
    setPickerTargetIdx(index);
    setPickerAppendOnly(false);
    setPickerVisible(true);
  }

  function handleLongPressAdd() {
    setPickerTargetIdx(sentence.length - 1);
    setPickerAppendOnly(true);
    setPickerVisible(true);
  }

  function handlePickerReplace(item: EmojiItem) {
    if (pickerTargetIdx !== null) replaceSlot(pickerTargetIdx, item);
    setPickerVisible(false);
    setPickerTargetIdx(null);
  }

  function handlePickerAddAfter(item: EmojiItem) {
    if (pickerTargetIdx !== null) insertAfter(pickerTargetIdx, item);
    setPickerVisible(false);
    setPickerTargetIdx(null);
  }

  function handlePickerClose() {
    setPickerVisible(false);
    setPickerTargetIdx(null);
    setPickerAppendOnly(false);
  }

  function handleShuffle() {
    Speech.stop();
    setSpeaking(false);
    shuffle();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function handlePlay() {
    if (speaking) {
      await Speech.stop();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    speakSentence();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>reel talk 🎬</Text>
        <Text style={styles.hint}>tap to pick · hold to randomize · drag ⠿ to move</Text>
      </View>

      <View style={styles.stage}>
        <SentenceStrip
          sentence={sentence}
          onTapSlot={spinSlot}
          onLongPressSlot={handleLongPressSlot}
          onRemoveSlot={removeSlot}
          onAdd={addRandom}
          onLongPressAdd={handleLongPressAdd}
          onMoveSlot={moveSlot}
        />
      </View>

      <View style={styles.actionBar}>
        <Pressable style={styles.shuffleBtn} onPress={handleShuffle}>
          <Text style={styles.shuffleBtnText}>🔀</Text>
        </Pressable>
        <Pressable
          style={[styles.playBtn, speaking && styles.playBtnSpeaking]}
          onPress={handlePlay}
        >
          <Text style={styles.playBtnText}>{speaking ? '■ stop' : '▶ play it!'}</Text>
        </Pressable>
        <Pressable style={[styles.loopBtn, looping && styles.loopBtnActive]} onPress={toggleLoop}>
          <Text style={styles.loopBtnText}>🔁</Text>
        </Pressable>
        <Pressable style={[styles.voiceBtn, selectedVoice && styles.voiceBtnActive]} onPress={() => setVoicePickerVisible(true)}>
          <Text style={styles.voiceBtnText}>🎤</Text>
        </Pressable>
      </View>

      <EmojiPicker
        visible={pickerVisible}
        recents={recents}
        onUsed={addRecent}
        onReplace={handlePickerReplace}
        onAddAfter={handlePickerAddAfter}
        onClose={handlePickerClose}
        appendOnly={pickerAppendOnly}
      />

      <VoicePicker
        visible={voicePickerVisible}
        selectedVoice={selectedVoice}
        onSelect={setSelectedVoice}
        onClose={() => setVoicePickerVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFF9F0',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 6,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: '#3C3489',
    letterSpacing: -1,
  },
  hint: {
    fontSize: 13,
    color: '#888780',
  },
  stage: {
    flex: 1,
    backgroundColor: '#EEEDFE',
    justifyContent: 'flex-start',
  },
  actionBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  shuffleBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FAC775',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shuffleBtnText: {
    fontSize: 22,
  },
  playBtn: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#534AB7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnSpeaking: {
    backgroundColor: '#993556',
  },
  playBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
  },
  loopBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EEEDFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loopBtnActive: {
    backgroundColor: '#534AB7',
  },
  loopBtnText: {
    fontSize: 22,
  },
  voiceBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EEEDFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceBtnActive: {
    backgroundColor: '#534AB7',
  },
  voiceBtnText: {
    fontSize: 22,
  },
});
