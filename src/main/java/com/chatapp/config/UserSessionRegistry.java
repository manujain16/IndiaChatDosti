package com.chatapp.config;

import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Component
public class UserSessionRegistry {
    
    private final Set<String> onlineUsers = ConcurrentHashMap.newKeySet();
    private final Map<String, String> userSessions = new ConcurrentHashMap<>();
    private final Map<String, String> userLocations = new ConcurrentHashMap<>();
    private final Map<String, String> userGenders = new ConcurrentHashMap<>();
    
    public void addUser(String username, String sessionId, String location, String gender) {
        onlineUsers.add(username);
        userSessions.put(username, sessionId);
        userLocations.put(username, location);
        userGenders.put(username, gender);
    }
    
    public void removeUser(String username) {
        onlineUsers.remove(username);
        userSessions.remove(username);
        userLocations.remove(username);
        userGenders.remove(username);
    }
    
    public Set<String> getOnlineUsers() {
        return Set.copyOf(onlineUsers);
    }
    
    public int getOnlineUserCount() {
        return onlineUsers.size();
    }
    
    public String getSessionId(String username) {
        return userSessions.get(username);
    }
    
    public String getLocation(String username) {
        return userLocations.get(username);
    }
    
    public String getGender(String username) {
        return userGenders.get(username);
    }
    
    public Map<String, String> getUserGenders() {
        return new HashMap<>(userGenders);
    }
    
    public Map<String, Set<String>> getUsersByLocation() {
        return userLocations.entrySet().stream()
            .collect(Collectors.groupingBy(
                Map.Entry::getValue,
                TreeMap::new,
                Collectors.mapping(Map.Entry::getKey, Collectors.toSet())
            ));
    }
}
