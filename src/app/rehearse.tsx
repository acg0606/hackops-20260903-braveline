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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { getScenarioPhrase, IMPOSSIBLE_DEADLINE_SCENARIO } from '@/domain/scenarios';
import { braveLineSessionStore, useBraveLineAudio } from '@/services';
import { type BravePalette, useBraveTheme } from '@/ui/braveline';

const reelPlate = require('../../assets/plates/reel-emblem.png');

const waveform = [
  5, 7, 14, 29, 19, 7, 34, 49, 68, 42, 22, 31, 14, 55, 38, 72, 18, 91, 49,
  25, 39, 17, 28, 58, 38, 69, 30, 20, 14, 62, 83, 47, 97, 59, 30, 38, 19, 53,
  23, 12, 36, 71, 99, 57, 34, 18, 41, 31, 58, 29, 47, 19, 37, 22, 17, 33, 49, 27,
  18, 43, 28, 15, 9,
];

type GuideLevel = 0 | 15 | 25;

export default function RehearseScreen() {
  const router = useRouter();
  const colors = useBraveTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const params = useLocalSearchParams<{
    cleanupWarning?: string;
    mode?: string;
    phraseId?: string;
  }>();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const audio = useBraveLineAudio();
  const [guideLevel, setGuideLevel] = useState<GuideLevel>(15);
  const [guideSpeaking, setGuideSpeaking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(() =>
    params.cleanupWarning === 'stale-session-metadata'
      ? 'The previous audio was removed. Its stale session metadata could not be cleared, but it cannot play the deleted file.'
      : null,
  );
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
    const frameHeight =
      Platform.OS === 'web' ? width * (1821 / 864) : height - insets.top - insets.bottom;
    return {
      h: frameHeight,
      sx: width / 864,
      sy: frameHeight / 1821,
      w: width,
    };
  }, [height, insets.bottom, insets.top, width]);
  const isExpanded = width >= 720 || width > height;

  const x = (value: number) => value * frame.sx;
  const y = (value: number) => value * frame.sy;
  const type = (value: number) => Math.max(value * frame.sx, value * 0.44);
  const retryPhrase =
    params.mode === 'retry' && typeof params.phraseId === 'string'
      ? getScenarioPhrase(IMPOSSIBLE_DEADLINE_SCENARIO, params.phraseId)
      : undefined;
  const isRetry = Boolean(retryPhrase);
  const activePhraseText = retryPhrase?.text ?? 'I can’t promise Thursday without risking the quality.';
  const activePhraseDisplay =
    retryPhrase?.text ?? 'I can’t\npromise\nThursday\nwithout\nrisking the\nquality.';
  const effectiveGuideLevel: GuideLevel = audio.isRecording ? 0 : guideLevel;
  const guideStatus = audio.isRecording
    ? 'Guide off. Only your voice is recording.'
    : guideSpeaking
      ? `Quiet Coach is playing at ${guideLevel}%. It stops before recording.`
      : 'Guide off. Your voice stays on this device.';

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

  if (isExpanded) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeFrame}>
        <View style={styles.expandedHeader}>
          <Pressable
            accessibilityLabel="Back to scenario"
            accessibilityRole="button"
            disabled={audio.isRecording || busy}
            hitSlop={12}
            onPress={() => router.replace('/prepare')}
            style={[styles.expandedBack, { opacity: audio.isRecording || busy ? 0.35 : 1 }]}
          >
            <Ionicons color={colors.aubergine} name="arrow-back" size={30} />
          </Pressable>
          <Text maxFontSizeMultiplier={1.3} style={styles.expandedMeta}>SET A BOUNDARY</Text>
          <Text maxFontSizeMultiplier={1.3} style={styles.expandedMeta}>
            {audio.isRecording ? `${Math.max(1, Math.ceil(audio.recordingDurationMs / 1000))}s SOLO TAKE` : '1:20 PRACTICE'}
          </Text>
        </View>

        <View style={styles.expandedBody} testID="rehearse-expanded-frame">
          <View style={styles.expandedScriptPane}>
            <Text maxFontSizeMultiplier={1.3} style={styles.expandedHandoff}>
              {audio.isRecording
                ? 'SOLO TAKE  /  GUIDE 0%  →  RECORDING'
                : `${isRetry ? 'RETRY' : 'HANDOFF'}  /  QUIET COACH ${guideLevel}%  →  YOUR TURN`}
            </Text>
            <Animated.Text
              accessibilityLabel={activePhraseText}
              accessibilityRole="header"
              maxFontSizeMultiplier={1.3}
              style={[
                styles.expandedPhrase,
                {
                  opacity: reveal,
                  transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
                },
              ]}
            >
              {activePhraseText}
            </Animated.Text>
            <View style={styles.expandedSplice} />
            <Text maxFontSizeMultiplier={1.3} style={styles.expandedSpliceLabel}>GUIDE ENDS HERE</Text>
            <Text maxFontSizeMultiplier={1.3} style={isRetry ? styles.expandedRetry : styles.expandedNext}>
              {isRetry ? 'One phrase. One cleaner take.' : 'Next: I can deliver a reliable version by Friday.'}
            </Text>
          </View>

          <View style={styles.expandedControlPane}>
            <Animated.View
              accessibilityLabel="Live microphone level preview"
              style={[styles.expandedWaveform, { opacity: signal }]}
            >
              <View style={styles.waveBaseline} />
              {waveform.map((bar, index) => (
                <View key={`${bar}-${index}`} style={[styles.expandedWaveBar, { height: Math.max(6, bar * 0.5) }]} />
              ))}
            </Animated.View>

            <Text maxFontSizeMultiplier={1.3} style={styles.expandedGuideLabel}>QUIET COACH</Text>
            <View style={styles.expandedGuideRow}>
              {[0, 15, 25].map((level) => (
                <Pressable
                  accessibilityLabel={`Set guide to ${level} percent`}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: audio.isRecording || busy, selected: effectiveGuideLevel === level }}
                  disabled={audio.isRecording || busy}
                  key={level}
                  onPress={() => setGuideLevel(level as GuideLevel)}
                  style={[styles.expandedGuideButton, effectiveGuideLevel === level && styles.expandedGuideSelected]}
                >
                  <Text maxFontSizeMultiplier={1.3} style={[styles.expandedGuideText, effectiveGuideLevel === level && styles.expandedGuideTextSelected]}>{level}%</Text>
                </Pressable>
              ))}
              <Pressable
                accessibilityHint="Plays or stops the low-volume English guide"
                accessibilityLabel={guideSpeaking ? 'Stop Quiet Coach' : 'Hear Quiet Coach'}
                accessibilityRole="button"
                disabled={audio.isRecording || busy}
                onPress={playQuietCoach}
                style={styles.expandedCoachButton}
              >
                <Ionicons color={colors.white} name={guideSpeaking ? 'stop' : 'play'} size={22} />
                <Text maxFontSizeMultiplier={1.3} style={styles.expandedCoachText}>{guideSpeaking ? 'STOP GUIDE' : 'HEAR GUIDE'}</Text>
              </Pressable>
            </View>

            <Pressable
              accessibilityHint="Starts a private solo recording"
              accessibilityLabel={audio.isRecording ? 'Stop and review my take' : 'Start my take'}
              accessibilityRole="button"
              disabled={busy}
              onPress={handleTake}
              style={({ pressed }) => [styles.expandedTakeButton, { opacity: pressed ? 0.9 : 1 }]}
            >
              <MaterialCommunityIcons color={colors.white} name={audio.isRecording ? 'stop' : 'microphone-outline'} size={30} />
              <Text maxFontSizeMultiplier={1.3} style={styles.expandedTakeLabel}>
                {busy ? 'PREPARING…' : audio.isRecording ? 'STOP & REVIEW' : 'START MY TAKE'}
              </Text>
            </Pressable>

            {notice ? <Text accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.3} style={styles.expandedNotice}>{notice}</Text> : null}
            <View style={styles.expandedPrivacy}>
              <MaterialCommunityIcons color={colors.aubergine} name="shield-lock-outline" size={26} />
              <Text accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.3} style={styles.expandedPrivacyText}>{guideStatus}</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeFrame}>
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
        <Ionicons color={colors.aubergine} name="arrow-back" size={type(54)} />
      </Pressable>

      <Text style={[styles.meta, { fontSize: type(27), left: x(210), lineHeight: type(34), top: y(42) }]}>SET A BOUNDARY</Text>
      <Text style={[styles.meta, { fontSize: type(27), lineHeight: type(34), right: x(25), top: y(42) }]}>
        {audio.isRecording ? `${Math.max(1, Math.ceil(audio.recordingDurationMs / 1000))}s SOLO TAKE` : '1:20 PRACTICE'}
      </Text>

      <Text style={[styles.handoff, { fontSize: type(22), left: x(210), lineHeight: type(29), top: y(156) }]}>
        {audio.isRecording
          ? 'SOLO TAKE  /  GUIDE 0%  →  RECORDING'
          : `${isRetry ? 'RETRY' : 'HANDOFF'}  /  QUIET COACH ${guideLevel}%  →  YOUR TURN`}
      </Text>

      <View style={[styles.indexOne, { left: x(55), top: y(246) }]}>
        <Text style={[styles.indexText, { fontSize: type(31), lineHeight: type(36) }]}>01</Text>
        <View style={[styles.indexHairline, { marginLeft: x(14), width: x(34) }]} />
      </View>

      <Animated.Text
        accessibilityLabel={activePhraseText}
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
        {activePhraseDisplay}
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
        accessibilityState={{ disabled: audio.isRecording || busy }}
        disabled={audio.isRecording || busy}
        hitSlop={16}
        onPress={playQuietCoach}
        style={[styles.indexTwo, { left: x(55), opacity: audio.isRecording || busy ? 0.45 : 1, top: y(887) }]}
      >
        <Text style={[styles.indexTextActive, { fontSize: type(31), lineHeight: type(36) }]}>02</Text>
        <Ionicons color={colors.cobalt} name={guideSpeaking ? 'stop' : 'play'} size={type(27)} />
      </Pressable>

      {!isRetry ? (
        <>
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
            {'I can deliver a\nreliable version\nby Friday.'}
          </Text>
        </>
      ) : (
        <Text
          accessibilityLabel="Retry only the highlighted moment"
          style={[styles.retryCue, { fontSize: type(24), left: x(209), lineHeight: type(32), top: y(1015) }]}
        >
          ONE PHRASE  /  ONE CLEANER TAKE
        </Text>
      )}

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
            accessibilityState={{ disabled: audio.isRecording || busy, selected: effectiveGuideLevel === level }}
            disabled={audio.isRecording || busy}
            key={level}
            onPress={() => setGuideLevel(level as GuideLevel)}
            style={[styles.guideButton, { borderLeftWidth: index === 0 ? 0 : StyleSheet.hairlineWidth, opacity: audio.isRecording && level !== 0 ? 0.45 : 1, width: x(183) }]}
          >
            <Text style={[styles.controlText, { color: effectiveGuideLevel === level ? colors.cobalt : colors.aubergine, fontSize: type(level === 15 ? 28 : 24.5) }]}>{level}%</Text>
          </Pressable>
        ))}
        <Pressable accessibilityLabel="Playback speed 0.9 times" accessibilityRole="button" style={[styles.speedButton, { borderLeftWidth: StyleSheet.hairlineWidth }]}>
          <Text style={[styles.controlText, { fontSize: type(23), transform: [{ translateX: x(3) }, { translateY: y(4) }] }]}>SPEED 0.9×</Text>
        </Pressable>
      </View>

      <View style={[styles.privacy, { height: y(95), left: x(49), top: y(1721) }]}>
        <View style={[styles.privacyGlyph, { height: type(51), width: type(51) }]}>
          <MaterialCommunityIcons color={colors.aubergine} name="shield-outline" size={type(51)} style={styles.shieldIcon} />
          <Ionicons color={colors.aubergine} name="lock-closed" size={type(15)} style={styles.privacyLock} />
        </View>
        <Text accessibilityLiveRegion="polite" style={[styles.privacyCopy, { fontSize: type(24), lineHeight: type(32), marginLeft: x(20) }]}>{guideStatus}</Text>
      </View>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: BravePalette) {
  return StyleSheet.create({
  activePhrase: { color: colors.aubergine, fontFamily: 'GothicA1_700Bold', letterSpacing: -3.1, position: 'absolute' },
  backButton: { alignItems: 'center', justifyContent: 'center', position: 'absolute', zIndex: 5 },
  buttonRail: { backgroundColor: colors.cobalt, position: 'absolute', top: 0 },
  controlRow: { alignItems: 'stretch', borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', left: 0, position: 'absolute' },
  controlText: { color: colors.aubergine, fontFamily: 'GothicA1_500Medium', letterSpacing: 0.7 },
  frame: { backgroundColor: colors.chalk, overflow: 'hidden', position: 'relative' },
  guideButton: { alignItems: 'center', borderLeftColor: colors.line, justifyContent: 'center' },
  handoff: { color: colors.aubergine, fontFamily: 'GothicA1_500Medium', letterSpacing: 1.1, position: 'absolute' },
  indexHairline: { backgroundColor: colors.aubergine, height: StyleSheet.hairlineWidth },
  indexOne: { alignItems: 'center', flexDirection: 'row', position: 'absolute' },
  indexText: { color: colors.aubergine, fontFamily: 'GothicA1_500Medium' },
  indexTextActive: { color: colors.cobalt, fontFamily: 'GothicA1_600SemiBold' },
  indexThree: { alignItems: 'center', flexDirection: 'row', position: 'absolute' },
  indexTwo: { alignItems: 'center', flexDirection: 'row', gap: 5, position: 'absolute' },
  loadingFrame: { backgroundColor: colors.chalk, flex: 1 },
  meta: { color: colors.aubergine, fontFamily: 'GothicA1_500Medium', letterSpacing: 1.2, position: 'absolute' },
  nextPhrase: { color: colors.aubergineSoft, fontFamily: 'GothicA1_400Regular', letterSpacing: -1, position: 'absolute' },
  notice: { color: colors.orange, fontFamily: 'GothicA1_500Medium', position: 'absolute' },
  privacy: { alignItems: 'center', flexDirection: 'row', position: 'absolute' },
  privacyCopy: { color: colors.aubergine, fontFamily: 'GothicA1_400Regular' },
  privacyGlyph: { alignItems: 'center', justifyContent: 'center' },
  privacyLock: { position: 'absolute', transform: [{ scaleX: 0.78 }, { scaleY: 1.1 }] },
  progressDot: { backgroundColor: colors.chalk, borderRadius: 999 },
  progressDots: { alignItems: 'center', flexDirection: 'row', position: 'absolute', zIndex: 3 },
  quietRail: { backgroundColor: colors.aubergineSoft, position: 'absolute' },
  railLower: { backgroundColor: colors.cobalt, position: 'absolute' },
  railTick: { backgroundColor: colors.chalk, left: 0, position: 'absolute', width: '100%' },
  railTop: { backgroundColor: colors.cobalt, position: 'absolute' },
  railTurn: { backgroundColor: colors.cobalt, position: 'absolute' },
  reelPlate: { left: 0, position: 'absolute', top: 0 },
  reelPlateFrame: { left: 0, overflow: 'hidden', position: 'absolute', top: 0 },
  retryCue: { color: colors.orange, fontFamily: 'GothicA1_600SemiBold', letterSpacing: 1.1, position: 'absolute' },
  safeFrame: { backgroundColor: colors.chalk, flex: 1 },
  speedButton: { alignItems: 'center', borderLeftColor: colors.line, flex: 1, justifyContent: 'center' },
  shieldIcon: { transform: [{ scaleX: 0.86 }] },
  splice: { backgroundColor: colors.orange, position: 'absolute', zIndex: 4 },
  spliceLabel: { color: colors.orange, fontFamily: 'GothicA1_500Medium', letterSpacing: 1.1, position: 'absolute' },
  spliceLead: { backgroundColor: colors.orange, height: 2, position: 'absolute' },
  spliceTriangle: { borderBottomColor: 'transparent', borderRightColor: colors.orange, borderTopColor: 'transparent', height: 0, width: 0 },
  takeButton: { alignItems: 'center', backgroundColor: colors.cobaltPressed, flexDirection: 'row', left: 0, overflow: 'hidden', position: 'absolute' },
  takeLabel: { color: colors.white, fontFamily: 'GothicA1_700Bold', letterSpacing: 1.2, position: 'absolute' },
  waveBar: { backgroundColor: colors.cobalt },
  waveBaseline: { borderColor: colors.cobalt, borderStyle: 'dotted', borderTopWidth: 3, left: 0, position: 'absolute', right: 0, top: '50%' },
  waveform: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', overflow: 'hidden', position: 'absolute' },
  expandedHeader: { alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 16, minHeight: 64, paddingHorizontal: 20 },
  expandedBack: { alignItems: 'center', height: 48, justifyContent: 'center', width: 48 },
  expandedMeta: { color: colors.aubergine, flex: 1, fontFamily: 'GothicA1_600SemiBold', fontSize: 13, letterSpacing: 1.2 },
  expandedBody: { flex: 1, flexDirection: 'row', marginHorizontal: 'auto', maxWidth: 1180, width: '100%' },
  expandedScriptPane: { borderRightColor: colors.line, borderRightWidth: StyleSheet.hairlineWidth, flex: 1.2, justifyContent: 'center', minWidth: 0, padding: 32 },
  expandedControlPane: { flex: 1, justifyContent: 'center', minWidth: 0, padding: 28 },
  expandedHandoff: { color: colors.cobalt, fontFamily: 'GothicA1_600SemiBold', fontSize: 14, letterSpacing: 1.1, marginBottom: 18 },
  expandedPhrase: { color: colors.aubergine, fontFamily: 'GothicA1_700Bold', fontSize: 45, letterSpacing: -1.5, lineHeight: 52, maxWidth: 620 },
  expandedSplice: { backgroundColor: colors.orange, height: 7, marginTop: 28, width: 68 },
  expandedSpliceLabel: { color: colors.orange, fontFamily: 'GothicA1_600SemiBold', fontSize: 12, letterSpacing: 1.1, marginTop: 8 },
  expandedNext: { color: colors.aubergineSoft, fontFamily: 'GothicA1_400Regular', fontSize: 20, lineHeight: 28, marginTop: 28 },
  expandedRetry: { color: colors.orange, fontFamily: 'GothicA1_600SemiBold', fontSize: 20, lineHeight: 28, marginTop: 28 },
  expandedWaveform: { alignItems: 'center', flexDirection: 'row', height: 76, justifyContent: 'center', overflow: 'hidden' },
  expandedWaveBar: { backgroundColor: colors.cobalt, flex: 1, marginHorizontal: 1, maxWidth: 4, minWidth: 1 },
  expandedGuideLabel: { color: colors.aubergineSoft, fontFamily: 'GothicA1_600SemiBold', fontSize: 12, letterSpacing: 1.2, marginBottom: 9, marginTop: 18 },
  expandedGuideRow: { flexDirection: 'row', gap: 8 },
  expandedGuideButton: { alignItems: 'center', borderColor: colors.line, borderWidth: 1, justifyContent: 'center', minHeight: 52, minWidth: 58, paddingHorizontal: 12 },
  expandedGuideSelected: { backgroundColor: colors.chalkMuted, borderColor: colors.cobalt },
  expandedGuideText: { color: colors.aubergine, fontFamily: 'GothicA1_500Medium', fontSize: 14 },
  expandedGuideTextSelected: { color: colors.cobalt, fontFamily: 'GothicA1_700Bold' },
  expandedCoachButton: { alignItems: 'center', backgroundColor: colors.cobalt, flex: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 52, paddingHorizontal: 14 },
  expandedCoachText: { color: colors.white, fontFamily: 'GothicA1_700Bold', fontSize: 13, letterSpacing: 0.7 },
  expandedTakeButton: { alignItems: 'center', backgroundColor: colors.cobaltPressed, flexDirection: 'row', gap: 12, justifyContent: 'center', marginTop: 18, minHeight: 70, paddingHorizontal: 22 },
  expandedTakeLabel: { color: colors.white, fontFamily: 'GothicA1_700Bold', fontSize: 19, letterSpacing: 0.8 },
  expandedNotice: { color: colors.orange, fontFamily: 'GothicA1_500Medium', fontSize: 13, lineHeight: 19, marginTop: 12 },
  expandedPrivacy: { alignItems: 'center', flexDirection: 'row', gap: 12, marginTop: 18, minHeight: 48 },
  expandedPrivacyText: { color: colors.aubergine, flex: 1, fontFamily: 'GothicA1_400Regular', fontSize: 13, lineHeight: 19 },
  });
}
