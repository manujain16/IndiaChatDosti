'use strict';

var collapsedLocations = {};
var messageForm = document.querySelector('#messageForm');
var messageInput = document.querySelector('#message');
var messageArea = document.querySelector('#messageArea');
var connectingElement = document.querySelector('.connecting');
var usernameDisplay = document.querySelector('#username-display');
var usersList = document.querySelector('#usersList');
var userCount = document.querySelector('#user-count');
var userSearchInput = document.querySelector('#userSearch');
var noUsersFound = document.querySelector('#noUsersFound');

var privateChatModal = document.querySelector('#privateChatModal');
var privateChatArea = document.querySelector('#privateChatArea');
var privateChatUsername = document.querySelector('#privateChatUsername');
var privateMessageForm = document.querySelector('#privateMessageForm');
var privateMessageInput = document.querySelector('#privateMessage');

var stompClient = null;
var username = null;
var userLocation = null;
var userGender = null;
var sessionId = null;
var allOnlineUsers = [];
var usersByLocation = {};
var userGenders = {};
var currentPrivateChat = null;
var privateChats = {};
var currentGenderFilter = 'all';
var isTransforming = false;

// Emoji data
var emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
    '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
    '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
    '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
    '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
    '🤧', '🥵', '🥶', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐',
    '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦',
    '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞',
    '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '👍', '👎',
    '👌', '✌️', '🤞', '🤟', '🤘', '👏', '🙌', '👐', '🤲', '🙏',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '⭐',
    '✨', '💫', '⚡', '🔥', '💥', '💯', '✅', '❌', '⚠️', '🎉',
    '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '🎯', '🎮', '🎲'
];

var emojiPickerVisible = false;
var currentEmojiTarget = null;
var emojiPicker = null;

function createEmojiPicker() {
    var picker = document.createElement('div');
    picker.id = 'emojiPicker';
    picker.className = 'emoji-picker hidden';
    
    emojis.forEach(function(emoji) {
        var emojiBtn = document.createElement('button');
        emojiBtn.type = 'button';
        emojiBtn.className = 'emoji-btn';
        emojiBtn.textContent = emoji;
        emojiBtn.onclick = function() {
            insertEmoji(emoji);
        };
        picker.appendChild(emojiBtn);
    });
    
    document.body.appendChild(picker);
    return picker;
}

function insertEmoji(emoji) {
    if (currentEmojiTarget) {
        var start = currentEmojiTarget.selectionStart;
        var end = currentEmojiTarget.selectionEnd;
        var text = currentEmojiTarget.value;
        currentEmojiTarget.value = text.substring(0, start) + emoji + text.substring(end);
        currentEmojiTarget.selectionStart = currentEmojiTarget.selectionEnd = start + emoji.length;
        currentEmojiTarget.focus();
    }
    hideEmojiPicker();
}

function showEmojiPicker(inputElement, buttonElement) {
    currentEmojiTarget = inputElement;
    
    if (!emojiPicker) {
        emojiPicker = createEmojiPicker();
    }
    
    var rect = buttonElement.getBoundingClientRect();
    emojiPicker.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
    emojiPicker.style.left = rect.left + 'px';
    emojiPicker.classList.remove('hidden');
    emojiPickerVisible = true;
}

function hideEmojiPicker() {
    if (emojiPicker) {
        emojiPicker.classList.add('hidden');
    }
    emojiPickerVisible = false;
    currentEmojiTarget = null;
}

function toggleEmojiPicker(inputElement, buttonElement) {
    if (emojiPickerVisible && currentEmojiTarget === inputElement) {
        hideEmojiPicker();
    } else {
        showEmojiPicker(inputElement, buttonElement);
    }
}

document.addEventListener('click', function(e) {
    if (!emojiPicker) return;
    
    var clickedOnPicker = emojiPicker.contains(e.target);
    var clickedOnTrigger = e.target.classList.contains('emoji-trigger') || 
                           e.target.closest('.emoji-trigger');
    
    if (!clickedOnPicker && !clickedOnTrigger && emojiPickerVisible) {
        hideEmojiPicker();
    }
});

