import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { type Href, useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { IMPOSSIBLE_DEADLINE_SCENARIO } from '@/domain/scenarios';
import {
  BraveCanvas,
  InkText,
  palette,
  PrimaryAction,
  PrivacyNote,
  Rule,
  TapeRail,
  TopBar,
  useBraveTheme,
} from '@/ui/braveline';

const rehearseRoute = '/rehearse' as Href;

export default function PrepareScreen() {
  const router = useRouter();
  const scenario = IMPOSSIBLE_DEADLINE_SCENARIO;

  return (
    <BraveCanvas>
      <TopBar label="BRAVELINE / PREPARE" meta={`~${scenario.estimatedMinutes} MIN`} />
      <View style={styles.body}>
        <TapeRail active={1} />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <InkText style={styles.kicker} weight="semibold">
            SET A BOUNDARY
          </InkText>
          <InkText accessibilityRole="header" style={styles.hero} weight="bold">
            Rehearse the words before they matter.
          </InkText>
          <Rule orange />

          <View style={styles.scenarioBlock}>
            <InkText style={styles.eyebrow} weight="semibold">
              TODAY&apos;S SCENARIO
            </InkText>
            <InkText accessibilityRole="header" style={styles.scenarioTitle} weight="bold">
              {scenario.title}
            </InkText>
            <InkText style={styles.setup}>{scenario.setup}</InkText>

            <View style={styles.factRows}>
              <FactRow icon="account-voice" label="Counterpart" value={scenario.counterpart} />
              <FactRow icon="alert-outline" label="Tension" value={scenario.tension} />
              <FactRow icon="flag-outline" label="Your outcome" value={scenario.goal} />
            </View>
          </View>

          <View accessibilityLabel="Three rehearsal stages" style={styles.sequence}>
            <Stage index="01" label="HEAR" detail="Follow one natural English line." />
            <Stage index="02" label="HANDOFF" detail="Quiet Coach fades to zero." accent />
            <Stage index="03" label="SPEAK" detail="Record only your voice." />
          </View>

          <PrimaryAction
            accessibilityHint="Opens the guided rehearsal for this scenario"
            label="Start Quiet Coach"
            onPress={() => router.push(rehearseRoute)}
            testID="prepare-start"
          />

          <PrivacyNote>{scenario.privacyPromise}</PrivacyNote>

          <View style={styles.nextBlock}>
            <InkText style={styles.eyebrow} weight="semibold">
              COMING NEXT
            </InkText>
            <ComingNext label="Give feedback after a miss" />
            <ComingNext label="Push back without sounding defensive" />
          </View>

          <InkText style={styles.disclosure}>{scenario.contentDisclosure}</InkText>
        </ScrollView>
      </View>
    </BraveCanvas>
  );
}

function FactRow({
  icon,
  label,
  value,
}: {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  value: string;
}) {
  const colors = useBraveTheme();
  return (
    <View style={styles.factRow}>
      <MaterialCommunityIcons color={colors.cobalt} name={icon} size={22} />
      <View style={styles.factCopy}>
        <InkText style={styles.factLabel} weight="semibold">
          {label.toUpperCase()}
        </InkText>
        <InkText style={styles.factValue}>{value}</InkText>
      </View>
    </View>
  );
}

function Stage({
  accent = false,
  detail,
  index,
  label,
}: {
  accent?: boolean;
  detail: string;
  index: string;
  label: string;
}) {
  return (
    <View style={styles.stage}>
      <InkText style={[styles.stageIndex, accent && styles.stageIndexAccent]} weight="bold">
        {index}
      </InkText>
      <View style={styles.stageCopy}>
        <InkText style={styles.stageLabel} weight="bold">
          {label}
        </InkText>
        <InkText style={styles.stageDetail}>{detail}</InkText>
      </View>
    </View>
  );
}

function ComingNext({ label }: { label: string }) {
  return (
    <View accessibilityLabel={`${label}, coming next`} style={styles.comingRow}>
      <View style={styles.comingDash} />
      <InkText style={styles.comingLabel}>{label}</InkText>
      <InkText style={styles.comingStatus} weight="semibold">
        SOON
      </InkText>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 28,
    paddingRight: 22,
    paddingBottom: 32,
  },
  kicker: {
    fontSize: 14,
    letterSpacing: 1.8,
    marginBottom: 13,
  },
  hero: {
    fontSize: 39,
    lineHeight: 43,
    letterSpacing: -1.2,
    maxWidth: 480,
    marginBottom: 21,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 1.7,
    color: palette.aubergineSoft,
  },
  scenarioBlock: {
    paddingTop: 24,
  },
  scenarioTitle: {
    fontSize: 27,
    lineHeight: 32,
    marginTop: 8,
  },
  setup: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 10,
    color: palette.aubergineSoft,
  },
  factRows: {
    marginTop: 22,
    borderTopColor: palette.line,
    borderTopWidth: 1,
  },
  factRow: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
    paddingVertical: 13,
    borderBottomColor: palette.line,
    borderBottomWidth: 1,
  },
  factCopy: {
    flex: 1,
  },
  factLabel: {
    fontSize: 11,
    letterSpacing: 1.1,
    marginBottom: 3,
  },
  factValue: {
    fontSize: 14,
    lineHeight: 20,
  },
  sequence: {
    marginVertical: 26,
    borderTopColor: palette.aubergine,
    borderTopWidth: 2,
  },
  stage: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderBottomColor: palette.line,
    borderBottomWidth: 1,
  },
  stageIndex: {
    width: 36,
    fontSize: 13,
    color: palette.cobalt,
  },
  stageIndexAccent: {
    color: palette.orange,
  },
  stageCopy: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  stageLabel: {
    width: 74,
    fontSize: 14,
    letterSpacing: 1,
  },
  stageDetail: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: palette.aubergineSoft,
  },
  nextBlock: {
    marginTop: 26,
  },
  comingRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomColor: palette.line,
    borderBottomWidth: 1,
  },
  comingDash: {
    width: 18,
    height: 3,
    backgroundColor: palette.cobalt,
  },
  comingLabel: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  comingStatus: {
    fontSize: 10,
    letterSpacing: 1.2,
    color: palette.aubergineSoft,
  },
  disclosure: {
    marginTop: 18,
    fontSize: 11,
    lineHeight: 17,
    color: palette.aubergineSoft,
  },
});
