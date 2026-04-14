import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const PomodoroContext = createContext();

export const PomodoroProvider = ({ children }) => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('study'); // 'study' or 'break'
  const [sessions, setSessions] = useState(0);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [muted, setMuted] = useState(false);
  
  const timerRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        if (seconds > 0) {
          setSeconds(s => s - 1);
        } else if (minutes > 0) {
          setMinutes(m => m - 1);
          setSeconds(59);
        } else {
          handleTimerEnd();
        }
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, minutes, seconds]);

  const handleTimerEnd = () => {
    setIsActive(false);
    clearInterval(timerRef.current);
    
    if (!muted) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {});
    }

    if (mode === 'study') {
      const newSessions = sessions + 1;
      setSessions(newSessions);
      if (newSessions % 4 === 0) {
        setMode('break');
        setMinutes(15);
      } else {
        setMode('break');
        setMinutes(5);
      }
    } else {
      setMode('study');
      setMinutes(25);
    }
    setSeconds(0);
  };

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setMinutes(mode === 'study' ? 25 : 5);
    setSeconds(0);
  };

  const toggleFocusMode = () => {
    setIsFocusMode(!isFocusMode);
  };

  useEffect(() => {
    if (isFocusMode) {
      document.body.classList.add('focus-mode-active');
    } else {
      document.body.classList.remove('focus-mode-active');
    }
  }, [isFocusMode]);

  const value = {
    minutes, setMinutes,
    seconds, setSeconds,
    isActive, setIsActive,
    mode, setMode,
    sessions, setSessions,
    isFocusMode, setIsFocusMode,
    toggleFocusMode,
    toggleTimer,
    resetTimer,
    muted, setMuted
  };

  return (
    <PomodoroContext.Provider value={value}>
      {children}
    </PomodoroContext.Provider>
  );
};

export const usePomodoro = () => {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error('usePomodoro must be used within a PomodoroProvider');
  }
  return context;
};
