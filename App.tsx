import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { AppShell } from './src/app';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppShell />
    </>
  );
}

export default App;
