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
        emojiBtn.onclick = function() { insertEmoji(emoji); };
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
    if (!emojiPicker) emojiPicker = createEmojiPicker();
    var rect = buttonElement.getBoundingClientRect();
    emojiPicker.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
    emojiPicker.style.left = rect.left + 'px';
    emojiPicker.classList.remove('hidden');
    emojiPickerVisible = true;
}

function hideEmojiPicker() {
    if (emojiPicker) emojiPicker.classList.add('hidden');
    emojiPickerVisible = false;
    currentEmojiTarget = null;
}

function toggleEmojiPicker(inputElement, buttonElement) {
    if (emojiPickerVisible && currentEmojiTarget === inputElement) hideEmojiPicker();
    else showEmojiPicker(inputElement, buttonElement);
}

document.addEventListener('click', function(e) {
    if (!emojiPicker) return;
    var clickedOnPicker = emojiPicker.contains(e.target);
    var clickedOnTrigger = e.target.classList.contains('emoji-trigger') || e.target.closest('.emoji-trigger');
    if (!clickedOnPicker && !clickedOnTrigger && emojiPickerVisible) hideEmojiPicker();
});

// AI tone transformation functions
async function transformMessage(tone) {
    var input = document.getElementById('message');
    var original = input.value.trim();
    if (!original || isTransforming) return;
    isTransforming = true;
    var buttons = document.querySelectorAll('.tone-btn');
    buttons.forEach(function(btn) { btn.disabled = true; });
    try { input.value = transformWithRules(original, tone); input.focus(); }
    finally { isTransforming = false; buttons.forEach(function(btn) { btn.disabled = false; }); }
}

async function transformPrivateMessage(tone) {
    var input = document.getElementById('privateMessage');
    var original = input.value.trim();
    if (!original || isTransforming) return;
    isTransforming = true;
    var buttons = document.querySelectorAll('.tone-btn');
    buttons.forEach(function(btn) { btn.disabled = true; });
    try { input.value = transformWithRules(original, tone); input.focus(); }
    finally { isTransforming = false; buttons.forEach(function(btn) { btn.disabled = false; }); }
}

function transformWithRules(message, tone) {
    var maps = {
        romantic: {'hello':'Hello there, sweetheart! 💕','hi':'Hi darling! 💖','how are you':'How are you doing, my love? ❤️','good morning':'Good morning, beautiful! ☀️💕','good night':'Good night, sleep well my dear! 🌙💖','thanks':'Thank you so much, you\'re so sweet! 💝','yes':'Yes, absolutely my love! 💕','no':'I\'m sorry darling, but no... 💔','ok':'Okay sweetheart! 💖','bye':'Goodbye my love, I\'ll miss you! 💕'},
        funny: {'hello':'Hey there, party person! 🎉','hi':'Yo! What\'s up, buttercup? 😄','how are you':'How are you doing? Still awesome, I hope! 😎','good morning':'Rise and shine, sunshine! ☀️😄','good night':'Sleep tight, don\'t let the bed bugs bite! 😴🐛','thanks':'Thanks a million! You rock! 🎸','yes':'Oh yeah! Absolutely! 💯','no':'Nope, not happening! 🙅‍♂️','ok':'Okie dokie! 👍','bye':'See ya later, alligator! 🐊'},
        casual: {'hello':'Hey!','hi':'Yo!','how are you':'What\'s up? How\'s it going?','good morning':'Morning!','good night':'Night!','thanks':'Thanks!','yes':'Yeah!','no':'Nah','ok':'Cool','okay':'Alright','bye':'Later!'},
        professional: {'hello':'Good day,','hi':'Greetings,','how are you':'I hope this message finds you well.','thanks':'Thank you for your time and consideration.','yes':'Affirmative.','no':'I regret to inform you that this is not feasible.','ok':'Understood.','bye':'Best regards,'},
        poetic: {'hello':'Greetings, like the gentle dawn breaking over distant hills...','hi':'Salutations, as soft as whispers on the evening breeze...','good morning':'The morning sun graces us with its golden light...','good night':'As the stars emerge to paint the velvet sky, I bid thee good night...','thanks':'My gratitude flows like rivers to the sea...'},
        formal: {'hello':'Good evening, I hope this message finds you in excellent health.','hi':'Greetings and salutations,','how are you':'I trust you are in good health and spirits.','thanks':'I express my sincere gratitude.','yes':'I am in complete agreement.','no':'I must respectfully decline.','ok':'That is acceptable.','bye':'I bid you farewell.'}
    };
    var map = maps[tone] || {};
    var lower = message.toLowerCase();
    for (var key in map) if (lower.includes(key)) return map[key];
    return message;
}