// // AI Tone Transformation Functions
// async function transformMessage(tone) {
//     var messageInput = document.getElementById('message');
//     var originalMessage = messageInput.value.trim();
//
//     if (!originalMessage) {
//         alert('Please type a message first!');
//         return;
//     }
//
//     if (isTransforming) {
//         return;
//     }
//
//     isTransforming = true;
//
//     var buttons = document.querySelectorAll('.tone-btn');
//     buttons.forEach(function(btn) { btn.disabled = true; });
//
//     try {
//         var transformedMessage = await callClaudeAPI(originalMessage, tone);
//         messageInput.value = transformedMessage;
//         messageInput.focus();
//     } catch (error) {
//         console.error('Transformation error:', error);
//         alert('Failed to transform message. Please try again.');
//     } finally {
//         isTransforming = false;
//         buttons.forEach(function(btn) { btn.disabled = false; });
//     }
// }
//
// async function transformPrivateMessage(tone) {
//     var messageInput = document.getElementById('privateMessage');
//     var originalMessage = messageInput.value.trim();
//
//     if (!originalMessage) {
//         alert('Please type a message first!');
//         return;
//     }
//
//     if (isTransforming) {
//         return;
//     }
//
//     isTransforming = true;
//
//     var buttons = document.querySelectorAll('.tone-btn');
//     buttons.forEach(function(btn) { btn.disabled = true; });
//
//     try {
//         var transformedMessage = await callClaudeAPI(originalMessage, tone);
//         messageInput.value = transformedMessage;
//         messageInput.focus();
//     } catch (error) {
//         console.error('Transformation error:', error);
//         alert('Failed to transform message. Please try again.');
//     } finally {
//         isTransforming = false;
//         buttons.forEach(function(btn) { btn.disabled = false; });
//     }
// }

// async function callClaudeAPI(message, tone) {
//     var prompts = {
//         romantic: 'Transform this message into a romantic, affectionate tone. Keep it sweet and loving. Original: "' + message + '"',
//         professional: 'Transform this message into a professional, business-like tone. Keep it formal and polite. Original: "' + message + '"',
//         funny: 'Transform this message into a funny, humorous tone. Add wit and humor. Original: "' + message + '"',
//         poetic: 'Transform this message into a poetic, artistic tone. Use beautiful language and metaphors. Original: "' + message + '"',
//         casual: 'Transform this message into a casual, relaxed tone. Make it friendly and easy-going. Original: "' + message + '"',
//         formal: 'Transform this message into a formal, sophisticated tone. Use proper language and etiquette. Original: "' + message + '"'
//     };
//
//     var systemPrompt = 'You are a message tone transformer. Transform the given message to match the requested tone. Rules: 1. Keep the core meaning intact 2. Maintain appropriate length (similar to original) 3. Output ONLY the transformed message, nothing else 4. No quotes, no preamble, just the message 5. Keep it suitable for a chat application';
//
//     try {
//         var response = await fetch("https://api.anthropic.com/v1/messages", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//                 "anthropic-version": "2023-06-01"
//             },
//             body: JSON.stringify({
//                 model: "claude-sonnet-4-20250514",
//                 max_tokens: 200,
//                 system: systemPrompt,
//                 messages: [
//                     {
//                         role: "user",
//                         content: prompts[tone]
//                     }
//                 ]
//             })
//         });
//
//         if (!response.ok) {
//             throw new Error('API request failed');
//         }
//
//         var data = await response.json();
//
//         var transformedText = '';
//         if (data.content && data.content.length > 0) {
//             transformedText = data.content
//                 .filter(function(block) { return block.type === 'text'; })
//                 .map(function(block) { return block.text; })
//                 .join(' ')
//                 .trim();
//         }
//
//         transformedText = transformedText.replace(/^["']|["']$/g, '');
//
//         return transformedText || message;
//
//     } catch (error) {
//         console.error('Claude API error:', error);
//         throw error;
//     }
// }

