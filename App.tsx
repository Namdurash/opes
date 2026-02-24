import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { AppShell } from './src/app';
import { ThemeProvider } from './src/shared/theme';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <ThemeProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppShell />
    </ThemeProvider>
  );
}

export default App;