function connect() {
    username = sessionStorage.getItem('username');
    userLocation = sessionStorage.getItem('location');
    userGender = sessionStorage.getItem('gender');
    if (!username || !userLocation || !userGender) { window.location.href = '/'; return; }
    usernameDisplay.textContent = username;
    var socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);
    stompClient.connect({}, onConnected, onError);
}

function onConnected(frame) {
    stompClient.subscribe('/topic/public', onMessageReceived);
    stompClient.send('/app/chat.addUser', {}, JSON.stringify({sender: username, location: userLocation, gender: userGender, type: 'JOIN'}));
    connectingElement.classList.add('hidden');
}

function subscribeToPrivateMessages(session) {
    var privateQueue = '/queue/private-' + session;
    stompClient.subscribe(privateQueue, function(payload) {
        var message = JSON.parse(payload.body);
        var otherUser = message.sender === username ? message.recipient : message.sender;
        var isSentByMe = message.sender === username;
        if (!privateChats[otherUser]) privateChats[otherUser] = [];
        privateChats[otherUser].push({
            sender: message.sender,
            content: message.content,
            imageData: message.imageData || null,
            timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
            sent: isSentByMe
        });
        if (currentPrivateChat === otherUser) displayPrivateMessages(otherUser);
        else if (!isSentByMe) openPrivateChat(otherUser);
    });
}

function onError(error) {
    connectingElement.textContent = 'Could not connect. Please refresh!';
    connectingElement.style.color = 'red';
}

function sendMessage(event) {
    event.preventDefault();
    var messageContent = messageInput.value.trim();
    if (messageContent && stompClient) {
        stompClient.send('/app/chat.sendMessage', {}, JSON.stringify({sender: username, content: messageContent, type: 'CHAT'}));
        messageInput.value = '';
    }
}