// Simple AI-like Message Transformation (No API needed)
// Replace the callClaudeAPI function and transform functions with these

var isTransforming = false;

async function transformMessage(tone) {
    var messageInput = document.getElementById('message');
    var originalMessage = messageInput.value.trim();

    if (!originalMessage) {
        alert('Please type a message first!');
        return;
    }

    if (isTransforming) {
        return;
    }

    isTransforming = true;

    var buttons = document.querySelectorAll('.tone-btn');
    buttons.forEach(function(btn) { btn.disabled = true; });

    try {
        var transformedMessage = transformWithRules(originalMessage, tone);
        messageInput.value = transformedMessage;
        messageInput.focus();
    } catch (error) {
        console.error('Transformation error:', error);
        alert('Failed to transform message. Please try again.');
    } finally {
        isTransforming = false;
        buttons.forEach(function(btn) { btn.disabled = false; });
    }
}

async function transformPrivateMessage(tone) {
    var messageInput = document.getElementById('privateMessage');
    var originalMessage = messageInput.value.trim();

    if (!originalMessage) {
        alert('Please type a message first!');
        return;
    }

    if (isTransforming) {
        return;
    }

    isTransforming = true;

    var buttons = document.querySelectorAll('.tone-btn');
    buttons.forEach(function(btn) { btn.disabled = true; });

    try {
        var transformedMessage = transformWithRules(originalMessage, tone);
        messageInput.value = transformedMessage;
        messageInput.focus();
    } catch (error) {
        console.error('Transformation error:', error);
        alert('Failed to transform message. Please try again.');
    } finally {
        isTransforming = false;
        buttons.forEach(function(btn) { btn.disabled = false; });
    }
}

function transformWithRules(message, tone) {
    var transformed = message;

    switch(tone) {
        case 'romantic':
            transformed = makeRomantic(message);
            break;
        case 'professional':
            transformed = makeProfessional(message);
            break;
        case 'funny':
            transformed = makeFunny(message);
            break;
        case 'poetic':
            transformed = makePoetic(message);
            break;
        case 'casual':
            transformed = makeCasual(message);
            break;
        case 'formal':
            transformed = makeFormal(message);
            break;
        default:
            transformed = message;
    }

    return transformed;
}

function makeRomantic(msg) {
    var romantic = {
        'hello': 'Hello there, sweetheart! 💕',
        'hi': 'Hi darling! 💖',
        'how are you': 'How are you doing, my love? I hope you\'re having a wonderful day! ❤️',
        'good morning': 'Good morning, beautiful! ☀️💕',
        'good night': 'Good night, sleep well my dear! Sweet dreams! 🌙💖',
        'thanks': 'Thank you so much, you\'re so sweet! 💝',
        'yes': 'Yes, absolutely my love! 💕',
        'no': 'I\'m sorry darling, but no... 💔',
        'ok': 'Okay sweetheart! 💖',
        'bye': 'Goodbye my love, I\'ll miss you! 💕',
        'i love': 'I absolutely adore',
        'like': 'love',
        'want': 'would love to',
        'need': 'deeply desire'
    };

    var result = msg.toLowerCase();
    for (var key in romantic) {
        if (result.includes(key)) {
            return romantic[key];
        }
    }

    return msg + ' 💕';
}

function makeProfessional(msg) {
    var professional = {
        'hello': 'Good day,',
        'hi': 'Greetings,',
        'how are you': 'I hope this message finds you well.',
        'thanks': 'Thank you for your time and consideration.',
        'yes': 'Affirmative.',
        'no': 'I regret to inform you that this is not feasible.',
        'ok': 'Understood.',
        'bye': 'Best regards,',
        'want': 'would like to',
        'need': 'require',
        'can you': 'Would you be able to',
        'gonna': 'going to',
        'wanna': 'want to'
    };

    var result = msg.toLowerCase();
    for (var key in professional) {
        if (result.includes(key)) {
            return professional[key];
        }
    }

    return 'I would like to inform you that ' + msg.toLowerCase();
}

