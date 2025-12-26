# Security Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │              SECURITY LAYER 1: Browser                │     │
│  ├────────────────────────────────────────────────────────┤     │
│  │  • Content Security Policy (CSP)                      │     │
│  │  • X-Frame-Options (Frame-busting)                    │     │
│  │  • X-XSS-Protection                                   │     │
│  │  • X-Content-Type-Options                             │     │
│  │  • Referrer-Policy                                    │     │
│  │  • Permissions-Policy                                 │     │
│  └────────────────────────────────────────────────────────┘     │
│                            ↓                                     │
│  ┌────────────────────────────────────────────────────────┐     │
│  │        SECURITY LAYER 2: Application Logic             │     │
│  ├────────────────────────────────────────────────────────┤     │
│  │                                                        │     │
│  │  ┌──────────────────────────────────────────────┐    │     │
│  │  │  Authentication Module                        │    │     │
│  │  ├──────────────────────────────────────────────┤    │     │
│  │  │  • PIN verification                          │    │     │
│  │  │  • Session management (30 min)               │    │     │
│  │  │  • Login attempt tracking                    │    │     │
│  │  │  • Account lockout (5 min)                   │    │     │
│  │  │  • SessionStorage integration                │    │     │
│  │  └──────────────────────────────────────────────┘    │     │
│  │                                                        │     │
│  │  ┌──────────────────────────────────────────────┐    │     │
│  │  │  Input Validation Module                      │    │     │
│  │  ├──────────────────────────────────────────────┤    │     │
│  │  │  • XSS prevention                            │    │     │
│  │  │  • HTML tag removal                          │    │     │
│  │  │  • Character whitelist                       │    │     │
│  │  │  • Length enforcement (20 chars)             │    │     │
│  │  │  • Paste protection                          │    │     │
│  │  └──────────────────────────────────────────────┘    │     │
│  │                                                        │     │
│  │  ┌──────────────────────────────────────────────┐    │     │
│  │  │  Rate Limiting Module                         │    │     │
│  │  ├──────────────────────────────────────────────┤    │     │
│  │  │  • 3 buzzes per second max                   │    │     │
│  │  │  • Per-player tracking                       │    │     │
│  │  │  • Time window: 1 second                     │    │     │
│  │  │  • Automatic blocking                        │    │     │
│  │  └──────────────────────────────────────────────┘    │     │
│  │                                                        │     │
│  │  ┌──────────────────────────────────────────────┐    │     │
│  │  │  Buzzer Logic (Core Functionality)            │    │     │
│  │  ├──────────────────────────────────────────────┤    │     │
│  │  │  • Enable/disable controls                   │    │     │
│  │  │  • Lockout mechanism                         │    │     │
│  │  │  • Timing (performance.now())                │    │     │
│  │  │  • Audio feedback                            │    │     │
│  │  └──────────────────────────────────────────────┘    │     │
│  │                                                        │     │
│  └────────────────────────────────────────────────────────┘     │
│                            ↓                                     │
│  ┌────────────────────────────────────────────────────────┐     │
│  │          SECURITY LAYER 3: Transport                   │     │
│  ├────────────────────────────────────────────────────────┤     │
│  │  • HTTPS (TLS 1.2/1.3)                                │     │
│  │  • Upgrade-Insecure-Requests                          │     │
│  │  • HSTS (Strict-Transport-Security)                   │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                             ↕
┌─────────────────────────────────────────────────────────────────┐
│                    WEB SERVER (Nginx/Apache)                     │
├─────────────────────────────────────────────────────────────────┤
│  • SSL/TLS Configuration                                         │
│  • Security Headers                                              │
│  • HTTP to HTTPS Redirect                                        │
│  • Access Control (.htaccess/nginx.conf)                         │
│  • Optional: Fail2Ban, WAF, Rate Limiting                        │
└─────────────────────────────────────────────────────────────────┘
```

## Authentication Flow

```
┌─────────┐
│  User   │
│ (Host)  │
└────┬────┘
     │
     │ (1) Clicks "Enable Buzzers"
     ↓
┌─────────────────────┐
│  Is Authenticated?  │
└─────────┬───────────┘
          │
    ┌─────┴─────┐
    │           │
   NO          YES
    │           │
    ↓           ↓
