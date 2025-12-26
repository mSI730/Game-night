// Security Configuration File
// This file contains recommended security settings for production deployment
// Copy these settings into buzzer.js and adjust as needed

const SECURITY_CONFIG = {
    // Authentication Settings
    authentication: {
        // ⚠️ CRITICAL: Change this PIN before deploying to production!
        // Use a strong, random PIN (4-6 digits)
        hostPin: '1234', // CHANGE THIS!
        
        // Session timeout in milliseconds (default: 30 minutes)
        sessionTimeout: 30 * 60 * 1000,
        
        // Maximum failed login attempts before lockout
        maxLoginAttempts: 5,
        
        // Lockout duration in milliseconds (default: 5 minutes)
        lockoutTime: 5 * 60 * 1000
    },
    
    // Rate Limiting Settings
    rateLimiting: {
        // Maximum buzzer presses allowed per time window
        maxBuzzesPerWindow: 3,
        
        // Time window in milliseconds (default: 1 second)
        rateLimitWindow: 1000
    },
    
    // Input Validation Settings
    inputValidation: {
        // Maximum length for player names
        maxNameLength: 20,
        
        // Allowed characters in player names (regex pattern)
        allowedNamePattern: /^[a-zA-Z0-9\s\-_]+$/
    },
    
    // Content Security Policy
    // These are defined in index.html meta tags, but documented here
    csp: {
        defaultSrc: "'self'",
        scriptSrc: "'self'",
        styleSrc: "'self' 'unsafe-inline'", // unsafe-inline needed for dynamic styles
        imgSrc: "'self' data:",
        fontSrc: "'self'",
        connectSrc: "'self'",
        mediaSrc: "'self'",
        objectSrc: "'none'",
        frameAncestors: "'none'",
        baseUri: "'self'",
        formAction: "'self'"
    },
    
    // Additional Security Headers (configure on web server)
    serverHeaders: {
        strictTransportSecurity: 'max-age=31536000; includeSubDomains',
        xContentTypeOptions: 'nosniff',
        xFrameOptions: 'DENY',
        xXssProtection: '1; mode=block',
        referrerPolicy: 'strict-origin-when-cross-origin',
        permissionsPolicy: 'geolocation=(), microphone=(), camera=()'
    }
};

// Production Deployment Checklist
const DEPLOYMENT_CHECKLIST = [
    '[ ] Changed default PIN in buzzer.js',
    '[ ] Configured HTTPS on web server',
    '[ ] Set up security headers (Nginx/Apache)',
    '[ ] Tested authentication flow',
    '[ ] Verified rate limiting works',
    '[ ] Tested session timeout',
    '[ ] Checked CSP in browser console',
    '[ ] Reviewed SECURITY.md documentation',
    '[ ] Performed security testing',
    '[ ] Set up monitoring/logging (if applicable)'
];

// Environment Detection
const ENVIRONMENT = {
    // Automatically detect if running in production
    isProduction: () => {
        return location.protocol === 'https:' && 
               location.hostname !== 'localhost' && 
               location.hostname !== '127.0.0.1';
    },
    
    // Check if all security requirements are met
    isSecure: () => {
        const checks = {
            https: location.protocol === 'https:',
            cspEnabled: document.querySelector('meta[http-equiv="Content-Security-Policy"]') !== null,
            pinChanged: false // Manual check required
        };
        return checks;
    }
};

// Export for use in other files (if using modules)
// export { SECURITY_CONFIG, DEPLOYMENT_CHECKLIST, ENVIRONMENT };

// For non-module usage, these are available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SECURITY_CONFIG, DEPLOYMENT_CHECKLIST, ENVIRONMENT };
}