function makeFunny(msg) {
    var funny = {
        'hello': 'Hey there, party person! 🎉',
        'hi': 'Yo! What\'s up, buttercup? 😄',
        'how are you': 'How are you doing? Still awesome, I hope! 😎',
        'good morning': 'Rise and shine, sunshine! ☀️😄',
        'good night': 'Sleep tight, don\'t let the bed bugs bite! 😴🐛',
        'thanks': 'Thanks a million! You rock! 🎸',
        'yes': 'Oh yeah! Absolutely! 💯',
        'no': 'Nope, not happening! 🙅‍♂️',
        'ok': 'Okie dokie! 👍',
        'bye': 'See ya later, alligator! 🐊',
        'tired': 'so tired, even my coffee needs coffee',
        'hungry': 'so hungry, I could eat a horse',
        'happy': 'happier than a kid in a candy store'
    };

    var result = msg.toLowerCase();
    for (var key in funny) {
        if (result.includes(key)) {
            return funny[key];
        }
    }

    return msg + ' 😄';
}

function makePoetic(msg) {
    var poetic = {
        'hello': 'Greetings, like the gentle dawn breaking over distant hills...',
        'hi': 'Salutations, as soft as whispers on the evening breeze...',
        'how are you': 'How doth thy spirit fare on this splendid day?',
        'good morning': 'The morning sun graces us with its golden light...',
        'good night': 'As the stars emerge to paint the velvet sky, I bid thee good night...',
        'thanks': 'My gratitude flows like rivers to the sea...',
        'yes': 'Indeed, as certain as the moon follows the sun...',
        'no': 'Alas, the fates decree otherwise...',
        'beautiful': 'as radiant as a thousand stars',
        'sad': 'melancholy, like autumn leaves falling',
        'happy': 'joyous, like songbirds at dawn'
    };

    var result = msg.toLowerCase();
    for (var key in poetic) {
        if (result.includes(key)) {
            return poetic[key];
        }
    }

    return 'Like whispers of the wind, ' + msg.toLowerCase() + '...';
}

function makeCasual(msg) {
    var casual = {
        'hello': 'Hey!',
        'hi': 'Yo!',
        'how are you': 'What\'s up? How\'s it going?',
        'good morning': 'Morning!',
        'good night': 'Night!',
        'thanks': 'Thanks!',
        'thank you': 'Thanks a bunch!',
        'yes': 'Yeah!',
        'no': 'Nah',
        'ok': 'Cool',
        'okay': 'Alright',
        'bye': 'Later!',
        'goodbye': 'See ya!',
        'do not': 'don\'t',
        'cannot': 'can\'t',
        'will not': 'won\'t',
        'going to': 'gonna',
        'want to': 'wanna'
    };

    var result = msg.toLowerCase();
    for (var key in casual) {
        if (result.includes(key)) {
            return casual[key];
        }
    }

    return msg;
}

function makeFormal(msg) {
    var formal = {
        'hello': 'Good evening, I hope this message finds you in excellent health.',
        'hi': 'Greetings and salutations,',
        'how are you': 'I trust you are in good health and spirits.',
        'thanks': 'I express my sincere gratitude.',
        'yes': 'I am in complete agreement.',
        'no': 'I must respectfully decline.',
        'ok': 'That is acceptable.',
        'bye': 'I bid you farewell.',
        'gonna': 'going to',
        'wanna': 'wish to',
        'can\'t': 'cannot',
        'don\'t': 'do not',
        'won\'t': 'will not',
        'isn\'t': 'is not'
    };

    var result = msg.toLowerCase();
    for (var key in formal) {
        if (result.includes(key)) {
            return formal[key];
        }
    }

    return 'I would like to respectfully state that ' + msg.toLowerCase();
}

console.log("✓ AI tone transformation loaded (Rule-based, no API needed)");

