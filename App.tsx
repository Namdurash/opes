import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { AppShell } from './src/app';
import { ThemeProvider } from './src/shared/theme';
import { GlobalBottomSheet } from './src/shared/ui/bottom-sheet';

function App() {

  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider>
        <BottomSheetModalProvider>
          <StatusBar />
          <AppShell />
          <GlobalBottomSheet />
        </BottomSheetModalProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default App;
