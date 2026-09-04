import {
  GothicA1_400Regular,
  GothicA1_500Medium,
  GothicA1_600SemiBold,
  GothicA1_700Bold,
  useFonts,
} from '@expo-google-fonts/gothic-a1';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  BackHandler,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { getScenarioPhrase, IMPOSSIBLE_DEADLINE_SCENARIO } from '@/domain/scenarios';
import { braveLineSessionStore, useBraveLineAudio } from '@/services';

const reelPlate = require('../../assets/plates/reel-emblem.png');

const INK = '#251438';
const COBALT = '#143cb2';
const COBALT_LIGHT = '#1e58c0';
const CHALK = '#f8f8e9';
const ORANGE = '#ff6418';
const QUIET = '#968999';

const waveform = [
  5, 7, 14, 29, 19, 7, 34, 49, 68, 42, 22, 31, 14, 55, 38, 72, 18, 91, 49,
  25, 39, 17, 28, 58, 38, 69, 30, 20, 14, 62, 83, 47, 97, 59, 30, 38, 19, 53,
  23, 12, 36, 71, 99, 57, 34, 18, 41, 31, 58, 29, 47, 19, 37, 22, 17, 33, 49, 27,
  18, 43, 28, 15, 9,
];

type GuideLevel = 0 | 15 | 25;