function connect() {
    username = sessionStorage.getItem('username');
    userLocation = sessionStorage.getItem('location');
    userGender = sessionStorage.getItem('gender');
    
    if (!username || !userLocation || !userGender) {
        window.location.href = '/';
        return;
    }
    
    console.log("Connecting as:", username, "Gender:", userGender, "from", userLocation);
    usernameDisplay.textContent = username;
    var socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);
    stompClient.connect({}, onConnected, onError);
}

function onConnected(frame) {
    console.log("✓ WebSocket connected");
    
    stompClient.subscribe('/topic/public', onMessageReceived);
    console.log("✓ Subscribed to /topic/public");
    
    stompClient.send("/app/chat.addUser", {}, JSON.stringify({
        sender: username,
        location: userLocation,
        gender: userGender,
        type: 'JOIN'
    }));
    console.log("✓ Sent JOIN with location:", userLocation, "and gender:", userGender);
    
    connectingElement.classList.add('hidden');
}

function subscribeToPrivateMessages(session) {
    var privateQueue = '/queue/private-' + session;
    console.log("Subscribing to:", privateQueue);
    
    stompClient.subscribe(privateQueue, function(payload) {
        console.log("🔔 PRIVATE MESSAGE RECEIVED ON", privateQueue);
        var message = JSON.parse(payload.body);
        console.log("Message:", message);
        
        var otherUser = message.sender === username ? message.recipient : message.sender;
        var isSentByMe = message.sender === username;
        
        if (!privateChats[otherUser]) {
            privateChats[otherUser] = [];
        }
        
        privateChats[otherUser].push({
            sender: message.sender,
            content: message.content,
            timestamp: new Date(),
            sent: isSentByMe
        });
        
        if (currentPrivateChat === otherUser) {
            displayPrivateMessages(otherUser);
        } else if (!isSentByMe) {
            openPrivateChat(otherUser);
        }
    });
    
    console.log("✓ Subscribed to", privateQueue);
}

function onError(error) {
    connectingElement.textContent = 'Could not connect. Please refresh!';
    connectingElement.style.color = 'red';
    console.error("Connection error:", error);
}

function sendMessage(event) {
    event.preventDefault();
    var messageContent = messageInput.value.trim();
    if (messageContent && stompClient) {
        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify({
            sender: username,
            content: messageContent,
            type: 'CHAT'
        }));
        messageInput.value = '';
    }
}

