import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';
import bcrypt from 'bcryptjs';
import User, { IUser } from './models/User';
import Message, { IMessage } from './models/Message';
import MessageRequest, { IMessageRequest } from './models/MessageRequest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://nirjari24_db_user:d4D3yahgyg1FZcpg@cluster0.sehzw9g.mongodb.net/chatgroup?appName=Cluster0';

// Middleware
app.use(cors());
app.use(express.json());

// Create HTTP server and initialize Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT']
  }
});

// Map to track connected users and their socket IDs: username (lowercase) -> Set<socket.id>
// Supports multiple devices logged in under the same account simultaneously
const userSocketMap = new Map<string, Set<string>>();

// Helper: emit to ALL sockets belonging to a user (multi-device support)
const emitToUser = (username: string, event: string, data: any) => {
  const sockets = userSocketMap.get(username.trim().toLowerCase());
  if (sockets && sockets.size > 0) {
    sockets.forEach(socketId => io.to(socketId).emit(event, data));
    return true;
  }
  return false;
};

let mongoMemoryInstance: MongoMemoryServer | null = null;

// Database Connection
const connectDB = async () => {
  const dbUri = process.env.MONGODB_URI || 'mongodb+srv://nirjari24_db_user:d4D3yahgyg1FZcpg@cluster0.sehzw9g.mongodb.net/chatgroup?appName=Cluster0';
  
  try {
    console.log(`Connecting to MongoDB at: ${dbUri}`);
    await mongoose.connect(dbUri, { serverSelectionTimeoutMS: 2000 });
    console.log('Connected to MongoDB Atlas / Database');
  } catch (err: any) {
    console.warn('MongoDB connection error:', err.message);
    console.log('Attempting to start a persistent in-memory MongoDB server as fallback...');
    
    try {
      const dbPersistPath = path.join(__dirname, '../db_persist');
      if (!fs.existsSync(dbPersistPath)) {
        fs.mkdirSync(dbPersistPath, { recursive: true });
      }
      
      mongoMemoryInstance = await MongoMemoryServer.create({
        instance: {
          dbPath: dbPersistPath,
          storageEngine: 'wiredTiger'
        }
      });
      const inMemoryUri = mongoMemoryInstance.getUri();
      console.log(`Starting persistent MongoDB server at: ${inMemoryUri} with dbPath: ${dbPersistPath}`);
      await mongoose.connect(inMemoryUri);
      console.log('Connected to Persistent MongoMemoryServer Database!');
    } catch (memErr: any) {
      console.error('Failed to start persistent MongoDB fallback server:', memErr.message);
      console.log('Falling back to volatile ephemeral MongoMemoryServer...');
      try {
        mongoMemoryInstance = await MongoMemoryServer.create();
        const inMemoryUri = mongoMemoryInstance.getUri();
        await mongoose.connect(inMemoryUri);
        console.log('Connected to Volatile Ephemeral MongoDB Database!');
      } catch (ephErr: any) {
        console.error('Critical: Failed to start any MongoDB server:', ephErr.message);
      }
    }
  }
};

connectDB();