function updateUsersList(usersByLoc) {
    if (!usersByLoc || Object.keys(usersByLoc).length === 0) usersByLoc = {};
    usersByLocation = usersByLoc;
    var searchQuery = userSearchInput.value.trim().toLowerCase();
    usersList.innerHTML = '';
    var sortedLocations = Object.keys(usersByLocation).sort();
    if (sortedLocations.length === 0) { noUsersFound.classList.remove('hidden'); usersList.classList.add('hidden'); userCount.textContent = '0'; return; }
    var hasVisibleUsers = false;
    var visibleUserCount = 0;
    sortedLocations.forEach(function(location) {
        var users = Array.from(usersByLocation[location] || []);
        if (!users.length) return;
        var filteredUsers = searchQuery ? users.filter(function(user) { return user.toLowerCase().includes(searchQuery); }) : users;
        if (!filteredUsers.length) return;
        filteredUsers.sort(function(a,b) { if (a === username) return -1; if (b === username) return 1; return a.localeCompare(b); });
        var usersInLocation = [];
        filteredUsers.forEach(function(user) { if (currentGenderFilter === 'all' || userGenders[user] === currentGenderFilter) usersInLocation.push(user); });
        if (!usersInLocation.length) return;
        hasVisibleUsers = true; visibleUserCount += usersInLocation.length;
        var locationHeader = document.createElement('li');
        locationHeader.classList.add('location-header'); locationHeader.style.cursor = 'pointer';
        if (collapsedLocations[location] === undefined) collapsedLocations[location] = false;
        var arrow = collapsedLocations[location] ? '▶' : '▼';
        locationHeader.innerHTML = '<span class="location-toggle">' + arrow + '</span> <span class="location-icon">📍</span> <span class="location-name">' + location + '</span> <span class="location-count">(' + usersInLocation.length + ')</span>';
        locationHeader.onclick = function() { collapsedLocations[location] = !collapsedLocations[location]; updateUsersList(usersByLocation); };
        usersList.appendChild(locationHeader);
        if (collapsedLocations[location]) return;
        usersInLocation.forEach(function(user) {
            var userItem = document.createElement('li'); userItem.classList.add('user-item','user-in-location'); userItem.setAttribute('data-username', user);
            if (user === username) userItem.classList.add('current-user');
            else { userItem.onclick = function() { openPrivateChat(user); }; userItem.style.cursor = 'pointer'; userItem.title = 'Click to send private message'; }
            var statusDot = document.createElement('span'); statusDot.classList.add('user-status');
            var genderIcon = document.createElement('span'); genderIcon.classList.add('gender-icon');
            if (userGenders[user] === 'Male') { genderIcon.textContent = '👑 '; genderIcon.classList.add('male'); }
            else if (userGenders[user] === 'Female') { genderIcon.textContent = '👸 '; genderIcon.classList.add('female'); }
            var userName = document.createElement('span'); userName.classList.add('user-name'); userName.textContent = user + (user === username ? ' (You)' : '');
            userItem.appendChild(statusDot); userItem.appendChild(genderIcon); userItem.appendChild(userName); usersList.appendChild(userItem);
        });
    });
    userCount.textContent = visibleUserCount;
    if (hasVisibleUsers) { noUsersFound.classList.add('hidden'); usersList.classList.remove('hidden'); }
    else { noUsersFound.classList.remove('hidden'); usersList.classList.add('hidden'); }
}

function filterUsers() { updateUsersList(usersByLocation); }
function filterByGender(gender) {
    currentGenderFilter = gender;
    document.getElementById('filterAll').classList.remove('active');
    document.getElementById('filterMale').classList.remove('active');
    document.getElementById('filterFemale').classList.remove('active');
    if (gender === 'all') document.getElementById('filterAll').classList.add('active');
    else if (gender === 'Male') document.getElementById('filterMale').classList.add('active');
    else document.getElementById('filterFemale').classList.add('active');
    updateUsersList(usersByLocation);
}

function addImageToMessage(contentElement, imageData) {
    if (!contentElement || !imageData || contentElement.querySelector('img.chat-shared-image')) return;
    var img = document.createElement('img');
    img.className = 'chat-shared-image';
    img.alt = 'Shared image';
    img.src = imageData;
    img.style.display = 'block';
    img.style.maxWidth = '280px';
    img.style.maxHeight = '320px';
    img.style.width = 'auto';
    img.style.height = 'auto';
    img.style.borderRadius = '10px';
    img.style.marginTop = '8px';
    img.style.objectFit = 'contain';
    img.style.cursor = 'pointer';
    img.onclick = function() { window.open(imageData, '_blank'); };
    contentElement.appendChild(img);
}

