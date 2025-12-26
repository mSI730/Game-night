# Security Quick Reference Card

## 🔐 Default Credentials
```
PIN: 1234
⚠️ CHANGE THIS IMMEDIATELY IN PRODUCTION!
Location: buzzer.js, line 18
```

## ⚡ Quick Commands

### Test Security Features
```bash
# Open test page in browser
open security-test.html

# Check security headers
curl -I https://yourdomain.com

# Test SSL configuration
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

### Server Setup (Nginx)
```bash
# Install
sudo apt-get install nginx certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Copy config
sudo cp nginx.conf.example /etc/nginx/sites-available/buzzer.conf
sudo ln -s /etc/nginx/sites-available/buzzer.conf /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### Server Setup (Apache)
```bash
# Enable modules
sudo a2enmod headers rewrite ssl

# Copy .htaccess
cp .htaccess /var/www/buzzer/

# Get SSL certificate
sudo certbot --apache -d yourdomain.com

# Test and restart
sudo apache2ctl configtest
sudo systemctl restart apache2
```

## 🛡️ Security Features At-A-Glance

| Feature | Status | Location |
|---------|--------|----------|
| Authentication | ✅ Enabled | buzzer.js:18 |
| Session Timeout | ✅ 30 min | buzzer.js:20 |
| Rate Limiting | ✅ 3/sec | buzzer.js:26-27 |
| Input Sanitization | ✅ Enabled | buzzer.js:sanitizeInput() |
| CSP | ✅ Enabled | index.html:6 |
| XSS Protection | ✅ Enabled | index.html:8 |
| Frame Protection | ✅ Enabled | index.html:9, buzzer.js:end |
| HTTPS Enforcement | ✅ Enabled | index.html:12 |
| Account Lockout | ✅ 5 attempts | buzzer.js:22-23 |

## 🔑 Authentication Flow

```
1. Host clicks "Enable Buzzers" or "Reset"
   ↓
2. Not authenticated? → Show login modal
   ↓
3. Enter PIN (default: 1234)
   ↓
4. Correct? → Session starts (30 min)
   ↓
5. Wrong? → Counter increments (max: 5)
   ↓
6. 5 failures → 5-minute lockout
   ↓
7. Session expires → Auto-logout
```

## 📊 Rate Limiting

```
Window: 1 second
Max: 3 buzzer presses per player
Action: Block additional presses
Log: Console warning
```

## 🧪 Testing Commands

### Input Sanitization Tests
```javascript
// XSS Test
<script>alert('XSS')</script>
// Expected: removes <script> tags

// HTML Injection
<img src=x onerror=alert(1)>
// Expected: removes <img> tag

// Special Characters
Player!@#$%^&*()
// Expected: removes special chars

// Length Test
AAAAAAAAAA... (50 chars)
// Expected: truncates to 20
```

### Authentication Tests
```
1. Wrong PIN 5 times → Should lock out
2. Wait 30 minutes → Should auto-logout
3. Close tab → Should clear session
4. Press Space → Should prompt login
```

### Rate Limit Test
```
1. Rapidly press Q key (10+ times/sec)
2. Should allow first 3
3. Should block rest for 1 second
4. Console warning should appear
```

## 🌐 External Testing URLs

```
Security Headers:
https://securityheaders.com/?q=https://yourdomain.com

SSL Test:
https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com

Mozilla Observatory:
https://observatory.mozilla.org/analyze/yourdomain.com

CSP Evaluator:
https://csp-evaluator.withgoogle.com/
```

## 📝 Configuration Values

```javascript
// buzzer.js configuration
hostPin: '1234'                    // Line 18 - CHANGE THIS!
sessionTimeout: 30 * 60 * 1000     // Line 20 - 30 minutes
maxLoginAttempts: 5                // Line 22 - 5 attempts
lockoutTime: 5 * 60 * 1000         // Line 23 - 5 minutes
rateLimitWindow: 1000              // Line 26 - 1 second
maxBuzzesPerWindow: 3              // Line 27 - 3 buzzes
maxNameLength: 20                  // Line 30 - 20 characters
```

## 🚨 Emergency Procedures

### Lockout Recovery
```
Problem: Locked out after failed attempts
Solution: Wait 5 minutes OR clear browser sessionStorage

Console command:
sessionStorage.clear();
location.reload();
```

### PIN Reset
```
Problem: Forgot PIN
Solution:
1. Edit buzzer.js line 18
2. Change hostPin value
3. Save and reload page
```

### Session Issues
```
Problem: Session expired unexpectedly
Solution:
1. Clear browser cache
2. Check system clock
3. Verify sessionStorage is enabled
```

### CSP Violations
```
Problem: Features not working, CSP errors in console
Solution:
1. Check browser console
2. Review CSP policy in index.html
3. Verify no inline scripts added
```

## 📞 Support Resources

- **Full Documentation**: SECURITY.md
- **Deployment Guide**: DEPLOYMENT_CHECKLIST.md
- **Implementation Details**: SECURITY_IMPLEMENTATION.md
- **Usage Guide**: README.md

## ⚙️ Browser Console Helpers

```javascript
// Check authentication status
sessionStorage.getItem('buzzer_auth')

// Check session start time
sessionStorage.getItem('buzzer_session_start')

// Clear session (emergency logout)
sessionStorage.clear(); location.reload();

// Check if CSP is active
document.querySelector('meta[http-equiv="Content-Security-Policy"]')

// Test sanitization
function sanitize(input) {
    let s = input.slice(0, 20);
    s = s.replace(/<[^>]*>/g, '');
    s = s.replace(/[^a-zA-Z0-9\s\-_]/g, '');
    return s.trim();
}
```

## 🎯 Common Tasks

### Change PIN
```
File: buzzer.js
Line: 18
Find: this.hostPin = '1234';
Replace: this.hostPin = 'YOUR_PIN';
```

### Adjust Session Timeout
```
File: buzzer.js
Line: 20
Find: this.sessionTimeout = 30 * 60 * 1000;
Change: 30 to desired minutes
```

### Modify Rate Limit
```
File: buzzer.js
Lines: 26-27
maxBuzzesPerWindow: 3  // Change max buzzes
rateLimitWindow: 1000  // Change window (ms)
```

### Update CSP Policy
```
File: index.html
Line: 6
Edit: content="..." attribute
Note: Be careful - restrictive policies enhance security
```

---

## ✅ Pre-Flight Checklist

Before going live:
- [ ] PIN changed from default
- [ ] HTTPS configured and working
- [ ] Security headers tested (A or A+ grade)
- [ ] All features tested in production environment
- [ ] Backups created
- [ ] Team trained on usage

---

**Keep this card handy during deployment and maintenance!**

*Quick Reference v1.0 | December 26, 2025*
