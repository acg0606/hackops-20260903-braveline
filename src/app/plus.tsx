import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { type Href, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { createPreviewEntitlements } from '@/services';
import {
  BraveCanvas,
  InkText,
  OutlineAction,
  palette,
  PrimaryAction,
  Rule,
  TopBar,
} from '@/ui/braveline';

const prepareRoute = '/prepare' as Href;
const previewEntitlements = createPreviewEntitlements();

const benefits = [
  {
    icon: 'pencil-ruler',
    index: '01',
    title: 'Write your own scenario',
    detail: 'Turn tomorrow’s real conversation into a focused rehearsal.',
  },
  {
    icon: 'account-switch-outline',
    index: '02',
    title: 'Choose the counterpart',
    detail: 'Practise with a direct, uncertain, or resistant response profile.',
  },
  {
    icon: 'timeline-clock-outline',
    index: '03',
    title: 'Keep rehearsal history',
    detail: 'Return to prior takes and compare the words you chose — privately.',
  },
] as const;

export default function PlusScreen() {
  const router = useRouter();

  return (
    <BraveCanvas>
      <TopBar label="BRAVELINE PLUS" meta="LOCAL PREVIEW" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View accessibilityLabel="Preview only. No purchase is available on this screen." style={styles.previewBand}>
          <MaterialCommunityIcons color={palette.orange} name="eye-outline" size={22} />
          <InkText style={styles.previewText} weight="semibold">
            PURCHASES OFF — PREVIEW ONLY
          </InkText>
        </View>

        <InkText style={styles.kicker} weight="semibold">
          AFTER YOUR FIRST REHEARSAL
        </InkText>
        <InkText accessibilityRole="header" style={styles.hero} weight="bold">
          More practice. Never a wall.
        </InkText>
        <InkText style={styles.intro}>
          The complete boundary rehearsal stays free and repeatable. Plus is for people who want to bring more of their own conversations into BraveLine.
        </InkText>
        <Rule orange />

        <View style={styles.benefitList}>
          {benefits.map((benefit) => (
            <View key={benefit.index} style={styles.benefitRow}>
              <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.iconColumn}>
                <InkText style={styles.benefitIndex} weight="bold">
                  {benefit.index}
                </InkText>
                <MaterialCommunityIcons color={palette.cobalt} name={benefit.icon} size={26} />
              </View>
              <View style={styles.benefitCopy}>
                <InkText style={styles.benefitTitle} weight="bold">
                  {benefit.title}
                </InkText>
                <InkText style={styles.benefitDetail}>{benefit.detail}</InkText>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.offerBlock}>
          <InkText style={styles.offerLabel} weight="semibold">
            PLANNED LAUNCH OFFER
          </InkText>
          <View style={styles.offerLine}>
            <InkText style={styles.offerLarge} weight="bold">
              7 days
            </InkText>
            <InkText style={styles.offerCopy}>to explore Plus before a paid plan begins.</InkText>
          </View>
          <InkText style={styles.offerFine}>
            {previewEntitlements.snapshot.disclosure} Billing details will appear only when RevenueCat is configured.
          </InkText>
        </View>

        <OutlineAction
          accessibilityHint="Unavailable because this is a local preview"
          disabled
          icon="lock-outline"
          label="Start trial — available in purchase mode"
          onPress={() => undefined}
          testID="plus-preview-disabled"
        />
        <View style={styles.actionSpacer} />
        <PrimaryAction
          accessibilityHint="Returns to the complete free rehearsal"
          icon="arrow-left"
          label="Continue with free BraveLine"
          onPress={() => router.replace(prepareRoute)}
          testID="plus-continue-free"
        />

        <View style={styles.restoreRow}>
          <MaterialCommunityIcons color={palette.aubergineSoft} name="restore" size={21} />
          <InkText style={styles.restoreText}>
            Restore and manage access appear here in live purchase mode.
          </InkText>
        </View>

        <InkText style={styles.entitlement}>
          PLANNED ENTITLEMENT · {previewEntitlements.snapshot.entitlementId.toUpperCase()}
        </InkText>
      </ScrollView>
    </BraveCanvas>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 32,
  },
  previewBand: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderBottomColor: palette.orange,
    borderBottomWidth: 4,
    marginBottom: 28,
  },
  previewText: {
    fontSize: 12,
    letterSpacing: 1.4,
  },
  kicker: {
    fontSize: 13,
    letterSpacing: 1.7,
    color: palette.cobalt,
    marginBottom: 10,
  },
  hero: {
    fontSize: 42,
    lineHeight: 45,
    letterSpacing: -1.4,
    maxWidth: 500,
  },
  intro: {
    fontSize: 16,
    lineHeight: 24,
    color: palette.aubergineSoft,
    marginTop: 16,
    marginBottom: 22,
  },
  benefitList: {
    marginTop: 25,
    borderTopColor: palette.aubergine,
    borderTopWidth: 2,
  },
  benefitRow: {
    minHeight: 116,
    flexDirection: 'row',
    borderBottomColor: palette.line,
    borderBottomWidth: 1,
    paddingVertical: 20,
  },
  iconColumn: {
    width: 64,
    justifyContent: 'space-between',
  },
  benefitIndex: {
    fontSize: 11,
    color: palette.orange,
  },
  benefitCopy: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 19,
    lineHeight: 24,
  },
  benefitDetail: {
    fontSize: 14,
    lineHeight: 21,
    color: palette.aubergineSoft,
    marginTop: 5,
  },
  offerBlock: {
    marginVertical: 26,
    paddingLeft: 18,
    borderLeftColor: palette.cobalt,
    borderLeftWidth: 8,
  },
  offerLabel: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: palette.cobalt,
  },
  offerLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
    marginTop: 5,
  },
  offerLarge: {
    fontSize: 31,
    letterSpacing: -0.8,
  },
  offerCopy: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  offerFine: {
    fontSize: 11,
    lineHeight: 17,
    color: palette.aubergineSoft,
    marginTop: 9,
  },
  actionSpacer: {
    height: 10,
  },
  restoreRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 9,
  },
  restoreText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: palette.aubergineSoft,
  },
  entitlement: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 10,
    letterSpacing: 1.3,
    color: palette.aubergineSoft,
  },
});
