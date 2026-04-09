# Understanding Our SSL Implementation & Changes

This document exists to help you understand exactly what we did to achieve a proper HTTPS/WSS (WebSocket Secure) connection and which lines of code were modified from the original project. This is perfect for briefing your teammates and answering any professor questions.

---

## 1. How We Generated the Certificates (Knowledge Base)

### The Problem with `openssl` (Self-Signed Certificates)
Initially, you can generate raw SSL certificates using `openssl`. While this encrypts the data (turning HTTP into HTTPS), the web browsers (Chrome, Firefox, Safari) throw big, scary red warnings ("Your connection is not private").
Why? Because modern browsers demand a **Chain of Trust**. They need to verify that a trusted **Certificate Authority (CA)** actually issued the certificate.

### The Solution: Using `mkcert`
To bypass the red warnings and mimic a real-world enterprise setup locally, we used a tool called **`mkcert`**.
1. **Generating a Root CA:** First, we ran a command that turned your Windows machine into a globally trusted "Certificate Authority" by creating a **Root Certificate** (`rootCA.pem`).
2. **Signing the Server Certs:** Next, we asked our new local Certificate Authority to generate a `server.cert` and `server.key` for the specific IP address (`172.28.176.1`) and `localhost`.
3. **Establishing Trust:** Because the Windows machine inherently trusts the CA it just made, the browser displays a perfect green padlock when connecting. For friends connecting from other devices (Mac/Linux), we simply export that `rootCA.pem` to their machines. Once their OS trusts our miniature CA, they get the green padlock too. No "Not Secure" warnings!

### The Commands We Used
We used these underlying commands (via PowerShell) to install and create the certificates:
```bash
mkcert -install
mkcert -cert-file server.cert -key-file server.key 172.28.176.1 localhost 127.0.0.1
mkcert -CAROOT
```

---

## 2. Code Changes briefing for the Team

We only had to change a few specific parts of the codebase to upgrade from standard HTTP unencrypted WebSockets to HTTPS encrypted WebSockets (WSS).

### Back-End (`index.js`)

**OLD CODE:**
```javascript
let express = require('express');
let socket = require('socket.io');

//app setup
let app = express();
let server = app.listen(5023, () => {
    console.log("Listening on 5023");
});
```

**NEW CODE:**
```javascript
const fs = require('fs');
const https = require('https');
let express = require('express');
let socket = require('socket.io');

//app setup
let app = express();

// 1. Read our securely generated certificates
const privateKey = fs.readFileSync('server.key', 'utf8');
const certificate = fs.readFileSync('server.cert', 'utf8');
const credentials = { key: privateKey, cert: certificate };

// 2. Create an HTTPS server instead of standard HTTP
let server = https.createServer(credentials, app);

// 3. Listen on '0.0.0.0' to explicitly bind to the Wi-Fi IP address
server.listen(5023, '0.0.0.0', () => {
    console.log("Listening on https://172.28.176.1:5023");
});
```
*(By passing `credentials` to `https.createServer`, `socket.io` effortlessly upgrades to WebSocket Secure (`wss://`) under the hood automatically!).*

### Front-End (`public/index.html`)

**OLD CODE (Around line 133):**
```html
let socket = io.connect('http://localhost:5023/');
```

**NEW CODE:**
```html
// Connect via HTTPS to the exact IP address the server is listening on
let socket = io.connect('https://172.28.176.1:5023/');
```
*(This ensures that any client who downloads the HTML page knows exactly how to dial back to the central server).*