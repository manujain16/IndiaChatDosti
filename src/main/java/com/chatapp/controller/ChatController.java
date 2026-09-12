package com.chatapp.controller;

import com.chatapp.config.UserSessionRegistry;
import com.chatapp.model.ChatMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.UUID;

@Controller
public class ChatController {
    private static final Logger log = LoggerFactory.getLogger(ChatController.class);
    private final UserSessionRegistry userSessionRegistry;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(UserSessionRegistry userSessionRegistry, SimpMessagingTemplate messagingTemplate) {
        this.userSessionRegistry = userSessionRegistry;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public ChatMessage sendMessage(@Payload ChatMessage chatMessage) {
        chatMessage.setId(UUID.randomUUID().toString());
        chatMessage.setTimestamp(LocalDateTime.now());
        chatMessage.setOnlineUsers(userSessionRegistry.getOnlineUsers());
        chatMessage.setUsersByLocation(userSessionRegistry.getUsersByLocation());
        chatMessage.setUserGenders(userSessionRegistry.getUserGenders());
        log.info("Message from {}: {}", chatMessage.getSender(), chatMessage.getContent());
        return chatMessage;
    }

    @MessageMapping("/chat.sendPrivateMessage")
    public void sendPrivateMessage(@Payload ChatMessage chatMessage) {
        chatMessage.setId(UUID.randomUUID().toString());
        chatMessage.setTimestamp(LocalDateTime.now());
        chatMessage.setType(ChatMessage.MessageType.PRIVATE_MESSAGE);

        String recipient = chatMessage.getRecipient();
        if (recipient == null || recipient.isBlank()) return;

        log.info("Private message from {} to {}: {}", chatMessage.getSender(), recipient, chatMessage.getContent());
        messagingTemplate.convertAndSendToUser(recipient, "/queue/private", chatMessage);
    }

    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public ChatMessage addUser(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        headerAccessor.getSessionAttributes().put("username", chatMessage.getSender());

        String location = chatMessage.getLocation() != null ? chatMessage.getLocation() : "Unknown";
        String gender = chatMessage.getGender() != null ? chatMessage.getGender() : "Unknown";
        userSessionRegistry.addUser(chatMessage.getSender(), sessionId, location, gender);

        chatMessage.setId(UUID.randomUUID().toString());
        chatMessage.setTimestamp(LocalDateTime.now());
        chatMessage.setOnlineUsers(userSessionRegistry.getOnlineUsers());
        chatMessage.setUsersByLocation(userSessionRegistry.getUsersByLocation());
        chatMessage.setUserGenders(userSessionRegistry.getUserGenders());

        log.info("User joined: {} ({}) from {} with session: {}", chatMessage.getSender(), gender, location, sessionId);
        return chatMessage;
    }
}
