// Jeopardy Buzzer System with Security Features
class BuzzerSystem {
    constructor() {
        this.buzzersEnabled = false;
        this.locked = false;
        this.winner = null;
        this.startTime = null;
        this.soundEnabled = true;
        
        // Security features
        this.isAuthenticated = false;
        this.hostPin = '1234'; // CHANGE THIS IN PRODUCTION!
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        this.sessionStart = null;
        this.sessionTimer = null;
        this.maxLoginAttempts = 5;
        this.loginAttempts = 0;
        this.lockoutTime = 5 * 60 * 1000; // 5 minutes lockout
        this.lockoutUntil = null;
        
        // Rate limiting for buzzer presses
        this.rateLimitWindow = 1000; // 1 second
        this.maxBuzzesPerWindow = 3;
        this.buzzerPressLog = new Map(); // player -> [timestamps]
        
        // Input sanitization
        this.maxNameLength = 20;
        this.allowedNamePattern = /^[a-zA-Z0-9\s\-_]+$/;
        
        // Player configurations
        this.players = {
            1: { key: 'q', name: 'Player 1', element: null, lightElement: null, timeElement: null },
            2: { key: 'p', name: 'Player 2', element: null, lightElement: null, timeElement: null },
            3: { key: 'm', name: 'Player 3', element: null, lightElement: null, timeElement: null }
        };
        
        this.init();
    }
    
