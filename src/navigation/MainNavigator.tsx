// 최상위 컨테이너 — Formation 모달 ↔ AssetScreen 전환
import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useAssetStore } from '../store/assetStore';
import { useFormationStore } from '../store/formationStore';
import { useMemo } from 'react';
import { AssetScreen } from '../screens/AssetScreen';
import { FormationFlow } from '../screens/FormationFlow';

export function MainNavigator() {
  const allAssets = useAssetStore((s) => s.assets);
  const assets = useMemo(
    () => allAssets.filter((a) => a.status !== 'archived'),
    [allAssets]
  );
  const reset = useFormationStore((s) => s.reset);
  const [formationOpen, setFormationOpen] = useState(false);

  // 첫 진입: 에셋 0개면 Formation 자동 시작 (§3.1)
  useEffect(() => {
    if (assets.length === 0) setFormationOpen(true);
  }, []); // mount 시 1회만

  const startFormation = useCallback(() => {
    reset();
    setFormationOpen(true);
  }, [reset]);

  const finishFormation = useCallback(() => {
    setFormationOpen(false);
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.root}>
        <AssetScreen onCreateNew={startFormation} />
      </View>
      <Modal
        visible={formationOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={finishFormation}
      >
        <FormationFlow onDone={finishFormation} />
      </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
