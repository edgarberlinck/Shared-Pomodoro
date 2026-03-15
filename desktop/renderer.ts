declare global {
  interface Window {
    electronAPI: {
      getConfig: () => Promise<any>;
      saveConfig: (config: any) => Promise<boolean>;
      apiRequest: (options: any) => Promise<any>;
      updateTray: (sessionData: any) => void;
      showNotification: (notification: any) => void;
      onTimerAction: (callback: (action: string) => void) => void;
    };
  }
}

interface Session {
  id: string;
  name: string;
  status: string;
  isBreak: boolean;
  timeLeft: number;
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  completedPomodoros: number;
  pomodorosUntilLongBreak: number;
}

let currentSession: Session | null = null;
let pollingInterval: NodeJS.Timeout | null = null;
let countdownInterval: NodeJS.Timeout | null = null;
let clientTimeLeft: number = 0;
let lastServerSync: number = Date.now();

const API = window.electronAPI;

// UI Elements
const loginView = document.getElementById('login-view')!;
const sessionView = document.getElementById('session-view')!;
const emailInput = document.getElementById('email') as HTMLInputElement;
const passwordInput = document.getElementById('password') as HTMLInputElement;
const loginBtn = document.getElementById('login-btn')!;
const sessionSelect = document.getElementById('session-select') as HTMLSelectElement;
const loadSessionBtn = document.getElementById('load-session-btn')!;
const timerDisplay = document.getElementById('timer-display')!;
const phaseDisplay = document.getElementById('phase-display')!;
const sessionNameDisplay = document.getElementById('session-name')!;
const pomodoroCount = document.getElementById('pomodoro-count')!;
const startBtn = document.getElementById('start-btn')!;
const pauseBtn = document.getElementById('pause-btn')!;
const resetBtn = document.getElementById('reset-btn')!;
const logoutBtn = document.getElementById('logout-btn')!;

// Initialize
async function init() {
  const config = await API.getConfig();
  
  if (config.token && config.currentSessionId) {
    await loadSession(config.currentSessionId);
    showSessionView();
  } else {
    showLoginView();
  }
  
  setupEventListeners();
}

function setupEventListeners() {
  loginBtn.addEventListener('click', handleLogin);
  loadSessionBtn.addEventListener('click', handleLoadSession);
  startBtn.addEventListener('click', () => handleTimerAction('start'));
  pauseBtn.addEventListener('click', () => handleTimerAction('pause'));
  resetBtn.addEventListener('click', () => handleTimerAction('reset'));
  logoutBtn.addEventListener('click', handleLogout);
  
  API.onTimerAction((action) => {
    handleTimerAction(action);
  });
}

async function handleLogin() {
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  
  if (!email || !password) {
    alert('Please enter email and password');
    return;
  }
  
  loginBtn.textContent = 'Logging in...';
  loginBtn.setAttribute('disabled', 'true');
  
  const response = await API.apiRequest({
    method: 'POST',
    endpoint: '/api/desktop/auth/login',
    body: { email, password },
  });
  
  if (response.ok && response.data.token) {
    await API.saveConfig({
      email,
      token: response.data.token,
    });
    
    await loadSessions();
    showSessionSelectView();
  } else {
    alert(response.data?.error || 'Login failed');
  }
  
  loginBtn.textContent = 'Login';
  loginBtn.removeAttribute('disabled');
}

async function loadSessions() {
  const config = await API.getConfig();
  const response = await API.apiRequest({
    method: 'GET',
    endpoint: '/api/sessions',
    token: config.token,
  });
  
  if (response.ok) {
    sessionSelect.innerHTML = '<option value="">Select a session...</option>';
    response.data.forEach((session: any) => {
      const option = document.createElement('option');
      option.value = session.id;
      option.textContent = session.name;
      sessionSelect.appendChild(option);
    });
  }
}

async function handleLoadSession() {
  const sessionId = sessionSelect.value;
  if (!sessionId) {
    alert('Please select a session');
    return;
  }
  
  const config = await API.getConfig();
  await API.saveConfig({ ...config, currentSessionId: sessionId });
  
  await loadSession(sessionId);
  showSessionView();
}

async function loadSession(sessionId: string) {
  const config = await API.getConfig();
  const response = await API.apiRequest({
    method: 'GET',
    endpoint: `/api/sessions/${sessionId}`,
    token: config.token,
  });
  
  if (response.ok) {
    updateSessionUI(response.data);
    startPolling();
  } else {
    alert('Failed to load session');
  }
}

function updateSessionUI(session: Session) {
  currentSession = session;
  clientTimeLeft = session.timeLeft;
  lastServerSync = Date.now();
  
  sessionNameDisplay.textContent = session.name;
  phaseDisplay.textContent = session.isBreak ? '☕ Break Time' : '🍅 Focus Time';
  pomodoroCount.textContent = `${session.completedPomodoros} pomodoros completed`;
  updateTimerDisplay(session.timeLeft);
  
  // Update buttons
  const isRunning = session.status === 'RUNNING' || session.status === 'BREAK';
  startBtn.style.display = isRunning ? 'none' : 'inline-block';
  pauseBtn.style.display = isRunning ? 'inline-block' : 'none';
  
  // Update tray
  API.updateTray(session);
  
  // Start/stop countdown
  if (isRunning) {
    startCountdown();
  } else {
    stopCountdown();
  }
}

function updateTimerDisplay(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function startCountdown() {
  stopCountdown();
  
  countdownInterval = setInterval(() => {
    if (clientTimeLeft > 0) {
      clientTimeLeft--;
      updateTimerDisplay(clientTimeLeft);
      
      // Sync with server every 5 seconds
      if (Date.now() - lastServerSync >= 5000) {
        syncWithServer();
      }
    }
  }, 1000);
}

function stopCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

async function syncWithServer() {
  if (!currentSession) return;
  
  const config = await API.getConfig();
  const response = await API.apiRequest({
    method: 'GET',
    endpoint: `/api/sessions/${currentSession.id}`,
    token: config.token,
  });
  
  if (response.ok) {
    const oldPhase = currentSession.isBreak;
    updateSessionUI(response.data);
    
    // Show notification on phase change
    if (oldPhase !== response.data.isBreak) {
      API.showNotification({
        title: response.data.isBreak ? 'Break Time! ☕' : 'Focus Time! 🍅',
        body: response.data.isBreak 
          ? 'Time for a break. Relax!'
          : 'Back to work. Stay focused!',
      });
    }
  }
  
  lastServerSync = Date.now();
}

function startPolling() {
  stopPolling();
  pollingInterval = setInterval(syncWithServer, 5000);
}

function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

async function handleTimerAction(action: string) {
  if (!currentSession) return;
  
  const config = await API.getConfig();
  const response = await API.apiRequest({
    method: 'POST',
    endpoint: `/api/sessions/${currentSession.id}/timer`,
    body: { action },
    token: config.token,
  });
  
  if (response.ok) {
    updateSessionUI(response.data);
  }
}

async function handleLogout() {
  stopPolling();
  stopCountdown();
  await API.saveConfig({});
  currentSession = null;
  showLoginView();
}

function showLoginView() {
  loginView.style.display = 'block';
  sessionView.style.display = 'none';
  document.getElementById('session-select-view')!.style.display = 'none';
}

function showSessionSelectView() {
  loginView.style.display = 'none';
  sessionView.style.display = 'none';
  document.getElementById('session-select-view')!.style.display = 'block';
}

function showSessionView() {
  loginView.style.display = 'none';
  sessionView.style.display = 'block';
  document.getElementById('session-select-view')!.style.display = 'none';
}

// Start the app
init();

export {};
