import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { generateDeterministicFeedback } from '@/domain/feedback';
import {
  getConfiguredRetryPhrase,
  IMPOSSIBLE_DEADLINE_SCENARIO,
} from '@/domain/scenarios';
import {
  braveLineSessionStore,
  isLocalAudioUri,
  type LocalAudioTake,
  useBraveLineAudio,
} from '@/services';
import {
  BraveCanvas,
  InkText,
  OutlineAction,
  palette,
  PrimaryAction,
  PrivacyNote,
  Rule,
  TapeRail,
  TopBar,
  useBraveTheme,
  Waveform,
} from '@/ui/braveline';

type ReadyParams = {
  capturedAt?: string | string[];
  durationMs?: string | string[];
  takeId?: string | string[];
  takeUri?: string | string[];
  saveWarning?: string | string[];
};

const plusRoute = '/plus' as Href;

export default function ReadyScreen() {
  const params = useLocalSearchParams<ReadyParams>();
  const router = useRouter();
  const audio = useBraveLineAudio();
  const colors = useBraveTheme();
  const [deleted, setDeleted] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmRetry, setConfirmRetry] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(() =>
    firstParam(params.saveWarning) === 'local-metadata-not-saved'
      ? 'Your audio is available now, but this rehearsal could not be restored after leaving the app.'
      : null,
  );

  const take = useMemo(() => readLocalTake(params), [params]);
  const hasTake = Boolean(take) && !deleted;
  const feedback = useMemo(
    () =>
      generateDeterministicFeedback({
        scenario: IMPOSSIBLE_DEADLINE_SCENARIO,
        durationMs: take?.durationMs ?? 0,
        hasValidAudio: hasTake,
      }),
    [hasTake, take?.durationMs],
  );

  const durationMs = take?.durationMs ?? 0;
  const playbackMs = Math.min(audio.playbackPositionMs, durationMs);
  const progress = durationMs > 0 ? Math.min(1, playbackMs / durationMs) : 0;

  async function togglePlayback() {
    if (!take || busy) return;
    setNotice(null);

    if (audio.isPlaying) {
      const result = audio.pausePlayback();
      if (!result.ok) setNotice(result.userMessage);
      return;
    }

    setBusy(true);
    const result = await audio.playTake(take);
    setBusy(false);
    if (!result.ok) setNotice(result.userMessage);
  }

  async function deleteTake() {
    if (!take || busy) return;
    setBusy(true);
    setNotice(null);

    try {
      const deletedAudio = await audio.deleteTake(take);

      if (!deletedAudio.ok) {
        setConfirmDelete(false);
        setNotice(deletedAudio.userMessage);
        return;
      }

      setDeleted(true);
      const deletedSession = await braveLineSessionStore.clear();
      setConfirmDelete(false);
      setNotice(
        deletedSession.ok
          ? 'Take deleted from this device.'
          : 'The audio was removed, but saved session metadata could not be cleared.',
      );
    } catch {
      setConfirmDelete(false);
      setNotice(
        'The delete request did not finish, so BraveLine kept the local session for an honest retry.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function replaceWithRetry() {
    if (!take || busy) return;
    setBusy(true);
    setNotice(null);

    try {
      const deletedAudio = await audio.deleteTake(take);
      if (!deletedAudio.ok) {
        setConfirmRetry(false);
        setNotice(
          `Retry did not start because the current take could not be removed. ${deletedAudio.userMessage}`,
        );
        return;
      }

      const deletedSession = await braveLineSessionStore.clear();
      const retryPhrase = getConfiguredRetryPhrase(IMPOSSIBLE_DEADLINE_SCENARIO);
      router.replace({
        pathname: '/rehearse',
        params: {
          mode: 'retry',
          phraseId: retryPhrase.id,
          ...(deletedSession.ok ? {} : { cleanupWarning: 'stale-session-metadata' }),
        },
      } as Href);
    } catch {
      setConfirmRetry(false);
      setNotice(
        'Retry did not start because BraveLine could not verify removal of the current local take.',
      );
    } finally {
      setBusy(false);
    }
  }

  function retryMoment() {
    setConfirmDelete(false);
    setConfirmRetry(true);
  }

  function cancelRetry() {
    setConfirmRetry(false);
  }

  function openDeleteConfirmation() {
    setConfirmRetry(false);
    setConfirmDelete(true);
  }

  return (
    <BraveCanvas>
      <TopBar label="BRAVELINE / READY" meta="03 / 03" onBack={() => router.back()} />
      <View style={styles.body}>
        <TapeRail active={3} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {hasTake && take ? (
            <>
              <InkText style={styles.kicker} weight="semibold">
                YOUR TAKE / LOCAL
              </InkText>
              <InkText accessibilityRole="header" style={styles.hero} weight="bold">
                Hear your words. Keep what feels true.
              </InkText>
              <Rule orange />

              <View style={styles.playerBlock}>
                <View style={styles.playerTopline}>
                  <InkText style={styles.playerLabel} weight="semibold">
                    ONLY YOUR VOICE
                  </InkText>
                  <InkText style={styles.duration} weight="medium">
                    {formatDuration(playbackMs)} / {formatDuration(durationMs)}
                  </InkText>
                </View>
                <Waveform muted={!audio.isPlaying} />
                <View accessibilityElementsHidden style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                </View>
                <Pressable
                  accessibilityHint="Plays the local recording without uploading it"
                  accessibilityLabel={audio.isPlaying ? 'Pause my take' : 'Play my take'}
                  accessibilityRole="button"
                  accessibilityState={{ busy }}
                  disabled={busy}
                  onPress={togglePlayback}
                  style={({ pressed }) => [styles.playButton, pressed && styles.playPressed]}
                  testID="ready-play"
                >
                  <MaterialCommunityIcons
                    color={colors.white}
                    name={audio.isPlaying ? 'pause' : 'play'}
                    size={30}
                  />
                  <InkText style={styles.playLabel} weight="bold">
                    {busy ? 'Preparing local audio…' : audio.isPlaying ? 'Pause my take' : 'Play my take'}
                  </InkText>
                </Pressable>
              </View>

              <View style={styles.feedbackBlock}>
                <View style={styles.feedbackHeading}>
                  <InkText style={styles.kicker} weight="semibold">
                    ONE USEFUL PASS
                  </InkText>
                  <InkText style={styles.source} weight="semibold">
                    {feedback.source.toUpperCase()}
                  </InkText>
                </View>
                <FeedbackLine index="+" label="STRENGTH" text={feedback.strength} />
                <FeedbackLine index="→" label="NEXT STEP" text={feedback.nextStep} accent />
                <View style={styles.evidence}>
                  <InkText style={styles.evidenceLabel} weight="semibold">
                    EVIDENCE
                  </InkText>
                  <InkText style={styles.evidenceText}>{feedback.evidencePhrase}</InkText>
                </View>
                <InkText style={styles.sourceDisclosure}>
                  No transcript was available, so BraveLine did not assess your wording, accent, emotion, or pronunciation.
                </InkText>
              </View>

              <View style={styles.retryBlock}>
                <InkText style={styles.retryLabel} weight="semibold">
                  RETRY EXACTLY THIS MOMENT
                </InkText>
                <InkText style={styles.retryPhrase} weight="bold">
                  “{feedback.retryPhrase}”
                </InkText>
              </View>
              <PrimaryAction
                accessibilityHint="Returns to Solo with only the highlighted clause"
                disabled={confirmRetry}
                icon="replay"
                label="Retry this moment"
                onPress={retryMoment}
                testID="ready-retry"
              />

              {confirmRetry ? (
                <View accessibilityLiveRegion="polite" style={styles.deleteConfirm}>
                  <InkText style={styles.deleteTitle} weight="bold">
                    Replace this local take?
                  </InkText>
                  <InkText style={styles.deleteCopy}>
                    BraveLine will permanently remove the current audio before opening a one-phrase retry. This cannot be undone.
                  </InkText>
                  <View style={styles.confirmActions}>
                    <Pressable
                      accessibilityLabel="Keep my current take"
                      accessibilityRole="button"
                      disabled={busy}
                      onPress={cancelRetry}
                      style={({ pressed }) => [styles.confirmButton, pressed && styles.confirmPressed]}
                    >
                      <InkText style={styles.confirmLabel} weight="semibold">
                        Keep it
                      </InkText>
                    </Pressable>
                    <Pressable
                      accessibilityLabel="Permanently delete current take and start phrase retry"
                      accessibilityRole="button"
                      accessibilityState={{ busy }}
                      disabled={busy}
                      onPress={replaceWithRetry}
                      style={({ pressed }) => [styles.deleteButton, pressed && styles.deletePressed]}
                    >
                      <InkText style={styles.deleteButtonLabel} weight="bold">
                        {busy ? 'Replacing…' : 'Delete & retry'}
                      </InkText>
                    </Pressable>
                  </View>
                </View>
              ) : !confirmDelete ? (
                <View style={styles.secondaryActions}>
                  <OutlineAction
                    accessibilityHint="Opens an honest local preview of advanced practice"
                    icon="plus"
                    label="Preview BraveLine Plus"
                    onPress={() => router.push(plusRoute)}
                    testID="ready-plus"
                  />
                  <OutlineAction
                    accessibilityHint="Asks for confirmation before removing the local take"
                    icon="delete-outline"
                    label="Delete now"
                    onPress={openDeleteConfirmation}
                    testID="ready-delete"
                  />
                </View>
              ) : (
                <View accessibilityLiveRegion="polite" style={styles.deleteConfirm}>
                  <InkText style={styles.deleteTitle} weight="bold">
                    Delete this local take?
                  </InkText>
                  <InkText style={styles.deleteCopy}>
                    This cannot be undone. BraveLine will not claim deletion unless the local file is actually removed.
                  </InkText>
                  <View style={styles.confirmActions}>
                    <Pressable
                      accessibilityLabel="Keep my take"
                      accessibilityRole="button"
                      onPress={() => setConfirmDelete(false)}
                      style={({ pressed }) => [styles.confirmButton, pressed && styles.confirmPressed]}
                    >
                      <InkText style={styles.confirmLabel} weight="semibold">
                        Keep it
                      </InkText>
                    </Pressable>
                    <Pressable
                      accessibilityLabel="Permanently delete my local take"
                      accessibilityRole="button"
                      accessibilityState={{ busy }}
                      disabled={busy}
                      onPress={deleteTake}
                      style={({ pressed }) => [styles.deleteButton, pressed && styles.deletePressed]}
                    >
                      <InkText style={styles.deleteButtonLabel} weight="bold">
                        {busy ? 'Deleting…' : 'Delete local take'}
                      </InkText>
                    </Pressable>
                  </View>
                </View>
              )}

              <PrivacyNote>Your take remains local. Nothing on this screen uploads audio.</PrivacyNote>
            </>
          ) : (
            <EmptyReady deleted={deleted} onRehearse={() => router.replace('/rehearse' as Href)} />
          )}

          {notice ? (
            <View accessibilityLiveRegion="polite" accessibilityRole="alert" style={[styles.notice, { backgroundColor: colors.chalkMuted }]}>
              <MaterialCommunityIcons color={colors.aubergine} name="information-outline" size={22} />
              <InkText style={styles.noticeText}>{notice}</InkText>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </BraveCanvas>
  );
}

function FeedbackLine({
  accent = false,
  index,
  label,
  text,
}: {
  accent?: boolean;
  index: string;
  label: string;
  text: string;
}) {
  return (
    <View style={styles.feedbackLine}>
      <InkText style={[styles.feedbackIndex, accent && styles.feedbackIndexAccent]} weight="bold">
        {index}
      </InkText>
      <View style={styles.feedbackCopy}>
        <InkText style={styles.feedbackLabel} weight="semibold">
          {label}
        </InkText>
        <InkText style={styles.feedbackText}>{text}</InkText>
      </View>
    </View>
  );
}

function EmptyReady({ deleted, onRehearse }: { deleted: boolean; onRehearse: () => void }) {
  return (
    <View style={styles.empty}>
      <InkText style={styles.kicker} weight="semibold">
        {deleted ? 'TAKE DELETED' : 'NO LOCAL TAKE'}
      </InkText>
      <InkText accessibilityRole="header" style={styles.emptyHero} weight="bold">
        {deleted ? 'The space is clear.' : 'Ready when your voice is.'}
      </InkText>
      <InkText style={styles.emptyCopy}>
        {deleted
          ? 'The verified local audio was removed. You can rehearse the same conversation again.'
          : 'Record a real take in Rehearse before playback or feedback becomes available. Nothing is simulated here.'}
      </InkText>
      <View style={styles.emptyRule} />
      <PrimaryAction
        accessibilityHint="Returns to the rehearsal teleprompter"
        icon="microphone-outline"
        label="Go to rehearsal"
        onPress={onRehearse}
        testID="ready-empty-rehearse"
      />
      <PrivacyNote>No take means no audio to upload, play, or assess.</PrivacyNote>
    </View>
  );
}

function readLocalTake(params: ReadyParams): LocalAudioTake | null {
  const uri = firstParam(params.takeUri);
  const rawDuration = firstParam(params.durationMs);
  const durationMs = rawDuration ? Number(rawDuration) : Number.NaN;

  if (
    !uri ||
    !isLocalAudioUri(uri) ||
    !Number.isFinite(durationMs) ||
    durationMs <= 0 ||
    durationMs > 30 * 60 * 1_000
  ) {
    return null;
  }

  return {
    id: firstParam(params.takeId) || 'local-route-take',
    uri,
    durationMs: Math.round(durationMs),
    capturedAt: firstParam(params.capturedAt) || '',
    localOnly: true,
    provider: Platform.OS === 'web' ? 'expo-audio-web' : 'expo-audio-native',
  };
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.round(milliseconds / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  content: {
    flexGrow: 1,
    paddingTop: 26,
    paddingRight: 22,
    paddingBottom: 34,
  },
  kicker: {
    fontSize: 12,
    letterSpacing: 1.6,
    color: palette.cobalt,
    marginBottom: 10,
  },
  hero: {
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1,
    maxWidth: 490,
    marginBottom: 20,
  },
  playerBlock: {
    marginTop: 24,
    marginBottom: 28,
  },
  playerTopline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
  },
  playerLabel: {
    fontSize: 11,
    letterSpacing: 1.3,
  },
  duration: {
    fontSize: 12,
    color: palette.aubergineSoft,
  },
  progressTrack: {
    height: 4,
    backgroundColor: palette.line,
    marginBottom: 13,
  },
  progressFill: {
    height: 4,
    backgroundColor: palette.orange,
  },
  playButton: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 11,
    backgroundColor: palette.aubergine,
  },
  playPressed: {
    opacity: 0.82,
  },
  playLabel: {
    color: palette.white,
    fontSize: 17,
  },
  feedbackBlock: {
    borderTopColor: palette.aubergine,
    borderTopWidth: 2,
  },
  feedbackHeading: {
    minHeight: 55,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  source: {
    fontSize: 9,
    letterSpacing: 1,
    color: palette.aubergineSoft,
  },
  feedbackLine: {
    flexDirection: 'row',
    gap: 13,
    paddingVertical: 17,
    borderTopColor: palette.line,
    borderTopWidth: 1,
  },
  feedbackIndex: {
    width: 28,
    fontSize: 22,
    lineHeight: 25,
    color: palette.cobalt,
  },
  feedbackIndexAccent: {
    color: palette.orange,
  },
  feedbackCopy: {
    flex: 1,
  },
  feedbackLabel: {
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 5,
  },
  feedbackText: {
    fontSize: 15,
    lineHeight: 22,
  },
  evidence: {
    paddingVertical: 15,
    paddingLeft: 18,
    borderLeftColor: palette.cobalt,
    borderLeftWidth: 7,
  },
  evidenceLabel: {
    fontSize: 10,
    letterSpacing: 1.2,
    color: palette.cobalt,
  },
  evidenceText: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
    color: palette.aubergineSoft,
  },
  sourceDisclosure: {
    fontSize: 11,
    lineHeight: 17,
    color: palette.aubergineSoft,
    marginTop: 10,
  },
  retryBlock: {
    marginTop: 27,
    marginBottom: 17,
  },
  retryLabel: {
    fontSize: 11,
    letterSpacing: 1.3,
    color: palette.orange,
  },
  retryPhrase: {
    fontSize: 25,
    lineHeight: 31,
    letterSpacing: -0.4,
    marginTop: 7,
  },
  secondaryActions: {
    gap: 10,
    marginTop: 11,
  },
  deleteConfirm: {
    marginTop: 12,
    padding: 17,
    borderColor: palette.orange,
    borderWidth: 2,
  },
  deleteTitle: {
    fontSize: 17,
  },
  deleteCopy: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 5,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 15,
  },
  confirmButton: {
    flex: 1,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: palette.aubergine,
    borderWidth: 1,
  },
  confirmPressed: {
    backgroundColor: palette.chalkMuted,
  },
  confirmLabel: {
    fontSize: 14,
  },
  deleteButton: {
    flex: 1.45,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.orange,
  },
  deletePressed: {
    opacity: 0.82,
  },
  deleteButtonLabel: {
    color: palette.aubergine,
    fontSize: 14,
  },
  notice: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 14,
    marginTop: 12,
    backgroundColor: palette.chalkMuted,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  empty: {
    flex: 1,
    paddingTop: 24,
  },
  emptyHero: {
    fontSize: 42,
    lineHeight: 46,
    letterSpacing: -1.2,
    marginTop: 4,
  },
  emptyCopy: {
    fontSize: 16,
    lineHeight: 24,
    color: palette.aubergineSoft,
    marginTop: 17,
    maxWidth: 480,
  },
  emptyRule: {
    width: 74,
    height: 7,
    backgroundColor: palette.cobalt,
    marginTop: 30,
    marginBottom: 26,
  },
});
