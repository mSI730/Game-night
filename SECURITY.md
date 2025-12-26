# Security Documentation

## Overview
This document outlines the security features implemented in the Jeopardy Buzzer System and provides guidance for secure deployment in production environments.

## Implemented Security Features

### 1. Content Security Policy (CSP)
Implemented via meta tags in `index.html`:
- **default-src 'self'**: Only allows resources from the same origin
- **script-src 'self'**: JavaScript only from same origin
- **object-src 'none'**: Blocks plugins (Flash, Java, etc.)
- **frame-ancestors 'none'**: Prevents clickjacking via iframe embedding
- **base-uri 'self'**: Restricts base URL to prevent injection attacks

### 2. Authentication System
- **PIN-based host authentication** (default: 1234)
- **Session management** with 30-minute timeout
- **Rate limiting** on login attempts (5 attempts max)
- **Account lockout** for 5 minutes after max failed attempts
- **Session storage** (cleared on tab close for security)

⚠️ **CRITICAL**: Change the default PIN in production!

```javascript
// In buzzer.js, line ~18
this.hostPin = 'YOUR_SECURE_PIN_HERE'; // CHANGE THIS!
```

### 3. Input Sanitization
All user inputs (player names) are sanitized to prevent XSS attacks:
- Maximum length enforcement (20 characters)
- HTML/script tag removal
- Character whitelist (alphanumeric, spaces, hyphens, underscores)
- Paste protection with automatic sanitization

### 4. Rate Limiting
Protection against buzzer spam and DoS:
- **3 buzzer presses per second** maximum per player
- Automatic blocking of excessive requests
- Console warnings for rate limit violations

### 5. HTTP Security Headers
Implemented via meta tags:
- **X-Content-Type-Options**: Prevents MIME sniffing
- **X-Frame-Options**: Prevents clickjacking
- **X-XSS-Protection**: Browser XSS filter enabled
- **Referrer-Policy**: Limits referrer information leakage
- **Permissions-Policy**: Restricts browser features (geolocation, camera, etc.)
- **Upgrade-Insecure-Requests**: Forces HTTPS when available

### 6. Frame Busting
JavaScript prevents the application from being embedded in iframes:
```javascript
if (window.self !== window.top) {
    window.top.location = window.self.location;
}
```

### 7. HTTPS Enforcement
- Upgrade-Insecure-Requests header automatically upgrades HTTP to HTTPS
- Console warning when running without HTTPS in production
- Exemptions for localhost development

## Production Deployment Checklist

### Required Actions
- [ ] **Change default PIN** in `buzzer.js` (line ~18)
- [ ] **Enable HTTPS** on your web server
- [ ] **Configure server-side security headers** (see below)
- [ ] **Review and adjust rate limits** if needed
- [ ] **Test authentication flow** thoroughly
- [ ] **Set appropriate session timeout** for your use case

### Recommended Server Configuration

#### Nginx
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    
    # Content Security Policy
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; media-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" always;
    
    location / {
        root /var/www/buzzer;
        index index.html;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

#### Apache
```apache
<VirtualHost *:443>
    ServerName yourdomain.com
    DocumentRoot /var/www/buzzer
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem
    SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1
    
    # Security Headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "DENY"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; media-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
</VirtualHost>

# Redirect HTTP to HTTPS
<VirtualHost *:80>
    ServerName yourdomain.com
    Redirect permanent / https://yourdomain.com/
</VirtualHost>
```

## Advanced Security Recommendations

### 1. Server-Side Authentication (Recommended for Production)
For enhanced security, implement backend authentication:
- Use bcrypt/argon2 for password hashing
- Implement JWT tokens for session management
- Add CSRF protection
- Use secure, httpOnly cookies

### 2. Database Integration
For multi-host scenarios:
- Store host credentials in a secure database
- Implement proper user management
- Add audit logging for authentication events
- Track and log buzzer activity

### 3. SSL/TLS Certificate
- Use Let's Encrypt for free SSL certificates
- Enable HTTP/2 for better performance
- Configure HSTS (HTTP Strict Transport Security)
- Test with SSL Labs (ssllabs.com/ssltest)

### 4. Additional Hardening
- Implement fail2ban for brute force protection
- Add WAF (Web Application Firewall) like ModSecurity
- Enable logging and monitoring
- Regular security audits and updates
- Consider adding CAPTCHA for repeated failed logins

### 5. Monitoring and Logging
Recommended logging points:
- Authentication attempts (success/failure)
- Session creation and expiration
- Rate limit violations
- Unusual buzzer patterns
- Client-side errors

## Known Limitations

### Client-Side Authentication
⚠️ The current authentication is client-side only, which means:
- PIN is visible in source code
- Determined users can bypass authentication via developer tools
- Not suitable for high-security environments

**Mitigation**: For production use with sensitive data, implement server-side authentication.

### Session Storage
- Sessions are stored in sessionStorage (cleared when tab closes)
- Users need to re-authenticate after closing the browser
- No persistent "remember me" functionality

### Rate Limiting
- Rate limiting is client-side only
- Can be bypassed by sophisticated attackers
- For production, implement server-side rate limiting

## Security Reporting

If you discover a security vulnerability, please:
1. Do not publicly disclose the issue
2. Document the vulnerability details
3. Contact the repository maintainer
4. Allow time for remediation before disclosure

## Security Updates

Keep the application secure by:
- Regularly reviewing security logs
- Updating dependencies (when added)
- Following web security best practices
- Monitoring for new attack vectors
- Staying informed about browser security updates

## Compliance Considerations

Depending on your use case, consider:
- **GDPR**: If collecting player data in EU
- **COPPA**: If used by children under 13
- **Accessibility**: WCAG 2.1 compliance
- **Data retention**: Clear policies for stored data

## Testing Security

### Manual Testing
1. Try SQL injection in name fields: `'; DROP TABLE users; --`
2. Test XSS: `<script>alert('XSS')</script>`
3. Test rate limiting: Spam buzzer rapidly
4. Test session timeout: Wait 30 minutes
5. Test lockout: Enter wrong PIN 5 times
6. Verify HTTPS redirect
7. Check CSP in browser console

### Automated Testing
Consider using:
- OWASP ZAP for vulnerability scanning
- Mozilla Observatory for header analysis
- Security Headers checker (securityheaders.com)
- SSL Labs for HTTPS configuration

## License
This security documentation is provided as-is. Implement additional measures as needed for your specific security requirements.
