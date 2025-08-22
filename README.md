# 🚀 Real-Time Chat Rooms with Emoji Reactions

A modern real-time chat application built with Flask, Socket.IO, and vanilla JavaScript. Features multiple chat rooms, real-time messaging, and emoji reactions.

## ✨ Features

- **Real-time messaging** - Messages appear instantly across all connected users
- **Multiple chat rooms** - General, Random, and Tech rooms available
- **Emoji reactions** - React to messages with 👍 ❤️ 😂 😮 😢 😡
- **Room switching** - Seamlessly switch between rooms without reconnecting
- **Responsive design** - Works on desktop and mobile devices
- **User notifications** - See when users join/leave rooms
- **Message history** - View previous messages when joining a room

## 🛠️ Technology Stack

- **Backend**: Python Flask + Flask-SocketIO + Eventlet
- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript
- **Real-time**: WebSockets via Socket.IO
- **Storage**: In-memory (resets on server restart)

## 📁 Project Structure

```
chat-app/
├── app.py                 # Flask + SocketIO server
├── requirements.txt       # Python dependencies
├── static/
│   ├── index.html        # Single-page app HTML
│   ├── styles.css        # Responsive CSS styling
│   └── app.js           # Client-side JavaScript
└── README.md            # This file
```

## 🚀 Getting Started

### Prerequisites

- Python 3.7+
- pip (Python package installer)

### Installation & Setup

1. **Clone or download this project**
2. **Create and activate a virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the server:**
   ```bash
   python app.py
   ```

5. **Open your browser and go to:**
   ```
   http://localhost:3000
   ```

### Usage

1. **Join a Room**: Enter your username and select a chat room
2. **Send Messages**: Type in the input field and press Enter or click Send
3. **React to Messages**: Click emoji buttons below any message
4. **Switch Rooms**: Use the dropdown in the header to change rooms
5. **Leave**: Click the Leave button to return to the join screen

## 🎮 Testing the App

1. **Open multiple browser tabs** to `http://localhost:3000`
2. **Join the same room** with different usernames
3. **Send messages** and see them appear in real-time
4. **Test emoji reactions** - click emojis and watch counts update
5. **Try room switching** and see message history per room
6. **Test on mobile** - the interface is fully responsive

## 📡 Socket.IO Events

### Client → Server
- `join_room`: Join a chat room
- `leave_room`: Leave current room  
- `send_message`: Send a new message
- `add_reaction`: Add emoji reaction to a message

### Server → Client
- `room_history`: Initial message history when joining
- `new_message`: New message broadcast to room
- `update_reactions`: Real-time reaction count updates
- `user_joined`/`user_left`: User presence notifications

## 🌐 Production Deployment

For production use, replace the development server:

```bash
pip install gunicorn
gunicorn -k eventlet -w 1 app:app --bind 0.0.0.0:3000
```

### Deploy Options:
- **Railway**: `railway up`
- **Render**: Connect your Git repo
- **Heroku**: `git push heroku main`
- **DigitalOcean**: Use App Platform

## 🔧 Customization

### Adding New Rooms
Edit the `rooms` dictionary in `app.py`:
```python
rooms = {
    "General": [],
    "Random": [],
    "Tech": [],
    "YourNewRoom": []  # Add here
}
```

### Adding New Emojis
Edit the `EMOJIS` array in `static/app.js`:
```javascript
const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '⭐'];
```

### Styling
All visual customization can be done in `static/styles.css` using CSS custom properties.

## 🐛 Known Limitations

- **No persistence** - Messages are stored in memory and lost on server restart
- **No authentication** - Anyone can join with any username
- **No message deletion** - Messages cannot be removed once sent
- **Simple reaction prevention** - Users can technically react multiple times by refreshing

## 🎯 Future Enhancements

- Database storage (PostgreSQL/MongoDB)
- User authentication and profiles
- Private messaging
- File/image sharing
- Message deletion/editing
- Admin moderation tools
- Push notifications

## 📄 License

This project is open source and available under the MIT License.

---

**Happy Chatting! 💬**
