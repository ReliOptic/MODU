// 최상위 컨테이너 — Formation 모달 ↔ AssetScreen 전환 + 웹 모바일 viewport
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Modal, Platform, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAssetStore, initAssetStore } from '../store/assetStore';
import { useFormationStore } from '../store/formationStore';
import { AssetScreen } from '../screens/AssetScreen';
import { FormationFlow } from '../screens/FormationFlow';
import { ConsentScreen, readConsentRecord } from '../screens/ConsentScreen';

/**
 * 모바일 viewport 폭 — 모든 디바이스에서 동일한 모바일 경험 제공.
 * 데스크톱 웹에서도 이 너비로 가운데 정렬됨.
 */
const MOBILE_MAX_WIDTH = 430;

export function MainNavigator() {
  const allAssets = useAssetStore((s) => s.assets);
  const initialized = useAssetStore((s) => s.initialized);
  const assets = useMemo(
    () => allAssets.filter((a) => a.status !== 'archived'),
    [allAssets]
  );
  const reset = useFormationStore((s) => s.reset);
  const [formationOpen, setFormationOpen] = useState(false);
  // null = loading, false = not yet consented, true = consented
  const [consentDone, setConsentDone] = useState<boolean | null>(null);
  // Guard: Formation auto-open only on first boot, never on subsequent asset-archive events.
  const firstBootRef = useRef(true);

  // Boot: check consent + load assets in parallel.
  useEffect(() => {
    readConsentRecord().then((record) => {
      setConsentDone(record !== null);
    });
    initAssetStore();
  }, []);

  // 첫 진입: 에셋 0개면 Formation 자동 시작 (§3.1) — wait until initialized and consented.
  // firstBootRef prevents re-triggering when a user archives their last asset.
  useEffect(() => {
    if (consentDone === true && initialized && firstBootRef.current && assets.length === 0) {
      firstBootRef.current = false;
      setFormationOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consentDone, initialized]);

  const startFormation = useCallback(() => {
    reset();
    setFormationOpen(true);
  }, [reset]);

  const finishFormation = useCallback(() => {
    setFormationOpen(false);
  }, []);

  // Still loading consent record — render nothing to avoid flash.
  if (consentDone === null) {
    return (
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.root} />
      </SafeAreaProvider>
    );
  }

  // Consent not yet recorded — show ConsentScreen.
  if (!consentDone) {
    return (
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.root}>
          <StatusBar style="dark" />
          <MobileFrame>
            <ConsentScreen onAccepted={() => setConsentDone(true)} />
          </MobileFrame>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.root}>
        <StatusBar style="dark" />
        <MobileFrame>
          <AssetScreen onCreateNew={startFormation} />
        </MobileFrame>
        <Modal
          visible={formationOpen}
          animationType="slide"
          presentationStyle={Platform.OS === 'web' ? 'overFullScreen' : 'pageSheet'}
          transparent={Platform.OS === 'web'}
          onRequestClose={finishFormation}
        >
          <MobileFrame>
            <FormationFlow onDone={finishFormation} />
          </MobileFrame>
        </Modal>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

/**
 * 웹 전용 모바일 frame — 데스크톱에서도 폰 크기로 보이게 가운데 정렬.
 * 네이티브에서는 그냥 flex:1.
 */
function MobileFrame({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  if (Platform.OS !== 'web') {
    return <View style={styles.root}>{children}</View>;
  }
  const isWide = width > MOBILE_MAX_WIDTH;
  return (
    <View style={styles.webOuter}>
      <View
        style={[
          styles.webInner,
          isWide && {
            maxWidth: MOBILE_MAX_WIDTH,
            shadowColor: '#000',
            shadowOpacity: 0.18,
            shadowRadius: 32,
            shadowOffset: { width: 0, height: 0 },
            // RN web 은 boxShadow 자동 변환
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  webOuter: {
    flex: 1,
    backgroundColor: '#E5E7EB', // 데스크톱 외곽 배경
    alignItems: 'center',
    justifyContent: 'center',
  },
  webInner: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
});
