# Jeopardy Buzzer System

A realistic, web-based Jeopardy-style game show buzzer system with multiple players, lockout functionality, precise timing, and **production-grade security features**.

## 🔒 Security Notice

⚠️ **IMPORTANT**: This application includes authentication and security features. The **default PIN is `1234`** - **CHANGE THIS IMMEDIATELY** before deploying to production!

See [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for security quick start or [SECURITY.md](SECURITY.md) for comprehensive security documentation.

## Features

### Game Features
- **3-Player Support**: Individual buzzers for three contestants
- **Lock-out System**: First player to buzz locks out all others
- **Precise Timing**: Displays reaction time to millisecond accuracy
- **Visual Feedback**: Animated buzzer lights and winner highlighting
- **Sound Effects**: Realistic buzzer and enable sounds
- **Host Controls**: Enable and reset buttons with authentication
- **Keyboard Shortcuts**: Quick access for host and players
- **Responsive Design**: Works on desktop and mobile devices
- **Customizable Names**: Players can enter their names

### Security Features
- **🔐 Host Authentication**: PIN-based login (default: 1234 - **CHANGE THIS!**)
- **⏱️ Session Management**: 30-minute auto-logout with countdown
- **🚫 Rate Limiting**: Anti-spam protection (3 buzzes/second max)
- **🛡️ Input Sanitization**: XSS attack prevention
- **📋 Content Security Policy**: Prevents code injection
- **🔒 HTTPS Enforcement**: Automatic secure connection upgrade
- **🚪 Frame Protection**: Blocks malicious iframe embedding
- **⛔ Account Lockout**: 5-minute lockout after failed login attempts

## How to Use

### Setup
1. Open `index.html` in a web browser
2. **Host must authenticate** before enabling buzzers (default PIN: 1234)
3. (Optional) Players enter their names in the input fields

### Gameplay
1. **Host**: Login with PIN when prompted (or click host controls to trigger login)
2. **Host**: Click "ENABLE BUZZERS" or press `Space Bar` to activate buzzers
3. **Players**: Press your assigned key when you know the answer:
   - Player 1: `Q`
   - Player 2: `P`
   - Player 3: `M`
4. First player to buzz in locks out the others
5. **Host**: Click "RESET" or press `Escape` to clear and start the next round

### Controls
- **Authentication**: Required for host controls (default PIN: 1234)
- **Space Bar**: Enable buzzers (host shortcut, requires auth)
- **Escape**: Reset the system (host shortcut, requires auth)
- **Sound Toggle**: Enable/disable sound effects
- **Session Timeout**: 30 minutes of inactivity logs out host automatically

## Security Features

### 🔒 Production-Ready Security
This application includes comprehensive security features:

- **Authentication**: PIN-based host login (⚠️ **Change default PIN: 1234**)
- **Session Management**: 30-minute timeout with visual countdown
- **Rate Limiting**: Prevents buzzer spam (3 presses/second limit per player)
- **Input Sanitization**: XSS protection on all user inputs
- **CSP Headers**: Prevents code injection attacks
- **HTTPS Enforcement**: Automatic upgrade to secure connections
- **Frame Protection**: Prevents clickjacking via iframe embedding
- **Account Lockout**: 5-minute lockout after 5 failed login attempts

⚠️ **Important**: See [SECURITY.md](SECURITY.md) for detailed security configuration and production deployment guidelines.

### Quick Security Setup
1. **Change the default PIN** in `buzzer.js` (line 18):
   ```javascript
   this.hostPin = 'YOUR_SECURE_PIN_HERE';
   ```
2. **Deploy with HTTPS** (required for production)
3. **Review** [SECURITY.md](SECURITY.md) for server configuration

## Technical Details

### Files
- `index.html` - Main HTML structure with security meta tags
- `styles.css` - Styling, animations, and authentication UI
- `buzzer.js` - Core buzzer logic, timing, and security features
- `SECURITY.md` - Comprehensive security documentation

### Technologies
- Pure HTML5/CSS3/JavaScript (no dependencies)
- Web Audio API for sound effects
- Performance API for precise timing
- CSS animations and transitions
- SessionStorage for authentication state
- Content Security Policy (CSP)

### Features Implemented
- **Lockout mechanism**: Prevents multiple buzzers after first activation
- **Millisecond precision**: Uses `performance.now()` for accurate timing
- **Audio feedback**: Synthesized buzzer sounds using Web Audio API
- **Visual effects**: Glowing animations and color changes
- **State management**: Clean enable/buzz/reset state transitions
- **Host authentication**: PIN-based access with rate limiting
- **Input sanitization**: Prevents XSS attacks on player names
- **Rate limiting**: Anti-spam protection (3 buzzes/second maximum)
- **Session management**: Auto-logout after 30 minutes
- **Security headers**: CSP, XSS protection, frame-busting
- **Lockout mechanism**: Prevents multiple buzzers after first activation
- **Millisecond precision**: Uses `performance.now()` for accurate timing
- **Audio feedback**: Synthesized buzzer sounds using Web Audio API
- **Visual effects**: Glowing animations and color changes
- **State management**: Clean enable/buzz/reset state transitions

## Customization

### Adding More Players
Edit `buzzer.js` to add players to the configuration:
```javascript
this.players = {
    1: { key: 'q', name: 'Player 1', ... },
    2: { key: 'p', name: 'Player 2', ... },
    3: { key: 'm', name: 'Player 3', ... },
    4: { key: 'a', name: 'Player 4', ... }  // Add new player
};
```

### Changing Key Bindings
Modify the `key` property in the player configuration in `buzzer.js` (around line 25).

### Styling
Edit `styles.css` to customize colors, animations, and layout.

### Adjusting Security Settings
In `buzzer.js`, you can modify:
- `hostPin` (line 18) - Change the authentication PIN
- `sessionTimeout` (line 20) - Adjust session duration (in milliseconds)
- `maxLoginAttempts` (line 22) - Maximum failed login attempts
- `lockoutTime` (line 23) - Account lockout duration after failed attempts
- `maxBuzzesPerWindow` (line 27) - Rate limit threshold

## Browser Compatibility
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (may require user interaction for audio)
- Mobile browsers: Supported (use on-screen buttons)

## License
Free to use and modify for personal or educational purposes.