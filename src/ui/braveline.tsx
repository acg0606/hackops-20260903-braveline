import {
  GothicA1_400Regular,
  GothicA1_500Medium,
  GothicA1_600SemiBold,
  GothicA1_700Bold,
  useFonts,
} from '@expo-google-fonts/gothic-a1';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps, PropsWithChildren } from 'react';
import { createContext, useContext } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type TextProps,
  useColorScheme,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const palette = {
  chalk: '#F8F8E9',
  chalkMuted: '#E9E7DA',
  aubergine: '#24103D',
  aubergineSoft: '#776E7D',
  cobalt: '#0B4DCA',
  cobaltPressed: '#073B9C',
  orange: '#FF6417',
  white: '#FFFFFF',
  line: '#C8C3C7',
  success: '#17694B',
} as const;

export type BravePalette = { [Key in keyof typeof palette]: string };

const darkPalette: BravePalette = {
  chalk: '#17111D',
  chalkMuted: '#2B2331',
  aubergine: '#F8F1FB',
  aubergineSoft: '#CFC3D4',
  cobalt: '#79A7FF',
  cobaltPressed: '#5A8DEB',
  orange: '#FF8A52',
  white: '#FFFFFF',
  line: '#5A4E60',
  success: '#75D8AC',
};

const FontContext = createContext(false);
const ThemeContext = createContext<BravePalette>(palette);

type InkTextProps = TextProps & {
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
};

const fontFamilies = {
  regular: 'GothicA1_400Regular',
  medium: 'GothicA1_500Medium',
  semibold: 'GothicA1_600SemiBold',
  bold: 'GothicA1_700Bold',
} as const;

export function BraveThemeProvider({ children }: PropsWithChildren) {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? darkPalette : palette;
  return <ThemeContext.Provider value={colors}>{children}</ThemeContext.Provider>;
}

export function useBraveTheme() {
  return useContext(ThemeContext);
}

export function BraveCanvas({ children }: PropsWithChildren) {
  const [fontsLoaded] = useFonts({
    GothicA1_400Regular,
    GothicA1_500Medium,
    GothicA1_600SemiBold,
    GothicA1_700Bold,
  });
  const colors = useBraveTheme();

  return (
    <FontContext.Provider value={fontsLoaded}>
      <SafeAreaView edges={['top', 'bottom']} style={[styles.canvas, { backgroundColor: colors.chalk }]}>
        {children}
      </SafeAreaView>
    </FontContext.Provider>
  );
}

export function InkText({ weight = 'regular', style, ...props }: InkTextProps) {
  const fontsLoaded = useContext(FontContext);
  const colors = useBraveTheme();
  const requestedColor = StyleSheet.flatten(style)?.color;
  const semanticColor =
    requestedColor === palette.aubergineSoft
      ? colors.aubergineSoft
      : requestedColor === palette.cobalt
        ? colors.cobalt
        : requestedColor === palette.orange
          ? colors.orange
          : requestedColor === palette.white
            ? colors.white
            : requestedColor === palette.success
              ? colors.success
              : requestedColor === palette.aubergine || requestedColor == null
                ? colors.aubergine
                : requestedColor;
  return (
    <Text
      {...props}
      maxFontSizeMultiplier={1.3}
      style={[
        styles.ink,
        { color: colors.aubergine },
        fontsLoaded ? { fontFamily: fontFamilies[weight] } : undefined,
        style,
        { color: semanticColor },
      ]}
    />
  );
}

type TopBarProps = {
  label: string;
  meta?: string;
  onBack?: () => void;
};

export function TopBar({ label, meta, onBack }: TopBarProps) {
  const colors = useBraveTheme();
  return (
    <View style={[styles.topBar, { borderBottomColor: colors.line }]}>
      {onBack ? (
        <Pressable
          accessibilityHint="Returns to the previous screen"
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.quietPressed]}
        >
          <MaterialCommunityIcons color={colors.aubergine} name="arrow-left" size={30} />
        </Pressable>
      ) : (
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.brandMark, { borderColor: colors.cobalt }]}>
          <View style={[styles.brandMarkCore, { backgroundColor: colors.orange }]} />
        </View>
      )}
      <InkText accessibilityRole="header" style={styles.topLabel} weight="semibold">
        {label}
      </InkText>
      {meta ? (
        <InkText style={[styles.topMeta, { color: colors.aubergineSoft }]} weight="medium">
          {meta}
        </InkText>
      ) : null}
    </View>
  );
}

type TapeRailProps = {
  active: 1 | 2 | 3;
  labels?: readonly [string, string, string];
  style?: ViewStyle;
};

export function TapeRail({ active, labels = ['PREPARE', 'REHEARSE', 'READY'], style }: TapeRailProps) {
  const colors = useBraveTheme();
  return (
    <View accessibilityLabel={`Step ${active} of 3, ${labels[active - 1]}`} style={[styles.rail, style]}>
      <View style={[styles.railLine, { backgroundColor: colors.cobalt }]} />
      {labels.map((label, index) => {
        const step = (index + 1) as 1 | 2 | 3;
        const isActive = step === active;
        const isComplete = step < active;
        return (
          <View key={label} style={styles.railStep}>
            <View
              style={[
                styles.railNode,
                { backgroundColor: colors.chalk },
                isComplete && [styles.railNodeComplete, { backgroundColor: colors.cobalt, borderColor: colors.chalk }],
                isActive && [styles.railNodeActive, { backgroundColor: colors.orange, borderColor: colors.chalk }],
              ]}
            />
            <InkText
              importantForAccessibility="no"
              style={[styles.railNumber, { color: colors.aubergineSoft }, isActive && [styles.railNumberActive, { color: colors.cobalt }]]}
              weight={isActive ? 'bold' : 'medium'}
            >
              {String(step).padStart(2, '0')}
            </InkText>
          </View>
        );
      })}
    </View>
  );
}

