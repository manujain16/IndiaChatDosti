package com.chatapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ChatApplication {

    public static void main(String[] args) {
        SpringApplication.run(ChatApplication.class, args);
        System.out.println("\n========================================");
        System.out.println("Chat Application Started Successfully!");
        System.out.println("Open your browser and navigate to:");
        System.out.println("http://localhost:8080");
        System.out.println("========================================\n");
    }
}
