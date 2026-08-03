package com.chatapp.config;

import com.chatapp.model.ChatMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.time.LocalDateTime;
import java.util.UUID;

@Component
public class WebSocketEventListener {

    private static final Logger log = LoggerFactory.getLogger(WebSocketEventListener.class);
    
    private final SimpMessageSendingOperations messagingTemplate;
    private final UserSessionRegistry userSessionRegistry;
    
    public WebSocketEventListener(SimpMessageSendingOperations messagingTemplate,
                                   UserSessionRegistry userSessionRegistry) {
        this.messagingTemplate = messagingTemplate;
        this.userSessionRegistry = userSessionRegistry;
    }

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        log.info("Received a new web socket connection");
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        
        if (username != null) {
            log.info("User Disconnected: " + username);
            
            // Remove user from online list
            userSessionRegistry.removeUser(username);
            
            ChatMessage chatMessage = ChatMessage.builder()
                    .id(UUID.randomUUID().toString())
                    .type(ChatMessage.MessageType.LEAVE)
                    .sender(username)
                    .timestamp(LocalDateTime.now())
                    .onlineUsers(userSessionRegistry.getOnlineUsers())
                    .build();
            
            messagingTemplate.convertAndSend("/topic/public", chatMessage);
        }
    }
}