┌────────────┐  ┌──────────────┐
│Show Login  │  │Enable Buzzers│
│Modal       │  └──────────────┘
└─────┬──────┘
      │
      │ (2) Enters PIN
      ↓
┌─────────────────┐
│  Validate PIN   │
└────┬─────┬──────┘
     │     │
  VALID  INVALID
     │     │
     │     ↓
     │  ┌──────────────────┐
     │  │ Increment Failed │
     │  │ Attempt Counter  │
     │  └────┬─────────────┘
     │       │
     │       ↓
     │  ┌──────────────────┐
     │  │ Counter >= 5?    │
     │  └─┬───────────┬────┘
     │    │          │
     │   YES        NO
     │    │          │
     │    ↓          ↓
     │  ┌───────┐  ┌────────┐
     │  │LOCKOUT│  │Show    │
     │  │5 min  │  │Error   │
     │  └───────┘  └────────┘
     │
     ↓
┌─────────────────┐
│ Create Session  │
│ • Set auth flag │
│ • Start timer   │
│ • Store in      │
│   sessionStorage│
└────┬────────────┘
     │
     │ (3) Start 30-min countdown
     ↓
┌─────────────────┐
│ Enable Host     │
│ Controls        │
└─────┬───────────┘
      │
      │ After 30 minutes OR manual logout
      ↓
┌─────────────────┐
│ Session Expired │
│ Auto-logout     │
└─────────────────┘
```

## Rate Limiting Flow

```
Player presses buzzer key
         │
         ↓
┌──────────────────────┐
│ Get player's press   │
│ history (last 1 sec) │
└─────────┬────────────┘
          │
          ↓
    ┌─────────────┐
    │ Count >= 3? │
    └──┬──────┬───┘
       │      │
      YES    NO
       │      │
       │      ↓
       │   ┌─────────────────┐
       │   │ Allow buzz      │
       │   │ Add timestamp   │
       │   └─────────────────┘
       │
       ↓
   ┌─────────────────┐
   │ Block buzz      │
   │ Log warning     │
   │ Ignore input    │
   └─────────────────┘
```

## Input Sanitization Flow

```
User inputs text
      │
      ↓
┌──────────────────┐
│ Check length     │
│ (max 20 chars)   │
└────┬─────────────┘
     │
     ↓
┌──────────────────┐
│ Remove HTML tags │
│ <script> etc.    │
└────┬─────────────┘
     │
     ↓
┌──────────────────┐
│ Filter chars     │
│ Keep: a-z, 0-9   │
│       space,-,_  │
└────┬─────────────┘
     │
     ↓
┌──────────────────┐
│ Trim whitespace  │
└────┬─────────────┘
     │
     ↓
┌──────────────────┐
│ Safe output      │
└──────────────────┘
```

## Data Flow Diagram

```
┌──────────────┐
│   Player 1   │────┐
└──────────────┘    │
                    │  Key Press (Q)
┌──────────────┐    │  ↓
│   Player 2   │────┼──→ ┌───────────────────┐
└──────────────┘    │    │ Rate Limiter      │
                    │    └────────┬──────────┘
┌──────────────┐    │             ↓
│   Player 3   │────┘    ┌──────────────────┐
└──────────────┘         │ Buzzer Enabled?  │
                         └────┬─────────────┘
┌──────────────┐              ↓
│   Host       │         ┌──────────────────┐
│              │ Auth    │ Process Buzz     │
│ ┌──────────┐ │ ───→   │ • Lock system    │
│ │ Enable   │ │         │ • Calculate time │
│ │ Buzzers  │ │         │ • Play sound     │
│ └──────────┘ │         │ • Update UI      │
│              │         └────────┬─────────┘
│ ┌──────────┐ │                  ↓
│ │  Reset   │ │ Auth    ┌──────────────────┐
│ └──────────┘ │ ───→   │ Display Winner   │
│              │         │ • Highlight      │
│ ┌──────────┐ │         │ • Show time      │
│ │  Logout  │ │         │ • Disable others │
│ └──────────┘ │         └──────────────────┘
└──────────────┘

Legend:
  ──→  Data flow
  Auth Required for host actions
