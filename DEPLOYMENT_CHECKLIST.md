# Production Deployment Checklist

Use this checklist before deploying the Jeopardy Buzzer System to production.

## ⚠️ Critical Security Tasks

### 1. Change Default PIN
- [ ] Open `buzzer.js`
- [ ] Go to line ~18
- [ ] Change `this.hostPin = '1234'` to a secure PIN
- [ ] Use 4-6 digits, random combination
- [ ] **DO NOT** commit the PIN to public repositories

**Example:**
```javascript
this.hostPin = '8347'; // Your secure PIN here
```

---

### 2. HTTPS Configuration
- [ ] Obtain SSL/TLS certificate (Let's Encrypt recommended)
- [ ] Configure web server for HTTPS
- [ ] Test HTTPS redirect from HTTP
- [ ] Verify certificate is valid: https://www.ssllabs.com/ssltest/

**Quick Setup with Let's Encrypt:**
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate (Nginx)
sudo certbot --nginx -d yourdomain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

---

### 3. Web Server Configuration

#### For Apache:
- [ ] Copy `.htaccess` to web root
- [ ] Verify `mod_headers` is enabled: `sudo a2enmod headers`
- [ ] Verify `mod_rewrite` is enabled: `sudo a2enmod rewrite`
- [ ] Restart Apache: `sudo systemctl restart apache2`
- [ ] Test configuration: `sudo apache2ctl configtest`

#### For Nginx:
- [ ] Copy `nginx.conf.example` to `/etc/nginx/sites-available/buzzer.conf`
- [ ] Update `server_name` with your domain
- [ ] Update `root` path to your application directory
- [ ] Update SSL certificate paths
- [ ] Create symbolic link: `sudo ln -s /etc/nginx/sites-available/buzzer.conf /etc/nginx/sites-enabled/`
- [ ] Test configuration: `sudo nginx -t`
- [ ] Reload Nginx: `sudo systemctl reload nginx`

---

## 🔧 Configuration Review

### 4. Security Settings Review
- [ ] Review session timeout (default: 30 minutes) - adjust if needed
- [ ] Review max login attempts (default: 5) - adjust if needed
- [ ] Review lockout duration (default: 5 minutes) - adjust if needed
- [ ] Review rate limiting (default: 3 buzzes/second) - adjust if needed
- [ ] Review max name length (default: 20 characters) - adjust if needed

**Configuration Location:** `buzzer.js` lines 18-31

---

### 5. File Permissions
- [ ] Set appropriate file permissions
- [ ] Web root: `755` (directories), `644` (files)
- [ ] Sensitive config files: `600`

```bash
# Set directory permissions
find /var/www/buzzer -type d -exec chmod 755 {} \;

# Set file permissions
find /var/www/buzzer -type f -exec chmod 644 {} \;

# Protect config files (if applicable)
chmod 600 /var/www/buzzer/config.security.js
```

---

## 🧪 Testing

### 6. Security Testing
- [ ] Test XSS protection: Enter `<script>alert('XSS')</script>` in player name
- [ ] Test rate limiting: Spam buzzer key rapidly (should block after 3/sec)
- [ ] Test authentication: Try accessing without login
- [ ] Test wrong PIN: Enter incorrect PIN 5 times (should lock out)
- [ ] Test session timeout: Wait 30 minutes (should auto-logout)
- [ ] Test HTTPS redirect: Visit `http://yourdomain.com` (should redirect)
- [ ] Open `security-test.html` and run all tests

---

### 7. Browser Testing
- [ ] Test in Chrome/Edge
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test on mobile devices
- [ ] Check browser console for errors
- [ ] Verify CSP is working (no violations in console)

---

### 8. External Security Scans
- [ ] Security Headers: https://securityheaders.com
  - Expected grade: A or A+
- [ ] SSL Test: https://www.ssllabs.com/ssltest/
  - Expected grade: A or A+
- [ ] Mozilla Observatory: https://observatory.mozilla.org/
  - Expected grade: B+ or higher

---

## 📊 Monitoring & Logging

### 9. Logging Setup (Optional but Recommended)
- [ ] Enable web server access logs
- [ ] Enable web server error logs
- [ ] Set up log rotation
- [ ] Monitor for authentication failures
- [ ] Monitor for rate limit violations

**Nginx Log Locations:**
- Access: `/var/log/nginx/buzzer_access.log`
- Error: `/var/log/nginx/buzzer_error.log`

**Apache Log Locations:**
- Access: `/var/log/apache2/access.log`
- Error: `/var/log/apache2/error.log`

---

### 10. Fail2Ban Setup (Optional)
- [ ] Install Fail2Ban: `sudo apt-get install fail2ban`
- [ ] Create custom filter for repeated failures
- [ ] Configure jail for buzzer application
- [ ] Test with intentional failures
- [ ] Verify banning works

---

## 📝 Documentation

### 11. Documentation Review
- [ ] Read [SECURITY.md](SECURITY.md) completely
- [ ] Read [README.md](README.md) for usage instructions
- [ ] Document your custom PIN (store securely, NOT in repo)
- [ ] Document any custom configuration changes
- [ ] Update team on authentication requirements

---

## 🚀 Deployment

### 12. File Upload
- [ ] Upload all files to web server
- [ ] Verify directory structure is intact
- [ ] Verify file ownership (www-data or nginx)
- [ ] Verify no sensitive files are publicly accessible

**Files to Upload:**
- `index.html`
- `buzzer.js` (with changed PIN)
- `styles.css`
- `README.md`
- `.htaccess` (Apache) or configure nginx separately

**Files NOT to Upload (or restrict access):**
- `config.security.js` (reference only)
- `SECURITY.md` (reference only)
- `nginx.conf.example` (reference only)
- `security-test.html` (testing only)

---

### 13. Post-Deployment Verification
- [ ] Visit your domain: `https://yourdomain.com`
- [ ] Verify HTTPS is active (padlock icon)
- [ ] Test authentication flow
- [ ] Test buzzer functionality
- [ ] Test all 3 players
- [ ] Test reset functionality
- [ ] Test session timeout
- [ ] Test on different devices

---

## 🔄 Maintenance

### 14. Ongoing Security Maintenance
- [ ] Schedule regular security audits (quarterly)
- [ ] Monitor server logs weekly
- [ ] Update SSL certificates before expiration
- [ ] Review and rotate PIN periodically
- [ ] Keep web server updated
- [ ] Monitor for new security vulnerabilities

---

## 📋 Pre-Launch Review

### Final Checks:
- [ ] All critical tasks completed
- [ ] All security tests passed
- [ ] HTTPS working correctly
- [ ] Default PIN changed
- [ ] Server configuration applied
- [ ] External scans show good grades
- [ ] Team trained on usage
- [ ] Backup of configuration exists
- [ ] Rollback plan documented

---

## ✅ Sign-Off

**Deployment Information:**
- Date: _______________
- Deployed By: _______________
- Domain: _______________
- PIN Changed: [ ] Yes [ ] No
- HTTPS Enabled: [ ] Yes [ ] No
- Server: [ ] Apache [ ] Nginx [ ] Other: _______________

**Testing Completed:**
- Security Headers: [ ] Pass [ ] Fail
- SSL Configuration: [ ] A+ [ ] A [ ] Other: _______________
- Authentication: [ ] Working [ ] Issues
- Rate Limiting: [ ] Working [ ] Issues
- XSS Protection: [ ] Working [ ] Issues

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________

---

## 🆘 Troubleshooting

### Common Issues:

**Authentication not working:**
- Check browser console for JavaScript errors
- Verify PIN was changed correctly
- Clear browser cache and cookies

**HTTPS redirect not working:**
- Verify `.htaccess` or nginx config
- Check web server error logs
- Ensure mod_rewrite (Apache) is enabled

**CSP violations:**
- Check browser console
- Verify no inline scripts added
- Review CSP policy in index.html

**Session timeout issues:**
- Check browser sessionStorage support
- Verify system clock is accurate
- Clear browser cache

---

**Need Help?**
- Review [SECURITY.md](SECURITY.md) for detailed information
- Check web server error logs
- Test with `security-test.html`
- Verify browser console for errors

---

*Deployment Checklist Version 1.0*
*Last Updated: December 26, 2025*