    init() {
        // Get DOM elements
        this.statusMessage = document.getElementById('statusMessage');
        this.timerDisplay = document.getElementById('timer');
        this.enableBtn = document.getElementById('enableBuzzers');
        this.resetBtn = document.getElementById('resetBuzzers');
        this.soundToggle = document.getElementById('soundToggle');
        
        // Authentication elements
        this.authModal = document.getElementById('authModal');
        this.authForm = document.getElementById('authForm');
        this.hostPinInput = document.getElementById('hostPin');
        this.authError = document.getElementById('authError');
        this.cancelAuthBtn = document.getElementById('cancelAuth');
        this.authStatus = document.getElementById('authStatus');
        this.sessionTimerDisplay = document.getElementById('sessionTimer');
        this.logoutBtn = document.getElementById('logoutBtn');
        
        // Initialize player elements
        for (let i = 1; i <= 3; i++) {
            this.players[i].element = document.querySelector(`.player[data-player="${i}"]`);
            this.players[i].lightElement = document.getElementById(`light${i}`);
            this.players[i].timeElement = document.getElementById(`time${i}`);
            this.players[i].nameInput = document.getElementById(`name${i}`);
        }
        
        // Create audio context for buzzer sounds
        this.initAudio();
        
        // Event listeners
        this.enableBtn.addEventListener('click', () => this.checkAuthAndEnable());
        this.resetBtn.addEventListener('click', () => this.checkAuthAndReset());
        this.soundToggle.addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
        });
        
        // Authentication event listeners
        this.authForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.cancelAuthBtn.addEventListener('click', () => this.closeAuthModal());
        this.logoutBtn.addEventListener('click', () => this.logout());
        
        // Keyboard event listener
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Update player names with sanitization
        Object.values(this.players).forEach(player => {
            player.nameInput.addEventListener('input', (e) => {
                const sanitized = this.sanitizeInput(e.target.value);
                if (sanitized !== e.target.value) {
                    e.target.value = sanitized;
                }
                player.name = sanitized || `Player ${player.element.dataset.player}`;
            });
            
            // Prevent paste of malicious content
            player.nameInput.addEventListener('paste', (e) => {
                e.preventDefault();
                const pastedText = (e.clipboardData || window.clipboardData).getData('text');
                const sanitized = this.sanitizeInput(pastedText);
                document.execCommand('insertText', false, sanitized);
            });
        });
        
        // Check for existing session
        this.checkExistingSession();
        
        // Disable host controls initially
        this.updateAuthUI();
    }
    
    initAudio() {
        // Create audio context (will be created on first user interaction)
        this.audioContext = null;
    }
    
    // Security: Input sanitization
    sanitizeInput(input) {
        if (!input) return '';
        
        // Limit length
        let sanitized = input.slice(0, this.maxNameLength);
        
        // Remove any HTML/script tags
        sanitized = sanitized.replace(/<[^>]*>/g, '');
        
        // Only allow safe characters
        sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-_]/g, '');
        
        // Trim whitespace
        sanitized = sanitized.trim();
        
        return sanitized;
    }
    
    // Security: Authentication
    checkAuthAndEnable() {
        if (!this.isAuthenticated) {
            this.showAuthModal();
        } else {
            this.enableBuzzers();
        }
    }
    
    checkAuthAndReset() {
        if (!this.isAuthenticated) {
            this.showAuthModal();
        } else {
            this.reset();
        }
    }
    
    showAuthModal() {
        if (this.lockoutUntil && Date.now() < this.lockoutUntil) {
            const remainingTime = Math.ceil((this.lockoutUntil - Date.now()) / 1000);
            this.authError.textContent = `Too many failed attempts. Locked out for ${remainingTime}s`;
            setTimeout(() => this.showAuthModal(), 1000);
            return;
        }
        
        this.authModal.classList.add('active');
        this.hostPinInput.value = '';
        this.authError.textContent = '';
        this.hostPinInput.focus();
    }
    
    closeAuthModal() {
        this.authModal.classList.remove('active');
        this.hostPinInput.value = '';
        this.authError.textContent = '';
    }
    
    handleLogin(e) {
        e.preventDefault();
        
        // Check lockout
        if (this.lockoutUntil && Date.now() < this.lockoutUntil) {
            const remainingTime = Math.ceil((this.lockoutUntil - Date.now()) / 1000);
            this.authError.textContent = `Locked out. Try again in ${remainingTime}s`;
            return;
        }
        
        const pin = this.hostPinInput.value;
        
        // Validate PIN format
        if (!/^[0-9]{4,6}$/.test(pin)) {
            this.authError.textContent = 'PIN must be 4-6 digits';
            return;
        }
        
        // Check PIN (in production, use hashed comparison and server-side validation)
        if (pin === this.hostPin) {
            this.isAuthenticated = true;
            this.loginAttempts = 0;
            this.sessionStart = Date.now();
            this.closeAuthModal();
            this.updateAuthUI();
            this.startSessionTimer();
            
            // Store session in sessionStorage (expires when tab closes)
            sessionStorage.setItem('buzzer_auth', 'true');
            sessionStorage.setItem('buzzer_session_start', this.sessionStart.toString());
        } else {
            this.loginAttempts++;
            const remaining = this.maxLoginAttempts - this.loginAttempts;
            
            if (this.loginAttempts >= this.maxLoginAttempts) {
                this.lockoutUntil = Date.now() + this.lockoutTime;
                this.authError.textContent = `Too many failed attempts. Locked out for 5 minutes.`;
                this.loginAttempts = 0;
            } else {
                this.authError.textContent = `Incorrect PIN. ${remaining} attempts remaining.`;
            }
            
            this.hostPinInput.value = '';
        }
    }
    
    logout() {
        this.isAuthenticated = false;
        this.sessionStart = null;
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
        }
        sessionStorage.removeItem('buzzer_auth');
        sessionStorage.removeItem('buzzer_session_start');
        this.updateAuthUI();
        this.reset();
    }
    
    checkExistingSession() {
        const auth = sessionStorage.getItem('buzzer_auth');
        const sessionStart = sessionStorage.getItem('buzzer_session_start');
        
        if (auth === 'true' && sessionStart) {
            const elapsed = Date.now() - parseInt(sessionStart);
            if (elapsed < this.sessionTimeout) {
                this.isAuthenticated = true;
                this.sessionStart = parseInt(sessionStart);
                this.updateAuthUI();
                this.startSessionTimer();
            } else {
                // Session expired
                sessionStorage.removeItem('buzzer_auth');
                sessionStorage.removeItem('buzzer_session_start');
            }
        }
    }
    
    startSessionTimer() {
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
        }
        
        this.sessionTimer = setInterval(() => {
            const elapsed = Date.now() - this.sessionStart;
            const remaining = this.sessionTimeout - elapsed;
            
            if (remaining <= 0) {
                this.logout();
                alert('Session expired. Please login again.');
            } else {
                const minutes = Math.floor(remaining / 60000);
                const seconds = Math.floor((remaining % 60000) / 1000);
                this.sessionTimerDisplay.textContent = `Session: ${minutes}:${seconds.toString().padStart(2, '0')}`;
                
                // Warn when less than 2 minutes
                if (remaining < 2 * 60 * 1000) {
                    this.sessionTimerDisplay.classList.add('warning');
                } else {
                    this.sessionTimerDisplay.classList.remove('warning');
                }
            }
        }, 1000);
    }
    
    updateAuthUI() {
        if (this.isAuthenticated) {
            this.authStatus.textContent = '🔓 Host: Authenticated';
            this.authStatus.classList.add('authenticated');
            this.sessionTimerDisplay.style.display = 'inline';
            this.logoutBtn.style.display = 'inline-block';
            this.enableBtn.disabled = false;
            this.resetBtn.disabled = false;
        } else {
            this.authStatus.textContent = '🔒 Host: Not Authenticated';
            this.authStatus.classList.remove('authenticated');
            this.sessionTimerDisplay.style.display = 'none';
            this.logoutBtn.style.display = 'none';
            this.enableBtn.disabled = true;
            this.resetBtn.disabled = true;
        }
    }
    
    // Security: Rate limiting for buzzer presses
    isRateLimited(player) {
        const now = Date.now();
        const playerId = player.element.dataset.player;
        
        if (!this.buzzerPressLog.has(playerId)) {
            this.buzzerPressLog.set(playerId, []);
        }
        
        const presses = this.buzzerPressLog.get(playerId);
        
        // Remove old presses outside the window
        const recentPresses = presses.filter(time => now - time < this.rateLimitWindow);
        
        if (recentPresses.length >= this.maxBuzzesPerWindow) {
            console.warn(`Rate limit exceeded for player ${playerId}`);
            return true;
        }
        
        recentPresses.push(now);
        this.buzzerPressLog.set(playerId, recentPresses);
        
        return false;
    }
    
    getAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioContext;
    }
    
    playBuzzSound() {
        if (!this.soundEnabled) return;
        
        try {
            const audioCtx = this.getAudioContext();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            // Jeopardy-style buzz: quick descending tone
            oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
            
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.15);
        } catch (error) {
            console.warn('Audio playback failed:', error);
        }
    }
    
    playEnableSound() {
        if (!this.soundEnabled) return;
        
        try {
            const audioCtx = this.getAudioContext();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            // Enable sound: rising tone
            oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.1);
        } catch (error) {
            console.warn('Audio playback failed:', error);
        }
    }
    
    enableBuzzers() {
        if (this.locked || !this.isAuthenticated) return;
        
        this.buzzersEnabled = true;
        this.startTime = performance.now();
        this.updateTimer();
        
        this.statusMessage.textContent = '⚡ BUZZERS ACTIVE - GO! ⚡';
        this.statusMessage.classList.add('enabled');
        this.statusMessage.classList.remove('buzzed');
        this.enableBtn.disabled = true;
        
        this.playEnableSound();
        
        // Clear all player states
        Object.values(this.players).forEach(player => {
            player.element.classList.remove('winner');
            player.lightElement.classList.remove('active');
        });
        
        // Clear rate limit logs when enabling
        this.buzzerPressLog.clear();
    }
    
    handleKeyPress(e) {
        const key = e.key.toLowerCase();
        
        // Space bar to enable buzzers (host shortcut) - requires auth
        if (key === ' ' && !this.locked) {
            e.preventDefault();
            this.checkAuthAndEnable();
            return;
        }
        
        // Escape to reset - requires auth
        if (key === 'escape') {
            e.preventDefault();
            this.checkAuthAndReset();
            return;
        }
        
        // Check if buzzers are enabled
        if (!this.buzzersEnabled || this.locked) return;
        
        // Find player by key
        const player = Object.values(this.players).find(p => p.key === key);
        if (player) {
            e.preventDefault();
            
            // Check rate limiting
            if (this.isRateLimited(player)) {
                console.warn('Buzzer spam detected and blocked');
                return;
            }
            
            this.buzz(player);
        }
    }
    
    buzz(player) {
        if (!this.buzzersEnabled || this.locked) return;
        
        // Lock the system
        this.locked = true;
        this.buzzersEnabled = false;
        this.winner = player;
        
        // Calculate time
        const buzzTime = (performance.now() - this.startTime) / 1000;
        
        // Play sound
        this.playBuzzSound();
        
        // Sanitize player name for display
        const safeName = this.sanitizeInput(player.name) || `Player ${player.element.dataset.player}`;
        
        // Update UI
        player.element.classList.add('winner');
        player.lightElement.classList.add('active');
        player.timeElement.textContent = `${buzzTime.toFixed(3)}s`;
        
        this.statusMessage.textContent = `🏆 ${safeName.toUpperCase()} BUZZED IN! 🏆`;
        this.statusMessage.classList.remove('enabled');
        this.statusMessage.classList.add('buzzed');
        
        this.timerDisplay.textContent = `${buzzTime.toFixed(3)}s`;
        
        this.enableBtn.disabled = true;
    }
    
    updateTimer() {
        if (!this.buzzersEnabled || this.locked) return;
        
        const elapsed = (performance.now() - this.startTime) / 1000;
        this.timerDisplay.textContent = `${elapsed.toFixed(3)}s`;
        
        requestAnimationFrame(() => this.updateTimer());
    }
    
    reset() {
        if (!this.isAuthenticated) return;
        
        this.buzzersEnabled = false;
        this.locked = false;
        this.winner = null;
        this.startTime = null;
        
        this.statusMessage.textContent = 'Buzzers Disabled - Host: Press ENABLE';
        this.statusMessage.classList.remove('enabled', 'buzzed');
        this.timerDisplay.textContent = '0.000s';
        
        this.enableBtn.disabled = false;
        
        // Clear all player states
        Object.values(this.players).forEach(player => {
            player.element.classList.remove('winner');
            player.lightElement.classList.remove('active');
            player.timeElement.textContent = '--';
        });
        
        // Clear rate limit logs
        this.buzzerPressLog.clear();
    }
}

// Initialize the buzzer system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Security: Prevent the page from being embedded in iframes
    if (window.self !== window.top) {
        window.top.location = window.self.location;
    }
    
    // Security: Warn if not using HTTPS in production
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        console.warn('⚠️ Security Warning: This application should be served over HTTPS in production!');
    }
    
    new BuzzerSystem();
});