function updateUsersList(usersByLoc) {
    if (!usersByLoc || Object.keys(usersByLoc).length === 0) {
        usersByLoc = {};
    }
    
    usersByLocation = usersByLoc;
    
    var searchQuery = userSearchInput.value.trim().toLowerCase();
    usersList.innerHTML = '';
    
    var sortedLocations = Object.keys(usersByLocation).sort();
    
    if (sortedLocations.length === 0) {
        noUsersFound.classList.remove('hidden');
        usersList.classList.add('hidden');
        userCount.textContent = '0';
        return;
    }
    
    var hasVisibleUsers = false;
    var visibleUserCount = 0;
    
    sortedLocations.forEach(function(location) {
        var users = Array.from(usersByLocation[location] || []);
        if (users.length === 0) return;
        
        var filteredUsers = searchQuery ? 
            users.filter(function(user) { return user.toLowerCase().includes(searchQuery); }) : 
            users;
        
        if (filteredUsers.length === 0) return;
        
        filteredUsers.sort(function(a, b) {
            if (a === username) return -1;
            if (b === username) return 1;
            return a.localeCompare(b);
        });
        
        var usersInLocation = [];
        filteredUsers.forEach(function(user) {
            if (currentGenderFilter !== 'all') {
                var userGenderValue = userGenders[user];
                if (userGenderValue !== currentGenderFilter) {
                    return;
                }
            }
            usersInLocation.push(user);
        });
        
        if (usersInLocation.length === 0) return;
        
        hasVisibleUsers = true;
        visibleUserCount += usersInLocation.length;

        var locationHeader = document.createElement('li');
        locationHeader.classList.add('location-header');
        locationHeader.style.cursor = 'pointer';

        if (collapsedLocations[location] === undefined) {
            collapsedLocations[location] = false; // default expanded
        }

        var arrow = collapsedLocations[location] ? '▶' : '▼';

        locationHeader.innerHTML =
            '<span class="location-toggle">' + arrow + '</span> ' +
            '<span class="location-icon">📍</span> ' +
            '<span class="location-name">' + location + '</span> ' +
            '<span class="location-count">(' + usersInLocation.length + ')</span>';

        locationHeader.onclick = function() {
            collapsedLocations[location] = !collapsedLocations[location];
            updateUsersList(usersByLocation);
        };

        usersList.appendChild(locationHeader);

// If collapsed, skip rendering users
        if (collapsedLocations[location]) {
            return;
        }
        usersInLocation.forEach(function(user) {
            var userItem = document.createElement('li');
            userItem.classList.add('user-item');
            userItem.classList.add('user-in-location');
            userItem.setAttribute('data-username', user);
            
            if (user === username) {
                userItem.classList.add('current-user');
            } else {
                userItem.onclick = function() { openPrivateChat(user); };
                userItem.style.cursor = 'pointer';
                userItem.title = 'Click to send private message';
            }
            
            var statusDot = document.createElement('span');
            statusDot.classList.add('user-status');
            
            var genderIcon = document.createElement('span');
            genderIcon.classList.add('gender-icon');
            var userGenderValue = userGenders[user];
            if (userGenderValue === 'Male') {
                genderIcon.textContent = '👑 ';
                genderIcon.classList.add('male');
            } else if (userGenderValue === 'Female') {
                genderIcon.textContent = '👸 ';
                genderIcon.classList.add('female');
            }
            
            var userName = document.createElement('span');
            userName.classList.add('user-name');
            userName.textContent = user + (user === username ? ' (You)' : '');
            
            userItem.appendChild(statusDot);
            userItem.appendChild(genderIcon);
            userItem.appendChild(userName);
            usersList.appendChild(userItem);
        });
    });
    
    userCount.textContent = visibleUserCount;
    
    if (hasVisibleUsers) {
        noUsersFound.classList.add('hidden');
        usersList.classList.remove('hidden');
    } else {
        noUsersFound.classList.remove('hidden');
        usersList.classList.add('hidden');
    }
}

function filterUsers() {
    updateUsersList(usersByLocation);
}

function filterByGender(gender) {
    console.log("Filtering by gender:", gender);
    currentGenderFilter = gender;
    
    document.getElementById('filterAll').classList.remove('active');
    document.getElementById('filterMale').classList.remove('active');
    document.getElementById('filterFemale').classList.remove('active');
    
    if (gender === 'all') {
        document.getElementById('filterAll').classList.add('active');
    } else if (gender === 'Male') {
        document.getElementById('filterMale').classList.add('active');
    } else if (gender === 'Female') {
        document.getElementById('filterFemale').classList.add('active');
    }
    
    updateUsersList(usersByLocation);
}

function onMessageReceived(payload) {
    var message = JSON.parse(payload.body);
    
    if (message.usersByLocation) {
        if (message.userGenders) {
            userGenders = message.userGenders;
            console.log("Updated user genders:", userGenders);
        }
        updateUsersList(message.usersByLocation);
        
        if (message.type === 'JOIN' && message.sender === username && sessionId === null) {
            setTimeout(function() {
                var ws = stompClient.ws;
                if (ws && ws._transport && ws._transport.url) {
                    var url = ws._transport.url;
                    var match = url.match(/\/([^/]+)\/websocket/);
                    if (match) {
                        sessionId = match[1];
                        console.log("Extracted session ID:", sessionId);
                        subscribeToPrivateMessages(sessionId);
                    }
                }
            }, 100);
        }
    }

    var messageElement = document.createElement('li');

    if (message.type === 'JOIN') {
        messageElement.classList.add('event-message');
        var locationText = message.location ? ' from ' + message.location : '';
        messageElement.textContent = message.sender + locationText + ' joined the chat!';
    } else if (message.type === 'LEAVE') {
        messageElement.classList.add('event-message');
        messageElement.textContent = message.sender + ' left the chat!';
    } else {
        messageElement.classList.add('chat-message');
        if (message.sender === username) {
            messageElement.classList.add('own');
        }

        var senderElement = document.createElement('div');
        senderElement.classList.add('message-sender');
        senderElement.textContent = message.sender;

        var contentElement = document.createElement('div');
        contentElement.classList.add('message-content');
        contentElement.textContent = message.content;

        var timeElement = document.createElement('div');
        timeElement.classList.add('message-time');
        if (message.timestamp) {
            var timestamp = new Date(message.timestamp);
            timeElement.textContent = timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }

        messageElement.appendChild(senderElement);
        messageElement.appendChild(contentElement);
        messageElement.appendChild(timeElement);
    }

    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;
}

