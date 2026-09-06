import { type Href, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import {
  braveLineSessionStore,
  inspectExpoAudioRecordingFile,
  resolveBraveLineResume,
} from '@/services';
import { useBraveTheme } from '@/ui/braveline';

export default function Index() {
  const router = useRouter();
  const colors = useBraveTheme();

  useEffect(() => {
    let active = true;

    void resolveBraveLineResume({
      inspectFile: inspectExpoAudioRecordingFile,
      platform: Platform.OS === 'web' ? 'web' : 'native',
      store: braveLineSessionStore,
    })
      .then((destination) => {
        if (!active) return;

        if (destination.kind === 'ready') {
          const { take } = destination;
          router.replace({
            pathname: '/ready',
            params: {
              capturedAt: take.capturedAt,
              durationMs: String(take.durationMs),
              takeId: take.id,
              takeUri: take.uri,
            },
          } as Href);
          return;
        }

        router.replace('/prepare' as Href);
      })
      .catch(() => {
        if (active) router.replace('/prepare' as Href);
      });

    return () => {
      active = false;
    };
  }, [router]);

  return <View style={[styles.loading, { backgroundColor: colors.chalk }]} testID="session-resume-loading" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#F8F8E9',
  },
});
