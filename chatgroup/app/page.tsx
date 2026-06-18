"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  Save,
  Key,
  CheckCheck,
  Mail,
  Phone,
  Camera,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  Fingerprint,
  Sun,
  Moon,
  ShieldAlert,
  Smartphone,
  Laptop,
  Check,
  AlertTriangle,
  Award
} from "lucide-react";

// Types
interface User {
  id?: string;
  username: string;
  email?: string;
  password?: string;
  avatarUrl: string;
  category?: string;
  bio?: string;
  statusText?: string;
}

interface Message {
  id: string;
  sender: string; // username
  recipient: string; // username
  text: string;
  imageUrl?: string; // for image attachments
  time: string;
  status?: "sent" | "delivered" | "read";
  isNew?: boolean;
}

// Preset Avatars for registration and mock contacts
const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80", // Woman 1
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80", // Man 1
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80", // Woman 2
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80", // Man 2
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&h=150&q=80", // Man 3
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80"  // Woman 3
];

// Default built-in mock contacts based on the user's screenshot
const MOCK_CONTACTS: User[] = [
  {
    id: "mock_ana",
    username: "Ana Malbasa",
    email: "ana@example.com",
    password: "password123",
    avatarUrl: PRESET_AVATARS[0],
    category: "PERSONAL BLOG",
    bio: "Lorem Ipsum Dolor Sit Amet, Consectetur Adipiscing Elit. Donec Sit Amet Nunc Augue. Pellentesque Vel Pellentesque Tellus. Nam Lacinia Leo Sed Eleifend Dignissim.",
    statusText: "Active 5m ago"
  },
  {
    id: "mock_paul",
    username: "Paul Osmand",
    email: "paul@example.com",
    password: "password123",
    avatarUrl: PRESET_AVATARS[1],
    category: "CREATIVE DESIGNER",
    bio: "Passionate about layouts, dark themes, and rich aesthetics. UI developer & animator based in London.",
    statusText: "hahah, nice!"
  },
  {
    id: "mock_edward",
    username: "Edward Davis",
    email: "edward@example.com",
    password: "password123",
    avatarUrl: PRESET_AVATARS[4],
    category: "PHOTOGRAPHER",
    bio: "Capturing moments and cityscapes. Let's grab coffee and share our logs.",
    statusText: "Are we still going for a coffee?"
  },
  {
    id: "mock_naomi",
    username: "Naomi Riste",
    email: "naomi@example.com",
    password: "password123",
    avatarUrl: PRESET_AVATARS[5],
    category: "WRITER",
    bio: "Words shape worlds. Blogging, script-writing, and coffee lover.",
    statusText: "What did your boss say?"
  },
  {
    id: "mock_jonathan",
    username: "Jonathan Blake",
    email: "jonathan@example.com",
    password: "password123",
    avatarUrl: PRESET_AVATARS[3],
    category: "ARTIST",
    bio: "Abstract lines, digital oil paint, and visual animations.",
    statusText: "Sent you some media"
  }
];