// Handle graceful shutdown to release database locks
// Triggering restart to test persistent DB fallback
const cleanup = async () => {
  console.log('Cleaning up database connections...');
  if (mongoMemoryInstance) {
    await mongoMemoryInstance.stop();
  }
  await mongoose.disconnect();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Socket.io Real-time Logic
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // When a user joins and declares their username
  socket.on('join', (username: string) => {
    if (username) {
      const normalized = username.trim().toLowerCase();
      // Add to the Set of sockets for this user (multi-device support)
      if (!userSocketMap.has(normalized)) {
        userSocketMap.set(normalized, new Set());
      }
      userSocketMap.get(normalized)!.add(socket.id);
      console.log(`Mapped user: ${normalized} -> socket: ${socket.id} (total devices: ${userSocketMap.get(normalized)!.size})`);

      // Broadcast online status
      socket.broadcast.emit('userStatus', { username: username.trim(), status: 'online' });
    }
  });

  // When a user sends a message in real-time
  socket.on('sendMessage', async (data: {
    sender: string;
    recipient: string;
    text: string;
    imageUrl?: string;
    time: string;
  }) => {
    const { sender, recipient, text, imageUrl, time } = data;
    if (!sender || !recipient) return;

    try {
      // Save message to MongoDB Atlas
      const message = new Message({
        sender,
        recipient,
        text,
        imageUrl,
        time,
        status: 'sent'
      });
      await message.save();

      const formatted = {
        id: message._id.toString(),
        sender: message.sender,
        recipient: message.recipient,
        text: message.text,
        imageUrl: message.imageUrl,
        time: message.time,
        status: message.status
      };

      // Confirm to sender
      socket.emit('messageAck', formatted);

      // Deliver to ALL recipient devices if online (multi-device support)
      emitToUser(recipient, 'newMessage', formatted);
      // Also deliver to all sender's other devices for sync
      const senderSockets = userSocketMap.get(sender.trim().toLowerCase());
      if (senderSockets) {
        senderSockets.forEach(sid => {
          if (sid !== socket.id) io.to(sid).emit('messageAck', formatted);
        });
      }
      console.log(`Realtime: Relayed message from ${sender} to ${recipient}`);
    } catch (err: any) {
      console.error('Error handling socket sendMessage:', err);
    }
  });

  // Relay typing indicators
  socket.on('typing', (data: { from: string; to: string; isTyping: boolean }) => {
    const { from, to, isTyping } = data;
    emitToUser(to, 'typing', { from, isTyping });
  });

  // Relay WebRTC calling events
  socket.on('callUser', (data: { to: string; from: string; offer: any; callType: 'audio' | 'video' }) => {
    const { to, from, offer, callType } = data;
    const sent = emitToUser(to, 'incomingCall', { from, offer, callType });
    if (sent) {
      console.log(`Call Signaling: Relayed call offer from ${from} to ${to} (${callType})`);
    } else {
      socket.emit('callError', { message: `${to} is offline.` });
    }
  });

  socket.on('answerCall', (data: { to: string; answer: any }) => {
    const { to, answer } = data;
    emitToUser(to, 'callAnswered', { answer });
    console.log(`Call Signaling: Relayed call answer to ${to}`);
  });

  socket.on('iceCandidate', (data: { to: string; candidate: any }) => {
    const { to, candidate } = data;
    emitToUser(to, 'iceCandidate', { candidate });
  });

  socket.on('endCall', (data: { to: string }) => {
    const { to } = data;
    emitToUser(to, 'endCall', {});
    console.log(`Call Signaling: Relayed endCall to ${to}`);
  });

  // Message Requests signaling relay
  socket.on('sendRequest', (data: { id: string; sender: string; recipient: string; status: 'pending' | 'accepted' | 'declined' }) => {
    const { recipient } = data;
    emitToUser(recipient, 'incomingRequest', data);
    console.log(`Socket Request: Relayed incoming request from ${data.sender} to ${recipient}`);
  });

  socket.on('updateRequest', (data: { id: string; sender: string; recipient: string; status: 'pending' | 'accepted' | 'declined' }) => {
    const { sender } = data;
    emitToUser(sender, 'requestUpdated', data);
    console.log(`Socket Request: Relayed request update for ${sender} from ${data.recipient}`);
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    for (const [username, socketSet] of userSocketMap.entries()) {
      if (socketSet.has(socket.id)) {
        socketSet.delete(socket.id);
        console.log(`Removed socket ${socket.id} from user: ${username} (remaining devices: ${socketSet.size})`);
        if (socketSet.size === 0) {
          // Only mark offline if NO more devices connected
          userSocketMap.delete(username);
          socket.broadcast.emit('userStatus', { username, status: 'offline' });
          console.log(`User fully offline: ${username}`);
        }
        break;
      }
    }
  });
});

// REST Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to the ChatGroup API' });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', dbStatus: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED', timestamp: new Date() });
});

