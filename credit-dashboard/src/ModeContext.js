import React from 'react';

const AppModeContext = React.createContext({ mode: 'testing', setMode: () => {} });

export default function AppModeProvider({ children }) {
  const [mode, setModeState] = React.useState(
    localStorage.getItem('app-mode') || 'testing'
  );

  const setMode = React.useCallback((newMode) => {
    setModeState(newMode);
    localStorage.setItem('app-mode', newMode);
  }, []);

  const value = React.useMemo(() => ({ mode, setMode }), [mode, setMode]);

  return (
    <AppModeContext.Provider value={value}>{children}</AppModeContext.Provider>
  );
}

export { AppModeContext };
