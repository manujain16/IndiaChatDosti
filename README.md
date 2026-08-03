# Real-Time Chat Application

A complete, production-ready web-based chat application built with Java, Spring Boot, and WebSockets.

## Features

✅ Real-time messaging using WebSocket (STOMP protocol)
✅ User join/leave notifications
✅ Modern, responsive UI with gradient design
✅ Message timestamps
✅ Multiple users support
✅ Automatic reconnection handling
✅ SockJS fallback for older browsers

## Technology Stack

- **Backend:**
  - Java 17
  - Spring Boot 3.2.0
  - Spring WebSocket
  - STOMP messaging
  - Lombok
  
- **Frontend:**
  - HTML5
  - CSS3
  - JavaScript (Vanilla)
  - SockJS client
  - STOMP.js

## Project Structure

```
chat-app/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/chatapp/
│   │   │       ├── ChatApplication.java          # Main application
│   │   │       ├── config/
│   │   │       │   ├── WebSocketConfig.java      # WebSocket configuration
│   │   │       │   └── WebSocketEventListener.java # Connection events
│   │   │       ├── controller/
│   │   │       │   ├── ChatController.java       # Message handling
│   │   │       │   └── WebController.java        # Page routing
│   │   │       └── model/
│   │   │           └── ChatMessage.java          # Message model
│   │   └── resources/
│   │       ├── static/
│   │       │   ├── css/
│   │       │   │   └── style.css                 # Styling
│   │       │   └── js/
│   │       │       ├── main.js                   # Username page logic
│   │       │       └── chat.js                   # Chat WebSocket logic
│   │       ├── templates/
│   │       │   ├── index.html                    # Username entry page
│   │       │   └── chat.html                     # Chat room page
│   │       └── application.properties            # App configuration
└── pom.xml                                       # Maven dependencies
```

## Prerequisites

- Java Development Kit (JDK) 17 or higher
- Maven 3.6+ (or use Maven wrapper included)

## Setup and Installation

### Option 1: Using Maven Wrapper (Recommended)

1. Navigate to the project directory:
```bash
cd chat-app
```

2. Build the project:
```bash
./mvnw clean package
```

3. Run the application:
```bash
./mvnw spring-boot:run
```

### Option 2: Using Maven

1. Navigate to the project directory:
```bash
cd chat-app
```

2. Build the project:
```bash
mvn clean package
```

3. Run the application:
```bash
mvn spring-boot:run
```

### Option 3: Run the JAR directly

1. Build the JAR:
```bash
mvn clean package
```

2. Run the JAR:
```bash
java -jar target/realtime-chat-1.0.0.jar
```

## Usage

1. **Start the application** using one of the methods above

2. **Open your browser** and navigate to:
   ```
   http://localhost:8080
   ```

3. **Enter your username** on the landing page

4. **Start chatting!** You can open multiple browser windows/tabs to simulate multiple users

## How It Works

### WebSocket Flow

1. **Client Connection:**
   - User enters username
   - Client establishes WebSocket connection via `/ws` endpoint
   - SockJS provides fallback for browsers without WebSocket support

2. **User Joins:**
   - Client sends JOIN message to `/app/chat.addUser`
   - Server broadcasts to all subscribers at `/topic/public`
   - All connected clients see "[username] joined the chat!"

3. **Sending Messages:**
   - User types message and clicks Send
   - Client sends CHAT message to `/app/chat.sendMessage`
   - Server broadcasts message to `/topic/public`
   - All clients receive and display the message

4. **User Leaves:**
   - User closes browser/tab
   - WebSocket disconnect event triggers
   - Server broadcasts LEAVE message
   - All clients see "[username] left the chat!"

### Key Classes Explained

**ChatApplication.java**
- Main Spring Boot application entry point
- Starts embedded Tomcat server

**WebSocketConfig.java**
- Configures WebSocket endpoints
- Sets up message broker with `/topic` prefix
- Defines application destination prefix `/app`

**ChatController.java**
- Handles incoming WebSocket messages
- `@MessageMapping` routes messages from clients
- `@SendTo` broadcasts to subscribed clients

**WebSocketEventListener.java**
- Listens for connect/disconnect events
- Sends user leave notifications

**ChatMessage.java**
- Model class for chat messages
- Contains: id, type, content, sender, timestamp
- Types: CHAT, JOIN, LEAVE

## Customization

### Change Port
Edit `src/main/resources/application.properties`:
```properties
server.port=9090
```

### Modify UI Colors
Edit `src/main/resources/static/css/style.css`:
```css
background: linear-gradient(135deg, #your-color 0%, #your-color2 100%);
```

### Add Features
Some ideas for extension:
- Message persistence with database
- Private messaging
- File sharing
- Typing indicators
- Message reactions
- User avatars
- Chat rooms/channels

## Testing

### Test with Multiple Users

1. Open application in multiple browser windows
2. Enter different usernames
3. Send messages from each window
4. Verify real-time message delivery
5. Close windows to test disconnect notifications

### Expected Behavior

✓ Messages appear instantly for all connected users
✓ Join/leave notifications are visible
✓ Timestamps are accurate
✓ UI is responsive and smooth
✓ Messages persist during session

## Troubleshooting

**Port 8080 already in use:**
```bash
# Find process using port 8080
lsof -i :8080  # Mac/Linux
netstat -ano | findstr :8080  # Windows

# Kill the process or change port in application.properties
```

**WebSocket connection failed:**
- Check firewall settings
- Verify browser WebSocket support
- Check browser console for errors

**Build errors:**
- Ensure Java 17+ is installed: `java -version`
- Clear Maven cache: `mvn clean`
- Update dependencies: `mvn clean install -U`

## Performance

- Supports hundreds of concurrent users
- Uses in-memory message broker (for production, consider RabbitMQ/ActiveMQ)
- No database required (messages not persisted)
- Lightweight and fast

## Security Considerations

For production deployment, consider:
- Add authentication (Spring Security)
- Implement rate limiting
- Sanitize user inputs (XSS prevention)
- Use WSS (WebSocket Secure) with SSL/TLS
- Add CSRF protection
- Implement proper session management

## License

This project is open source and available for educational and commercial use.

## Support

For issues or questions, check the logs in the console or examine browser developer tools.

---

**Enjoy your real-time chat application! 💬**