// USERS REST API
// Register a new user
app.post('/api/users/register', async (req: Request, res: Response): Promise<any> => {
  const { username: requestedUsername, email, password, avatarUrl, category, bio } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const username = (requestedUsername && requestedUsername.trim()) || email.trim().split('@')[0];
  if (!username) {
    return res.status(400).json({ error: 'Invalid username or email address' });
  }

  if (!email.trim().toLowerCase().endsWith('@gmail.com')) {
    return res.status(400).json({ error: 'Only Gmail addresses are allowed to register.' });
  }

  try {
    // Check if email already exists
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Check if username already exists (case-insensitive)
    const existingUsername = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = new User({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
      category: category || 'MEMBER',
      bio: bio || "Joined ChatGroup. Let's communicate in real-time."
    });
    await user.save();
    
    const responseUser = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      category: user.category,
      bio: user.bio,
      statusText: user.statusText
    };

    console.log(`Registered new user: ${user.username} (${user.email})`);
    res.json(responseUser);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Log in an existing user
app.post('/api/users/login', async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const loginIdentifier = email.trim();
    const user = await User.findOne({
      $or: [
        { email: loginIdentifier.toLowerCase() },
        { username: { $regex: new RegExp(`^${loginIdentifier}$`, 'i') } }
      ]
    });
    if (!user) {
      console.log(`[AUTH] Failed login: User not found for identifier "${loginIdentifier}"`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = bcrypt.compareSync(password.trim(), user.password);
    if (!isMatch) {
      console.log(`[AUTH] Failed login: Incorrect password "${password}" for user "${user.username}" (email: ${user.email})`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const responseUser = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      category: user.category,
      bio: user.bio,
      statusText: user.statusText
    };

    console.log(`User logged in: ${user.username} (${user.email})`);
    res.json(responseUser);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const users = await User.find({ email: /@gmail\.com$/i });
    // Exclude password hashes when listing users
    const safeUsers = users.map(user => ({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      category: user.category,
      bio: user.bio,
      statusText: user.statusText
    }));
    res.json(safeUsers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update user profile
app.put('/api/users/profile', async (req: Request, res: Response): Promise<any> => {
  const { email, bio, avatarUrl } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required to identify user profile' });
  }

  try {
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $set: { bio, avatarUrl } },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const responseUser = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      category: user.category,
      bio: user.bio,
      statusText: user.statusText
    };
    
    res.json(responseUser);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// MESSAGES REST API
// Get message history between two users
app.get('/api/messages', async (req: Request, res: Response): Promise<any> => {
  const { user1, user2 } = req.query;
  if (!user1 || !user2) {
    return res.status(400).json({ error: 'user1 and user2 query parameters are required' });
  }

  try {
    const messages = await Message.find({
      $or: [
        { sender: user1, recipient: user2 },
        { sender: user2, recipient: user1 }
      ]
    }).sort({ createdAt: 1 });
    
    const formattedMessages = messages.map(msg => ({
      id: msg._id.toString(),
      sender: msg.sender,
      recipient: msg.recipient,
      text: msg.text,
      imageUrl: msg.imageUrl,
      time: msg.time,
      status: msg.status
    }));

    res.json(formattedMessages);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save a new message (Fallback REST endpoint)
app.post('/api/messages', async (req: Request, res: Response): Promise<any> => {
  const { sender, recipient, text, imageUrl, time, status } = req.body;
  if (!sender || !recipient) {
    return res.status(400).json({ error: 'Sender and recipient are required' });
  }

  try {
    const message = new Message({
      sender,
      recipient,
      text,
      imageUrl,
      time,
      status: status || 'sent'
    });
    await message.save();
    
    const formatted = {
      id: message._id.toString(),
      sender: message.sender,
      recipient: message.recipient,
      text: message.text,
      imageUrl: message.imageUrl,
      time: message.time,
      status: message.status
    };

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Mark messages as read
app.put('/api/messages/read', async (req: Request, res: Response): Promise<any> => {
  const { sender, recipient } = req.body;
  if (!sender || !recipient) {
    return res.status(400).json({ error: 'sender and recipient are required' });
  }

  try {
    await Message.updateMany(
      { sender, recipient, status: { $ne: 'read' } },
      { $set: { status: 'read' } }
    );
    
    // Notify the sender in real-time that recipient has read their messages
    emitToUser(sender, 'messagesRead', { reader: recipient });
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// MESSAGE REQUESTS REST API
// Get all requests involving a user
app.get('/api/requests', async (req: Request, res: Response): Promise<any> => {
  const { user } = req.query;
  if (!user) {
    return res.status(400).json({ error: 'user query parameter is required' });
  }

  try {
    const requests = await MessageRequest.find({
      $or: [
        { sender: user },
        { recipient: user }
      ]
    });
    
    res.json(requests.map(reqDoc => ({
      id: reqDoc._id.toString(),
      sender: reqDoc.sender,
      recipient: reqDoc.recipient,
      status: reqDoc.status
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new request
app.post('/api/requests', async (req: Request, res: Response): Promise<any> => {
  const { sender, recipient } = req.body;
  if (!sender || !recipient) {
    return res.status(400).json({ error: 'sender and recipient are required' });
  }

  try {
    // Check if a request already exists in either direction
    const existing = await MessageRequest.findOne({
      $or: [
        { sender, recipient },
        { sender: recipient, recipient: sender }
      ]
    });

    if (existing) {
      return res.status(400).json({ error: 'A message request already exists between these users' });
    }

    const newReq = new MessageRequest({
      sender,
      recipient,
      status: 'pending'
    });
    await newReq.save();

    res.json({
      id: newReq._id.toString(),
      sender: newReq.sender,
      recipient: newReq.recipient,
      status: newReq.status
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update request status (Accept or Decline)
app.put('/api/requests', async (req: Request, res: Response): Promise<any> => {
  const { requestId, status } = req.body;
  if (!requestId || !status) {
    return res.status(400).json({ error: 'requestId and status are required' });
  }

  if (!['accepted', 'declined', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    const updated = await MessageRequest.findByIdAndUpdate(
      requestId,
      { $set: { status } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Message request not found' });
    }

    res.json({
      id: updated._id.toString(),
      sender: updated.sender,
      recipient: updated.recipient,
      status: updated.status
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
  
  // Log local network IP addresses for mobile devices
  const os = require('os');
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`📡 [network]: Accessible on LAN at http://${net.address}:${PORT}`);
      }
    }
  }
});