type ActionProps = {
  accessibilityHint?: string;
  disabled?: boolean;
  icon?: ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  onPress: () => void;
  testID?: string;
};

export function PrimaryAction({
  accessibilityHint,
  disabled = false,
  icon = 'arrow-right',
  label,
  onPress,
  testID,
}: ActionProps) {
  const colors = useBraveTheme();
  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.primaryAction,
        { backgroundColor: colors.cobalt },
        pressed && !disabled && [styles.primaryPressed, { backgroundColor: colors.cobaltPressed }],
        disabled && styles.disabled,
      ]}
    >
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.splice, { backgroundColor: colors.orange }]} />
      <InkText style={styles.primaryLabel} weight="bold">
        {label}
      </InkText>
      <MaterialCommunityIcons color={colors.white} name={icon} size={26} />
    </Pressable>
  );
}

export function OutlineAction({
  accessibilityHint,
  disabled = false,
  icon = 'arrow-right',
  label,
  onPress,
  testID,
}: ActionProps) {
  const colors = useBraveTheme();
  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.outlineAction,
        { borderColor: colors.aubergine },
        pressed && !disabled && [styles.outlinePressed, { backgroundColor: colors.chalkMuted }],
        disabled && styles.disabled,
      ]}
    >
      <MaterialCommunityIcons color={colors.aubergine} name={icon} size={23} />
      <InkText style={styles.outlineLabel} weight="semibold">
        {label}
      </InkText>
    </Pressable>
  );
}

export function PrivacyNote({ children }: PropsWithChildren) {
  const colors = useBraveTheme();
  return (
    <View accessibilityRole="summary" style={styles.privacyNote}>
      <MaterialCommunityIcons color={colors.aubergine} name="shield-lock-outline" size={23} />
      <InkText style={styles.privacyText}>{children}</InkText>
    </View>
  );
}

export function Rule({ orange = false }: { orange?: boolean }) {
  const colors = useBraveTheme();
  return <View accessibilityElementsHidden style={[styles.rule, { backgroundColor: orange ? colors.orange : colors.line }, orange && styles.orangeRule]} />;
}

export function Waveform({ muted = false }: { muted?: boolean }) {
  const colors = useBraveTheme();
  const bars = [8, 18, 31, 15, 24, 44, 19, 33, 12, 27, 51, 25, 16, 37, 22, 42, 18, 29, 11];
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.waveform}>
      {bars.map((height, index) => (
        <View
          key={`${height}-${index}`}
          style={[
            styles.waveBar,
            { height },
            { backgroundColor: muted ? colors.line : colors.cobalt },
            index === 10 ? [styles.waveBarAccent, { backgroundColor: colors.orange }] : undefined,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    backgroundColor: palette.chalk,
  },
  ink: {
    color: palette.aubergine,
  },
  topBar: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    borderBottomColor: palette.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
  },
  quietPressed: {
    opacity: 0.55,
  },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 20,
    borderColor: palette.cobalt,
    borderWidth: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkCore: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: palette.orange,
  },
  topLabel: {
    flex: 1,
    fontSize: 15,
    letterSpacing: 1.4,
  },
  topMeta: {
    fontSize: 13,
    letterSpacing: 1,
    color: palette.aubergineSoft,
  },
  rail: {
    width: 66,
    alignSelf: 'stretch',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  railLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 32,
    width: 8,
    backgroundColor: palette.cobalt,
  },
  railStep: {
    minHeight: 64,
    width: 66,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  railNode: {
    position: 'absolute',
    left: 27,
    width: 19,
    height: 3,
    backgroundColor: palette.chalk,
  },
  railNodeComplete: {
    height: 13,
    width: 13,
    left: 29,
    borderRadius: 7,
    backgroundColor: palette.cobalt,
    borderColor: palette.chalk,
    borderWidth: 3,
  },
  railNodeActive: {
    height: 18,
    width: 18,
    left: 27,
    backgroundColor: palette.orange,
    borderColor: palette.chalk,
    borderWidth: 3,
  },
  railNumber: {
    fontSize: 12,
    color: palette.aubergineSoft,
    marginLeft: 0,
  },
  railNumberActive: {
    color: palette.cobalt,
  },
  primaryAction: {
    width: '100%',
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.cobalt,
    paddingHorizontal: 22,
    overflow: 'hidden',
  },
  primaryPressed: {
    backgroundColor: palette.cobaltPressed,
  },
  splice: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
    backgroundColor: palette.orange,
  },
  primaryLabel: {
    color: palette.white,
    fontSize: 18,
    letterSpacing: 0.3,
  },
  outlineAction: {
    width: '100%',
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderColor: palette.aubergine,
    borderWidth: 1,
    paddingHorizontal: 18,
  },
  outlinePressed: {
    backgroundColor: palette.chalkMuted,
  },
  outlineLabel: {
    flex: 1,
    fontSize: 15,
  },
  disabled: {
    opacity: 0.45,
  },
  privacyNote: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  rule: {
    height: 1,
    backgroundColor: palette.line,
  },
  orangeRule: {
    height: 5,
    width: 44,
    backgroundColor: palette.orange,
  },
  waveform: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 3,
    overflow: 'hidden',
  },
  waveBar: {
    flex: 1,
    maxWidth: 4,
    minWidth: 2,
    backgroundColor: palette.cobalt,
  },
  waveBarMuted: {
    backgroundColor: palette.line,
  },
  waveBarAccent: {
    backgroundColor: palette.orange,
  },
});