```

## Security Threat Model

```
┌─────────────────────────────────────────────────────────────┐
│                    POTENTIAL THREATS                         │
└─────────────────────────────────────────────────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           ↓                  ↓                  ↓
    ┌──────────┐      ┌──────────┐      ┌──────────┐
    │   XSS    │      │Clickjack │      │ Brute    │
    │ Attacks  │      │  -ing    │      │ Force    │
    └────┬─────┘      └────┬─────┘      └────┬─────┘
         │                 │                  │
         ↓                 ↓                  ↓
    ┌──────────┐      ┌──────────┐      ┌──────────┐
    │ Input    │      │ Frame    │      │ Account  │
    │Sanitize  │      │ Busting  │      │ Lockout  │
    │   +      │      │   +      │      │   +      │
    │  CSP     │      │X-Frame-  │      │ Rate     │
    │          │      │Options   │      │ Limit    │
    └──────────┘      └──────────┘      └──────────┘
         │                 │                  │
         └────────┬────────┴──────────────────┘
                  ↓
         ┌─────────────────┐
         │  MITIGATIONS    │
         │    APPLIED      │
         └─────────────────┘

Other Mitigations:
• HTTPS: Prevents MITM attacks
• Session timeout: Limits exposure
• HSTS: Prevents protocol downgrade
• CSP: Prevents inline code execution
```

## File Structure with Security Context

```
Game-night/
├── index.html                    # Entry point with security meta tags
│   ├── CSP headers
│   ├── XSS protection
│   ├── Frame-busting headers
│   └── Authentication modal
│
├── buzzer.js                     # Core logic with security features
│   ├── Authentication (lines 10-165)
│   ├── Input sanitization (lines 100-120)
│   ├── Rate limiting (lines 166-190)
│   ├── Session management (lines 191-255)
│   └── Buzzer logic (lines 256+)
│
├── styles.css                    # Styling + auth UI
│   ├── Main styles
│   └── Authentication modal (lines 220-350)
│
├── SECURITY.md                   # Comprehensive security docs
├── QUICK_REFERENCE.md            # Quick security guide
├── DEPLOYMENT_CHECKLIST.md       # Pre-deployment checklist
├── SECURITY_IMPLEMENTATION.md    # Implementation details
├── config.security.js            # Configuration reference
├── .htaccess                     # Apache security config
├── nginx.conf.example            # Nginx security config
└── security-test.html            # Security feature tests
```

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACE                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Player 1  │  │  Player 2  │  │  Player 3  │            │
│  │   Panel    │  │   Panel    │  │   Panel    │            │
│  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘            │
│         │                │                │                  │
│         └────────────────┴────────────────┘                  │
│                          ↓                                   │
│         ┌────────────────────────────────┐                  │
│         │   Input Sanitization Filter    │                  │
│         └────────────────┬───────────────┘                  │
│                          ↓                                   │
│         ┌────────────────────────────────┐                  │
│         │     BuzzerSystem Class         │                  │
│         │  (Central Controller)          │                  │
│         └────────────────┬───────────────┘                  │
│                          │                                   │
│         ┌────────────────┼────────────────┐                 │
│         │                │                │                 │
│         ↓                ↓                ↓                 │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐               │
│  │  Auth    │   │   Rate   │   │  Audio   │               │
│  │  Module  │   │  Limiter │   │  Engine  │               │
│  └──────────┘   └──────────┘   └──────────┘               │
│         │                                                    │
│         ↓                                                    │
│  ┌────────────────────────────────┐                        │
│  │    SessionStorage (Browser)    │                        │
│  └────────────────────────────────┘                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Security Layers Summary

```
Layer 1: Transport Security
├── HTTPS/TLS encryption
├── HSTS enforcement
└── Certificate validation

Layer 2: Application Security
├── Authentication & authorization
├── Input validation & sanitization
├── Rate limiting
├── Session management
└── XSS prevention

Layer 3: Browser Security
├── Content Security Policy
├── X-Frame-Options
├── X-XSS-Protection
├── X-Content-Type-Options
└── Permissions-Policy

Layer 4: Server Security
├── Security headers
├── Access control
├── File permissions
└── Optional: Fail2Ban, WAF
```

---

**This architecture provides defense-in-depth with multiple layers of security controls.**