function onMessageReceived(payload) {
    var message = JSON.parse(payload.body);
    if (message.usersByLocation) {
        if (message.userGenders) userGenders = message.userGenders;
        updateUsersList(message.usersByLocation);
        if (message.type === 'JOIN' && message.sender === username && sessionId === null) {
            setTimeout(function() {
                var ws = stompClient.ws;
                if (ws && ws._transport && ws._transport.url) {
                    var match = ws._transport.url.match(/\/([^/]+)\/websocket/);
                    if (match) { sessionId = match[1]; subscribeToPrivateMessages(sessionId); }
                }
            }, 100);
        }
    }
    var messageElement = document.createElement('li');
    if (message.type === 'JOIN') {
        messageElement.classList.add('event-message');
        messageElement.textContent = message.sender + (message.location ? ' from ' + message.location : '') + ' joined the chat!';
    } else if (message.type === 'LEAVE') {
        messageElement.classList.add('event-message');
        messageElement.textContent = message.sender + ' left the chat!';
    } else {
        messageElement.classList.add('chat-message');
        if (message.sender === username) messageElement.classList.add('own');
        var senderElement = document.createElement('div'); senderElement.classList.add('message-sender'); senderElement.textContent = message.sender;
        var contentElement = document.createElement('div'); contentElement.classList.add('message-content');
        if (message.imageData) { contentElement.textContent = '📷 Image'; addImageToMessage(contentElement, message.imageData); }
        else contentElement.textContent = message.content || '';
        var timeElement = document.createElement('div'); timeElement.classList.add('message-time');
        if (message.timestamp) { var timestamp = new Date(message.timestamp); timeElement.textContent = timestamp.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); }
        messageElement.appendChild(senderElement); messageElement.appendChild(contentElement); messageElement.appendChild(timeElement);
    }
    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;
}

function openPrivateChat(recipientUsername) {
    currentPrivateChat = recipientUsername;
    privateChatUsername.textContent = recipientUsername;
    privateChatModal.classList.remove('hidden');
    if (!privateChats[recipientUsername]) privateChats[recipientUsername] = [];
    displayPrivateMessages(recipientUsername);
    privateMessageInput.focus();
}

function closePrivateChat() { privateChatModal.classList.add('hidden'); currentPrivateChat = null; }

function sendPrivateMessage(event) {
    event.preventDefault();
    var messageContent = privateMessageInput.value.trim();
    if (messageContent && stompClient && currentPrivateChat) {
        stompClient.send('/app/chat.sendPrivateMessage', {}, JSON.stringify({sender: username, recipient: currentPrivateChat, content: messageContent, type: 'PRIVATE_MESSAGE'}));
        privateMessageInput.value = '';
    }
}

function displayPrivateMessages(recipientUsername) {
    privateChatArea.innerHTML = '';
    var messages = privateChats[recipientUsername] || [];
    messages.forEach(function(msg) {
        var messageElement = document.createElement('li');
        messageElement.classList.add('private-message', msg.sent ? 'sent' : 'received');
        var contentElement = document.createElement('div'); contentElement.classList.add('message-content');
        if (msg.imageData) { contentElement.textContent = '📷 Image'; addImageToMessage(contentElement, msg.imageData); }
        else contentElement.textContent = msg.content || '';
        var timeElement = document.createElement('div'); timeElement.classList.add('message-time');
        timeElement.textContent = (msg.timestamp || new Date()).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
        messageElement.appendChild(contentElement); messageElement.appendChild(timeElement); privateChatArea.appendChild(messageElement);
    });
    privateChatArea.scrollTop = privateChatArea.scrollHeight;
}

window.addEventListener('load', function() {
    var mainEmojiBtn = document.getElementById('mainEmojiBtn');
    var mainMessageInput = document.getElementById('message');
    if (mainEmojiBtn && mainMessageInput) mainEmojiBtn.addEventListener('click', function(e) { e.preventDefault(); toggleEmojiPicker(mainMessageInput, mainEmojiBtn); });
    var privateEmojiBtn = document.getElementById('privateEmojiBtn');
    var privateMessageInputElem = document.getElementById('privateMessage');
    if (privateEmojiBtn && privateMessageInputElem) privateEmojiBtn.addEventListener('click', function(e) { e.preventDefault(); toggleEmojiPicker(privateMessageInputElem, privateEmojiBtn); });
    connect();
});

messageForm.addEventListener('submit', sendMessage, true);
userSearchInput.addEventListener('input', filterUsers, true);
privateMessageForm.addEventListener('submit', sendPrivateMessage, true);

window.addEventListener('beforeunload', function() { if (stompClient !== null) stompClient.disconnect(); });

console.log('✓ chat.js loaded with image rendering and private messaging');