const EMOJI_CATEGORIES = [
  { name: "Smileys", icon: "😀", list: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "🥵", "🥶", "😱", "😰", "😥", "😓"] },
  { name: "Love", icon: "❤️", list: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💋", "💌"] },
  { name: "Hands", icon: "👍", list: ["👍", "👎", "👊", "✊", "🤛", "🤜", "🤞", "✌️", "🤟", "🤘", "👌", "🤏", "👈", "👉", "👆", "👇", "👋", "🤚", "🖐️", "✋", "🙏", "👏", "🙌", "👐"] },
  { name: "Nature", icon: "🌸", list: ["🐱", "🐶", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐵", "🐒", "🐔", "🐧", "🐦", "🐤", "🦄", "🐝", "🐛", "🦋", "🌸", "🌹", "🍀", "🍁", "🌲", "🔥", "🌈", "☀️", "🌙"] },
  { name: "Food", icon: "🍕", list: ["🍕", "🍔", "🍟", "🌭", "🍿", "🥞", "🥪", "🥗", "🍣", "🍦", "🍩", "🍪", "🎂", "🍫", "🍬", "🍉", "🍓", "🍇", "🍌", "🍎", "🥑", "☕", "🍺", "🍷"] },
  { name: "Objects", icon: "🎮", list: ["🎮", "👾", "🎨", "🎬", "🎤", "🎧", "💻", "📱", "📷", "💡", "💰", "💵", "📝", "🔑", "🚗", "✈️", "⚽", "🏀", "🏆", "🎁", "🎉", "🎈"] }
];

export default function Home() {
  // Navigation View State
  const [currentView, setCurrentView] = useState("chat"); // "chat" or "settings"

  // Settings Theme
  const [theme, setTheme] = useState<"light" | "dark" | "black">("light"); // "dark", "light", or "black"
  const isDark = theme === "dark" || theme === "black";

  // Account Detail States
  const [name, setName] = useState("Om Gadhiya");
  const [username, setUsername] = useState("om_gadhiya_001");
  const [email, setEmail] = useState("omgadhiya97@gmail.com");
  const [phone, setPhone] = useState("+91 97245 67890");
  const [bio, setBio] = useState("Education | Learning and Building Premium Web Apps 🚀");
  const [avatar, setAvatar] = useState("/om_gadhiya.png");

  // Password Change States
  const [currentPassword, setCurrentPassword] = useState("omgadhiya97@123");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Show/Hide Password States
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Switch tabs in sidebar
  const [activeSection, setActiveSection] = useState("profile"); // "profile", "security"

  // 2FA state
  const [twoFactor, setTwoFactor] = useState(false);

  // Status Alerts
  const [toast, setToast] = useState<string | null>(null);
  const [timeString, setTimeString] = useState("");

  // Chat authentication states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"register" | "login">("register");
  
  // Registration Form States
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState(PRESET_AVATARS[0]);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>(MOCK_CONTACTS);

  // Login Form States
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Google Sign-In states
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [isSigningInWithGoogle, setIsSigningInWithGoogle] = useState(false);
  const [googleCustomEmail, setGoogleCustomEmail] = useState("");

  // Chat window states
  const [activeContact, setActiveContact] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Emoji Picker states
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState("Smileys");
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Right side panel toggles
  const [isDetailPaneOpen, setIsDetailPaneOpen] = useState(true);

  // Online statuses & typing indicator tracking
  const [onlineUsers, setOnlineUsers] = useState<Record<string, "online" | "away" | "offline">>({
    "Ana Malbasa": "online",
    "Paul Osmand": "online",
    "Edward Davis": "online",
    "Naomi Riste": "away",
    "Jonathan Blake": "offline"
  });
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

  // References
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const myTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Time state update for Chat
  const [currentTime, setCurrentTime] = useState("12:37");

  // Synchronized Clock Loop
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      setTimeString(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, "0");
      hours = hours % 12;
      hours = hours ? hours : 12;
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Click outside to close emoji picker
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setIsEmojiPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Audio system triggers
  const playSound = (type: "send" | "receive") => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      if (type === "send") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(950, ctx.currentTime + 0.07);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.07);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.07);
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(620, ctx.currentTime);
        osc.frequency.setValueAtTime(740, ctx.currentTime + 0.06);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch (e) {
      console.warn("Audio Context blocked by browser", e);
    }
  };

  // 1. Initial Load from Local Cache
  useEffect(() => {
    // Load persisted theme
    const savedTheme = localStorage.getItem("chatgroup_theme") as "light" | "dark" | "black" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }

    const savedUser = localStorage.getItem("chatgroup_current_user");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setCurrentUser(parsed);
      
      // Sync settings dashboard states with current user profile
      setName(parsed.username);
      setUsername(parsed.username);
      setBio(parsed.bio || "Available to chat in real-time.");
      setAvatar(parsed.avatarUrl);
    }

    const savedUsersList = localStorage.getItem("chatgroup_registered_users");
    if (savedUsersList) {
      const parsed = JSON.parse(savedUsersList) as User[];
      const combined = [...MOCK_CONTACTS];
      parsed.forEach((u) => {
        if (!combined.some((c) => c.username.toLowerCase() === u.username.toLowerCase())) {
          combined.push(u);
        }
      });
      setRegisteredUsers(combined);
    } else {
      localStorage.setItem("chatgroup_registered_users", JSON.stringify(MOCK_CONTACTS));
    }

    const savedMessages = localStorage.getItem("chatgroup_messages");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      const defaultHistory: Message[] = [
        { id: "h1", sender: "Ana Malbasa", recipient: "Ann", text: "Cool! Don't forget to bring your ice skaters unless you want theirs!", time: "07:43 AM" },
        { id: "h2", sender: "Ann", recipient: "Ana Malbasa", text: "I wish I don't have those bad boys anymore, will use theirs.", time: "07:43 AM", status: "read" },
        { id: "h3", sender: "Ana Malbasa", recipient: "Ann", text: "It's all good! It will go back quick. :)", time: "08:00 AM" },
        { id: "h4", sender: "Ann", recipient: "Ana Malbasa", text: "", imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80", time: "08:00 AM", status: "read" },
        { id: "h5", sender: "Ann", recipient: "Ana Malbasa", text: "Wow! where did you snap that? Looks really nice!", time: "08:04 AM", status: "read" }
      ];
      setMessages(defaultHistory);
      localStorage.setItem("chatgroup_messages", JSON.stringify(defaultHistory));
    }

    setActiveContact(MOCK_CONTACTS[0]);
  }, []);

  // Save theme changes to Local Cache
  useEffect(() => {
    localStorage.setItem("chatgroup_theme", theme);
  }, [theme]);

  // 2. Setup BroadcastChannel for Real-time synchronizations
  useEffect(() => {
    if (!currentUser) return;

    const channel = new BroadcastChannel("chatgroup_realtime");
    channelRef.current = channel;

    const sendHeartbeat = () => {
      channel.postMessage({
        type: "HEARTBEAT",
        username: currentUser.username,
        avatarUrl: currentUser.avatarUrl
      });
    };
    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 3000);

    const onlineTimerMap: Record<string, NodeJS.Timeout> = {};

    channel.onmessage = (event) => {
      const data = event.data;
      if (!data) return;

      switch (data.type) {
        case "HEARTBEAT":
          setOnlineUsers((prev) => ({ ...prev, [data.username]: "online" }));
          
          if (onlineTimerMap[data.username]) {
            clearTimeout(onlineTimerMap[data.username]);
          }
          onlineTimerMap[data.username] = setTimeout(() => {
            setOnlineUsers((prev) => ({ ...prev, [data.username]: "offline" }));
          }, 8000);

          setRegisteredUsers((prev) => {
            if (prev.some((u) => u.username.toLowerCase() === data.username.toLowerCase())) {
              // Update user avatar/info if it changes in settings
              return prev.map(u => u.username.toLowerCase() === data.username.toLowerCase() ? { ...u, avatarUrl: data.avatarUrl } : u);
            }
            const newList = [...prev, { username: data.username, avatarUrl: data.avatarUrl, category: "MEMBER", bio: "Available to chat in real-time." }];
            localStorage.setItem("chatgroup_registered_users", JSON.stringify(newList));
            return newList;
          });
          break;

        case "USER_REGISTER":
          setRegisteredUsers((prev) => {
            const index = prev.findIndex(u => u.username.toLowerCase() === data.user.username.toLowerCase());
            let newList = [...prev];
            if (index > -1) {
              newList[index] = data.user;
            } else {
              newList.push(data.user);
            }
            localStorage.setItem("chatgroup_registered_users", JSON.stringify(newList));
            return newList;
          });
          setOnlineUsers((prev) => ({ ...prev, [data.user.username]: "online" }));
          break;

        case "MSG":
          if (data.to === currentUser.username || data.from === currentUser.username) {
            const newMsg: Message = data.msg;
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              const nextMsgs = [...prev, newMsg];
              localStorage.setItem("chatgroup_messages", JSON.stringify(nextMsgs));
              return nextMsgs;
            });
            
            if (data.from !== currentUser.username) {
              playSound("receive");
              if (activeContact && activeContact.username === data.from) {
                channel.postMessage({
                  type: "READ_RECEIPT",
                  msgId: newMsg.id,
                  reader: currentUser.username,
                  sender: data.from
                });
              }
            }
            setTimeout(() => scrollToBottom("smooth"), 50);
          }
          break;

        case "READ_RECEIPT":
          if (data.sender === currentUser.username) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === data.msgId ? { ...msg, status: "read" } : msg
              )
            );
          }
          break;

        case "TYPING":
          if (data.to === currentUser.username) {
            setTypingUsers((prev) => ({ ...prev, [data.from]: data.isTyping }));
            
            if (data.isTyping) {
              if (typingTimeoutRef.current[data.from]) {
                clearTimeout(typingTimeoutRef.current[data.from]);
              }
              typingTimeoutRef.current[data.from] = setTimeout(() => {
                setTypingUsers((prev) => ({ ...prev, [data.from]: false }));
              }, 4000);
            }
          }
          break;

        default:
          break;
      }
    };

    return () => {
      clearInterval(heartbeatInterval);
      channel.close();
      Object.values(onlineTimerMap).forEach(clearTimeout);
    };
  }, [currentUser, activeContact]);

  // Handle local user keystroke relays for typing animations
  const handleUserTyping = (textLength: number) => {
    if (!channelRef.current || !currentUser || !activeContact) return;

    channelRef.current.postMessage({
      type: "TYPING",
      from: currentUser.username,
      to: activeContact.username,
      isTyping: textLength > 0
    });

    if (myTypingTimeoutRef.current) {
      clearTimeout(myTypingTimeoutRef.current);
    }

    if (textLength > 0) {
      myTypingTimeoutRef.current = setTimeout(() => {
        if (channelRef.current && currentUser && activeContact) {
          channelRef.current.postMessage({
            type: "TYPING",
            from: currentUser.username,
            to: activeContact.username,
            isTyping: false
          });
        }
      }, 2500);
    }
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Submit registration form
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername.trim() || !regEmail.trim() || !regPassword) {
      setToast("Please fill in all registration fields! ❌");
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const newUser: User = {
      id: "u_" + Math.random().toString(36).substr(2, 9),
      username: regUsername.trim(),
      email: regEmail.trim().toLowerCase(),
      password: regPassword,
      avatarUrl: selectedAvatarUrl,
      category: "MEMBER",
      bio: "Joined ChatGroup. Let's communicate in real-time."
    };

    // Check if duplicate of exact (username, email, password) already exists
    const duplicate = registeredUsers.some(
      (u) =>
        u.username.toLowerCase() === newUser.username.toLowerCase() &&
        u.email?.toLowerCase() === newUser.email?.toLowerCase() &&
        u.password === newUser.password
    );

    if (duplicate) {
      setToast("An account with this username, email and password already exists! ❌");
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setCurrentUser(newUser);
    localStorage.setItem("chatgroup_current_user", JSON.stringify(newUser));

    // Sync settings dashboard profiles
    setName(newUser.username);
    setUsername(newUser.username.toLowerCase().replace(/\s+/g, "_"));
    setAvatar(newUser.avatarUrl);
    setBio(newUser.bio || "");
    setEmail(newUser.email || "");
    setCurrentPassword(newUser.password || "");

    setRegisteredUsers((prev) => {
      const nextList = [...prev, newUser];
      localStorage.setItem("chatgroup_registered_users", JSON.stringify(nextList));
      return nextList;
    });

    const channel = new BroadcastChannel("chatgroup_realtime");
    channel.postMessage({
      type: "USER_REGISTER",
      user: newUser
    });
    channel.close();

    setToast("Account registered successfully! Welcome. 🎉");
    setTimeout(() => setToast(null), 3000);

    // Clear registration fields
    setRegUsername("");
    setRegEmail("");
    setRegPassword("");
  };

  // Submit login form
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword) {
      setToast("Please fill in all login fields! ❌");
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const identifier = loginIdentifier.trim().toLowerCase();

    // Query registeredUsers for an account with matching (username OR email) AND matching password
    const matchedUser = registeredUsers.find(
      (u) =>
        (u.username.toLowerCase() === identifier || u.email?.toLowerCase() === identifier) &&
        u.password === loginPassword
    );

    if (matchedUser) {
      setCurrentUser(matchedUser);
      localStorage.setItem("chatgroup_current_user", JSON.stringify(matchedUser));

      // Sync settings dashboard profiles
      setName(matchedUser.username);
      setUsername(matchedUser.username.toLowerCase().replace(/\s+/g, "_"));
      setAvatar(matchedUser.avatarUrl);
      setBio(matchedUser.bio || "");
      if (matchedUser.email) setEmail(matchedUser.email);
      if (matchedUser.password) setCurrentPassword(matchedUser.password);

      setToast(`Logged in as ${matchedUser.username}! Welcome back. 👋`);
      setTimeout(() => setToast(null), 3000);

      // Clear login fields
      setLoginIdentifier("");
      setLoginPassword("");
    } else {
      setToast("Invalid username/email or password! ❌");
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Google ID Sign-in handler
  const handleGoogleSignIn = (gUsername: string, emailStr: string, avatarUrlStr: string) => {
    setIsSigningInWithGoogle(true);

    // Simulate minor network delay for OAuth realism
    setTimeout(() => {
      const newUser: User = {
        id: "google_" + Math.random().toString(36).substr(2, 9),
        username: gUsername.trim(),
        email: emailStr,
        password: "google_oauth",
        avatarUrl: avatarUrlStr,
        category: "MEMBER",
        bio: `Logged in via Google (${emailStr}).`
      };

      setCurrentUser(newUser);
      localStorage.setItem("chatgroup_current_user", JSON.stringify(newUser));

      // Sync settings dashboard profiles
      setName(newUser.username);
      setUsername(newUser.username.toLowerCase().replace(/\s+/g, "_"));
      setAvatar(newUser.avatarUrl);
      setBio(newUser.bio || "");
      setEmail(emailStr);
      setCurrentPassword("google_oauth");

      setRegisteredUsers((prev) => {
        const exists = prev.some((u) => u.username.toLowerCase() === newUser.username.toLowerCase() && u.email?.toLowerCase() === emailStr.toLowerCase());
        if (exists) return prev;
        const nextList = [...prev, newUser];
        localStorage.setItem("chatgroup_registered_users", JSON.stringify(nextList));
        return nextList;
      });

      const channel = new BroadcastChannel("chatgroup_realtime");
      channel.postMessage({
        type: "USER_REGISTER",
        user: newUser
      });
      channel.close();

      setIsSigningInWithGoogle(false);
      setIsGoogleModalOpen(false);

      // Trigger success toast
      setToast("Signed in with Google successfully! 🛡️");
      setTimeout(() => setToast(null), 3000);
    }, 1200);
  };

  // Send message submit
  const handleSendMessage = (textToSend = inputText, imageLink?: string) => {
    const textContent = textToSend.trim();
    if (!textContent && !imageLink) return;
    if (!currentUser || !activeContact) return;

    const timeStringVal = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });

    const newMsg: Message = {
      id: Math.random().toString(36).substring(2, 9),
      sender: currentUser.username,
      recipient: activeContact.username,
      text: textContent,
      imageUrl: imageLink,
      time: timeStringVal,
      status: "sent",
      isNew: true
    };

    setMessages((prev) => {
      const nextMsgs = [...prev, newMsg];
      localStorage.setItem("chatgroup_messages", JSON.stringify(nextMsgs));
      return nextMsgs;
    });

    setInputText("");
    playSound("send");
    setTimeout(() => scrollToBottom("smooth"), 50);

    if (myTypingTimeoutRef.current) {
      clearTimeout(myTypingTimeoutRef.current);
    }
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: "TYPING",
        from: currentUser.username,
        to: activeContact.username,
        isTyping: false
      });
      channelRef.current.postMessage({
        type: "MSG",
        msg: newMsg,
        from: currentUser.username,
        to: activeContact.username
      });
    }

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMsg.id ? { ...msg, status: "delivered" } : msg
        )
      );
    }, 1000);

    const isMock = MOCK_CONTACTS.some((c) => c.username === activeContact.username);
    const isOffline = onlineUsers[activeContact.username] === "offline" || !onlineUsers[activeContact.username];
    if (isMock && isOffline) {
      triggerMockResponse(activeContact.username);
    }
  };

  // Simulated responses for offline directory contacts
  const triggerMockResponse = (contactName: string) => {
    setTimeout(() => {
      setTypingUsers((prev) => ({ ...prev, [contactName]: true }));
      setTimeout(() => scrollToBottom("smooth"), 50);

      setTimeout(() => {
        const replies = [
          "Cool! I'll double check my schedules.",
          "Awesome. Send me the media logs when you've got them.",
          "It's a gorgeous photo, where was it taken?",
          "Sure thing, talk to you later tonight!",
          "Yes! Let's get together soon."
        ];
        const text = replies[Math.floor(Math.random() * replies.length)];
        const timeStringVal = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        });

        const replyMessage: Message = {
          id: Math.random().toString(36).substring(2, 9),
          sender: contactName,
          recipient: currentUser?.username || "Ann",
          text,
          time: timeStringVal,
          isNew: true
        };

        setMessages((prev) => {
          const next = [...prev, replyMessage];
          localStorage.setItem("chatgroup_messages", JSON.stringify(next));
          return next;
        });

        setTypingUsers((prev) => ({ ...prev, [contactName]: false }));
        playSound("receive");
        setTimeout(() => scrollToBottom("smooth"), 50);
      }, 2000);
    }, 1500);
  };

  // Mock attachment click: triggers a gorgeous nature photography message send
  const handleSendMockImage = () => {
    if (!currentUser || !activeContact) return;
    const mockImageUrls = [
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1472214222555-d404758b1c42?auto=format&fit=crop&w=400&q=80"
    ];
    const chosenImage = mockImageUrls[Math.floor(Math.random() * mockImageUrls.length)];
    handleSendMessage("", chosenImage);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveContact(MOCK_CONTACTS[0]);
    localStorage.removeItem("chatgroup_current_user");
  };

  // Filters messages for selected user
  const conversationMessages = messages.filter(
    (msg) =>
      currentUser &&
      activeContact &&
      ((msg.sender === currentUser.username && msg.recipient === activeContact.username) ||
        (msg.sender === activeContact.username && msg.recipient === currentUser.username))
  );

  // Filters contacts list for sidebar search
  const filteredContacts = registeredUsers.filter(
    (u) =>
      currentUser &&
      u.username.toLowerCase() !== currentUser.username.toLowerCase() &&
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get last message info for sidebar preview
  const getLastMessage = (userParam: string) => {
    const thread = messages.filter(
      (m) =>
        currentUser &&
        ((m.sender === currentUser.username && m.recipient === userParam) ||
          (m.sender === userParam && m.recipient === currentUser.username))
    );
    return thread[thread.length - 1];
  };

  const renderCheckmarks = (status: "sent" | "delivered" | "read") => {
    const color = status === "read" ? "text-emerald-500" : "text-slate-400";
    return (
      <svg
        className={`w-3.5 h-3.5 inline ml-1 ${color} transition-colors duration-300`}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25l6-6 4.5-4.5" />
      </svg>
    );
  };

  // Password Complexity Calculation
  const hasMinLength = newPassword.length >= 8;
  const hasCapital = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

  const getSecurityScore = () => {
    let score = 50;
    if (twoFactor) score += 20;
    if (currentPassword.length >= 10) score += 10;
    if (name && username && email && phone) score += 10;
    if (newPassword && hasMinLength && hasCapital && hasNumber && hasSpecial) score += 10;
    return Math.min(score, 100);
  };

  const securityScore = getSecurityScore();

  const getPasswordStrength = () => {
    if (!newPassword) return { score: 0, label: "None", color: "bg-slate-800", text: "text-slate-500" };
    let score = 0;
    if (hasMinLength) score++;
    if (hasCapital) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;

    switch (score) {
      case 1: return { score: 25, label: "Weak ⚠️", color: "bg-rose-500/80", text: "text-rose-400" };
      case 2: return { score: 50, label: "Medium ⚡", color: "bg-amber-500/80", text: "text-amber-400" };
      case 3: return { score: 75, label: "Strong ✨", color: "bg-indigo-500/80", text: "text-indigo-400" };
      case 4: return { score: 100, label: "Excellent 🔒", color: "bg-emerald-500/80", text: "text-emerald-400" };
      default: return { score: 10, label: "Too Short ❌", color: "bg-rose-600/85", text: "text-rose-500" };
    }
  };

  const passwordStrength = getPasswordStrength();

  // Save profile and sync to currentUser states
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentUser) {
      const updatedUser: User = {
        ...currentUser,
        username: username.trim(),
        avatarUrl: avatar,
        bio: bio.trim()
      };
      
      setCurrentUser(updatedUser);
      localStorage.setItem("chatgroup_current_user", JSON.stringify(updatedUser));
      
      setRegisteredUsers((prev) => {
        const list = prev.map(u => u.username.toLowerCase() === currentUser.username.toLowerCase() ? updatedUser : u);
        localStorage.setItem("chatgroup_registered_users", JSON.stringify(list));
        return list;
      });

      if (channelRef.current) {
        channelRef.current.postMessage({
          type: "USER_REGISTER",
          user: updatedUser
        });
      }
    }

    setToast("Account details updated successfully! 🎉");
    setTimeout(() => setToast(null), 3000);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New password and confirm password do not match!");
      return;
    }
    setCurrentPassword(newPassword);
    setNewPassword("");
    setConfirmPassword("");
    setToast("Password updated successfully! 🛡️");
    setTimeout(() => setToast(null), 3000);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setAvatar(imageUrl);
      
      if (currentUser) {
        const updatedUser: User = { ...currentUser, avatarUrl: imageUrl };
        setCurrentUser(updatedUser);
        localStorage.setItem("chatgroup_current_user", JSON.stringify(updatedUser));
      }

      setToast("Profile picture updated successfully! 📸");
      setTimeout(() => setToast(null), 3000);
    }
  };

  const triggerAvatarUpload = () => {
    fileInputRef.current?.click();
  };

  // --- RENDERS CHATROOM OR SETTINGS VIEW ---
  if (currentView === "settings") {
    return (
      <main className={`min-h-screen w-full transition-colors duration-500 flex flex-col justify-start items-center p-4 sm:p-6 md:p-12 font-sans relative overflow-y-auto ${
        theme === "black" 
          ? "bg-black text-[#E4E6EB] black-theme" 
          : theme === "dark" 
            ? "bg-[#04060A] text-[#E4E6EB]" 
            : "bg-slate-50 text-black light-theme"
      }`}>
        
        {/* Hidden File Input for Avatar Upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleAvatarFileChange}
          accept="image/*"
          className="hidden"
        />
        
        {/* Background glowing particles (Aurora effect) */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className={`absolute top-[5%] left-[10%] w-[380px] h-[380px] rounded-full blur-[120px] transition-opacity duration-700 ${
            isDark ? "bg-cyan-500/10 opacity-100" : "bg-cyan-400/5 opacity-80"
          }`} />
          <div className={`absolute bottom-[10%] right-[10%] w-[450px] h-[450px] rounded-full blur-[140px] transition-opacity duration-700 ${
            isDark ? "bg-purple-500/10 opacity-100" : "bg-purple-400/5 opacity-80"
          }`} />
        </div>

        {/* Floating Toast Notification */}
        {toast && (
          <div className="fixed top-8 z-50 bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 font-extrabold px-6 py-4 rounded-full shadow-[0_12px_40px_rgba(6,182,212,0.4)] text-sm tracking-wide flex items-center gap-2.5 animate-bounce border border-white/20">
            <CheckCheck className="w-5 h-5 text-slate-950" />
            <span>{toast}</span>
          </div>
        )}

        <div className="w-full max-w-5xl z-10 space-y-6">
          
          {/* Top Header Panel */}
          <div className={`relative border rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden transition-colors duration-500 ${
            isDark 
              ? "bg-gradient-to-r from-slate-950 via-[#0B0F19] to-slate-950 border-slate-800/80" 
              : "bg-white border-slate-200"
          }`}>
            
            <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-purple-500 to-transparent" />

            <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
              {/* Back to Chat Trigger */}
              <button
                onClick={() => setCurrentView("chat")}
                className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                  isDark
                    ? "bg-slate-900 border-slate-800 text-cyan-400 hover:bg-slate-800"
                    : "bg-white border-slate-200 text-slate-800 hover:bg-slate-100 shadow-sm"
                }`}
                title="Back to ChatRoom"
              >
                <ArrowRight className="w-4.5 h-4.5 rotate-180" />
              </button>
              
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center flex-shrink-0 text-cyan-400 shadow-inner">
                <Fingerprint className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 dark:from-white dark:to-slate-400 from-slate-950 to-slate-700">
                    Settings Dashboard
                  </span>
                </h1>
                <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-black font-semibold"}`}>
                  Customize account profile details and manage credentials.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setTheme(prev => {
                  if (prev === "light") return "dark";
                  if (prev === "dark") return "black";
                  return "light";
                })}
                className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                  theme === "black"
                    ? "bg-[#121212] border-neutral-900 text-amber-400 hover:bg-neutral-900"
                    : theme === "dark"
                      ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-850"
                      : "bg-white border-slate-200 text-slate-800 hover:bg-slate-100 shadow-sm"
                }`}
                title={`Toggle Theme (Current: ${theme === "black" ? "OLED Black" : theme === "dark" ? "Dark Mode" : "Light Mode"})`}
              >
                {theme === "black" ? (
                  <Sun className="w-4.5 h-4.5" />
                ) : theme === "dark" ? (
                  <Sparkles className="w-4.5 h-4.5" />
                ) : (
                  <Moon className="w-4.5 h-4.5" />
                )}
              </button>

              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border select-none ${
                isDark ? "bg-slate-900/50 border-slate-800/60" : "bg-white border-slate-200 shadow-sm"
              }`}>
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold">{timeString || "12:37"}</span>
                <div className="w-px h-3 bg-slate-850" />
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Secured</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="hidden lg:block lg:col-span-4 space-y-6">
              <div className={`border rounded-[28px] p-5 shadow-xl transition-all duration-500 ${
                isDark ? "bg-[#080B12]/80 border-slate-800/80" : "bg-white border-slate-200 shadow-md"
              }`}>
                <h3 className={`text-xs font-extrabold uppercase tracking-wider mb-4 px-1.5 ${isDark ? "text-slate-400" : "text-black"}`}>Settings Hub</h3>
                
                <div className="space-y-1.5">
                  <button
                    onClick={() => setActiveSection("profile")}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl font-bold text-xs.5 transition-all text-left ${
                      activeSection === "profile"
                        ? "bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 text-cyan-400 border border-cyan-500/20"
                        : isDark ? "text-slate-400 hover:text-slate-200" : "text-black hover:text-cyan-500"
                    }`}
                  >
                    <UserIcon className="w-4.5 h-4.5" />
                    <span>Account Details</span>
                  </button>

                  <button
                    onClick={() => setActiveSection("security")}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl font-bold text-xs.5 transition-all text-left ${
                      activeSection === "security"
                        ? "bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 text-cyan-400 border border-cyan-500/20"
                        : isDark ? "text-slate-400 hover:text-slate-200" : "text-black hover:text-cyan-500"
                    }`}
                  >
                    <Lock className="w-4.5 h-4.5" />
                    <span>Password & Security</span>
                  </button>
                </div>
              </div>

              <div className={`border rounded-[28px] p-5 shadow-xl transition-all duration-500 overflow-hidden relative ${
                isDark ? "bg-[#080B12]/80 border-slate-800/80" : "bg-white border-slate-200 shadow-md"
              }`}>
                <div className="absolute top-0 right-0 w-[100px] h-[100px] bg-cyan-500/5 rounded-full blur-[20px] pointer-events-none" />

                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-cyan-400" />
                  <h3 className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? "text-slate-350" : "text-black"}`}>Security Health</h3>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative w-18 h-18 rounded-full border-4 border-slate-800 flex items-center justify-center flex-shrink-0">
                    <div className="absolute inset-0 rounded-full border-4 border-cyan-400 transition-all duration-500" style={{ clipPath: `polygon(0 0, 100% 0, 100% ${securityScore}%, 0 ${securityScore}%)` }} />
                    <span className="text-base font-black">{securityScore}%</span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs.5 font-bold tracking-wide">
                      {securityScore === 100 ? "Highly Shielded! 🔒" : "Enhancement Recommended"}
                    </h4>
                    <p className={`text-[10px] leading-normal ${isDark ? "text-slate-400" : "text-black"}`}>
                      {securityScore === 100 ? "Your account profile details are fully setup with robust configurations." : "Set a strong password and enable 2-Factor Authentication to reach 100% protection."}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-850/50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
                    <span className="text-[11px] font-bold">2-Factor Authentication</span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setTwoFactor(!twoFactor);
                      setToast(twoFactor ? "Two-Factor Auth Disabled 🔓" : "Two-Factor Auth Enabled 🔒");
                      setTimeout(() => setToast(null), 2500);
                    }}
                    className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-300 relative ${
                      twoFactor ? "bg-cyan-500" : "bg-slate-800"
                    }`}
                  >
                    <div className={`w-4.5 h-4.5 rounded-full bg-slate-950 transition-transform duration-300 ${
                      twoFactor ? "translate-x-4.5 bg-white" : "translate-x-0"
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 w-full space-y-4">
              <div className={`flex lg:hidden gap-1.5 p-1.5 rounded-2xl border transition-colors duration-500 ${
                isDark 
                  ? "bg-slate-950/40 border-slate-800/80" 
                  : "bg-white border-slate-200 shadow-sm"
              }`}>
                <button
                  type="button"
                  onClick={() => setActiveSection("profile")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs.5 transition-all cursor-pointer ${
                    activeSection === "profile"
                      ? isDark
                        ? "bg-gradient-to-r from-cyan-500/15 to-indigo-500/15 text-cyan-400 border border-cyan-500/20"
                        : "bg-cyan-50 text-cyan-600 border border-cyan-200"
                      : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500"
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Account</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection("security")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs.5 transition-all cursor-pointer ${
                    activeSection === "security"
                      ? isDark
                        ? "bg-gradient-to-r from-cyan-500/15 to-indigo-500/15 text-cyan-400 border border-cyan-500/20"
                        : "bg-cyan-50 text-cyan-600 border border-cyan-200"
                      : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500"
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>Security</span>
                </button>
              </div>
              
              {activeSection === "profile" && (
                <div className={`border rounded-[32px] p-6 md:p-8 shadow-2xl transition-all duration-500 relative overflow-hidden ${
                  isDark ? "bg-[#080B12]/80 border-slate-800/80" : "bg-white border-slate-200 shadow-md"
                }`}>
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="border-b border-slate-850/50 pb-4 flex items-center justify-between select-none">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-5 h-5 text-cyan-400" />
                        <h2 className="text-lg font-black tracking-wide">Account Profile Details</h2>
                      </div>
                      <span className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full font-bold">Information</span>
                    </div>

                    <div className={`flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl border select-none transition-colors duration-500 ${
                      isDark ? "bg-slate-950/40 border-slate-900/60" : "bg-slate-50 border-slate-200"
                    }`}>
                      <div className="relative group">
                        <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 opacity-60 blur-xs group-hover:opacity-100 transition duration-300" />
                        
                        <div className="w-[88px] h-[88px] rounded-full overflow-hidden border-[3px] border-slate-950 relative bg-slate-900">
                          <img
                            src={avatar}
                            alt={name}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={triggerAvatarUpload}
                          className="absolute -bottom-1 -right-1 p-2 bg-slate-900 border border-slate-700/80 text-cyan-400 rounded-full shadow-lg hover:bg-slate-800 transition"
                          title="Upload Avatar"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-center sm:text-left space-y-1">
                        <h3 className="text-sm.5 font-extrabold">{name}</h3>
                        <p className={`text-[11px] leading-normal ${isDark ? "text-slate-400" : "text-black"}`}>
                          JPG, PNG allowed. Standard resolution will be automatically configured.
                        </p>
                        
                        <div className="flex items-center justify-center sm:justify-start gap-3 mt-1.5">
                          <button
                            type="button"
                            onClick={triggerAvatarUpload}
                            className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1.5 transition"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Roll Random Photo
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2 text-left">
                          <label className={`text-[11px] font-bold uppercase tracking-widest px-0.5 ${isDark ? "text-slate-400" : "text-black"}`}>Full Name</label>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={`w-full border rounded-2xl px-4 py-3.5 text-xs.5 outline-none transition duration-300 ${
                              isDark 
                                ? "bg-slate-950/60 border-slate-800 text-white focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/10" 
                                : "bg-slate-50 border-slate-200 text-black font-semibold focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/10"
                            }`}
                            placeholder="Your full name..."
                            required
                          />
                        </div>

                        <div className="space-y-2 text-left">
                          <label className={`text-[11px] font-bold uppercase tracking-widest px-0.5 ${isDark ? "text-slate-400" : "text-black"}`}>Username</label>
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={`w-full border rounded-2xl px-4 py-3.5 text-xs.5 outline-none transition duration-300 ${
                              isDark 
                                ? "bg-slate-950/60 border-slate-800 text-white focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/10" 
                                : "bg-slate-50 border-slate-200 text-black font-semibold focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/10"
                            }`}
                            placeholder="Your username..."
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2 text-left">
                        <label className={`text-[11px] font-bold uppercase tracking-widest px-0.5 ${isDark ? "text-slate-400" : "text-black"}`}>Email Address</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                            <Mail className="w-4 h-4" />
                          </span>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full border rounded-2xl pl-12 pr-4 py-3.5 text-xs.5 outline-none transition duration-300 ${
                              isDark 
                                ? "bg-slate-950/60 border-slate-800 text-white focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/10" 
                                : "bg-slate-50 border-slate-200 text-black font-semibold focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/10"
                            }`}
                            placeholder="your.email@domain.com"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2 text-left">
                        <label className={`text-[11px] font-bold uppercase tracking-widest px-0.5 ${isDark ? "text-slate-400" : "text-black"}`}>Phone Number</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                            <Phone className="w-4 h-4" />
                          </span>
                          <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className={`w-full border rounded-2xl pl-12 pr-4 py-3.5 text-xs.5 outline-none transition duration-300 ${
                              isDark 
                                ? "bg-slate-950/60 border-slate-800 text-white focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/10" 
                                : "bg-slate-50 border-slate-200 text-black font-semibold focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/10"
                            }`}
                            placeholder="Your phone number..."
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2 text-left">
                        <label className={`text-[11px] font-bold uppercase tracking-widest px-0.5 ${isDark ? "text-slate-400" : "text-black"}`}>Bio Details</label>
                        <textarea
                          rows={3}
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          className={`w-full border rounded-2xl p-4.5 text-xs.5 outline-none transition duration-300 resize-none ${
                            isDark 
                              ? "bg-slate-950/60 border-slate-800 text-white focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/10" 
                              : "bg-slate-50 border-slate-200 text-black font-semibold focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/10"
                          }`}
                          placeholder="Write something about yourself..."
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full group bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-black py-4 rounded-2xl text-xs.5 transition-all shadow-[0_8px_25px_rgba(6,182,212,0.2)] flex items-center justify-center gap-1.5 mt-4 select-none cursor-pointer"
                    >
                      <Save className="w-4.5 h-4.5" /> Save Account Profile Details
                    </button>
                  </form>
                </div>
              )}

              {activeSection === "security" && (
                <div className={`border rounded-[32px] p-6 md:p-8 shadow-2xl transition-all duration-500 relative overflow-hidden ${
                  isDark ? "bg-[#080B12]/80 border-slate-800/80" : "bg-white border-slate-200 shadow-md"
                }`}>
                  <form onSubmit={handleSavePassword} className="space-y-6">
                    <div className="border-b border-slate-850/50 pb-4 flex items-center justify-between select-none">
                      <div className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-indigo-400" />
                        <h2 className="text-lg font-black tracking-wide">Change Password Settings</h2>
                      </div>
                      <span className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full font-bold">Authentication</span>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2 text-left relative">
                        <label className={`text-[11px] font-bold uppercase tracking-widest px-0.5 ${isDark ? "text-slate-400" : "text-black"}`}>Current Password</label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className={`w-full border rounded-2xl pl-4 pr-11 py-3.5 text-xs.5 outline-none transition duration-300 ${
                              isDark 
                                ? "bg-slate-950/60 border-slate-800 text-white focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/10" 
                                : "bg-slate-50 border-slate-200 text-black font-semibold focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/10"
                            }`}
                            placeholder="Type current password..."
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors"
                          >
                            {showCurrentPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 text-left relative">
                        <label className={`text-[11px] font-bold uppercase tracking-widest px-0.5 ${isDark ? "text-slate-400" : "text-black"}`}>New Password</label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={`w-full border rounded-2xl pl-4 pr-11 py-3.5 text-xs.5 outline-none transition duration-300 ${
                              isDark 
                                ? "bg-slate-950/60 border-slate-800 text-white focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/10" 
                                : "bg-slate-50 border-slate-200 text-black font-semibold focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/10"
                            }`}
                            placeholder="Type new secure password..."
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors"
                          >
                            {showNewPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                          </button>
                        </div>

                        {newPassword && (
                          <div className="mt-3.5 p-4 bg-slate-950/90 rounded-2xl border border-slate-900 space-y-3 select-none text-xs">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10.5px]">
                                <span className="text-slate-400">Security Index:</span>
                                <span className={`font-bold ${passwordStrength.text}`}>{passwordStrength.label}</span>
                              </div>
                              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-500 ${passwordStrength.color}`}
                                  style={{ width: `${passwordStrength.score}%` }}
                                />
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-900/60 grid grid-cols-2 gap-2 text-[10.5px]">
                              <div className="flex items-center gap-1.5">
                                {hasMinLength ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-700" />}
                                <span className={hasMinLength ? "text-slate-200" : "text-slate-500"}>8+ Characters</span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {hasCapital ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-700" />}
                                <span className={hasCapital ? "text-slate-200" : "text-slate-500"}>Uppercase Letter</span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-700" />}
                                <span className={hasNumber ? "text-slate-200" : "text-slate-500"}>Number (0-9)</span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {hasSpecial ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-700" />}
                                <span className={hasSpecial ? "text-slate-200" : "text-slate-500"}>Special Symbol</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 text-left relative">
                        <label className={`text-[11px] font-bold uppercase tracking-widest px-0.5 ${isDark ? "text-slate-400" : "text-black"}`}>Confirm New Password</label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full border rounded-2xl pl-4 pr-11 py-3.5 text-xs.5 outline-none transition duration-300 ${
                              isDark 
                                ? "bg-slate-950/60 border-slate-800 text-white focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/10" 
                                : "bg-slate-50 border-slate-200 text-black font-semibold focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/10"
                            }`}
                            placeholder="Verify new secure password..."
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-white text-slate-950 font-black py-4 rounded-2xl text-xs.5 hover:bg-slate-200 transition-all flex items-center justify-center gap-1.5 mt-4 shadow-md select-none cursor-pointer"
                    >
                      <Key className="w-4.5 h-4.5" /> Save New Password
                    </button>
                  </form>
                </div>
              )}

              <div className={`block lg:hidden border rounded-[28px] p-5 shadow-xl transition-all duration-500 overflow-hidden relative ${
                isDark ? "bg-[#080B12]/80 border-slate-800/80" : "bg-white border-slate-200 shadow-md"
              }`}>
                <div className="absolute top-0 right-0 w-[100px] h-[100px] bg-cyan-500/5 rounded-full blur-[20px] pointer-events-none" />

                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-xs font-extrabold uppercase text-slate-350 tracking-wider">Security Health</h3>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative w-18 h-18 rounded-full border-4 border-slate-800 flex items-center justify-center flex-shrink-0">
                    <div className="absolute inset-0 rounded-full border-4 border-cyan-400 transition-all duration-500" style={{ clipPath: `polygon(0 0, 100% 0, 100% ${securityScore}%, 0 ${securityScore}%)` }} />
                    <span className="text-base font-black">{securityScore}%</span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs.5 font-bold tracking-wide">
                      {securityScore === 100 ? "Highly Shielded! 🔒" : "Enhancement Recommended"}
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      {securityScore === 100 ? "Your account profile details are fully setup with robust configurations." : "Set a strong password and enable 2-Factor Authentication to reach 100% protection."}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-850/50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
                    <span className="text-[11px] font-bold">2-Factor Authentication</span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setTwoFactor(!twoFactor);
                      setToast(twoFactor ? "Two-Factor Auth Disabled 🔓" : "Two-Factor Auth Enabled 🔒");
                      setTimeout(() => setToast(null), 2500);
                    }}
                    className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-300 relative ${
                      twoFactor ? "bg-cyan-500" : "bg-slate-800"
                    }`}
                  >
                    <div className={`w-4.5 h-4.5 rounded-full bg-slate-950 transition-transform duration-300 ${
                      twoFactor ? "translate-x-4.5 bg-white" : "translate-x-0"
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-[10.5px] text-slate-500 select-none z-10">
          Secure Settings Hub. Encrypted using SHA-256 protocols. Powered by Next.js.
        </div>
      </main>
    );
  }

  // --- DEFAULT VIEW: CHATROOM ---
  return (
    <div className={`w-full h-screen max-h-screen text-slate-800 flex flex-col font-sans antialiased overflow-hidden ${
      theme === "black" 
        ? "bg-black text-slate-100 black-theme" 
        : theme === "dark" 
          ? "bg-slate-950 text-slate-100" 
          : "bg-white text-slate-800"
    }`}>
      
      {/* 1. TOP CHATGROUP NAVBAR */}
      <header className={`h-[60px] border-b px-6 flex items-center justify-between z-50 flex-shrink-0 ${
        theme === "black"
          ? "bg-black border-neutral-900"
          : isDark 
            ? "bg-slate-900 border-slate-800" 
            : "bg-white border-slate-200"
      }`}>
        
        {/* Left Branding */}
        <div className="flex items-center gap-2.5 select-none">
          <svg className="w-6.5 h-6.5 text-sky-500 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.119 2 11.2c0 2.925 1.458 5.519 3.743 7.151l-.736 2.946a.75.75 0 001.087.828l3.414-1.707c.803.18 1.637.282 2.492.282 5.523 0 10-4.119 10-9.2C22 6.119 17.523 2 12 2zm1 13h-2v-2h2v2zm0-4h-2V7h2v4z" />
          </svg>
          <span className="text-[19px] font-extrabold tracking-tight bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            ChatGroup
          </span>
        </div>

        {/* Center Search bar */}
        {currentUser && (
          <div className={`hidden md:flex w-[260px] h-[36px] border rounded-lg items-center px-3 gap-2 ${
            theme === "black"
              ? "bg-[#0a0a0a] border-neutral-800"
              : isDark 
                ? "bg-slate-950 border-slate-800" 
                : "bg-slate-100 border-slate-200"
          }`}>
            <svg className="w-4.5 h-4.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
            </svg>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm w-full outline-none text-slate-400 placeholder-slate-450 font-normal"
            />
          </div>
        )}

        {/* Right Nav Icons / Theme Toggle (if not logged in) */}
        <div className="flex items-center gap-5">
          {currentUser ? (
            <>
              {/* Search Icon */}
              <button className="text-slate-500 hover:text-slate-800 transition-colors hidden sm:block">
                <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
                </svg>
              </button>
              
              {/* Direct Messages Icon */}
              <button className="text-slate-500 hover:text-slate-800 transition-colors relative">
                <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
                <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold flex items-center justify-center text-white">1</span>
              </button>

              {/* Settings gear icon */}
              <button 
                onClick={() => {
                  setName(currentUser.username);
                  setUsername(currentUser.username);
                  setBio(currentUser.bio || "");
                  setAvatar(currentUser.avatarUrl);
                  setCurrentView("settings");
                }}
                className="text-slate-500 hover:text-slate-800 transition-colors"
                title="Settings Dashboard"
              >
                <svg className="w-5.5 h-5.5 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* Home Icon */}
              <button className="text-slate-500 hover:text-slate-800 transition-colors hidden sm:block">
                <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              </button>

              {/* Notifications Heart */}
              <button className="text-slate-500 hover:text-slate-800 transition-colors hidden sm:block">
                <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </button>

              {/* Logged in user avatar */}
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.username}
                className="w-7 h-7 rounded-full object-cover border border-slate-200 active:scale-95 transition-transform"
              />
            </>
          ) : (
            /* Theme Toggle Button for Logged-Out Users */
            <button
              onClick={() => setTheme(prev => {
                if (prev === "light") return "dark";
                if (prev === "dark") return "black";
                return "light";
              })}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                theme === "black"
                  ? "bg-[#121212] border-neutral-900 text-amber-400 hover:bg-neutral-900"
                  : isDark
                    ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-850"
                    : "bg-white border-slate-200 text-slate-800 hover:bg-slate-100 shadow-sm"
              }`}
              title={`Toggle Theme (Current: ${theme === "black" ? "OLED Black" : theme === "dark" ? "Dark Mode" : "Light Mode"})`}
            >
              {theme === "black" ? (
                <Sun className="w-4 h-4" />
              ) : theme === "dark" ? (
                <Sparkles className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </header>

      {/* 2. AUTH / LOGOUT / REGISTER CONTAINER */}
      {!currentUser ? (
        <div className={`flex-1 flex items-center justify-center p-6 ${
          theme === "black"
            ? "bg-black"
            : isDark ? "bg-slate-900" : "bg-white"
        }`}>
          <div className={`w-full max-w-[390px] rounded-2xl p-8 shadow-[0_15px_40px_rgba(0,0,0,0.04)] flex flex-col items-center animate-chat-bubble border ${
            theme === "black"
              ? "bg-[#050505] border-neutral-900 text-slate-100"
              : isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-850"
          }`}>
            {/* Auth Mode Toggle Tabs */}
            <div className={`flex w-full border-b mb-5 ${
              theme === "black" ? "border-neutral-900" : isDark ? "border-slate-800" : "border-slate-100"
            }`}>
              <button
                type="button"
                onClick={() => setAuthMode("register")}
                className={`flex-1 pb-2 text-[11px] font-bold tracking-widest uppercase transition-all border-b-2 cursor-pointer ${
                  authMode === "register"
                    ? "border-sky-500 text-sky-500"
                    : "border-transparent text-slate-400 hover:text-slate-500"
                }`}
              >
                Register
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className={`flex-1 pb-2 text-[11px] font-bold tracking-widest uppercase transition-all border-b-2 cursor-pointer ${
                  authMode === "login"
                    ? "border-sky-500 text-sky-500"
                    : "border-transparent text-slate-400 hover:text-slate-500"
                }`}
              >
                Login
              </button>
            </div>

            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/10 mb-4 text-white">
              <svg className="w-7 h-7 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>

            <h2 className={`text-xl font-extrabold tracking-wide mb-1 ${isDark ? "text-slate-100" : "text-slate-800"}`}>
              {authMode === "register" ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="text-[12px] text-slate-400 text-center mb-5 leading-relaxed">
              {authMode === "register" 
                ? "Register a username and password to start chatting in real-time."
                : "Enter your username/email and password to join your server chat."
              }
            </p>

            {authMode === "register" ? (
              <form onSubmit={handleRegister} className="w-full flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Select Profile Face</span>
                  <div className="grid grid-cols-6 gap-2">
                    {PRESET_AVATARS.map((avatarItem, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setSelectedAvatarUrl(avatarItem)}
                        className={`relative w-9 h-9 rounded-full overflow-hidden border-2 transition-all active:scale-90 ${
                          selectedAvatarUrl === avatarItem ? "border-sky-500 scale-105" : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img src={avatarItem} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Username</label>
                  <input
                    type="text"
                    maxLength={18}
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="e.g. Ann"
                    className={`w-full px-4 py-2.5 border rounded-xl outline-none text-xs font-semibold shadow-sm transition-colors ${
                      theme === "black"
                        ? "bg-black border-neutral-900 text-white placeholder-slate-700 focus:border-sky-500/50"
                        : isDark 
                          ? "bg-slate-900 border-slate-800 text-white placeholder-slate-650 focus:border-sky-500/50" 
                          : "bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-sky-500/50"
                    }`}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-455 uppercase tracking-widest">Email Address</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. ann@gmail.com"
                    className={`w-full px-4 py-2.5 border rounded-xl outline-none text-xs font-semibold shadow-sm transition-colors ${
                      theme === "black"
                        ? "bg-black border-neutral-900 text-white placeholder-slate-700 focus:border-sky-500/50"
                        : isDark 
                          ? "bg-slate-900 border-slate-800 text-white placeholder-slate-650 focus:border-sky-500/50" 
                          : "bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-sky-500/50"
                    }`}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Password</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Choose account password..."
                    className={`w-full px-4 py-2.5 border rounded-xl outline-none text-xs font-semibold shadow-sm transition-colors ${
                      theme === "black"
                        ? "bg-black border-neutral-900 text-white placeholder-slate-700 focus:border-sky-500/50"
                        : isDark 
                          ? "bg-slate-900 border-slate-800 text-white placeholder-slate-650 focus:border-sky-500/50" 
                          : "bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-sky-500/50"
                    }`}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={!regUsername.trim() || !regEmail.trim() || !regPassword}
                  className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 font-bold text-white rounded-xl shadow-md active:scale-95 transition-all text-xs mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Register & Join
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Username or Email</label>
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="Enter username or email..."
                    className={`w-full px-4 py-2.5 border rounded-xl outline-none text-xs font-semibold shadow-sm transition-colors ${
                      theme === "black"
                        ? "bg-black border-neutral-900 text-white placeholder-slate-700 focus:border-sky-500/50"
                        : isDark 
                          ? "bg-slate-900 border-slate-800 text-white placeholder-slate-650 focus:border-sky-500/50" 
                          : "bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-sky-500/50"
                    }`}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter account password..."
                    className={`w-full px-4 py-2.5 border rounded-xl outline-none text-xs font-semibold shadow-sm transition-colors ${
                      theme === "black"
                        ? "bg-black border-neutral-900 text-white placeholder-slate-700 focus:border-sky-500/50"
                        : isDark 
                          ? "bg-slate-900 border-slate-800 text-white placeholder-slate-650 focus:border-sky-500/50" 
                          : "bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-sky-500/50"
                    }`}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={!loginIdentifier.trim() || !loginPassword}
                  className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 font-bold text-white rounded-xl shadow-md active:scale-95 transition-all text-xs mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Log In & Join
                </button>
              </form>
            )}

            <div className="flex items-center my-3.5 w-full">
              <div className={`flex-grow border-t ${theme === "black" ? "border-neutral-900" : isDark ? "border-slate-800" : "border-slate-200"}`}></div>
              <span className={`mx-3 text-[10px] font-bold uppercase tracking-wider ${theme === "black" ? "text-slate-700" : isDark ? "text-slate-600" : "text-slate-400"}`}>or</span>
              <div className={`flex-grow border-t ${theme === "black" ? "border-neutral-900" : isDark ? "border-slate-800" : "border-slate-200"}`}></div>
            </div>

            <button
              type="button"
              onClick={() => setIsGoogleModalOpen(true)}
              className={`w-full py-2.5 border rounded-xl outline-none text-xs font-bold shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer ${
                theme === "black"
                  ? "bg-black border-neutral-900 hover:bg-[#080808] text-slate-200"
                  : isDark
                    ? "bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-200"
                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>
          </div>
        </div>
      ) : (
        /* MAIN 3-COLUMN FLEXBOARD VIEWPORT */
        <div className="flex-1 flex overflow-hidden w-full relative">
          
          {/* COLUMN 1: LEFT SIDEBAR MESSAGES LIST (350px) */}
          <section 
            className={`border-r flex flex-col flex-shrink-0 transition-all duration-300 ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            } ${
              activeContact 
                ? "hidden md:flex w-[350px] h-full" 
                : "w-full md:w-[350px] h-full"
            }`}
          >
            <div className="p-4 flex flex-col gap-3 border-b border-slate-100/10">
              <div className={`w-full h-[36px] border rounded-lg flex items-center px-3 gap-2 ${
                isDark ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-200"
              }`}>
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-sm w-full outline-none text-slate-400 placeholder-slate-500 font-normal"
                />
              </div>
              
              <div className="flex justify-between items-center text-xs text-slate-450 font-bold tracking-wide">
                <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-650">
                  <span>Latest First</span>
                  <svg className="w-3 h-3 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
                
                <button 
                  onClick={handleLogout}
                  className="w-6 h-6 rounded-full bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center active:scale-90 transition-transform shadow-md"
                  title="Logout / Exit Session"
                >
                  <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {filteredContacts.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">No contacts found</div>
              ) : (
                filteredContacts.map((user) => {
                  const isOnline = onlineUsers[user.username] === "online";
                  const isAway = onlineUsers[user.username] === "away";
                  const isTyping = typingUsers[user.username];
                  const isActive = activeContact?.username === user.username;
                  const lastMsg = getLastMessage(user.username);
                  
                  const hasMockBadge = (user.username === "Paul Osmand" || user.username === "Edward Davis") && !lastMsg;

                  return (
                    <button
                      key={user.username}
                      onClick={() => setActiveContact(user)}
                      className={`w-full p-3.5 flex items-center gap-3.5 rounded-xl hover-scale relative ${
                        isActive
                          ? isDark ? "bg-slate-800" : "bg-slate-100"
                          : isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className={`w-[52px] h-[52px] rounded-full overflow-hidden p-[2.5px] ${
                          isActive ? "insta-gradient-border" : isDark ? "border border-slate-800" : "border border-slate-200"
                        }`}>
                          <img 
                            src={user.avatarUrl} 
                            className={`w-full h-full rounded-full object-cover border ${
                              isDark ? "border-slate-900" : "border-white"
                            }`} 
                          />
                        </div>
                        
                        <span className={`absolute top-0.5 right-0.5 w-3 h-3 rounded-full border-2 ${
                          isDark ? "border-slate-900" : "border-white"
                        } ${
                          isTyping ? "bg-amber-400 animate-pulse" :
                          isOnline ? "bg-emerald-500 pulse-online" :
                          isAway ? "bg-amber-500" : "bg-slate-400"
                        }`} />
                      </div>
                      
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className={`text-[13.5px] font-bold tracking-wide truncate ${
                            isDark ? "text-slate-200" : "text-slate-700"
                          }`}>
                            {user.username.toUpperCase()}
                          </span>
                          {lastMsg ? (
                            <span className="text-[10px] text-slate-450 font-semibold">{lastMsg.time}</span>
                          ) : (
                            <span className="text-[10px] text-slate-450 font-medium">08:04 AM</span>
                          )}
                        </div>
                        
                        <p className="text-[11.5px] text-slate-500 truncate leading-snug">
                          {isTyping ? (
                            <span className="text-purple-500 font-bold animate-pulse">typing...</span>
                          ) : lastMsg ? (
                            lastMsg.text || "📷 Photo attachment"
                          ) : (
                            user.statusText || "Start DM"
                          )}
                        </p>
                      </div>

                      {hasMockBadge && (
                        <span className="absolute right-4 w-4.5 h-4.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-[10px] font-black text-white flex items-center justify-center select-none shadow">
                          1
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* COLUMN 2: MIDDLE PANE - ACTIVE DIRECT MESSAGE STREAM */}
          <main 
            className={`flex-1 flex flex-col border-r transition-all duration-300 ${
              isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
            } ${
              !activeContact 
                ? "hidden md:flex h-full items-center justify-center text-center p-8" 
                : "flex h-full"
            }`}
          >
            {activeContact ? (
              <>
                {/* Active Chat Header */}
                <header className={`h-[60px] px-6 border-b flex items-center justify-between flex-shrink-0 z-40 select-none ${
                  isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                }`}>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setActiveContact(null)}
                      className="md:hidden p-1.5 rounded-full text-slate-500 hover:text-slate-800 active:scale-95"
                    >
                      <svg className="w-5 h-5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                    </button>

                    <div className="relative">
                      <img
                        src={activeContact.avatarUrl}
                        alt={activeContact.username}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200"
                      />
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white ${
                        typingUsers[activeContact.username] ? "bg-amber-400 animate-pulse" :
                        onlineUsers[activeContact.username] === "online" ? "bg-emerald-500" :
                        onlineUsers[activeContact.username] === "away" ? "bg-amber-500" : "bg-slate-400"
                      }`} />
                    </div>
                    <div>
                      <h3 className={`text-sm font-bold tracking-wide ${isDark ? "text-slate-100" : "text-slate-800"}`}>{activeContact.username}</h3>
                      <p className="text-[10px] text-slate-400 font-semibold tracking-wide">
                        {typingUsers[activeContact.username] ? "typing..." : "Active now"}
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setIsDetailPaneOpen((prev) => !prev)}
                    className={`w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100/10 text-slate-400 hover:text-slate-700 transition-all active:scale-90 ${
                      isDetailPaneOpen ? "bg-slate-100/10 text-slate-300" : ""
                    }`}
                  >
                    <svg className="w-5.5 h-5.5 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.063.852l-.708 2.836a.75.75 0 001.063.852l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                  </button>
                </header>

                {/* Message feeds stream */}
                <div className={`flex-1 overflow-y-auto px-6 py-6 space-y-5 custom-scrollbar flex flex-col ${
                  isDark ? "bg-slate-950" : "bg-white"
                }`}>
                  
                  {/* Sync info banner */}
                  <div className="w-full bg-indigo-50/5 border border-indigo-500/10 rounded-xl p-3 flex items-center justify-between text-xs text-indigo-400 gap-3 shadow-sm select-none animate-chat-bubble flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                      </span>
                      <span><b>Real-time Sync Active</b>: Open this site in another tab to chat live.</span>
                    </div>
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded">Tab Sync</span>
                  </div>

                  {conversationMessages.map((msg) => {
                    const isMe = msg.sender === currentUser.username;
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex w-full items-end gap-2.5 ${
                          isMe ? "justify-end" : "justify-start"
                        } ${msg.isNew ? "animate-chat-bubble" : ""}`}
                      >
                        {!isMe && (
                          <img
                            src={activeContact.avatarUrl}
                            alt={activeContact.username}
                            className="w-[28px] h-[28px] rounded-full object-cover border border-slate-200 flex-shrink-0 select-none mb-1"
                          />
                        )}

                        <div className="flex flex-col max-w-[70%]">
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed shadow-sm break-words relative ${
                              isMe
                                ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-br-sm bubble-shadow-me"
                                : isDark 
                                  ? "bg-slate-800 text-slate-100 rounded-bl-sm bubble-shadow-them"
                                  : "bg-slate-100 text-slate-800 rounded-bl-sm bubble-shadow-them"
                            }`}
                          >
                            {msg.text && <p className="font-normal">{msg.text}</p>}
                            
                            {msg.imageUrl && (
                              <img
                                src={msg.imageUrl}
                                alt="Attachment"
                                className="rounded-lg max-h-[220px] object-cover mt-1 select-none border border-slate-700/20"
                              />
                            )}

                            <div className="flex items-center justify-end mt-1 text-[9px] font-semibold select-none">
                              <span className={isMe ? "text-white/80" : "text-slate-400"}>{msg.time}</span>
                              {isMe && msg.status && renderCheckmarks(msg.status)}
                            </div>
                          </div>
                        </div>

                        {isMe && (
                          <img
                            src={currentUser.avatarUrl}
                            alt={currentUser.username}
                            className="w-[28px] h-[28px] rounded-full object-cover border border-slate-200 flex-shrink-0 select-none mb-1"
                          />
                        )}
                      </div>
                    );
                  })}

                  {/* typing status indicator visual overlay */}
                  {typingUsers[activeContact.username] && (
                    <div className="flex w-full items-end gap-2.5 justify-start animate-chat-bubble">
                      <img
                        src={activeContact.avatarUrl}
                        alt={activeContact.username}
                        className="w-[28px] h-[28px] rounded-full object-cover border border-slate-200 flex-shrink-0 mb-1"
                      />
                      <div className={`px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5 shadow-sm ${
                        isDark ? "bg-slate-800 text-slate-100" : "bg-slate-100 text-slate-800"
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-450 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-450 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-450 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Footer input box */}
                <footer className={`p-4 border-t flex items-center gap-3 select-none flex-shrink-0 ${
                  isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                }`}>
                  <button 
                    onClick={handleSendMockImage}
                    title="Send photography media"
                    className="p-1.5 rounded-full text-slate-500 hover:text-slate-850 hover:bg-slate-100/10 transition-all active:scale-90"
                  >
                    <svg className="w-6.5 h-6.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </button>

                  {/* Emoji Picker Popover Wrapper */}
                  <div className="relative" ref={emojiPickerRef}>
                    <button 
                      onClick={() => setIsEmojiPickerOpen((prev) => !prev)}
                      title="Insert emoji"
                      className={`p-1.5 rounded-full hover:bg-slate-100/10 transition-all active:scale-90 ${
                        isEmojiPickerOpen ? "text-sky-500 bg-slate-100/10" : "text-slate-500 hover:text-slate-850"
                      }`}
                    >
                      <svg className="w-6.5 h-6.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                      </svg>
                    </button>

                    {isEmojiPickerOpen && (
                      <div className={`absolute bottom-[52px] left-0 w-[270px] border rounded-2xl p-3 shadow-xl flex flex-col z-50 animate-chat-bubble select-none ${
                        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                      }`}>
                        <div className="flex justify-between items-center border-b border-slate-100/10 pb-2 mb-2">
                          {EMOJI_CATEGORIES.map((cat) => (
                            <button
                              type="button"
                              key={cat.name}
                              onClick={() => setActiveEmojiCategory(cat.name)}
                              title={cat.name}
                              className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm transition-all active:scale-95 ${
                                activeEmojiCategory === cat.name ? "bg-slate-100/10 text-slate-300" : "opacity-50 hover:opacity-100"
                              }`}
                            >
                              {cat.icon}
                            </button>
                          ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1.5 overflow-y-auto max-h-[140px] custom-scrollbar p-1">
                          {EMOJI_CATEGORIES.find((c) => c.name === activeEmojiCategory)?.list.map((emoji) => (
                            <button
                              type="button"
                              key={emoji}
                              onClick={() => setInputText((prev) => prev + emoji)}
                              className="w-8 h-8 flex items-center justify-center text-[18px] hover:bg-slate-100/10 active:scale-90 rounded-lg transition-all"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={`flex-1 h-[44px] px-4 border transition-colors rounded-full flex items-center ${
                    isDark ? "bg-slate-950 border-slate-800 focus-within:border-slate-700" : "bg-slate-50 border-slate-200 focus-within:border-slate-300"
                  }`}>
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => {
                        setInputText(e.target.value);
                        handleUserTyping(e.target.value.length);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Message..."
                      className={`bg-transparent text-sm w-full outline-none font-normal ${
                        isDark ? "text-slate-100 placeholder-slate-600" : "text-slate-800 placeholder-slate-400"
                      }`}
                    />
                  </div>

                  <button 
                    onClick={() => {
                      setInputText("Listening...");
                      setTimeout(() => setInputText("I'm skating tonight!"), 1500);
                    }}
                    className="p-1.5 rounded-full text-slate-500 hover:text-slate-850 hover:bg-slate-100/10 transition-all active:scale-90"
                  >
                    <svg className="w-6.5 h-6.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleSendMessage()}
                    className={`w-[40px] h-[40px] rounded-full flex items-center justify-center transition-all ${
                      inputText.trim()
                        ? "insta-send-gradient hover:opacity-90 active:scale-90 text-white shadow-md"
                        : "bg-slate-100/10 text-slate-550 cursor-not-allowed"
                    }`}
                    disabled={!inputText.trim()}
                  >
                    <svg className="w-[16px] h-[16px] rotate-45 -translate-x-[1px] stroke-[2.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </button>
                </footer>
              </>
            ) : (
              <div className={`flex-1 flex flex-col items-center justify-center text-center p-8 select-none ${
                isDark ? "bg-slate-950" : "bg-slate-50"
              }`}>
                <div className={`w-20 h-20 rounded-full border flex items-center justify-center text-slate-400 mb-4 shadow-sm ${
                  isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                }`}>
                  <svg className="w-10 h-10 stroke-[1.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </div>
                <h2 className="text-[17px] font-bold text-slate-500 uppercase tracking-widest">Your Messages</h2>
                <p className="text-[12px] text-slate-450 max-w-[240px] mt-2 leading-relaxed">
                  Send private messages and media photos to a friend or group. Select a conversation to start.
                </p>
              </div>
            )}
          </main>

          {/* COLUMN 3: RIGHT PANEL - CONTACT DETAIL INFO DISPLAY (320px) */}
          {activeContact && isDetailPaneOpen && (
            <aside 
              className={`w-full lg:w-[320px] border-l flex flex-col items-center p-6 text-center select-none z-45 animate-chat-bubble absolute lg:static top-0 right-0 h-full lg:h-auto shadow-2xl lg:shadow-none ${
                isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
              }`}
            >
              <button 
                onClick={() => setIsDetailPaneOpen(false)}
                className="lg:hidden absolute top-4 right-4 p-2 text-slate-450 hover:text-slate-800"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="relative mt-8 mb-5 select-none">
                <div className="w-[120px] h-[120px] rounded-full overflow-hidden border border-slate-200 p-[3px] shadow-sm">
                  <img
                    src={activeContact.avatarUrl}
                    alt={activeContact.username}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>

              <h2 className={`text-[18px] font-black tracking-wide mb-0.5 ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                {activeContact.username.toUpperCase()}
              </h2>
              <p className="text-[11px] font-extrabold tracking-widest text-slate-450 uppercase mb-4">
                {activeContact.category || "MEMBER"}
              </p>

              <p className="text-[12px] leading-relaxed text-slate-500 max-w-[240px] mb-6 font-medium">
                {activeContact.bio || "No profile biography available yet."}
              </p>

              <button className="px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 font-bold text-white active:scale-95 transition-all text-xs tracking-wide shadow-md">
                VIEW PROFILE
              </button>

              <div className="flex gap-4 mt-auto pt-8 select-none">
                <button className={`w-[52px] h-[52px] rounded-full text-slate-500 flex items-center justify-center active:scale-90 transition-all shadow-sm ${
                  isDark ? "bg-slate-850 hover:bg-slate-800" : "bg-slate-100 hover:bg-slate-200"
                }`}>
                  <svg className="w-5.5 h-5.5 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </button>
                <button className={`w-[52px] h-[52px] rounded-full text-slate-500 flex items-center justify-center active:scale-90 transition-all shadow-sm ${
                  isDark ? "bg-slate-850 hover:bg-slate-800" : "bg-slate-100 hover:bg-slate-200"
                }`}>
                  <svg className="w-5.5 h-5.5 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.557-5.118-3.851-6.674-6.674l1.293-.97c.362-.272.528-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                </button>
              </div>
            </aside>
          )}

        </div>
      )}

      {isGoogleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-[400px] mx-4 rounded-2xl shadow-2xl p-6 border transition-all ${
            isDark 
              ? "bg-slate-950 border-slate-800 text-slate-100" 
              : "bg-white border-slate-200 text-slate-850"
          }`}>
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="font-bold text-sm">Sign in with Google</span>
              </div>
              <button 
                onClick={() => !isSigningInWithGoogle && setIsGoogleModalOpen(false)}
                className={`p-1 rounded-full hover:bg-slate-100/10 cursor-pointer ${isSigningInWithGoogle ? "opacity-30 cursor-not-allowed" : ""}`}
                disabled={isSigningInWithGoogle}
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            {isSigningInWithGoogle ? (
              <div className="flex flex-col items-center justify-center py-10 gap-4">
                <div className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
                <div className="text-center">
                  <p className="text-sm font-semibold">Signing in...</p>
                  <p className="text-xs text-slate-400 mt-1">Connecting to Google services</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-450">Choose a Google Account to continue to ChatGroup.</p>
                
                {/* Mock Accounts List */}
                <div className="space-y-2">
                  {[
                    {
                      name: "Krupali Bathani",
                      email: "krupali.bathani@gmail.com",
                      avatar: PRESET_AVATARS[0]
                    },
                    {
                      name: "Om Gadhiya",
                      email: "omgadhiya97@gmail.com",
                      avatar: "/om_gadhiya.png"
                    },
                    {
                      name: "David Williams",
                      email: "david.williams@gmail.com",
                      avatar: "/david_williams.png"
                    }
                  ].map((acc, index) => (
                    <button
                      key={index}
                      onClick={() => handleGoogleSignIn(acc.name, acc.email, acc.avatar)}
                      className={`w-full p-3 border rounded-xl flex items-center gap-3 transition-all active:scale-[0.98] cursor-pointer text-left ${
                        isDark 
                          ? "border-slate-800 hover:bg-slate-900 bg-slate-950" 
                          : "border-slate-200 hover:bg-slate-50 bg-white"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-slate-200">
                        {acc.avatar.startsWith("/") ? (
                          <img src={acc.avatar} className="w-full h-full object-cover" onError={(e) => {
                            e.currentTarget.src = PRESET_AVATARS[index];
                          }} />
                        ) : (
                          <img src={acc.avatar} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{acc.name}</p>
                        <p className="text-xs text-slate-400 truncate">{acc.email}</p>
                      </div>
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>

                {/* Separator / Custom Email option */}
                <div className="flex items-center my-3 w-full">
                  <div className={`flex-grow border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}></div>
                  <span className={`mx-3 text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-slate-600" : "text-slate-400"}`}>or</span>
                  <div className={`flex-grow border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}></div>
                </div>

                {/* Custom Google Account Input */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!googleCustomEmail.trim()) return;
                    const email = googleCustomEmail.trim().toLowerCase();
                    const prefix = email.split("@")[0];
                    const formattedName = prefix
                      .split(/[\._\-]+/)
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(" ");
                    const randomAvatar = PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)];
                    handleGoogleSignIn(formattedName, email, randomAvatar);
                  }}
                  className="space-y-3"
                >
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Use custom email</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. yourname@gmail.com"
                      value={googleCustomEmail}
                      onChange={(e) => setGoogleCustomEmail(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-xl outline-none text-xs font-semibold shadow-sm transition-colors ${
                        isDark 
                          ? "bg-slate-900 border-slate-800 text-white placeholder-slate-650 focus:border-sky-500/50" 
                          : "bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-sky-500/50"
                      }`}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 font-bold text-white rounded-xl shadow-md transition-all text-xs active:scale-95 cursor-pointer dark:bg-sky-600 dark:hover:bg-sky-500"
                  >
                    Continue
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
