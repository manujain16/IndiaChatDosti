# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Navigate to Project Directory
```bash
cd chat-app
```

### Step 2: Run the Application
```bash
./run.sh
```
Or manually:
```bash
mvn spring-boot:run
```

### Step 3: Open Your Browser
Navigate to: **http://localhost:8080**

---

## 📱 How to Use

1. **Enter Username**: Type your name on the landing page
2. **Join Chat**: Click "Join Chat" button
3. **Start Messaging**: Type messages and press Send or Enter
4. **Multiple Users**: Open another browser window/tab with a different username

---

## 🎯 Test the Chat

### Single Computer Test:
1. Open browser window #1 → Enter "Alice" → Join
2. Open browser window #2 → Enter "Bob" → Join
3. Send messages from both windows
4. Watch messages appear in real-time!

### Network Test:
1. Start the application
2. Share your computer's IP address with friends
3. Friends visit: `http://YOUR_IP:8080`
4. Everyone can chat together!

---

## 📂 Project Files Overview

```
chat-app/
├── pom.xml                          # Dependencies
├── run.sh                           # Quick start script
├── README.md                        # Full documentation
│
├── src/main/java/com/chatapp/
│   ├── ChatApplication.java         # ⭐ Main application
│   ├── config/
│   │   ├── WebSocketConfig.java     # WebSocket setup
│   │   └── WebSocketEventListener.java
│   ├── controller/
│   │   ├── ChatController.java      # Message handling
│   │   └── WebController.java
│   └── model/
│       └── ChatMessage.java         # Message structure
│
└── src/main/resources/
    ├── application.properties       # Configuration
    ├── templates/
    │   ├── index.html              # Username page
    │   └── chat.html               # Chat room
    └── static/
        ├── css/style.css           # Styling
        └── js/
            ├── main.js             # Username logic
            └── chat.js             # Chat WebSocket
```

---

## ⚡ Key Features

✅ **Real-time messaging** - Instant message delivery
✅ **Multiple users** - Unlimited concurrent users
✅ **Join/Leave notifications** - See who comes and goes
✅ **Message timestamps** - Track conversation timeline
✅ **Responsive design** - Works on desktop and mobile
✅ **Modern UI** - Beautiful gradient interface

---

## 🔧 Quick Troubleshooting

**Problem: Port 8080 is in use**
```bash
# Solution: Change port in application.properties
server.port=9090
```

**Problem: Build fails**
```bash
# Solution: Clean and rebuild
mvn clean install
```

**Problem: Can't connect to WebSocket**
- Check if application is running
- Verify browser supports WebSocket
- Check browser console for errors

---

## 🎨 Customize It!

### Change Colors
Edit `src/main/resources/static/css/style.css`:
```css
background: linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%);
```

### Change Port
Edit `src/main/resources/application.properties`:
```properties
server.port=3000
```

### Add Features
- Message persistence → Add Spring Data JPA + H2 Database
- User authentication → Add Spring Security
- Private messaging → Modify ChatController
- File sharing → Add MultipartFile support

---

## 📊 Architecture

```
Browser (Client)
    ↓
SockJS/STOMP Client
    ↓
WebSocket Connection (/ws)
    ↓
Spring WebSocket Handler
    ↓
@MessageMapping Controllers
    ↓
Message Broker (/topic/public)
    ↓
All Connected Clients (Broadcast)
```

---

## 💡 Next Steps

1. ✓ Get the app running
2. ✓ Test with multiple users
3. ⭐ Add your own features
4. 🚀 Deploy to production

---

**Happy Chatting! 💬**
