package com.chatapp.model;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

public class ChatMessage {
    
    private String id;
    private MessageType type;
    private String content;
    private String imageData;
    private String sender;
    private String recipient;
    private String location;
    private String gender;
    private LocalDateTime timestamp;
    private Set<String> onlineUsers;
    private Map<String, Set<String>> usersByLocation;
    private Map<String, String> userGenders;
    
    public enum MessageType {
        CHAT,
        JOIN,
        LEAVE,
        USER_LIST,
        PRIVATE_MESSAGE
    }
    
    public ChatMessage() {
    }
    
    public ChatMessage(String id, MessageType type, String content, String sender, LocalDateTime timestamp) {
        this.id = id;
        this.type = type;
        this.content = content;
        this.sender = sender;
        this.timestamp = timestamp;
    }
    
    public static ChatMessageBuilder builder() {
        return new ChatMessageBuilder();
    }
    
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public MessageType getType() { return type; }
    public void setType(MessageType type) { this.type = type; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getImageData() { return imageData; }
    public void setImageData(String imageData) { this.imageData = imageData; }
    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }
    public String getRecipient() { return recipient; }
    public void setRecipient(String recipient) { this.recipient = recipient; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public Set<String> getOnlineUsers() { return onlineUsers; }
    public void setOnlineUsers(Set<String> onlineUsers) { this.onlineUsers = onlineUsers; }
    public Map<String, Set<String>> getUsersByLocation() { return usersByLocation; }
    public void setUsersByLocation(Map<String, Set<String>> usersByLocation) { this.usersByLocation = usersByLocation; }
    public Map<String, String> getUserGenders() { return userGenders; }
    public void setUserGenders(Map<String, String> userGenders) { this.userGenders = userGenders; }
    
    public static class ChatMessageBuilder {
        private String id;
        private MessageType type;
        private String content;
        private String imageData;
        private String sender;
        private String recipient;
        private String location;
        private String gender;
        private LocalDateTime timestamp;
        private Set<String> onlineUsers;
        private Map<String, Set<String>> usersByLocation;
        private Map<String, String> userGenders;
        
        public ChatMessageBuilder id(String id) { this.id = id; return this; }
        public ChatMessageBuilder type(MessageType type) { this.type = type; return this; }
        public ChatMessageBuilder content(String content) { this.content = content; return this; }
        public ChatMessageBuilder imageData(String imageData) { this.imageData = imageData; return this; }
        public ChatMessageBuilder sender(String sender) { this.sender = sender; return this; }
        public ChatMessageBuilder recipient(String recipient) { this.recipient = recipient; return this; }
        public ChatMessageBuilder location(String location) { this.location = location; return this; }
        public ChatMessageBuilder gender(String gender) { this.gender = gender; return this; }
        public ChatMessageBuilder timestamp(LocalDateTime timestamp) { this.timestamp = timestamp; return this; }
        public ChatMessageBuilder onlineUsers(Set<String> onlineUsers) { this.onlineUsers = onlineUsers; return this; }
        public ChatMessageBuilder usersByLocation(Map<String, Set<String>> usersByLocation) { this.usersByLocation = usersByLocation; return this; }
        public ChatMessageBuilder userGenders(Map<String, String> userGenders) { this.userGenders = userGenders; return this; }
        
        public ChatMessage build() {
            ChatMessage message = new ChatMessage(id, type, content, sender, timestamp);
            message.setImageData(imageData);
            message.setRecipient(recipient);
            message.setLocation(location);
            message.setGender(gender);
            message.setOnlineUsers(onlineUsers);
            message.setUsersByLocation(usersByLocation);
            message.setUserGenders(userGenders);
            return message;
        }
    }
}