export default function RehearseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; phraseId?: string }>();
  const { width, height } = useWindowDimensions();
  const audio = useBraveLineAudio();
  const [guideLevel, setGuideLevel] = useState<GuideLevel>(15);
  const [guideSpeaking, setGuideSpeaking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const reveal = useRef(new Animated.Value(0)).current;
  const signal = useRef(new Animated.Value(1)).current;
  const [fontsLoaded] = useFonts({
    GothicA1_400Regular,
    GothicA1_500Medium,
    GothicA1_600SemiBold,
    GothicA1_700Bold,
  });

  const frame = useMemo(() => {
    const frameHeight = Platform.OS === 'web' ? width * (1821 / 864) : height;
    return {
      h: frameHeight,
      sx: width / 864,
      sy: frameHeight / 1821,
      w: width,
    };
  }, [height, width]);

  const x = (value: number) => value * frame.sx;
  const y = (value: number) => value * frame.sy;
  const type = (value: number) => Math.max(value * frame.sx, value * 0.44);
  const retryPhrase =
    params.mode === 'retry' && typeof params.phraseId === 'string'
      ? getScenarioPhrase(IMPOSSIBLE_DEADLINE_SCENARIO, params.phraseId)
      : undefined;

  useEffect(() => () => {
    void Speech.stop();
  }, []);

  useEffect(() => {
    if (!audio.isRecording) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, [audio.isRecording]);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReducedMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      reveal.setValue(1);
      return;
    }
    reveal.setValue(0);
    Animated.timing(reveal, {
      duration: 420,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [reducedMotion, reveal]);

  useEffect(() => {
    signal.stopAnimation();
    if (reducedMotion || (!guideSpeaking && !audio.isRecording)) {
      signal.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(signal, { duration: 650, toValue: 0.48, useNativeDriver: true }),
        Animated.timing(signal, { duration: 650, toValue: 1, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [audio.isRecording, guideSpeaking, reducedMotion, signal]);

  function playQuietCoach() {
    if (busy || audio.isRecording) return;
    setNotice(null);

    if (guideSpeaking) {
      void Speech.stop();
      setGuideSpeaking(false);
      return;
    }

    if (guideLevel === 0) {
      setNotice('Choose 15% or 25% to hear Quiet Coach.');
      return;
    }

    setGuideSpeaking(true);
    Speech.speak(retryPhrase?.text ?? 'I can’t promise Thursday without risking the quality.', {
      language: 'en-US',
      pitch: 1,
      rate: 0.9,
      volume: guideLevel / 100,
      onDone: () => setGuideSpeaking(false),
      onError: () => {
        setGuideSpeaking(false);
        setNotice('Quiet Coach is unavailable. You can still rehearse from the script.');
      },
      onStopped: () => setGuideSpeaking(false),
    });
  }

  async function handleTake() {
    if (busy) return;
    setBusy(true);
    setNotice(null);

    if (!audio.isRecording) {
      await Speech.stop();
      setGuideSpeaking(false);

      if (audio.permission !== 'granted') {
        const permission = await audio.requestPermission();
        if (permission !== 'granted') {
          setBusy(false);
          setNotice(
            permission === 'denied'
              ? 'Microphone permission is needed for a private take.'
              : 'Recording is unavailable here. The script still works for silent practice.',
          );
          return;
        }
      }

      const started = await audio.startRecording({ guideStopped: true });
      setBusy(false);
      if (!started.ok) setNotice(started.userMessage);
      return;
    }

    const stopped = await audio.stopRecording();
    if (!stopped.ok) {
      setBusy(false);
      setNotice(stopped.userMessage);
      return;
    }

    const take = stopped.value;
    const activePhraseId = retryPhrase?.id ?? IMPOSSIBLE_DEADLINE_SCENARIO.retryPhraseId;
    const saved = await braveLineSessionStore.save({
      version: 1,
      updatedAt: take.capturedAt,
      scenarioId: IMPOSSIBLE_DEADLINE_SCENARIO.id,
      phase: 'review',
      activePhraseId,
      take,
      preferences: {
        guideVolume: guideLevel / 100,
        guideRate: 0.9,
        captions: true,
        reducedMotion,
      },
      feedback: null,
    });

    setBusy(false);
    router.replace({
      pathname: '/ready',
      params: {
        capturedAt: take.capturedAt,
        durationMs: String(take.durationMs),
        takeId: take.id,
        takeUri: take.uri,
        ...(saved.ok ? {} : { saveWarning: 'local-metadata-not-saved' }),
      },
    } as Href);
  }

  if (!fontsLoaded) {
    return <View style={styles.loadingFrame} testID="rehearse-loading" />;
  }

  return (
    <View style={[styles.frame, { height: frame.h, width: frame.w }]} testID="rehearse-frame">
      <View
        style={[styles.railTop, { height: y(899), left: x(137), width: x(28) }]}
      >
        {[107, 174, 610, 677].map((top) => (
          <View key={top} style={[styles.railTick, { top: y(top), height: Math.max(y(2), 1) }]} />
        ))}
      </View>

      <View
        style={[
          styles.railTurn,
          {
            borderBottomLeftRadius: x(28),
            height: y(34),
            left: x(137),
            top: y(898),
            width: frame.w - x(137),
          },
        ]}
      />

      <View
        style={[
          styles.quietRail,
          { height: y(337), left: x(148), top: y(931), width: Math.max(x(1), 1) },
        ]}
      />

      <View
        style={[styles.railLower, { height: y(230), left: x(137), top: y(1268), width: x(28) }]}
      >
        {[68, 122].map((top) => (
          <View key={top} style={[styles.railTick, { top: y(top), height: Math.max(y(2), 1) }]} />
        ))}
      </View>

      <Pressable
        accessibilityLabel="Back to scenario"
        accessibilityRole="button"
        disabled={audio.isRecording || busy}
        hitSlop={12}
        onPress={() => router.replace('/prepare')}
        style={[
          styles.backButton,
          { height: y(54), left: x(30), opacity: audio.isRecording || busy ? 0.35 : 1, top: y(30), width: x(56) },
        ]}
      >
        <Ionicons color={INK} name="arrow-back" size={type(54)} />
      </Pressable>

      <Text style={[styles.meta, { fontSize: type(27), left: x(210), lineHeight: type(34), top: y(42) }]}>SET A BOUNDARY</Text>
      <Text style={[styles.meta, { fontSize: type(27), lineHeight: type(34), right: x(25), top: y(42) }]}>
        {audio.isRecording ? `${Math.max(1, Math.ceil(audio.recordingDurationMs / 1000))}s SOLO TAKE` : '1:20 PRACTICE'}
      </Text>

      <Text style={[styles.handoff, { fontSize: type(22), left: x(210), lineHeight: type(29), top: y(156) }]}>
        {audio.isRecording
          ? 'SOLO TAKE  /  GUIDE 0%  →  RECORDING'
          : `HANDOFF  /  QUIET COACH ${guideLevel}%  →  YOUR TURN`}
      </Text>

      <View style={[styles.indexOne, { left: x(55), top: y(246) }]}>
        <Text style={[styles.indexText, { fontSize: type(31), lineHeight: type(36) }]}>01</Text>
        <View style={[styles.indexHairline, { marginLeft: x(14), width: x(34) }]} />
      </View>

      <Animated.Text
        accessibilityRole="header"
        style={[
          styles.activePhrase,
          { fontSize: type(94), left: x(209), lineHeight: type(106), top: y(236), width: x(620) },
          {
            opacity: reveal,
            transform: [
              {
                translateY: reveal.interpolate({
                  inputRange: [0, 1],
                  outputRange: [y(16), 0],
                }),
              },
            ],
          },
        ]}
      >
        {'I can’t\npromise\nThursday\nwithout\nrisking the\nquality.'}
      </Animated.Text>

      <View style={[styles.progressDots, { left: x(222), top: y(906) }]}>
        {Array.from({ length: 9 }, (_, index) => (
          <View key={index} style={[styles.progressDot, { height: x(8), marginRight: x(9), width: x(8) }]} />
        ))}
      </View>

      <Pressable
        accessibilityHint="Plays or stops the low-volume English guide"
        accessibilityLabel={guideSpeaking ? 'Stop Quiet Coach' : 'Hear Quiet Coach'}
        accessibilityRole="button"
        onPress={playQuietCoach}
        style={[styles.indexTwo, { left: x(55), top: y(887) }]}
      >
        <Text style={[styles.indexTextActive, { fontSize: type(31), lineHeight: type(36) }]}>02</Text>
        <Ionicons color={COBALT} name={guideSpeaking ? 'stop' : 'play'} size={type(27)} />
      </Pressable>

      <View style={[styles.indexThree, { left: x(55), top: y(995) }]}>
        <Text style={[styles.indexText, { fontSize: type(31), lineHeight: type(36) }]}>03</Text>
        <View style={[styles.indexHairline, { marginLeft: x(14), width: x(34) }]} />
      </View>

      <Text
        style={[
          styles.nextPhrase,
          { fontSize: type(61), left: x(209), lineHeight: type(68), top: y(992), width: x(432) },
        ]}
      >
        {retryPhrase ? retryPhrase.text : 'I can deliver a\nreliable version\nby Friday.'}
      </Text>

      <View style={[styles.splice, { height: y(29), left: x(137), top: y(1285), width: x(27) }]} />
      <View style={{ left: x(160), position: 'absolute', top: y(1292) }}>
        <View style={[styles.spliceTriangle, { borderBottomWidth: x(7), borderRightWidth: x(10), borderTopWidth: x(7) }]} />
      </View>
      <View style={[styles.spliceLead, { left: x(169), top: y(1298), width: x(27) }]} />
      <Text style={[styles.spliceLabel, { fontSize: type(21), left: x(211), lineHeight: type(27), top: y(1286) }]}>GUIDE ENDS HERE</Text>

      <Animated.View
        accessibilityLabel="Live microphone level preview"
        style={[styles.waveform, { height: y(111), left: x(160), opacity: signal, top: y(1360), width: x(700) }]}
      >
        <View style={styles.waveBaseline} />
        {waveform.map((bar, index) => (
          <View
            key={`${bar}-${index}`}
            style={[
              styles.waveBar,
              { height: y(Math.max(8, bar)), marginHorizontal: Math.max(x(2.1), 1), width: Math.max(x(2.4), 2) },
            ]}
          />
        ))}
      </Animated.View>

      <Pressable
        accessibilityHint="Starts a private solo recording"
        accessibilityLabel={audio.isRecording ? 'Stop and review my take' : 'Start my take'}
        accessibilityRole="button"
        disabled={busy}
        onPress={handleTake}
        style={({ pressed }) => [styles.takeButton, { height: y(132), opacity: pressed ? 0.9 : 1, top: y(1498), width: frame.w }]}
      >
        <View style={[styles.reelPlateFrame, { height: y(132), width: x(153) }]}>
          <Image accessibilityIgnoresInvertColors source={reelPlate} resizeMode="cover" style={[styles.reelPlate, { height: y(132), width: x(259) }]} />
        </View>
        <View style={[styles.buttonRail, { height: y(132), left: x(153), width: x(28) }]}>
          {[29, 98].map((top) => (
            <View key={top} style={[styles.railTick, { height: Math.max(y(2), 1), top: y(top) }]} />
          ))}
        </View>
        <Text style={[styles.takeLabel, { fontSize: type(36), left: x(305), lineHeight: type(48), top: y(46) }]}>
          {busy ? 'PREPARING…' : audio.isRecording ? 'STOP & REVIEW' : 'START MY TAKE'}
        </Text>
      </Pressable>

      {notice ? (
        <Text accessibilityLiveRegion="polite" style={[styles.notice, { fontSize: type(17), left: x(211), top: y(1428), width: x(620) }]}>
          {notice}
        </Text>
      ) : null}

      <View style={[styles.controlRow, { height: y(89), top: y(1630), width: frame.w }]}>
        {[0, 15, 25].map((level, index) => (
          <Pressable
            accessibilityLabel={`Set guide to ${level} percent`}
            accessibilityRole="button"
            key={level}
            onPress={() => setGuideLevel(level as GuideLevel)}
            style={[styles.guideButton, { borderLeftWidth: index === 0 ? 0 : StyleSheet.hairlineWidth, width: x(183) }]}
          >
            <Text style={[styles.controlText, { color: guideLevel === level ? COBALT_LIGHT : INK, fontSize: type(level === 15 ? 28 : 24.5) }]}>{level}%</Text>
          </Pressable>
        ))}
        <Pressable accessibilityLabel="Playback speed 0.9 times" accessibilityRole="button" style={[styles.speedButton, { borderLeftWidth: StyleSheet.hairlineWidth }]}>
          <Text style={[styles.controlText, { fontSize: type(23), transform: [{ translateX: x(3) }, { translateY: y(4) }] }]}>SPEED 0.9×</Text>
        </Pressable>
      </View>

      <View style={[styles.privacy, { height: y(95), left: x(49), top: y(1721) }]}>
        <View style={[styles.privacyGlyph, { height: type(51), width: type(51) }]}>
          <MaterialCommunityIcons color={INK} name="shield-outline" size={type(51)} style={styles.shieldIcon} />
          <Ionicons color={INK} name="lock-closed" size={type(15)} style={styles.privacyLock} />
        </View>
        <Text style={[styles.privacyCopy, { fontSize: type(24), lineHeight: type(32), marginLeft: x(20) }]}>Guide off. Your voice stays on this device.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  activePhrase: { color: INK, fontFamily: 'GothicA1_700Bold', letterSpacing: -3.1, position: 'absolute' },
  backButton: { alignItems: 'center', justifyContent: 'center', position: 'absolute', zIndex: 5 },
  buttonRail: { backgroundColor: COBALT_LIGHT, position: 'absolute', top: 0 },
  controlRow: { alignItems: 'stretch', borderBottomColor: '#8b8290', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', left: 0, position: 'absolute' },
  controlText: { color: INK, fontFamily: 'GothicA1_500Medium', letterSpacing: 0.7 },
  frame: { backgroundColor: CHALK, overflow: 'hidden', position: 'relative' },
  guideButton: { alignItems: 'center', borderLeftColor: '#b4acb4', justifyContent: 'center' },
  handoff: { color: INK, fontFamily: 'GothicA1_500Medium', letterSpacing: 1.1, position: 'absolute' },
  indexHairline: { backgroundColor: INK, height: StyleSheet.hairlineWidth },
  indexOne: { alignItems: 'center', flexDirection: 'row', position: 'absolute' },
  indexText: { color: INK, fontFamily: 'GothicA1_500Medium' },
  indexTextActive: { color: COBALT, fontFamily: 'GothicA1_600SemiBold' },
  indexThree: { alignItems: 'center', flexDirection: 'row', position: 'absolute' },
  indexTwo: { alignItems: 'center', flexDirection: 'row', gap: 5, position: 'absolute' },
  loadingFrame: { backgroundColor: CHALK, flex: 1 },
  meta: { color: INK, fontFamily: 'GothicA1_500Medium', letterSpacing: 1.2, position: 'absolute' },
  nextPhrase: { color: QUIET, fontFamily: 'GothicA1_400Regular', letterSpacing: -1, position: 'absolute' },
  notice: { color: ORANGE, fontFamily: 'GothicA1_500Medium', position: 'absolute' },
  privacy: { alignItems: 'center', flexDirection: 'row', position: 'absolute' },
  privacyCopy: { color: INK, fontFamily: 'GothicA1_400Regular' },
  privacyGlyph: { alignItems: 'center', justifyContent: 'center' },
  privacyLock: { position: 'absolute', transform: [{ scaleX: 0.78 }, { scaleY: 1.1 }] },
  progressDot: { backgroundColor: CHALK, borderRadius: 999 },
  progressDots: { alignItems: 'center', flexDirection: 'row', position: 'absolute', zIndex: 3 },
  quietRail: { backgroundColor: '#aba4ab', position: 'absolute' },
  railLower: { backgroundColor: COBALT, position: 'absolute' },
  railTick: { backgroundColor: CHALK, left: 0, position: 'absolute', width: '100%' },
  railTop: { backgroundColor: COBALT, position: 'absolute' },
  railTurn: { backgroundColor: COBALT, position: 'absolute' },
  reelPlate: { left: 0, position: 'absolute', top: 0 },
  reelPlateFrame: { left: 0, overflow: 'hidden', position: 'absolute', top: 0 },
  speedButton: { alignItems: 'center', borderLeftColor: '#b4acb4', flex: 1, justifyContent: 'center' },
  shieldIcon: { transform: [{ scaleX: 0.86 }] },
  splice: { backgroundColor: ORANGE, position: 'absolute', zIndex: 4 },
  spliceLabel: { color: ORANGE, fontFamily: 'GothicA1_500Medium', letterSpacing: 1.1, position: 'absolute' },
  spliceLead: { backgroundColor: ORANGE, height: 2, position: 'absolute' },
  spliceTriangle: { borderBottomColor: 'transparent', borderRightColor: ORANGE, borderTopColor: 'transparent', height: 0, width: 0 },
  takeButton: { alignItems: 'center', backgroundColor: '#1339b1', flexDirection: 'row', left: 0, overflow: 'hidden', position: 'absolute' },
  takeLabel: { color: CHALK, fontFamily: 'GothicA1_700Bold', letterSpacing: 1.2, position: 'absolute' },
  waveBar: { backgroundColor: COBALT_LIGHT },
  waveBaseline: { borderColor: COBALT_LIGHT, borderStyle: 'dotted', borderTopWidth: 3, left: 0, position: 'absolute', right: 0, top: '50%' },
  waveform: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', overflow: 'hidden', position: 'absolute' },
});