function openPrivateChat(recipientUsername) {
    console.log("Opening private chat with:", recipientUsername);
    currentPrivateChat = recipientUsername;
    privateChatUsername.textContent = recipientUsername;
    privateChatModal.classList.remove('hidden');
    
    if (!privateChats[recipientUsername]) {
        privateChats[recipientUsername] = [];
    }
    
    displayPrivateMessages(recipientUsername);
    privateMessageInput.focus();
}

function closePrivateChat() {
    privateChatModal.classList.add('hidden');
    currentPrivateChat = null;
}

function sendPrivateMessage(event) {
    event.preventDefault();
    
    var messageContent = privateMessageInput.value.trim();
    
    if (messageContent && stompClient && currentPrivateChat) {
        stompClient.send("/app/chat.sendPrivateMessage", {}, JSON.stringify({
            sender: username,
            recipient: currentPrivateChat,
            content: messageContent,
            type: 'PRIVATE_MESSAGE'
        }));
        
        privateMessageInput.value = '';
    }
}

function displayPrivateMessages(recipientUsername) {
    privateChatArea.innerHTML = '';
    var messages = privateChats[recipientUsername] || [];
    
    messages.forEach(function(msg) {
        var messageElement = document.createElement('li');
        messageElement.classList.add('private-message');
        messageElement.classList.add(msg.sent ? 'sent' : 'received');
        
        var contentElement = document.createElement('div');
        contentElement.classList.add('message-content');
        contentElement.textContent = msg.content;
        
        var timeElement = document.createElement('div');
        timeElement.classList.add('message-time');
        timeElement.textContent = msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        messageElement.appendChild(contentElement);
        messageElement.appendChild(timeElement);
        privateChatArea.appendChild(messageElement);
    });
    
    privateChatArea.scrollTop = privateChatArea.scrollHeight;
}

window.addEventListener('load', function() {
    var mainEmojiBtn = document.getElementById('mainEmojiBtn');
    var mainMessageInput = document.getElementById('message');
    
    if (mainEmojiBtn && mainMessageInput) {
        mainEmojiBtn.addEventListener('click', function(e) {
            e.preventDefault();
            toggleEmojiPicker(mainMessageInput, mainEmojiBtn);
        });
    }
    
    var privateEmojiBtn = document.getElementById('privateEmojiBtn');
    var privateMessageInputElem = document.getElementById('privateMessage');
    
    if (privateEmojiBtn && privateMessageInputElem) {
        privateEmojiBtn.addEventListener('click', function(e) {
            e.preventDefault();
            toggleEmojiPicker(privateMessageInputElem, privateEmojiBtn);
        });
    }
    
    connect();
});

messageForm.addEventListener('submit', sendMessage, true);
userSearchInput.addEventListener('input', filterUsers, true);
privateMessageForm.addEventListener('submit', sendPrivateMessage, true);

window.addEventListener('beforeunload', function() {
    if (stompClient !== null) {
        stompClient.disconnect();
    }
});

console.log("✓ chat.js loaded with AI TONES, GENDER FILTER, LOCATION GROUPING, EMOJIS and private messaging");
