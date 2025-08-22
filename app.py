from flask import Flask, send_from_directory, request
from flask_socketio import SocketIO, emit, join_room, leave_room
import uuid
import time

app = Flask(__name__, static_folder="static")
app.config['SECRET_KEY'] = 'your-secret-key-here'
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# In-memory data storage
rooms = {
    "General": [],
    "Random": [],
    "Tech": []
}

# Store connected users per room
room_users = {
    "General": set(),
    "Random": set(),
    "Tech": set()
}

# Track session ID to username and room mapping
connected_sids = {}  # sid -> {'username': str, 'room': str}

def broadcast_user_list(room):
    """Helper function to broadcast updated user list to a room"""
    users = list(room_users[room])
    socketio.emit('user_list_update', {'users': users}, room=room)

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@socketio.on('join_room')
def handle_join_room(data):
    username = data['username']
    room = data['room']
    sid = request.sid
    
    # Track this session
    connected_sids[sid] = {'username': username, 'room': room}
    
    # Join the room
    join_room(room)
    room_users[room].add(username)
    
    # Send message history to the user
    emit('room_history', {'messages': rooms[room]})
    
    # Send current user list to the new user
    users = list(room_users[room])
    emit('user_list_update', {'users': users})
    
    # Notify others in the room
    emit('user_joined', {'user': username}, room=room, include_self=False)
    
    # Broadcast updated user list to everyone in the room
    broadcast_user_list(room)
    
    print(f"{username} joined {room}")

@socketio.on('leave_room')
def handle_leave_room(data):
    username = data['username']
    room = data['room']
    sid = request.sid
    
    leave_room(room)
    room_users[room].discard(username)
    
    # Update session tracking
    if sid in connected_sids:
        del connected_sids[sid]
    
    # Notify others in the room
    emit('user_left', {'user': username}, room=room, include_self=False)
    
    # Broadcast updated user list
    broadcast_user_list(room)
    
    print(f"{username} left {room}")

@socketio.on('send_message')
def handle_send_message(data):
    room = data['room']
    username = data['username']
    text = data['text']
    
    # Create message object
    message = {
        'id': str(uuid.uuid4()),
        'user': username,
        'text': text,
        'timestamp': int(time.time()),
        'reactions': {'👍': 0, '❤️': 0, '😂': 0, '😮': 0, '😢': 0, '😡': 0}
    }
    
    # Add to room history
    rooms[room].append(message)
    
    # Broadcast to all users in the room
    emit('new_message', {'message': message}, room=room)
    
    print(f"Message from {username} in {room}: {text}")

@socketio.on('add_reaction')
def handle_add_reaction(data):
    message_id = data['messageId']
    emoji = data['emoji']
    room = data['room']
    
    # Find the message in the room
    for message in rooms[room]:
        if message['id'] == message_id:
            if emoji in message['reactions']:
                message['reactions'][emoji] += 1
                
                # Broadcast updated reactions to all users in the room
                emit('update_reactions', {
                    'messageId': message_id,
                    'reactions': message['reactions']
                }, room=room)
                
                print(f"Reaction {emoji} added to message {message_id}")
                break

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    print(f'Client disconnected: {sid}')
    
    # Clean up user from session tracking
    if sid in connected_sids:
        user_info = connected_sids[sid]
        username = user_info['username']
        room = user_info['room']
        
        # Remove user from room
        room_users[room].discard(username)
        
        # Notify others in the room
        socketio.emit('user_left', {'user': username}, room=room)
        
        # Broadcast updated user list
        broadcast_user_list(room)
        
        # Clean up session tracking
        del connected_sids[sid]
        
        print(f"{username} disconnected from {room}")

if __name__ == '__main__':
    print("Starting Chat Server on http://localhost:3000")
    socketio.run(app, host='0.0.0.0', port=3000, debug=True)
