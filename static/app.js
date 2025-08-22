// Global variables
let socket;
let currentUser = '';
let currentRoom = '';
let reactedMessages = new Set(); // Track messages user has reacted to

// Available emojis for reactions
const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

// DOM elements
const joinScreen = document.getElementById('join-screen');
const chatScreen = document.getElementById('chat-screen');
const joinForm = document.getElementById('join-form');
const usernameInput = document.getElementById('username');
const roomSelect = document.getElementById('room-select');
const currentRoomEl = document.getElementById('current-room');
const currentUserEl = document.getElementById('current-user');
const messagesContainer = document.getElementById('messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const roomSwitcher = document.getElementById('room-switcher');
const leaveBtn = document.getElementById('leave-btn');
const notificationsEl = document.getElementById('notifications');
const userListEl = document.getElementById('user-list');

// Initialize the application
function init() {
    socket = io();
    setupEventListeners();
    setupSocketListeners();
}

// Set up DOM event listeners
function setupEventListeners() {
    // Join form
    joinForm.addEventListener('submit', handleJoinRoom);
    
    // Message form
    messageForm.addEventListener('submit', handleSendMessage);
    
    // Room switcher
    roomSwitcher.addEventListener('change', handleRoomSwitch);
    
    // Leave button
    leaveBtn.addEventListener('click', handleLeave);
    
    // Auto-focus username input
    usernameInput.focus();
}

// Set up Socket.IO event listeners
function setupSocketListeners() {
    socket.on('connect', () => {
        console.log('Connected to server');
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        showNotification('Disconnected from server', 'error');
    });
    
    socket.on('room_history', (data) => {
        displayMessages(data.messages);
    });
    
    socket.on('new_message', (data) => {
        appendMessage(data.message);
        scrollToBottom();
    });
    
    socket.on('update_reactions', (data) => {
        updateMessageReactions(data.messageId, data.reactions);
    });
    
    socket.on('user_joined', (data) => {
        showSystemMessage(`${data.user} joined the room`);
    });
    
    socket.on('user_left', (data) => {
        showSystemMessage(`${data.user} left the room`);
    });
    
    socket.on('user_list_update', (data) => {
        renderUsers(data.users);
    });
}

// Handle joining a room
function handleJoinRoom(e) {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    const room = roomSelect.value;
    
    if (!username || !room) {
        showNotification('Please enter a username and select a room', 'error');
        return;
    }
    
    currentUser = username;
    currentRoom = room;
    
    // Update UI
    currentUserEl.textContent = username;
    currentRoomEl.textContent = `💬 ${room}`;
    roomSwitcher.value = room;
    
    // Join room
    socket.emit('join_room', { username, room });
    
    // Switch screens
    joinScreen.classList.add('hidden');
    chatScreen.classList.remove('hidden');
    
    // Focus message input
    messageInput.focus();
    
    showNotification(`Joined ${room} room!`);
}

// Handle sending a message
function handleSendMessage(e) {
    e.preventDefault();
    
    const text = messageInput.value.trim();
    if (!text) return;
    
    socket.emit('send_message', {
        room: currentRoom,
        username: currentUser,
        text: text
    });
    
    messageInput.value = '';
    messageInput.focus();
}

// Handle room switching
function handleRoomSwitch(e) {
    const newRoom = e.target.value;
    if (newRoom === currentRoom) return;
    
    // Leave current room
    socket.emit('leave_room', {
        username: currentUser,
        room: currentRoom
    });
    
    // Join new room
    currentRoom = newRoom;
    socket.emit('join_room', {
        username: currentUser,
        room: newRoom
    });
    
    // Update UI
    currentRoomEl.textContent = `💬 ${newRoom}`;
    messagesContainer.innerHTML = '';
    reactedMessages.clear();
    
    showNotification(`Switched to ${newRoom} room!`);
}

// Handle leaving the chat
function handleLeave() {
    if (currentRoom) {
        socket.emit('leave_room', {
            username: currentUser,
            room: currentRoom
        });
    }
    
    // Reset state
    currentUser = '';
    currentRoom = '';
    reactedMessages.clear();
    messagesContainer.innerHTML = '';
    userListEl.innerHTML = ''; // Clear user list
    usernameInput.value = '';
    roomSelect.value = '';
    
    // Switch screens
    chatScreen.classList.add('hidden');
    joinScreen.classList.remove('hidden');
    
    usernameInput.focus();
    showNotification('Left the chat room');
}

// Display message history
function displayMessages(messages) {
    messagesContainer.innerHTML = '';
    messages.forEach(message => appendMessage(message));
    scrollToBottom();
}

// Append a single message to the chat
function appendMessage(message) {
    const messageEl = createMessageElement(message);
    messagesContainer.appendChild(messageEl);
}

// Create a message DOM element
function createMessageElement(message) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message';
    messageEl.dataset.messageId = message.id;
    
    const time = new Date(message.timestamp * 1000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    messageEl.innerHTML = `
        <div class="message-header">
            <span class="message-user">${escapeHtml(message.user)}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-text">${escapeHtml(message.text)}</div>
        <div class="emoji-picker">
            ${EMOJIS.map(emoji => 
                `<button class="emoji-btn" data-emoji="${emoji}" data-message-id="${message.id}">${emoji}</button>`
            ).join('')}
        </div>
        <div class="message-reactions">
            ${createReactionsHtml(message.reactions)}
        </div>
    `;
    
    // Add event listeners to emoji buttons
    const emojiButtons = messageEl.querySelectorAll('.emoji-btn');
    emojiButtons.forEach(btn => {
        btn.addEventListener('click', handleEmojiClick);
    });
    
    return messageEl;
}

// Create reactions HTML
function createReactionsHtml(reactions) {
    return Object.entries(reactions)
        .filter(([emoji, count]) => count > 0)
        .map(([emoji, count]) => `
            <div class="reaction">
                <span class="reaction-emoji">${emoji}</span>
                <span class="reaction-count">${count}</span>
            </div>
        `).join('');
}

// Handle emoji button clicks
function handleEmojiClick(e) {
    const emoji = e.target.dataset.emoji;
    const messageId = e.target.dataset.messageId;
    
    // Simple prevention of double reactions (client-side only)
    const reactionKey = `${messageId}-${emoji}`;
    if (reactedMessages.has(reactionKey)) {
        showNotification('You already reacted with that emoji!', 'error');
        return;
    }
    
    socket.emit('add_reaction', {
        messageId: messageId,
        emoji: emoji,
        room: currentRoom
    });
    
    reactedMessages.add(reactionKey);
}

// Update message reactions in real-time
function updateMessageReactions(messageId, reactions) {
    const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageEl) return;
    
    const reactionsContainer = messageEl.querySelector('.message-reactions');
    reactionsContainer.innerHTML = createReactionsHtml(reactions);
}

// Render active users in sidebar
function renderUsers(users) {
    userListEl.innerHTML = '';
    
    if (users.length === 0) {
        const emptyMsg = document.createElement('li');
        emptyMsg.textContent = 'No users online';
        emptyMsg.style.color = 'var(--text-light)';
        emptyMsg.style.fontStyle = 'italic';
        userListEl.appendChild(emptyMsg);
        return;
    }
    
    users.forEach(username => {
        const userEl = document.createElement('li');
        userEl.textContent = username;
        
        // Highlight current user
        if (username === currentUser) {
            userEl.classList.add('current-user');
        }
        
        userListEl.appendChild(userEl);
    });
}

// Show system messages
function showSystemMessage(text) {
    const systemMsg = document.createElement('div');
    systemMsg.className = 'system-message';
    systemMsg.textContent = text;
    messagesContainer.appendChild(systemMsg);
    scrollToBottom();
}

// Show notifications
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notificationsEl.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.parentElement.removeChild(notification);
        }
    }, 3000);
}

// Scroll messages to bottom
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Handle Enter key in message input
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage(e);
    }
});

// Handle Enter key in username input
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        if (roomSelect.value) {
            handleJoinRoom(e);
        } else {
            roomSelect.focus();
        }
    }
});

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
