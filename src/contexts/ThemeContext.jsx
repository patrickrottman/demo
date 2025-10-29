import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, CssBaseline } from '@mui/material';

const ThemeContext = createContext(null);

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Check localStorage for saved preference, default to light
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('theme_mode');
    return savedMode || 'light';
  });

  // Save preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('theme_mode', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Create theme based on current mode
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === 'light' ? '#1976d2' : '#90caf9',
          },
          secondary: {
            main: mode === 'light' ? '#dc004e' : '#f48fb1',
          },
          background: {
            default: mode === 'light' ? '#f5f5f5' : '#121212',
            paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
          },
        },
        components: {
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: mode === 'light' ? '#1976d2' : '#1e1e1e',
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              colorWarning: {
                backgroundColor: mode === 'light' ? '#fff3e0' : '#3d2e00',
                color: mode === 'light' ? '#e65100' : '#ffb74d',
              },
              colorSuccess: {
                backgroundColor: mode === 'light' ? '#e8f5e9' : '#1b5e20',
                color: mode === 'light' ? '#2e7d32' : '#81c784',
              },
              colorError: {
                backgroundColor: mode === 'light' ? '#ffebee' : '#5f2120',
                color: mode === 'light' ? '#c62828' : '#e57373',
              },
            },
          },
        },
      }),
    [mode]
  );

  const value = {
    mode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
