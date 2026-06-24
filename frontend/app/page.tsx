"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { io } from "socket.io-client";
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
  Award,
  Palette,
  ShieldBan
} from "lucide-react";

// Types
interface User {
  username: string;
  email?: string;
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
  edited?: boolean;
  forwarded?: boolean;
  replyToId?: string;
  replyToSender?: string;
  replyToText?: string;
  reactions?: { username: string; emoji: string }[];
}

interface MessageRequest {
  id: string;
  sender: string;
  recipient: string;
  status: 'pending' | 'accepted' | 'declined';
}

interface GroupMessage {
  id: string;
  sender: string;
  senderAvatar: string;
  text: string;
  imageUrl?: string;
  time: string;
  isNew?: boolean;
}

interface GroupChat {
  id: string;
  name: string;
  avatarColor: string;
  members: string[];
  messages: GroupMessage[];
  createdAt: string;
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
const MOCK_CONTACTS: User[] = [];

const EMOJI_CATEGORIES = [
  { name: "Smileys", icon: "😀", list: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "🥵", "🥶", "😱", "😰", "😥", "😓"] },
  { name: "Love", icon: "❤️", list: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💋", "💌"] },
  { name: "Hands", icon: "👍", list: ["👍", "👎", "👊", "✊", "🤛", "🤜", "🤞", "✌️", "🤟", "🤘", "👌", "🤏", "👈", "👉", "👆", "👇", "👋", "🤚", "🖐️", "✋", "🙏", "👏", "🙌", "👐"] },
  { name: "Nature", icon: "🌸", list: ["🐱", "🐶", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐵", "🐒", "🐔", "🐧", "🐦", "🐤", "🦄", "🐝", "🐛", "🦋", "🌸", "🌹", "🍀", "🍁", "🌲", "🔥", "🌈", "☀️", "🌙"] },
  { name: "Food", icon: "🍕", list: ["🍕", "🍔", "🍟", "🌭", "🍿", "🥞", "🥪", "🥗", "🍣", "🍦", "🍩", "🍪", "🎂", "🍫", "🍬", "🍉", "🍓", "🍇", "🍌", "🍎", "🥑", "☕", "🍺", "🍷"] },
  { name: "Objects", icon: "🎮", list: ["🎮", "👾", "🎨", "🎬", "🎤", "🎧", "💻", "📱", "📷", "💡", "💰", "💵", "📝", "🔑", "🚗", "✈️", "⚽", "🏀", "🏆", "🎁", "🎉", "🎈"] }
];

export default function Home() {
  const [customApiBase, setCustomApiBase] = useState<string>("");
  const [showServerSettings, setShowServerSettings] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("chatgroup_custom_api_base");
      if (saved) {
        setCustomApiBase(saved);
      }
    }
  }, []);

  const saveCustomApiBase = (val: string) => {
    let sanitized = val.trim();
    if (sanitized.endsWith("/")) {
      sanitized = sanitized.slice(0, -1);
    }
    setCustomApiBase(sanitized);
    if (typeof window !== "undefined") {
      localStorage.setItem("chatgroup_custom_api_base", sanitized);
    }
  };

  const API_BASE = customApiBase || process.env.NEXT_PUBLIC_API_URL || 
    (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
      ? `${window.location.protocol}//${window.location.hostname}:5000`
      : "http://localhost:5000");

  function fetchUsers(loggedInUser?: User | null, autoSelectOnDesktop = false) {
    const userToExclude = loggedInUser !== undefined ? loggedInUser : currentUser;
    fetch(`${API_BASE}/api/users`)
      .then(res => res.json())
      .then(users => {
        if (users && Array.isArray(users)) {
          setRegisteredUsers(users);
          setActiveContact(prev => {
            // Safely filter out the current user if it exists
            const otherUsers = userToExclude && userToExclude.username
              ? users.filter(u => u?.username && userToExclude?.username && u.username.toLowerCase() !== userToExclude.username.toLowerCase())
              : users;
            
            if (prev) {
              const exists = otherUsers.find(u => u && u.username && u.username.toLowerCase() === prev.username.toLowerCase());
              return exists || null;
            }
            
            // Only auto-select on desktop on initial load / login / registration if explicitly allowed
            if (autoSelectOnDesktop && typeof window !== 'undefined' && window.innerWidth >= 768) {
              return otherUsers.length > 0 ? otherUsers[0] : null;
            }
            
            return null;
          });
        }
      })
      .catch(err => console.warn("Error fetching users:", err));
  }

  // Navigation View State
  const [currentView, setCurrentView] = useState("chat"); // "chat" or "settings"
  const [navView, setNavView] = useState<"chat" | "group" | "calls" | "settings">("chat"); // left nav sidebar active view

  // Settings Theme
  const [theme, setTheme] = useState<"light" | "dark" | "black">("dark"); // "dark", "light", or "black"
  const isDark = theme === "dark" || theme === "black";

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  // Password Change States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Show/Hide Password States
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Switch tabs in sidebar
  const [activeSection, setActiveSection] = useState("profile"); // "profile", "security", "appearance", "blocked"

  // 2FA state
  const [twoFactor, setTwoFactor] = useState(false);

  // Blocked users state
  const [blockedUsers, setBlockedUsers] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("chatgroup_blocked_users");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Persist blocked users
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("chatgroup_blocked_users", JSON.stringify(blockedUsers));
    }
  }, [blockedUsers]);

  const toggleBlockUser = (username: string) => {
    setBlockedUsers(prev =>
      prev.includes(username) ? prev.filter(u => u !== username) : [...prev, username]
    );
  };

  const isUserBlocked = (username: string) => blockedUsers.includes(username);

  // Status Alerts
  const [toast, setToast] = useState<string | null>(null);
  const [timeString, setTimeString] = useState("");

  // Chat authentication states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState(PRESET_AVATARS[0]);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);

  // Chat window states
  const [activeContact, setActiveContact] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Message interaction states
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [messageActionsOpenId, setMessageActionsOpenId] = useState<string | null>(null);
  const [chatBackground, setChatBackground] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("chatgroup_background") || "default";
    }
    return "default";
  });

  // Group Chat states
  const GROUP_AVATAR_COLORS = ["#E53E3E", "#DD6B20", "#38A169", "#3182CE", "#805AD5", "#D53F8C", "#319795", "#E8EA7A"];
  const [groups, setGroups] = useState<GroupChat[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("chatgroup_groups");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [activeGroup, setActiveGroup] = useState<GroupChat | null>(null);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);
  const [groupInputText, setGroupInputText] = useState("");
  const [groupSearchQuery, setGroupSearchQuery] = useState("");

  const getChatBgStyles = () => {
    switch (chatBackground) {
      case "starry":
        return {
          backgroundImage: "url('/starry_sky.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        };
      case "nude-minimalist":
        return {
          backgroundImage: "url('/nude_minimalist.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        };
      case "aurora-glow":
        return {
          backgroundImage: "url('/aurora_glow.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        };
      case "cyberpunk-neon":
        return {
          backgroundImage: "url('/cyberpunk_neon.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        };
      case "forest-mist":
        return {
          backgroundImage: "url('/forest_mist.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        };
      case "cute-shinchan":
        return {
          backgroundColor: "#FEDEC9",
          backgroundImage: "url('/cute_shinchan.png')",
          backgroundSize: "contain",
          backgroundPosition: "right bottom",
          backgroundRepeat: "no-repeat"
        };
      case "cute-chibi":
        return {
          backgroundColor: "#FFE9EF",
          backgroundImage: "url('/cute_chibi.png')",
          backgroundSize: "contain",
          backgroundPosition: "right bottom",
          backgroundRepeat: "no-repeat"
        };
      case "cute-retro":
        return {
          backgroundImage: "url('/cute_retro.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        };
      case "retro-blobs":
        return {
          backgroundImage: "url('/retro_blobs.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        };
      case "nature-lake":
        return {
          backgroundImage: "url('/nature_lake.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        };
      case "rainy-weather":
        return {
          backgroundImage: "url('/rainy_weather.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        };
      case "tangled":
        return {
          backgroundColor: "#404528",
          backgroundImage: "url('/tangled.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        };
      case "bows-pattern":
        return {
          backgroundColor: "#FFEFDF",
          backgroundImage: "url('/bows_pattern.png')",
          backgroundSize: "180px auto",
          backgroundPosition: "center",
          backgroundRepeat: "repeat"
        };
      case "spiderman":
        return {
          backgroundColor: "#BF373B",
          backgroundImage: "url('/spiderman.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        };
      case "nude-cream":
        return { backgroundColor: "#FAF8F5" };
      case "nude-sand":
        return { backgroundColor: "#EADBC8" };
      case "nude-tan":
        return { backgroundColor: "#DAC0A3" };
      case "nude-rose":
        return { backgroundColor: "#E8DCD5" };
      case "solid-dark":
        return { backgroundColor: "#121214" };
      case "sunset":
        return {
          backgroundColor: "#18181b",
          backgroundImage: "linear-gradient(135deg, rgba(217, 119, 6, 0.25) 0%, rgba(225, 29, 72, 0.25) 50%, rgba(147, 51, 234, 0.25) 100%)",
          backgroundSize: "cover"
        };
      default:
        return {};
    }
  };

  const getMessageBubbleStyles = (isMe: boolean) => {
    // Default fallback classes
    const defaultMe = "bg-[#3D1B5C] text-[#FFFFFF] rounded-br-sm shadow-sm";
    const defaultOtherDark = "bg-[#2E2E33] text-[#E8E8F0] rounded-bl-sm border border-[#2E2E33]";
    const defaultOtherLight = "bg-[#F0F0F8] text-[#252529] rounded-bl-sm border border-[#E0E0EA]";
    const defaultOther = isDark ? defaultOtherDark : defaultOtherLight;

    if (chatBackground === "default") {
      return isMe ? { className: defaultMe } : { className: defaultOther };
    }

    switch (chatBackground) {
      case "starry":
        return isMe 
          ? { style: { backgroundColor: "rgba(79, 70, 229, 0.85)", color: "#FFFFFF" } } // Deep Indigo
          : { style: { backgroundColor: "rgba(30, 41, 59, 0.8)", color: "#E2E8F0", borderColor: "rgba(71, 85, 105, 0.4)", borderWidth: "1px", borderStyle: "solid" } };
      case "nude-minimalist":
      case "nude-cream":
      case "nude-sand":
      case "nude-tan":
      case "nude-rose":
        return isMe
          ? { style: { backgroundColor: "#8C6239", color: "#FFFFFF" } } // Warm Terracotta / Clay Brown
          : { style: { backgroundColor: "#F5EBE6", color: "#4A3E3D", borderColor: "#E6D5CC", borderWidth: "1px", borderStyle: "solid" } };
      case "aurora-glow":
        return isMe
          ? { style: { backgroundColor: "rgba(13, 148, 136, 0.9)", color: "#FFFFFF" } } // Aurora Teal
          : { style: { backgroundColor: "rgba(15, 23, 42, 0.85)", color: "#2DD4BF", borderColor: "rgba(20, 184, 166, 0.3)", borderWidth: "1px", borderStyle: "solid" } };
      case "cyberpunk-neon":
        return isMe
          ? { style: { backgroundColor: "#EC4899", color: "#FFFFFF", boxShadow: "0 0 10px rgba(236, 72, 153, 0.5)" } } // Hot Pink Glow
          : { style: { backgroundColor: "#1E1B4B", color: "#38BDF8", borderColor: "#4338CA", borderWidth: "1px", borderStyle: "solid" } }; // Cyber Indigo/Cyan
      case "forest-mist":
        return isMe
          ? { style: { backgroundColor: "#556B2F", color: "#FFFFFF" } } // Dark Olive Green
          : { style: { backgroundColor: "#FAF0E6", color: "#2E3B1E", borderColor: "#D2B48C", borderWidth: "1px", borderStyle: "solid" } }; // Linen
      case "cute-shinchan":
        return isMe
          ? { style: { backgroundColor: "#E53E3E", color: "#FFFFFF" } } // McDonald's Red
          : { style: { backgroundColor: "#FFF8F0", color: "#5C3E35", borderColor: "#FED7D7", borderWidth: "1px", borderStyle: "solid" } }; // Soft donut cream
      case "cute-chibi":
        return isMe
          ? { style: { backgroundColor: "#FF6B8B", color: "#FFFFFF" } } // Strawberry pink
          : { style: { backgroundColor: "#FFF5F5", color: "#4A2B2D", borderColor: "#FFE3E3", borderWidth: "1px", borderStyle: "solid" } };
      case "cute-retro":
      case "retro-blobs":
        return isMe
          ? { style: { backgroundColor: "#D97706", color: "#FFFFFF" } } // Terracotta Orange
          : { style: { backgroundColor: "#ECFDF5", color: "#065F46", borderColor: "#A7F3D0", borderWidth: "1px", borderStyle: "solid" } }; // Pale Emerald / Sage Green
      case "nature-lake":
        return isMe
          ? { style: { backgroundColor: "#C2410C", color: "#FFFFFF" } } // Rust / Autumn Orange
          : { style: { backgroundColor: "#F0FDF4", color: "#166534", borderColor: "#BBF7D0", borderWidth: "1px", borderStyle: "solid" } }; // Pale Mint
      case "rainy-weather":
        return isMe
          ? { style: { backgroundColor: "#475569", color: "#FFFFFF" } } // Slate Gray
          : { style: { backgroundColor: "#F1F5F9", color: "#1E293B", borderColor: "#E2E8F0", borderWidth: "1px", borderStyle: "solid" } }; // Rain Light Gray
      case "tangled":
        return isMe
          ? { style: { backgroundColor: "#7C3AED", color: "#FFFFFF" } } // Royal Purple
          : { style: { backgroundColor: "#FEF9C3", color: "#713F12", borderColor: "#FEF08A", borderWidth: "1px", borderStyle: "solid" } }; // Rapunzel Blonde/Yellow
      case "bows-pattern":
        return isMe
          ? { style: { backgroundColor: "#F472B6", color: "#FFFFFF" } } // Cotton Candy Pink
          : { style: { backgroundColor: "#FFFDF9", color: "#854D0E", borderColor: "#FED7AA", borderWidth: "1px", borderStyle: "solid" } }; // Light Cream Cherry
      case "spiderman":
        return isMe
          ? { style: { backgroundColor: "#E53E3E", color: "#FFFFFF" } } // Spider-Man Red
          : { style: { backgroundColor: "#1E293B", color: "#F472B6", borderColor: "#F472B6", borderWidth: "1px", borderStyle: "solid" } }; // Gwen Stacy Dark/Pink
      case "solid-dark":
        return isMe
          ? { style: { backgroundColor: "#3F3F46", color: "#FFFFFF" } } // Zinc-700
          : { style: { backgroundColor: "#18181B", color: "#E4E4E7", borderColor: "#27272A", borderWidth: "1px", borderStyle: "solid" } }; // Zinc-900
      case "sunset":
        return isMe
          ? { style: { backgroundColor: "#E11D48", color: "#FFFFFF" } } // Rose-600
          : { style: { backgroundColor: "rgba(24, 24, 27, 0.75)", color: "#F4F4F5", borderColor: "rgba(63, 63, 70, 0.4)", borderWidth: "1px", borderStyle: "solid" } }; // Translucent sunset message
      default:
        return isMe ? { className: defaultMe } : { className: defaultOther };
    }
  };

  // --- Group Chat Helpers ---
  // Persist groups to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("chatgroup_groups", JSON.stringify(groups));
    }
  }, [groups]);

  // Keep activeGroup in sync with groups array (e.g. after new messages)
  useEffect(() => {
    if (activeGroup) {
      const updated = groups.find(g => g.id === activeGroup.id);
      if (updated) setActiveGroup(updated);
    }
  }, [groups]);

  const createGroup = () => {
    if (!newGroupName.trim() || selectedGroupMembers.length === 0 || !currentUser) return;
    const newGroup: GroupChat = {
      id: `group_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: newGroupName.trim(),
      avatarColor: GROUP_AVATAR_COLORS[groups.length % GROUP_AVATAR_COLORS.length],
      members: [currentUser.username, ...selectedGroupMembers],
      messages: [],
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setGroups(prev => [newGroup, ...prev]);
    setActiveGroup(newGroup);
    setNewGroupName("");
    setSelectedGroupMembers([]);
    setIsCreateGroupModalOpen(false);
  };

  const sendGroupMessage = (groupId: string, text: string) => {
    if (!text.trim() || !currentUser) return;
    const newMsg: GroupMessage = {
      id: `gmsg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sender: currentUser.username,
      senderAvatar: currentUser.avatarUrl,
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isNew: true,
    };
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, messages: [...g.messages, newMsg] } : g));
    setGroupInputText("");
  };

  const getGroupLastMessage = (group: GroupChat) => {
    if (group.messages.length === 0) return { text: "No messages yet", time: group.createdAt };
    const last = group.messages[group.messages.length - 1];
    const senderPrefix = last.sender === currentUser?.username ? "You" : last.sender.split(" ")[0];
    return { text: `${senderPrefix}: ${last.text}`, time: last.time };
  };

  const getGroupInitials = (name: string) => {
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  };

  const toggleGroupMember = (username: string) => {
    setSelectedGroupMembers(prev =>
      prev.includes(username) ? prev.filter(m => m !== username) : [...prev, username]
    );
  };
  
  // Emoji Picker states
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState("Smileys");
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Right side panel toggles
  const [isDetailPaneOpen, setIsDetailPaneOpen] = useState(false);

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
  const socketRef = useRef<any>(null);
  const tempMessageIdRef = useRef<string | null>(null);
  const activeContactRef = useRef<User | null>(null);
  const chatImageInputRef = useRef<HTMLInputElement>(null);

  // Live Camera Snap states & refs
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [liveCameraError, setLiveCameraError] = useState<string | null>(null);
  const [liveCameraStream, setLiveCameraStream] = useState<MediaStream | null>(null);
  const liveCameraVideoRef = useRef<HTMLVideoElement>(null);

  // Message Requests state
  const [messageRequests, setMessageRequests] = useState<MessageRequest[]>([]);

  // Video devices state hooks
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");

  // Call state variables
  const [callState, setCallState] = useState<"idle" | "calling" | "ringing" | "connected">("idle");
  const [callType, setCallType] = useState<"audio" | "video">("video");
  const [callerName, setCallerName] = useState("");
  const [calleeName, setCalleeName] = useState("");
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [incomingCallInfo, setIncomingCallInfo] = useState<any>(null);

  // Call WebRTC refs
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  
  // Audio feedback synthesis
  const ringingOscillatorRef = useRef<AudioContext | null>(null);
  const toneIntervalRef = useRef<any>(null);

  // Refs for preventing stale closures in socket events
  const callStateRef = useRef<"idle" | "calling" | "ringing" | "connected">("idle");
  const incomingCallInfoRef = useRef<any>(null);
  const calleeNameRef = useRef<string>("");

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  useEffect(() => {
    incomingCallInfoRef.current = incomingCallInfo;
  }, [incomingCallInfo]);

  useEffect(() => {
    calleeNameRef.current = calleeName;
  }, [calleeName]);

  // Bind streams to video tags dynamically when elements mount/update
  useEffect(() => {
    if (localStreamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [callState, localVideoRef.current]);

  useEffect(() => {
    if (remoteStreamRef.current && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    }
  }, [callState, remoteVideoRef.current]);

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

  // --- Audio feedback tone synthesis ---
  const startRingingTone = () => {
    stopTones();
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      ringingOscillatorRef.current = ctx;

      const playPulse = () => {
        if (ctx.state === 'closed') return;
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.frequency.setValueAtTime(440, ctx.currentTime);
        gain1.gain.setValueAtTime(0.05, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.3);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.frequency.setValueAtTime(440, ctx.currentTime + 0.4);
        gain2.gain.setValueAtTime(0.05, ctx.currentTime + 0.4);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.7);
      };

      playPulse();
      toneIntervalRef.current = setInterval(playPulse, 2000);
    } catch (e) {
      console.warn("Could not start ringing tone", e);
    }
  };

  const startCallingTone = () => {
    stopTones();
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      ringingOscillatorRef.current = ctx;

      const playPulse = () => {
        if (ctx.state === 'closed') return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.2);
      };

      playPulse();
      toneIntervalRef.current = setInterval(playPulse, 2500);
    } catch (e) {
      console.warn("Could not start calling tone", e);
    }
  };

  const stopTones = () => {
    if (toneIntervalRef.current) {
      clearInterval(toneIntervalRef.current);
      toneIntervalRef.current = null;
    }
    if (ringingOscillatorRef.current) {
      try {
        ringingOscillatorRef.current.close();
      } catch (e) {}
      ringingOscillatorRef.current = null;
    }
  };

  // --- WebRTC signaling handlers & teardowns ---
  const handleEndCallRef = useRef<any>(null);
  handleEndCallRef.current = (notifyPeer = true) => {
    stopTones();

    // Notify other peer
    if (notifyPeer && socketRef.current && socketRef.current.connected) {
      const peer = callStateRef.current === 'ringing' && incomingCallInfoRef.current ? incomingCallInfoRef.current.from : calleeNameRef.current || (incomingCallInfoRef.current && incomingCallInfoRef.current.from);
      if (peer) {
        socketRef.current.emit('endCall', { to: peer });
      }
    }

    // Stop local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Stop remote stream tracks (if any)
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => track.stop());
      remoteStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Reset state
    setCallState('idle');
    setIncomingCallInfo(null);
    setCalleeName('');
    setCallerName('');
    setIsMicMuted(false);
    setIsCameraOff(false);
    setVideoDevices([]);
    setSelectedVideoDevice('');
  };

  const getDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const vDevices = devices.filter(device => device.kind === 'videoinput');
      setVideoDevices(vDevices);
      if (vDevices.length > 0 && !selectedVideoDevice) {
        setSelectedVideoDevice(vDevices[0].deviceId);
      }
    } catch (e) {
      console.warn("Error enumerating devices:", e);
    }
  };

  const changeVideoDevice = async (deviceId: string) => {
    setSelectedVideoDevice(deviceId);
    if (localStreamRef.current) {
      try {
        const oldTrack = localStreamRef.current.getVideoTracks()[0];
        if (oldTrack) {
          oldTrack.stop();
          localStreamRef.current.removeTrack(oldTrack);
        }

        const constraints = {
          audio: false,
          video: { deviceId: { exact: deviceId }, width: 1280, height: 720 }
        };

        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        const newTrack = newStream.getVideoTracks()[0];

        if (newTrack) {
          localStreamRef.current.addTrack(newTrack);

          // Update local video element
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
            localVideoRef.current.srcObject = localStreamRef.current;
          }

          // Replace track in RTCRtpSender
          if (peerConnectionRef.current) {
            const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
            if (sender) {
              await sender.replaceTrack(newTrack);
              console.log("WebRTC: Video track swapped.");
            }
          }
        }
      } catch (error) {
        console.error("Error switching video device:", error);
        alert("Could not swap camera device.");
      }
    }
  };

  const initializePeerConnection = (targetUsername: string, localStream: MediaStream) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" }
      ]
    });

    peerConnectionRef.current = pc;

    // Add local tracks to peer connection
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    // Send local ICE candidates to peer
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("iceCandidate", {
          to: targetUsername,
          candidate: event.candidate
        });
      }
    };

    // Receive remote tracks
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        const rStream = event.streams[0];
        remoteStreamRef.current = rStream;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = rStream;
        }
      }
    };

    return pc;
  };

  const startCall = async (type: "audio" | "video") => {
    if (!currentUser || !activeContact) return;

    setCallState("calling");
    setCallType(type);
    setCalleeName(activeContact.username);
    setCallerName(currentUser.username);
    startCallingTone();

    try {
      const constraints = {
        audio: true,
        video: type === "video" ? { width: 1280, height: 720 } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      await getDevices();

      const pc = initializePeerConnection(activeContact.username, stream);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("callUser", {
          to: activeContact.username,
          from: currentUser.username,
          offer,
          callType: type
        });
      }
    } catch (e) {
      console.error("Error starting media call:", e);
      alert("Could not access camera/microphone. Please check permissions.");
      handleEndCallRef.current(true);
    }
  };

  const acceptCall = async () => {
    if (!currentUser || !incomingCallInfo) return;
    stopTones();
    setCallState("connected");

    try {
      const constraints = {
        audio: true,
        video: incomingCallInfo.callType === "video" ? { width: 1280, height: 720 } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      await getDevices();

      const pc = initializePeerConnection(incomingCallInfo.from, stream);
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCallInfo.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("answerCall", {
          to: incomingCallInfo.from,
          answer
        });
      }
    } catch (e) {
      console.error("Error accepting call:", e);
      alert("Could not access camera/microphone. Please check permissions.");
      handleEndCallRef.current(true);
    }
  };

  const declineCall = () => {
    handleEndCallRef.current(true);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  };

  const flipCamera = async () => {
    if (videoDevices.length <= 1) return;
    const currentIndex = videoDevices.findIndex(d => d.deviceId === selectedVideoDevice);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % videoDevices.length;
    const nextDevice = videoDevices[nextIndex];
    if (nextDevice) {
      await changeVideoDevice(nextDevice.deviceId);
    }
  };

  // Close calls on component unmount
  useEffect(() => {
    return () => {
      if (handleEndCallRef.current) {
        handleEndCallRef.current(true);
      }
    };
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

  // Fetch message requests from server
  const fetchRequests = () => {
    const userVal = localStorage.getItem("chatgroup_current_user");
    if (!userVal) return;
    const parsed = JSON.parse(userVal);
    fetch(`${API_BASE}/api/requests?user=${parsed.username}`)
      .then(res => res.json())
      .then(reqs => {
        if (reqs && Array.isArray(reqs)) {
          setMessageRequests(reqs);
        }
      })
      .catch(err => console.warn("Error fetching requests:", err));
  };

  // Fetch unread messages count from server
  const fetchUnreadMessagesCount = () => {
    const userVal = localStorage.getItem("chatgroup_current_user");
    if (!userVal) return;
    try {
      const parsed = JSON.parse(userVal);
      fetch(`${API_BASE}/api/messages/unread-count?user=${parsed.username}`)
        .then(res => res.json())
        .then(data => {
          if (data && typeof data.count === 'number') {
            setUnreadMessagesCount(data.count);
          }
        })
        .catch(err => console.warn("Error fetching unread count:", err));
    } catch (e) {
      console.warn("Error parsing current user", e);
    }
  };

  // Helper to resolve request status between current user and a contact
  const getChatRelationship = (contactUsername: string) => {
    if (!currentUser || !currentUser.username || !contactUsername) return null;
    
    // Mock contacts are disabled

    const match = messageRequests.find(r => 
      (currentUser?.username && r.sender.toLowerCase() === currentUser.username.toLowerCase() && r.recipient.toLowerCase() === contactUsername.toLowerCase()) ||
      (contactUsername && r.sender.toLowerCase() === contactUsername.toLowerCase() && currentUser?.username && r.recipient.toLowerCase() === currentUser.username.toLowerCase())
    );
    return match || null;
  };

  const checkUsernameAvailability = async () => {
    if (!username) { setUsernameAvailable(null); return; }
    try {
      const res = await fetch(`${API_BASE}/api/users/check-username?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      setUsernameAvailable(data.available);
      if (!data.available) {
        // Username taken
      }
    } catch (e) {
      console.warn("Username check failed", e);
      setUsernameAvailable(null);
    }
  };

  const sendChatRequest = (recipientUsername: string) => {
    if (!currentUser) return;
    const existing = getChatRelationship(recipientUsername);
    if (existing) {
      // If it exists and was declined, reset to pending
      fetch(`${API_BASE}/api/requests`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: existing.id, status: 'pending' })
      })
      .then(res => res.json())
      .then(updatedReq => {
        if (updatedReq.error) {
          alert(updatedReq.error);
          return;
        }
        setMessageRequests(prev => prev.map(r => r.id === existing.id ? updatedReq : r));
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit("sendRequest", updatedReq);
        }
        setToast("Chat request sent! ✉️");
        setTimeout(() => setToast(null), 3000);
      })
      .catch(err => console.error("Error resetting chat request:", err));
      return;
    }

    // Normal POST
    fetch(`${API_BASE}/api/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender: currentUser.username, recipient: recipientUsername })
    })
    .then(res => res.json())
    .then(newReq => {
      if (newReq.error) {
        alert(newReq.error);
        return;
      }
      setMessageRequests(prev => [...prev, newReq]);
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("sendRequest", newReq);
      }
      setToast("Chat request sent! ✉️");
      setTimeout(() => setToast(null), 3000);
    })
    .catch(err => console.error("Error sending chat request:", err));
  };

  const updateChatRequest = (requestId: string, newStatus: 'accepted' | 'declined') => {
    if (!currentUser) return;
    fetch(`${API_BASE}/api/requests`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, status: newStatus })
    })
    .then(res => res.json())
    .then(updatedReq => {
      if (updatedReq.error) {
        alert(updatedReq.error);
        return;
      }
      setMessageRequests(prev => prev.map(r => r.id === requestId ? updatedReq : r));
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("updateRequest", updatedReq);
      }
      setToast(`Request ${newStatus}! 🎉`);
      setTimeout(() => setToast(null), 3000);
    })
    .catch(err => console.error("Error updating chat request:", err));
  };

  // 1. Initial Load from Local Cache
  useEffect(() => {
    const savedTheme = localStorage.getItem("chatgroup_theme") as "light" | "dark" | "black" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    const savedUser = localStorage.getItem("chatgroup_current_user");
    let initialUser = null;
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.username) {
          initialUser = parsed;
          // Restore user immediately from cache — no network needed
          setCurrentUser(parsed);
          setName(parsed.username);
          setUsername(parsed.username);
          setBio(parsed.bio || "Available to chat in real-time.");
          setAvatar(parsed.avatarUrl);
          if (parsed.email) setEmail(parsed.email);
          const token = localStorage.getItem("chatgroup_session_token");
          if (token) setCurrentPassword(token);

          // Validate session: if backend restarted (in-memory DB wiped),
          // silently re-register the user so they stay logged in without interruption.
          fetch(`${API_BASE}/api/users`)
            .then(res => res.json())
            .then(users => {
              if (users && Array.isArray(users)) {
                const exists = users.some(u => u && u.username && u.username.toLowerCase() === parsed.username.toLowerCase());
                if (!exists) {
                  // User not found in DB (backend was restarted). Re-register silently.
                  console.log("Session restored from cache. Re-syncing user to backend (DB was reset)...");
                  // Use the stored real password if available, otherwise use a deterministic fallback
                  const storedToken = localStorage.getItem("chatgroup_session_token");
                  const reRegBody = {
                    username: parsed.username,
                    email: parsed.email || `${parsed.username.toLowerCase().replace(/\s+/g, "")}@gmail.com`,
                    password: storedToken || ("chatgroup_auto_restore_" + parsed.username),
                    avatarUrl: parsed.avatarUrl,
                    category: parsed.category || "MEMBER",
                    bio: parsed.bio || "Joined Chitchat."
                  };
                  fetch(`${API_BASE}/api/users/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(reRegBody)
                  })
                  .then(r => r.json())
                  .then(newUser => {
                    if (newUser && newUser.username) {
                      // Update localStorage with fresh backend data
                      const merged = { ...parsed, ...newUser };
                      localStorage.setItem("chatgroup_current_user", JSON.stringify(merged));
                      setCurrentUser(merged);
                      console.log("User silently re-registered after backend restart:", merged.username);
                    }
                  })
                  .catch(err => console.warn("Silent re-register failed (non-critical):", err));
                }
              }
            })
            .catch(err => console.warn("Failed to validate cached user (non-critical):", err));
        } else {
          localStorage.removeItem("chatgroup_current_user");
        }
      } catch (e) {
        localStorage.removeItem("chatgroup_current_user");
      }
    }

    fetchUsers(initialUser, true);
    fetchRequests();
    fetchUnreadMessagesCount();
  }, [API_BASE]);

  // Save theme changes to Local Cache
  useEffect(() => {
    localStorage.setItem("chatgroup_theme", theme);
  }, [theme]);

  // Poll users periodically
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUsers(currentUser, false);
      fetchRequests();
      fetchUnreadMessagesCount();
    }, 10000);
    return () => clearInterval(interval);
  }, [API_BASE, currentUser]);

  // Keep activeContactRef updated to prevent stale closures in socket events
  useEffect(() => {
    activeContactRef.current = activeContact;
  }, [activeContact]);

  // Socket.io Real-time connection and event listeners
  useEffect(() => {
    if (!currentUser) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(API_BASE);
    socketRef.current = socket;

    const registerSocket = () => {
      console.log("Registering socket for user:", currentUser.username);
      socket.emit("join", currentUser.username);
    };

    if (socket.connected) {
      registerSocket();
    }

    socket.on("connect", () => {
      console.log("Connected to WebSockets server:", socket.id);
      registerSocket();
    });

    // Listen for incoming messages
    socket.on("newMessage", (newMsg: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      const currentActive = activeContactRef.current;
      if (currentActive && currentActive.username === newMsg.sender && currentUser?.username) {
        playSound("receive");
        fetch(`${API_BASE}/api/messages/read`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: newMsg.sender,
            recipient: currentUser.username
          })
        }).catch(err => console.warn("Error marking message as read:", err));

        // Emit socket read update instantly
        socket.emit("readMessages", {
          sender: newMsg.sender,
          recipient: currentUser.username
        });
      } else {
        playSound("receive");
        setUnreadMessagesCount((prev) => prev + 1);
      }
      setTimeout(() => scrollToBottom("smooth"), 50);
    });

    // Listen for message confirmation/acks from server
    socket.on("messageAck", (ackedMsg: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === ackedMsg.id)) return prev;
        const hasTemp = tempMessageIdRef.current && prev.some(m => m.id === tempMessageIdRef.current);
        if (hasTemp) {
          return prev.map(m => m.id === tempMessageIdRef.current ? ackedMsg : m);
        } else {
          return [...prev, ackedMsg];
        }
      });
      setTimeout(() => scrollToBottom("smooth"), 50);
    });

    // Listen for message edit events from server
    socket.on("messageEdited", (editedMsg: Message) => {
      setMessages((prev) => prev.map((m) => m.id === editedMsg.id ? { ...m, text: editedMsg.text, edited: true } : m));
    });

    // Listen for message reaction updates from server
    socket.on("messageReactionUpdated", (data: { id: string; reactions: { username: string; emoji: string }[] }) => {
      setMessages((prev) => prev.map((m) => m.id === data.id ? { ...m, reactions: data.reactions } : m));
    });

    // Listen for read receipts from other users
    socket.on("messagesRead", (data: { reader: string }) => {
      if (!data || !data.reader) return;
      setMessages((prev) =>
        prev.map((msg) =>
          msg && msg.recipient && msg.recipient.toLowerCase() === data.reader.toLowerCase()
            ? { ...msg, status: "read" }
            : msg
        )
      );
    });

    // Listen for delivery updates
    socket.on("messagesDelivered", (data: { sender: string; recipient: string }) => {
      if (!data || !data.sender || !data.recipient) return;
      setMessages((prev) =>
        prev.map((msg) =>
          msg && msg.sender && msg.recipient &&
          msg.sender.toLowerCase() === data.sender.toLowerCase() &&
          msg.recipient.toLowerCase() === data.recipient.toLowerCase() &&
          msg.status === "sent"
            ? { ...msg, status: "delivered" }
            : msg
        )
      );
    });

    // Listen for typing indicator
    socket.on("typing", (data: { from: string; isTyping: boolean }) => {
      setTypingUsers((prev) => ({ ...prev, [data.from]: data.isTyping }));
    });

    // Listen for read receipts
    socket.on("messagesRead", (data: { reader: string }) => {
      console.log("Read receipts received. User read our messages:", data.reader);
      setMessages((prev) =>
        prev.map((m) =>
          m.recipient === data.reader && m.status !== "read"
            ? { ...m, status: "read" }
            : m
        )
      );
    });

    // Listen for online/offline statuses
    socket.on("userStatus", (data: { username: string; status: "online" | "offline" }) => {
      setOnlineUsers((prev) => ({ ...prev, [data.username]: data.status }));
    });

    // Listen for incoming WebRTC calls and signaling
    socket.on("incomingCall", (data: { from: string; offer: any; callType: "audio" | "video" }) => {
      console.log("incomingCall event received from:", data.from, "current callState:", callStateRef.current);
      if (callStateRef.current !== "idle") {
        socket.emit("endCall", { to: data.from });
        return;
      }
      setIncomingCallInfo(data);
      setCallState("ringing");
      setCallType(data.callType);
      setCallerName(data.from);
      startRingingTone();
    });

    socket.on("callAnswered", async (data: { answer: any }) => {
      console.log("callAnswered event received");
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          setCallState("connected");
          stopTones();
        } catch (e) {
          console.error("Error setting remote answer description:", e);
          if (handleEndCallRef.current) {
            handleEndCallRef.current(true);
          }
        }
      }
    });

    socket.on("iceCandidate", async (data: { candidate: any }) => {
      if (peerConnectionRef.current && data.candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error("Error adding ice candidate:", e);
        }
      }
    });

    socket.on("endCall", () => {
      console.log("endCall event received from peer");
      if (handleEndCallRef.current) {
        handleEndCallRef.current(false);
      }
    });

    socket.on("callError", (data: { message: string }) => {
      alert(data.message);
      if (handleEndCallRef.current) {
        handleEndCallRef.current(false);
      }
    });

    socket.on("incomingRequest", (newReq: MessageRequest) => {
      setMessageRequests((prev) => {
        if (prev.some((r) => r.id === newReq.id)) return prev;
        return [...prev, newReq];
      });
      setToast(`Incoming message request from ${newReq.sender}! ✉️`);
      setTimeout(() => setToast(null), 3000);
    });

    socket.on("requestUpdated", (updatedReq: MessageRequest) => {
      setMessageRequests((prev) =>
        prev.map((r) => r.id === updatedReq.id ? updatedReq : r)
      );
      setToast(`Chat request was ${updatedReq.status}! 🎉`);
      setTimeout(() => setToast(null), 3000);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUser?.username, API_BASE]);

  // Load messages & read receipts on conversation change
  useEffect(() => {
    if (currentUser && activeContact) {
      fetch(`${API_BASE}/api/messages?user1=${currentUser.username}&user2=${activeContact.username}`)
        .then(res => res.json())
        .then(msgs => {
          if (msgs && Array.isArray(msgs)) {
            setMessages(msgs);
            setTimeout(() => scrollToBottom("smooth"), 50);
          }
        })
        .catch(err => console.warn("Error fetching messages:", err));

      // Mark messages as read
      if (activeContact.username && currentUser?.username) {
        fetch(`${API_BASE}/api/messages/read`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: activeContact.username,
            recipient: currentUser.username
          })
        })
        .then(() => {
          fetchUnreadMessagesCount();
        })
        .catch(err => console.warn("Error marking messages as read:", err));
      }

      // Emit read status through WebSockets
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("readMessages", {
          sender: activeContact.username,
          recipient: currentUser.username
        });
      }
    }
  }, [activeContact, currentUser, API_BASE]);

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
              } else {
                fetchUnreadMessagesCount();
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
          fetchUnreadMessagesCount();
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
    if (!currentUser || !activeContact) return;

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("typing", {
        from: currentUser.username,
        to: activeContact.username,
        isTyping: textLength > 0
      });
    }

    if (myTypingTimeoutRef.current) {
      clearTimeout(myTypingTimeoutRef.current);
    }

    if (textLength > 0) {
      myTypingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current && socketRef.current.connected && currentUser && activeContact) {
          socketRef.current.emit("typing", {
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

  // Submit login form
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!authEmail.trim() || !authPassword) return;
    if (isAuthLoading) return;

    setIsAuthLoading(true);
    fetch(`${API_BASE}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: authEmail.trim(),
        password: authPassword.trim()  // trim to avoid accidental leading/trailing spaces
      })
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed. Please try again.");
      }
      return data;
    })
    .then(user => {
      setCurrentUser(user);
      const userWithMeta = { ...user, email: user.email };
      localStorage.setItem("chatgroup_current_user", JSON.stringify(userWithMeta));
      // Store session token (password) for silent re-registration after backend restart
      localStorage.setItem("chatgroup_session_token", authPassword.trim());
      setCurrentPassword(authPassword.trim());

      // Sync settings dashboard profiles
      setName(user.username);
      setUsername(user.username);
      setAvatar(user.avatarUrl);
      setBio(user.bio || "");
      setEmail(user.email || "");

      fetchUsers(user, true);
      setToast("Logged in successfully! 👋");
      setTimeout(() => setToast(null), 3000);
    })
    .catch(err => {
      console.error("Login error:", err);
      const msg = err.message || "Login failed. Please check your credentials.";
      // Show a friendly message - don't expose internal server URLs
      if (msg.includes("fetch") || msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        setAuthError("Cannot connect to server. Make sure the backend is running.");
      } else {
        setAuthError(msg);
      }
    })
    .finally(() => {
      setIsAuthLoading(false);
    });
  };

  // Submit registration form
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!regUsername.trim() || !regEmail.trim() || !regPassword) return;

    if (isAuthLoading) return;

    // Basic client-side validation
    if (!regEmail.trim().toLowerCase().includes("@")) {
      setAuthError("A valid email address is required.");
      return;
    }

    if (regPassword.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }

    const reqBody = {
      username: regUsername.trim(),
      email: regEmail.trim().toLowerCase(),
      password: regPassword.trim(),  // trim to avoid accidental spaces
      avatarUrl: selectedAvatarUrl,
      category: "MEMBER",
      bio: "Joined Chitchat. Let's communicate in real-time."
    };

    setIsAuthLoading(true);
    fetch(`${API_BASE}/api/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqBody)
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed. Please try again.");
      }
      return data;
    })
    .then(newUser => {
      setCurrentUser(newUser);
      const userWithMeta = { ...newUser, email: newUser.email };
      localStorage.setItem("chatgroup_current_user", JSON.stringify(userWithMeta));
      // Store session token (password) for silent re-registration after backend restart
      localStorage.setItem("chatgroup_session_token", regPassword.trim());
      setCurrentPassword(regPassword.trim());

      // Sync settings dashboard profiles
      setName(newUser.username);
      setUsername(newUser.username);
      setAvatar(newUser.avatarUrl);
      setBio(newUser.bio || "");
      setEmail(newUser.email || "");

      fetchUsers(newUser, true);
      setRegUsername("");
      setRegEmail("");
      setRegPassword("");
      setToast("Account created successfully! 🎉");
      setTimeout(() => setToast(null), 3000);

      const channel = new BroadcastChannel("chatgroup_realtime");
      channel.postMessage({
        type: "USER_REGISTER",
        user: newUser
      });
      channel.close();
    })
    .catch(err => {
      console.error("Registration error:", err);
      const msg = err.message || "Registration failed. Please try again.";
      if (msg.includes("fetch") || msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        setAuthError("Cannot connect to server. Make sure the backend is running.");
      } else {
        setAuthError(msg);
      }
    })
    .finally(() => {
      setIsAuthLoading(false);
    });
  };

  // Send message submit
  const handleSendMessage = (textToSend = inputText, imageLink?: string) => {
    const textContent = textToSend.trim();
    if (!textContent && !imageLink) return;
    if (!currentUser || !activeContact) return;

    // Handle Edit message
    if (editingMessage) {
      if (!textContent) return;
      
      // Update locally
      setMessages((prev) => prev.map((m) => m.id === editingMessage.id ? { ...m, text: textContent, edited: true } : m));
      setInputText("");
      setEditingMessage(null);
      
      // Emit through Socket
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("editMessage", {
          id: editingMessage.id,
          text: textContent
        });
      } else {
        // Fallback to REST API
        fetch(`${API_BASE}/api/messages/${editingMessage.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textContent })
        }).catch(err => console.error("Error editing message via REST fallback:", err));
      }
      return;
    }

    const timeStringVal = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });

    const tempId = Math.random().toString(36).substring(2, 9);
    tempMessageIdRef.current = tempId;

    const newMsg: Message = {
      id: tempId,
      sender: currentUser.username,
      recipient: activeContact.username,
      text: textContent,
      imageUrl: imageLink,
      time: timeStringVal,
      status: "sent"
    };

    // Add reply properties if replying
    if (replyingToMessage) {
      newMsg.replyToId = replyingToMessage.id;
      newMsg.replyToSender = replyingToMessage.sender;
      newMsg.replyToText = replyingToMessage.text || (replyingToMessage.imageUrl ? "📷 Image" : "");
    }

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
    setReplyingToMessage(null); // Reset reply state
    playSound("send");
    setTimeout(() => scrollToBottom("smooth"), 50);

    // Emit message through Socket
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("sendMessage", {
        sender: currentUser.username,
        recipient: activeContact.username,
        text: textContent,
        imageUrl: imageLink,
        time: timeStringVal,
        replyToId: newMsg.replyToId,
        replyToSender: newMsg.replyToSender,
        replyToText: newMsg.replyToText
      });

      socketRef.current.emit("typing", {
        from: currentUser.username,
        to: activeContact.username,
        isTyping: false
      });
    } else {
      // Fallback to REST API
      fetch(`${API_BASE}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMsg)
      })
      .then(res => res.json())
      .then(savedMsg => {
        setMessages(prev => prev.map(m => m.id === tempId ? savedMsg : m));
      })
      .catch(err => console.error("Error saving message via REST fallback:", err));
    }

    // Mock auto-reply triggered by MOCK_CONTACTS is disabled
  };

  const handleForwardMessage = (targetContactUsername: string) => {
    if (!forwardingMessage || !currentUser) return;

    const timeStringVal = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
    const tempId = Math.random().toString(36).substring(2, 9);

    const newMsg: Message = {
      id: tempId,
      sender: currentUser.username,
      recipient: targetContactUsername,
      text: forwardingMessage.text,
      imageUrl: forwardingMessage.imageUrl,
      time: timeStringVal,
      status: "sent",
      forwarded: true
    };

    // Add locally if the active chat is this contact
    if (activeContact && activeContact.username.toLowerCase() === targetContactUsername.toLowerCase()) {
      setMessages((prev) => [...prev, newMsg]);
      setTimeout(() => scrollToBottom("smooth"), 50);
    }

    // Emit through Socket
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("sendMessage", {
        sender: currentUser.username,
        recipient: targetContactUsername,
        text: forwardingMessage.text,
        imageUrl: forwardingMessage.imageUrl,
        time: timeStringVal,
        forwarded: true
      });
    } else {
      // Fallback REST
      fetch(`${API_BASE}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMsg)
      })
      .catch(err => console.error("Error saving forwarded message:", err));
    }

    setForwardingMessage(null);
    setToast(`Message forwarded to ${targetContactUsername}! ↪️`);
    setTimeout(() => setToast(null), 3000);
  };

  const handleMessageReaction = (messageId: string, emoji: string) => {
    if (!currentUser) return;

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("messageReaction", {
        id: messageId,
        username: currentUser.username,
        emoji
      });
    }
  };


  const handleChatImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setToast("Compressing & sending image... 📤");
    setTimeout(() => setToast(null), 3000);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 800;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const base64Data = canvas.toDataURL("image/jpeg", 0.75);
          handleSendMessage("", base64Data);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const startLiveCamera = async () => {
    setLiveCameraError(null);
    setCapturedPhoto(null);
    setIsLiveCameraOpen(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "user" },
        audio: false
      });
      setLiveCameraStream(stream);
      setTimeout(() => {
        if (liveCameraVideoRef.current) {
          liveCameraVideoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      setLiveCameraError("Could not access your camera. Please ensure permissions are granted.");
    }
  };

  const stopLiveCamera = () => {
    if (liveCameraStream) {
      liveCameraStream.getTracks().forEach((track) => track.stop());
      setLiveCameraStream(null);
    }
    setIsLiveCameraOpen(false);
    setCapturedPhoto(null);
    setLiveCameraError(null);
  };

  const captureLivePhoto = () => {
    if (liveCameraVideoRef.current) {
      const video = liveCameraVideoRef.current;
      const canvas = document.createElement("canvas");
      const MAX_SIZE = 800;
      let width = video.videoWidth || 640;
      let height = video.videoHeight || 480;

      if (width > height) {
        if (width > MAX_SIZE) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        setCapturedPhoto(dataUrl);
      }
    }
  };

  const sendLivePhoto = () => {
    if (capturedPhoto) {
      handleSendMessage("", capturedPhoto);
      stopLiveCamera();
    }
  };

  function handleLogout() {
    setCurrentUser(null);
    setActiveContact(null);
    setCurrentView("chat");
    localStorage.removeItem("chatgroup_current_user");
    localStorage.removeItem("chatgroup_session_token");
  }

  // Resolve chat relationship and status
  const activeRelationship = activeContact ? getChatRelationship(activeContact.username) : null;
  const isAccepted = activeRelationship?.status === "accepted";

  const pendingRequestsCount = currentUser
    ? messageRequests.filter(r => r.recipient.toLowerCase() === currentUser.username.toLowerCase() && r.status === 'pending').length
    : 0;
  const totalUnreadCount = unreadMessagesCount + pendingRequestsCount;

  // Filters messages for selected user
  const conversationMessages = messages.filter(
    (msg) =>
      currentUser &&
      activeContact &&
      ((msg.sender === currentUser.username && msg.recipient === activeContact.username) ||
        (msg.sender === activeContact.username && msg.recipient === currentUser.username))
  );

  // Filters contacts list for sidebar search (real humans with Gmail accounts only, excluding AI/mock bots)
  const filteredContacts = registeredUsers.filter(
    (u) => {
      if (!currentUser || !currentUser.username || !u || !u.username || !u.email) return false;
      
      const usernameLower = u.username.toLowerCase();
      const emailLower = u.email.toLowerCase();
      const forbidden = ['paul', 'ai', 'bot', 'assistant'];
      const isAi = forbidden.some(keyword => usernameLower.includes(keyword) || emailLower.includes(keyword));
      
      return (
        usernameLower !== currentUser.username.toLowerCase() &&
        usernameLower.includes(searchQuery.toLowerCase()) &&
        !isAi
      );
    }
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
    if (status === "sent") {
      return (
        <Check className="w-3.5 h-3.5 inline ml-1 text-slate-400 transition-colors duration-300" strokeWidth={3} />
      );
    }
    const color = status === "read" ? "text-[#E8EA7A]" : "text-slate-400";
    return (
      <CheckCheck className={`w-3.5 h-3.5 inline ml-1 ${color} transition-colors duration-300`} strokeWidth={3} />
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
    if (!newPassword) return { score: 0, label: "None", color: "bg-[#2E2E33]", text: "text-slate-500" };
    let score = 0;
    if (hasMinLength) score++;
    if (hasCapital) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;

    switch (score) {
      case 1: return { score: 33, label: "Weak ⚠️", color: "bg-rose-500/80", text: "text-rose-400" };
      case 2: return { score: 66, label: "Medium ⚡", color: "bg-amber-500/80", text: "text-[#E8EA7A]" };
      case 3: return { score: 100, label: "Strong ✨", color: "bg-emerald-500/80", text: "text-emerald-400" };
      default: return { score: 10, label: "Too Short ❌", color: "bg-rose-600/85", text: "text-rose-500" };
    }
  };

  const passwordStrength = getPasswordStrength();

  // Save profile and sync to currentUser states
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    if (currentUser) {
      // Update profile with username, email and bio
      const reqBody = {
        username,
        email,
        bio: bio.trim()
      };

      fetch(`${API_BASE}/api/users/update-profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody)
      })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to update profile");
        }
        return data;
      })
      .then(updatedUser => {
        setCurrentUser(updatedUser);
        localStorage.setItem("chatgroup_current_user", JSON.stringify(updatedUser));

        fetchUsers(updatedUser, false);

        if (channelRef.current) {
          channelRef.current.postMessage({
            type: "USER_REGISTER",
            user: updatedUser
          });
        }
        setToast("Account details updated successfully! 🎉");
        setTimeout(() => setToast(null), 3000);
      })
      .catch(err => {
        console.error("Error updating profile:", err);
        setToast(err.message || "Error updating profile. Please try again. ❌");
        setTimeout(() => setToast(null), 3000);
      });
    }
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New password and confirm password do not match!");
      return;
    }
    if (!currentUser) return;

    fetch(`${API_BASE}/api/users/change-password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: currentUser.email,
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim()
      })
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password");
      }
      return data;
    })
    .then(() => {
      localStorage.setItem("chatgroup_session_token", newPassword.trim());
      setCurrentPassword(newPassword.trim());
      setNewPassword("");
      setConfirmPassword("");
      setToast("Password updated successfully! 🛡️");
      setTimeout(() => setToast(null), 3000);
    })
    .catch(err => {
      console.error("Error updating password:", err);
      alert(err.message || "Failed to update password. Please check your current password.");
    });
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
          : isDark ? "bg-[#252529] text-[#FFFFFF]" 
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
            isDark ? "bg-[#E8EA7A]/10 opacity-100" : "bg-[#E8EA7A]/5 opacity-80"
          }`} />
          <div className={`absolute bottom-[10%] right-[10%] w-[450px] h-[450px] rounded-full blur-[140px] transition-opacity duration-700 ${
            isDark ? "bg-[#3D1B5C]/10 opacity-100" : "bg-[#3D1B5C]/5 opacity-80"
          }`} />
        </div>

        {/* Floating Toast Notification */}
        {toast && (
          <div className="fixed top-8 z-50 bg-[#E8EA7A] text-[#1E1E22] font-extrabold px-6 py-4 rounded-full shadow-md shadow-[#E8EA7A]/10 text-sm tracking-wide flex items-center gap-2.5 animate-bounce border border-white/20">
            <CheckCheck className="w-5 h-5 text-slate-950" />
            <span>{toast}</span>
          </div>
        )}

        <div className="w-full max-w-5xl z-10 space-y-6">
          
          {/* Top Header Panel */}
          <div className={`relative border rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden transition-colors duration-500 ${
            isDark ? "bg-[#1F1F23] border-[#2E2E33]" 
              : "bg-white border-slate-200"
          }`}>
            
            <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#E8EA7A] to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#3D1B5C] to-transparent" />

            <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
              {/* Back to Chat Trigger */}
              <button
                onClick={() => { setCurrentView("chat"); setNavView("chat"); }}
                className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                  isDark ? "bg-[#2E2E33] border-[#2E2E33] text-[#E8EA7A] hover:bg-[#35353B]"
                    : "bg-white border-slate-200 text-slate-800 hover:bg-slate-100 shadow-sm"
                }`}
                title="Back to ChatRoom"
              >
                <ArrowRight className="w-4.5 h-4.5 rotate-180" />
              </button>

              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FFFFFF] via-[#A0A0A0] to-[#FFFFFF] dark:from-white dark:to-slate-400 from-slate-950 to-slate-700">
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
                onClick={() => {
                  setTheme(prev => {
                    const next = prev === "light" ? "dark" : prev === "dark" ? "black" : "light";
                    setToast(next === "light" ? "Light Theme Activated ☀️" : next === "dark" ? "Dark Theme Activated 🌙" : "OLED Black Theme Activated 🌑");
                    setTimeout(() => setToast(null), 2500);
                    return next;
                  });
                }}
                className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                  theme === "black"
                    ? "bg-[#121212] border-neutral-900 text-[#E8EA7A] hover:bg-neutral-900"
                    : isDark ? "bg-[#2E2E33] border-[#2E2E33] text-[#E8EA7A] hover:bg-[#35353B]"
                      : "bg-white border-slate-200 text-slate-800 hover:bg-slate-100 shadow-sm"
                }`}
                title={`Toggle Theme (Current: ${theme === "black" ? "OLED Black" : isDark ? "Dark Mode" : "Light Mode"})`}
              >
                {theme === "black" ? (
                  <Sun className="w-4.5 h-4.5" />
                ) : isDark ? (
                  <Sparkles className="w-4.5 h-4.5" />
                ) : (
                  <Moon className="w-4.5 h-4.5" />
                )}
              </button>

              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border select-none ${
                isDark ? "bg-[#1F1F23]/80 border-[#2E2E33]" : "bg-white border-slate-200 shadow-sm"
              }`}>
                <Clock className="w-4 h-4 text-[#E8EA7A]" />
                <span className="text-xs font-bold">{timeString || "12:37"}</span>
                <div className="w-px h-3 bg-slate-850" />
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Secured</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="hidden lg:block lg:col-span-4 space-y-6">
              {/* User Profile Card */}
              <div className={`border rounded-[28px] p-5 shadow-xl transition-all duration-500 flex flex-col items-center text-center ${
                isDark ? "bg-[#1F1F23] border-[#2E2E33]" : "bg-white border-slate-200 shadow-md"
              }`}>
                <div className="relative group mb-3">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-[#E8EA7A] to-[#3D1B5C] opacity-60 blur-xs" />
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border-[2.5px] border-slate-950 bg-slate-900">
                    <img
                      src={currentUser?.avatarUrl || avatar}
                      alt={currentUser?.username || name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                </div>
                <h3 className="text-sm font-extrabold tracking-tight">{currentUser?.username || name}</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate w-full mt-0.5">{currentUser?.email || email}</p>
              </div>

              <div className={`border rounded-[28px] p-5 shadow-xl transition-all duration-500 ${
                isDark ? "bg-[#1F1F23] border-[#2E2E33]" : "bg-white border-slate-200 shadow-md"
              }`}>
                <h3 className={`text-xs font-extrabold uppercase tracking-wider mb-4 px-1.5 ${isDark ? "text-slate-400" : "text-black"}`}>Settings Hub</h3>
                
                <div className="space-y-1.5">
                  <button
                    onClick={() => setActiveSection("profile")}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl font-black text-xs.5 transition-all text-left border cursor-pointer ${
                      activeSection === "profile"
                        ? "bg-[#E8EA7A]/12 text-[#E8EA7A] border border-[#E8EA7A]/15 shadow-sm shadow-[#E8EA7A]/5"
                        : "bg-transparent border-transparent text-slate-400 hover:text-[#FFFFFF] hover:bg-[#35353B]/50"
                    }`}
                  >
                    <UserIcon className="w-4.5 h-4.5" />
                    <span>Account Details</span>
                  </button>

                  <button
                    onClick={() => setActiveSection("security")}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl font-black text-xs.5 transition-all text-left border cursor-pointer ${
                      activeSection === "security"
                        ? "bg-[#E8EA7A]/12 text-[#E8EA7A] border border-[#E8EA7A]/15 shadow-sm shadow-[#E8EA7A]/5"
                        : "bg-transparent border-transparent text-slate-400 hover:text-[#FFFFFF] hover:bg-[#35353B]/50"
                    }`}
                  >
                    <Lock className="w-4.5 h-4.5" />
                    <span>Password & Security</span>
                  </button>

                  <button
                    onClick={() => setActiveSection("appearance")}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl font-black text-xs.5 transition-all text-left border cursor-pointer ${
                      activeSection === "appearance"
                        ? "bg-[#E8EA7A]/12 text-[#E8EA7A] border border-[#E8EA7A]/15 shadow-sm shadow-[#E8EA7A]/5"
                        : "bg-transparent border-transparent text-slate-400 hover:text-[#FFFFFF] hover:bg-[#35353B]/50"
                    }`}
                  >
                    <Palette className="w-4.5 h-4.5" />
                    <span>Chat Appearance</span>
                  </button>

                  <button
                    onClick={() => setActiveSection("blocked")}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl font-black text-xs.5 transition-all text-left border cursor-pointer ${
                      activeSection === "blocked"
                        ? "bg-red-500/10 text-red-500 border-red-500/20 shadow-sm shadow-red-500/5"
                        : "bg-transparent border-transparent text-slate-400 hover:text-[#FFFFFF] hover:bg-[#35353B]/50"
                    }`}
                  >
                    <ShieldBan className="w-4.5 h-4.5" />
                    <span>Blocked Users</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl font-black text-xs.5 transition-all text-left border cursor-pointer bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                    <span>Log Out</span>
                  </button>
                </div>
              </div>


            </div>

            <div className="lg:col-span-8 w-full space-y-4">
              <div className={`flex lg:hidden gap-1.5 p-1.5 rounded-2xl border transition-colors duration-500 ${
                isDark ? "bg-[#1F1F23]/80 border-[#2E2E33]" 
                  : "bg-white border-slate-200 shadow-sm"
              }`}>
                <button
                  type="button"
                  onClick={() => setActiveSection("profile")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs.5 transition-all cursor-pointer ${
                    activeSection === "profile"
                      ? isDark ? "bg-[#E8EA7A]/12 text-[#E8EA7A] border border-[#E8EA7A]/15"
                        : "bg-[#E8EA7A]/10 text-[#E8EA7A] border border-[#E8EA7A]/20"
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
                      ? isDark ? "bg-[#E8EA7A]/12 text-[#E8EA7A] border border-[#E8EA7A]/15"
                        : "bg-[#E8EA7A]/10 text-[#E8EA7A] border border-[#E8EA7A]/20"
                      : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500"
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>Security</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection("appearance")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs.5 transition-all cursor-pointer ${
                    activeSection === "appearance"
                      ? isDark ? "bg-[#E8EA7A]/12 text-[#E8EA7A] border border-[#E8EA7A]/15"
                        : "bg-[#E8EA7A]/10 text-[#E8EA7A] border border-[#E8EA7A]/20"
                      : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500"
                  }`}
                >
                  <Palette className="w-4 h-4" />
                  <span>Appearance</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection("blocked")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs.5 transition-all cursor-pointer ${
                    activeSection === "blocked"
                      ? isDark ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : "bg-red-50 text-red-600 border border-red-200"
                      : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500"
                  }`}
                >
                  <ShieldBan className="w-4 h-4" />
                  <span className="hidden sm:inline">Blocked</span>
                </button>
              </div>

              {/* Mobile User Profile Card & Log Out */}
              <div className={`flex lg:hidden flex-col sm:flex-row items-center justify-between gap-4 p-4 border rounded-[24px] transition-all duration-500 ${
                isDark ? "bg-[#1F1F23] border-[#2E2E33]" : "bg-white border-slate-200 shadow-sm"
              }`}>
                <div className="flex items-center gap-3.5 text-left w-full sm:w-auto">
                  <div className="relative group flex-shrink-0">
                    <div className="absolute -inset-0.5 rounded-full bg-gradient-to-tr from-[#E8EA7A] to-[#3D1B5C] opacity-60 blur-xs" />
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-slate-950 bg-slate-900">
                      <img
                        src={currentUser?.avatarUrl || avatar}
                        alt={currentUser?.username || name}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold truncate">{currentUser?.username || name}</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{currentUser?.email || email}</p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-xs transition-all border cursor-pointer bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                  <span>Log Out</span>
                </button>
              </div>
              
              {activeSection === "profile" && (
                <div className={`border rounded-[32px] p-6 md:p-8 shadow-2xl transition-all duration-500 relative overflow-hidden ${
                  isDark ? "bg-[#1F1F23] border-[#2E2E33]" : "bg-white border-slate-200 shadow-md"
                }`}>
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="border-b border-[#2E2E33] pb-4 flex items-center justify-between select-none">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-5 h-5 text-[#E8EA7A]" />
                        <h2 className="text-lg font-black tracking-wide">Account Profile Details</h2>
                      </div>
                      <span className="text-[10px] text-slate-500 bg-slate-900 border border-[#2E2E33] px-2.5 py-1 rounded-full font-bold">Information</span>
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
                              isDark ? "bg-[#252529] border-[#2E2E33] text-white focus:border-[#E8EA7A]/80 focus:ring-2 focus:ring-[#E8EA7A]/10" 
                                : "bg-slate-50 border-slate-200 text-black font-semibold focus:border-[#E8EA7A] focus:ring-2 focus:ring-[#E8EA7A]/10"
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
                            onBlur={checkUsernameAvailability}
                            className={`w-full border rounded-2xl px-4 py-3.5 text-xs.5 outline-none transition duration-300 ${isDark ? "bg-[#252529] border-[#2E2E33] text-white focus:border-[#E8EA7A]/80 focus:ring-2 focus:ring-[#E8EA7A]/10" : "bg-slate-50 border-slate-200 text-black font-semibold focus:border-[#E8EA7A] focus:ring-2 focus:ring-[#E8EA7A]/10"}`}
                            placeholder="Your username..."
                            required
                          />
                          {usernameAvailable === false && (
                            <p className="text-rose-400 text-xs mt-1">Username already taken</p>
                          )}
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
                              isDark ? "bg-[#252529] border-[#2E2E33] text-white focus:border-[#E8EA7A]/80 focus:ring-2 focus:ring-[#E8EA7A]/10" 
                                : "bg-slate-50 border-slate-200 text-black font-semibold focus:border-[#E8EA7A] focus:ring-2 focus:ring-[#E8EA7A]/10"
                            }`}
                            placeholder="your.email@domain.com"
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
                            isDark ? "bg-[#252529] border-[#2E2E33] text-white focus:border-[#E8EA7A]/80 focus:ring-2 focus:ring-[#E8EA7A]/10" 
                              : "bg-slate-50 border-slate-200 text-black font-semibold focus:border-[#E8EA7A] focus:ring-2 focus:ring-[#E8EA7A]/10"
                          }`}
                          placeholder="Write something about yourself..."
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full group bg-[#E8EA7A] hover:bg-[#F3F59B] text-[#1E1E22] font-black py-4 rounded-2xl text-xs.5 transition-all shadow-md flex items-center justify-center gap-1.5 mt-4 select-none cursor-pointer"
                    >
                      <Save className="w-4.5 h-4.5" /> Save Account Profile Details
                    </button>
                  </form>
                </div>
              )}

              {activeSection === "security" && (
                <div className={`border rounded-[32px] p-6 md:p-8 shadow-2xl transition-all duration-500 relative overflow-hidden ${
                  isDark ? "bg-[#1F1F23] border-[#2E2E33]" : "bg-white border-slate-200 shadow-md"
                }`}>
                  <form onSubmit={handleSavePassword} className="space-y-6">
                    <div className="border-b border-[#2E2E33] pb-4 flex items-center justify-between select-none">
                      <div className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-[#E8EA7A]" />
                        <h2 className="text-lg font-black tracking-wide">Change Password Settings</h2>
                      </div>
                      <span className="text-[10px] text-slate-500 bg-slate-900 border border-[#2E2E33] px-2.5 py-1 rounded-full font-bold">Authentication</span>
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
                              isDark ? "bg-[#252529] border-[#2E2E33] text-white focus:border-[#E8EA7A]/80 focus:ring-2 focus:ring-[#E8EA7A]/10" 
                                : "bg-slate-50 border-slate-200 text-black font-semibold focus:border-[#E8EA7A] focus:ring-2 focus:ring-[#E8EA7A]/10"
                            }`}
                            placeholder="Type current password..."
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#E8EA7A] transition-colors"
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
                            className={`w-full border rounded-2xl pl-4 pr-11 py-3.5 text-xs.5 outline-none transition duration-300 ${isDark ? "bg-[#252529] border-[#2E2E33] text-white focus:border-[#E8EA7A]/80 focus:ring-2 focus:ring-[#E8EA7A]/10" : "bg-slate-50 border-slate-200 text-black font-semibold focus:border-[#E8EA7A] focus:ring-2 focus:ring-[#E8EA7A]/10"}`}
                            placeholder="Type new secure password..."
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#E8EA7A] transition-colors"
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
                              isDark ? "bg-[#252529] border-[#2E2E33] text-white focus:border-[#E8EA7A]/80 focus:ring-2 focus:ring-[#E8EA7A]/10" 
                                : "bg-slate-50 border-slate-200 text-black font-semibold focus:border-[#E8EA7A] focus:ring-2 focus:ring-[#E8EA7A]/10"
                            }`}
                            placeholder="Verify new secure password..."
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#E8EA7A] transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#E8EA7A] text-[#1E1E22] font-black py-4 rounded-2xl text-xs.5 hover:bg-[#F3F59B] transition-all flex items-center justify-center gap-1.5 mt-4 shadow-md select-none cursor-pointer"
                    >
                      <Key className="w-4.5 h-4.5" /> Save New Password
                    </button>
                  </form>

                  <div className="mt-8 pt-8 border-t border-[#2E2E33]">
                    <div className="flex items-center gap-2 mb-4">
                      <Award className="w-5 h-5 text-[#E8EA7A]" />
                      <h3 className="text-xs font-extrabold uppercase text-slate-350 tracking-wider">Security Health</h3>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="relative w-18 h-18 rounded-full border-4 border-[#2E2E33] flex items-center justify-center flex-shrink-0">
                        <div className="absolute inset-0 rounded-full border-4 border-[#E8EA7A] transition-all duration-500" style={{ clipPath: `polygon(0 0, 100% 0, 100% ${securityScore}%, 0 ${securityScore}%)` }} />
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

                    <div className="mt-5 pt-4 border-t border-[#2E2E33] flex items-center justify-between">
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
                          twoFactor ? "bg-[#E8EA7A]" : "bg-[#2E2E33]"
                        }`}
                      >
                        <div className={`w-4.5 h-4.5 rounded-full bg-slate-950 transition-transform duration-300 ${
                          twoFactor ? "translate-x-4.5 bg-white" : "translate-x-0"
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "appearance" && (
                <div className={`border rounded-[32px] p-6 md:p-8 shadow-2xl transition-all duration-500 relative overflow-hidden ${
                  isDark ? "bg-[#0A0A0C]/90 border-slate-900" : "bg-white border-slate-200 shadow-md"
                }`}>
                  <div className="border-b border-slate-850/50 pb-4 flex items-center justify-between select-none mb-6">
                    <div className="flex items-center gap-2">
                      <Palette className="w-5 h-5 text-[#E8EA7A]" />
                      <h2 className="text-lg font-black tracking-wide">Chat Appearance</h2>
                    </div>
                    <span className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full font-bold">Theme Settings</span>
                  </div>

                  <div className="space-y-6">
                    <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      Choose a custom background style to customize your messaging panel.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {/* Default Theme */}
                      <button
                        type="button"
                        onClick={() => {
                          setChatBackground("default");
                          localStorage.setItem("chatgroup_background", "default");
                        }}
                        className={`flex flex-col text-left rounded-2xl border p-4 transition-all duration-350 cursor-pointer group ${
                          chatBackground === "default" || !chatBackground
                            ? "border-[#E8EA7A]/80 bg-[#E8EA7A]/5 shadow-[0_8px_20px_rgba(232,234,122,0.15)]"
                            : isDark ? "border-slate-800 bg-slate-950/20 hover:border-slate-700" : "border-slate-200 bg-slate-50 hover:border-slate-350"
                        }`}
                      >
                        <div className={`w-full h-24 rounded-xl mb-3 flex items-center justify-center border border-slate-850/30 ${
                          theme === "black" ? "bg-black" : isDark ? "bg-[#252529]" : "bg-[#F5F5FA]"
                        }`}>
                          <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? "text-slate-400" : "text-slate-600"}`}>Default Theme</span>
                        </div>
                        <span className="text-xs.5 font-bold">Default Background</span>
                        <span className="text-[9px] text-slate-500 mt-0.5">Adapts dynamically to the general theme settings</span>
                      </button>

                      {/* Starry Sky Theme */}
                      <button
                        type="button"
                        onClick={() => {
                          setChatBackground("starry");
                          localStorage.setItem("chatgroup_background", "starry");
                        }}
                        className={`flex flex-col text-left rounded-2xl border p-4 transition-all duration-350 cursor-pointer group ${
                          chatBackground === "starry"
                            ? "border-[#E8EA7A]/80 bg-[#E8EA7A]/5 shadow-[0_8px_20px_rgba(232,234,122,0.15)]"
                            : isDark ? "border-slate-800 bg-slate-950/20 hover:border-slate-700" : "border-slate-200 bg-slate-50 hover:border-slate-350"
                        }`}
                      >
                        <div 
                          className="w-full h-24 rounded-xl mb-3 flex items-center justify-center border border-slate-850/30"
                          style={{
                            backgroundImage: "url('/starry_sky.png')",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat"
                          }}
                        >
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-200 bg-black/60 px-2 py-1 rounded">Starry Sky</span>
                        </div>
                        <span className="text-xs.5 font-bold">Starry Sky</span>
                        <span className="text-[9px] text-slate-500 mt-0.5">A gorgeous cosmos aesthetic filled with stars</span>
                      </button>

                      {/* Nude Organic Minimalist Theme */}
                      <button
                        type="button"
                        onClick={() => {
                          setChatBackground("nude-minimalist");
                          localStorage.setItem("chatgroup_background", "nude-minimalist");
                        }}
                        className={`flex flex-col text-left rounded-2xl border p-4 transition-all duration-350 cursor-pointer group ${
                          chatBackground === "nude-minimalist"
                            ? "border-[#E8EA7A]/80 bg-[#E8EA7A]/5 shadow-[0_8px_20px_rgba(232,234,122,0.15)]"
                            : isDark ? "border-slate-800 bg-slate-950/20 hover:border-slate-700" : "border-slate-200 bg-slate-50 hover:border-slate-350"
                        }`}
                      >
                        <div 
                          className="w-full h-24 rounded-xl mb-3 flex items-center justify-center border border-slate-850/30"
                          style={{
                            backgroundImage: "url('/nude_minimalist.png')",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat"
                          }}
                        >
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-800 bg-white/70 px-2 py-1 rounded">Nude Organic</span>
                        </div>
                        <span className="text-xs.5 font-bold">Nude Organic</span>
                        <span className="text-[9px] text-slate-500 mt-0.5">Elegant minimalist nude background with organic flows</span>
                      </button>

                      {/* Nude Cream Theme */}
                      <button
                        type="button"
                        onClick={() => {
                          setChatBackground("nude-cream");
                          localStorage.setItem("chatgroup_background", "nude-cream");
                        }}
                        className={`flex flex-col text-left rounded-2xl border p-4 transition-all duration-350 cursor-pointer group ${
                          chatBackground === "nude-cream"
                            ? "border-[#E8EA7A]/80 bg-[#E8EA7A]/5 shadow-[0_8px_20px_rgba(232,234,122,0.15)]"
                            : isDark ? "border-slate-800 bg-slate-950/20 hover:border-slate-700" : "border-slate-200 bg-slate-50 hover:border-slate-350"
                        }`}
                      >
                        <div className="w-full h-24 rounded-xl mb-3 flex items-center justify-center border border-slate-850/30 bg-[#FAF8F5]">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600">Nude Cream</span>
                        </div>
                        <span className="text-xs.5 font-bold">Nude Cream</span>
                        <span className="text-[9px] text-slate-500 mt-0.5">A clean, warm cream tone soft on the eyes</span>
                      </button>

                      {/* Nude Sand Theme */}
                      <button
                        type="button"
                        onClick={() => {
                          setChatBackground("nude-sand");
                          localStorage.setItem("chatgroup_background", "nude-sand");
                        }}
                        className={`flex flex-col text-left rounded-2xl border p-4 transition-all duration-350 cursor-pointer group ${
                          chatBackground === "nude-sand"
                            ? "border-[#E8EA7A]/80 bg-[#E8EA7A]/5 shadow-[0_8px_20px_rgba(232,234,122,0.15)]"
                            : isDark ? "border-slate-800 bg-slate-950/20 hover:border-slate-700" : "border-slate-200 bg-slate-50 hover:border-slate-350"
                        }`}
                      >
                        <div className="w-full h-24 rounded-xl mb-3 flex items-center justify-center border border-slate-850/30 bg-[#EADBC8]">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-700">Nude Sand</span>
                        </div>
                        <span className="text-xs.5 font-bold">Nude Sand</span>
                        <span className="text-[9px] text-slate-500 mt-0.5">A natural warm sandy beige color palette</span>
                      </button>

                      {/* Nude Tan Theme */}
                      <button
                        type="button"
                        onClick={() => {
                          setChatBackground("nude-tan");
                          localStorage.setItem("chatgroup_background", "nude-tan");
                        }}
                        className={`flex flex-col text-left rounded-2xl border p-4 transition-all duration-350 cursor-pointer group ${
                          chatBackground === "nude-tan"
                            ? "border-[#E8EA7A]/80 bg-[#E8EA7A]/5 shadow-[0_8px_20px_rgba(232,234,122,0.15)]"
                            : isDark ? "border-slate-800 bg-slate-950/20 hover:border-slate-700" : "border-slate-200 bg-slate-50 hover:border-slate-350"
                        }`}
                      >
                        <div className="w-full h-24 rounded-xl mb-3 flex items-center justify-center border border-slate-850/30 bg-[#DAC0A3]">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-800">Nude Tan</span>
                        </div>
                        <span className="text-xs.5 font-bold">Nude Tan</span>
                        <span className="text-[9px] text-slate-500 mt-0.5">A cozy tan tone blending warmth and balance</span>
                      </button>

                      {/* Nude Rose Theme */}
                      <button
                        type="button"
                        onClick={() => {
                          setChatBackground("nude-rose");
                          localStorage.setItem("chatgroup_background", "nude-rose");
                        }}
                        className={`flex flex-col text-left rounded-2xl border p-4 transition-all duration-350 cursor-pointer group ${
                          chatBackground === "nude-rose"
                            ? "border-[#E8EA7A]/80 bg-[#E8EA7A]/5 shadow-[0_8px_20px_rgba(232,234,122,0.15)]"
                            : isDark ? "border-slate-800 bg-slate-950/20 hover:border-slate-700" : "border-slate-200 bg-slate-50 hover:border-slate-350"
                        }`}
                      >
                        <div className="w-full h-24 rounded-xl mb-3 flex items-center justify-center border border-slate-850/30 bg-[#E8DCD5]">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-700">Nude Rose</span>
                        </div>
                        <span className="text-xs.5 font-bold">Nude Rose</span>
                        <span className="text-[9px] text-slate-500 mt-0.5">A soft neutral rose with clay undertones</span>
                      </button>

                      {/* Solid Dark (OLED Black) Theme */}
                      <button
                        type="button"
                        onClick={() => {
                          setChatBackground("solid-dark");
                          localStorage.setItem("chatgroup_background", "solid-dark");
                        }}
                        className={`flex flex-col text-left rounded-2xl border p-4 transition-all duration-350 cursor-pointer group ${
                          chatBackground === "solid-dark"
                            ? "border-[#E8EA7A]/80 bg-[#E8EA7A]/5 shadow-[0_8px_20px_rgba(232,234,122,0.15)]"
                            : isDark ? "border-slate-800 bg-slate-950/20 hover:border-slate-700" : "border-slate-200 bg-slate-50 hover:border-slate-350"
                        }`}
                      >
                        <div className="w-full h-24 rounded-xl mb-3 flex items-center justify-center border border-slate-850/30 bg-[#121214]">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">OLED Black</span>
                        </div>
                        <span className="text-xs.5 font-bold">OLED Black</span>
                        <span className="text-[9px] text-slate-500 mt-0.5">A clean, ultra-dark tone maximizing battery life and eye comfort</span>
                      </button>

                      {/* Sunset Glow Theme */}
                      <button
                        type="button"
                        onClick={() => {
                          setChatBackground("sunset");
                          localStorage.setItem("chatgroup_background", "sunset");
                        }}
                        className={`flex flex-col text-left rounded-2xl border p-4 transition-all duration-350 cursor-pointer group ${
                          chatBackground === "sunset"
                            ? "border-[#E8EA7A]/80 bg-[#E8EA7A]/5 shadow-[0_8px_20px_rgba(232,234,122,0.15)]"
                            : isDark ? "border-slate-800 bg-slate-950/20 hover:border-slate-700" : "border-slate-200 bg-slate-50 hover:border-slate-350"
                        }`}
                      >
                        <div 
                          className="w-full h-24 rounded-xl mb-3 flex items-center justify-center border border-slate-850/30 bg-[#18181b]"
                          style={{
                            backgroundImage: "linear-gradient(135deg, rgba(217, 119, 6, 0.25) 0%, rgba(225, 29, 72, 0.25) 50%, rgba(147, 51, 234, 0.25) 100%)"
                          }}
                        >
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-200 bg-black/60 px-2 py-1 rounded">Sunset Glow</span>
                        </div>
                        <span className="text-xs.5 font-bold">Sunset Glow</span>
                        <span className="text-[9px] text-slate-500 mt-0.5">A warm, sunset-inspired gradient with a relaxing blend of hues</span>
                      </button>

                      {/* Aurora Glow Theme */}
                      <button
                        type="button"
                        onClick={() => {
                          setChatBackground("aurora-glow");
                          localStorage.setItem("chatgroup_background", "aurora-glow");
                        }}
                        className={`flex flex-col text-left rounded-2xl border p-4 transition-all duration-350 cursor-pointer group ${
                          chatBackground === "aurora-glow"
                            ? "border-[#E8EA7A]/80 bg-[#E8EA7A]/5 shadow-[0_8px_20px_rgba(232,234,122,0.15)]"
                            : isDark ? "border-slate-800 bg-slate-950/20 hover:border-slate-700" : "border-slate-200 bg-slate-50 hover:border-slate-350"
                        }`}
                      >
                        <div 
                          className="w-full h-24 rounded-xl mb-3 flex items-center justify-center border border-slate-850/30"
                          style={{
                            backgroundImage: "url('/aurora_glow.png')",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat"
                          }}
                        >
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-200 bg-black/60 px-2 py-1 rounded">Aurora Glow</span>
                        </div>
                        <span className="text-xs.5 font-bold">Aurora Glow</span>
                        <span className="text-[9px] text-slate-500 mt-0.5">A dynamic and gorgeous neon aurora theme</span>
                      </button>

                      {/* Cyberpunk Neon Theme */}
                      <button
                        type="button"
                        onClick={() => {
                          setChatBackground("cyberpunk-neon");
                          localStorage.setItem("chatgroup_background", "cyberpunk-neon");
                        }}
                        className={`flex flex-col text-left rounded-2xl border p-4 transition-all duration-350 cursor-pointer group ${
                          chatBackground === "cyberpunk-neon"
                            ? "border-[#E8EA7A]/80 bg-[#E8EA7A]/5 shadow-[0_8px_20px_rgba(232,234,122,0.15)]"
                            : isDark ? "border-slate-800 bg-slate-950/20 hover:border-slate-700" : "border-slate-200 bg-slate-50 hover:border-slate-350"
                        }`}
                      >
                        <div 
                          className="w-full h-24 rounded-xl mb-3 flex items-center justify-center border border-slate-850/30"
                          style={{
                            backgroundImage: "url('/cyberpunk_neon.png')",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat"
                          }}
                        >
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-200 bg-black/60 px-2 py-1 rounded">Cyberpunk Neon</span>
                        </div>
                        <span className="text-xs.5 font-bold">Cyberpunk Neon</span>
                        <span className="text-[9px] text-slate-500 mt-0.5">Vibrant synthwave grids and neon city flows</span>
                      </button>

                      {/* Forest Mist Theme */}
                      <button
                        type="button"
                        onClick={() => {
                          setChatBackground("forest-mist");
                          localStorage.setItem("chatgroup_background", "forest-mist");
                        }}
                        className={`flex flex-col text-left rounded-2xl border p-4 transition-all duration-350 cursor-pointer group ${
                          chatBackground === "forest-mist"
                            ? "border-[#E8EA7A]/80 bg-[#E8EA7A]/5 shadow-[0_8px_20px_rgba(232,234,122,0.15)]"
                            : isDark ? "border-slate-800 bg-slate-950/20 hover:border-slate-700" : "border-slate-200 bg-slate-50 hover:border-slate-350"
                        }`}
                      >
                        <div 
                          className="w-full h-24 rounded-xl mb-3 flex items-center justify-center border border-slate-850/30"
                          style={{
                            backgroundImage: "url('/forest_mist.png')",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat"
                          }}
                        >
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-800 bg-white/70 px-2 py-1 rounded">Forest Mist</span>
                        </div>
                        <span className="text-xs.5 font-bold">Forest Mist</span>
                        <span className="text-[9px] text-slate-500 mt-0.5">Calming pine forest with peaceful morning fog</span>
                      </button>

                      {/* Cute Shin-chan Theme */}
                      <button
                        type="button"
                        onClick={() => {
                          setChatBackground("cute-shinchan");
                          localStorage.setItem("chatgroup_background", "cute-shinchan");
                        }}
                        className={`flex flex-col text-left rounded-2xl border p-4 transition-all duration-350 cursor-pointer group ${
                          chatBackground === "cute-shinchan"
                            ? "border-[#E8EA7A]/80 bg-[#E8EA7A]/5 shadow-[0_8px_20px_rgba(232,234,122,0.15)]"
                            : isDark ? "border-slate-800 bg-slate-950/20 hover:border-slate-700" : "border-slate-200 bg-slate-50 hover:border-slate-350"
                        }`}
                      >
                        <div 
                          className="w-full h-24 rounded-xl mb-3 flex items-center justify-center border border-slate-850/30"
                          style={{
                            backgroundColor: "#FEDEC9",
                            backgroundImage: "url('/cute_shinchan.png')",
                            backgroundSize: "contain",
                            backgroundPosition: "center bottom",
                            backgroundRepeat: "no-repeat"
                          }}
                        >
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-800 bg-white/70 px-2 py-1 rounded">Cute Shin-chan</span>
                        </div>
                        <span className="text-xs.5 font-bold">Cute Shin-chan</span>
                        <span className="text-[9px] text-slate-500 mt-0.5">Shin-chan enjoying burgers and donuts theme</span>
                      </button>

                      {/* Cute Chibi Theme */}
                      <button
                        type="button"
                        onClick={() => {
                          setChatBackground("cute-chibi");
                          localStorage.setItem("chatgroup_background", "cute-chibi");
                        }}
                        className={`flex flex-col text-left rounded-2xl border p-4 transition-all duration-350 cursor-pointer group ${
                          chatBackground === "cute-chibi"
                            ? "border-[#E8EA7A]/80 bg-[#E8EA7A]/5 shadow-[0_8px_20px_rgba(232,234,122,0.15)]"
                            : isDark ? "border-slate-800 bg-slate-950/20 hover:border-slate-700" : "border-slate-200 bg-slate-50 hover:border-slate-350"
                        }`}
                      >
                        <div 
                          className="w-full h-24 rounded-xl mb-3 flex items-center justify-center border border-slate-850/30"
                          style={{
                            backgroundColor: "#FFE9EF",
                            backgroundImage: "url('/cute_chibi.png')",
                            backgroundSize: "contain",
                            backgroundPosition: "center bottom",
                            backgroundRepeat: "no-repeat"
                          }}
                        >
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-800 bg-white/70 px-2 py-1 rounded">Cute Chibi</span>
                        </div>
                        <span className="text-xs.5 font-bold">Cute Chibi</span>
                        <span className="text-[9px] text-slate-500 mt-0.5">Pastel pink chibi strawberry cupcake theme</span>
                      </button>

                      {/* Cute Retro Theme */}
                      <button
                        type="button"
                        onClick={() => {
                          setChatBackground("cute-retro");
                          localStorage.setItem("chatgroup_background", "cute-retro");
                        }}
                        className={`flex flex-col text-left rounded-2xl border p-4 transition-all duration-350 cursor-pointer group ${
                          chatBackground === "cute-retro"
                            ? "border-[#E8EA7A]/80 bg-[#E8EA7A]/5 shadow-[0_8px_20px_rgba(232,234,122,0.15)]"
                            : isDark ? "border-slate-800 bg-slate-950/20 hover:border-slate-700" : "border-slate-200 bg-slate-50 hover:border-slate-350"
                        }`}
                      >
                        <div 
                          className="w-full h-24 rounded-xl mb-3 flex items-center justify-center border border-slate-850/30"
                          style={{
                            backgroundImage: "url('/cute_retro.png')",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat"
                          }}
                        >
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-200 bg-black/60 px-2 py-1 rounded">Cute Retro</span>
                        </div>
                        <span className="text-xs.5 font-bold">Cute Retro</span>
                        <span className="text-[9px] text-slate-500 mt-0.5">Pink retro character with abstract wavy blobs</span>
                      </button>

                      {/* Retro Blobs Theme */}
                      <button
                        type="button"
                        onClick={() => {
                          setChatBackground("retro-blobs");
                          localStorage.setItem("chatgroup_background", "retro-blobs");
                        }}
                        className={`flex flex-col text-left rounded-2xl border p-4 transition-all duration-350 cursor-pointer group ${
                          chatBackground === "retro-blobs"
                            ? "border-[#E8EA7A]/80 bg-[#E8EA7A]/5 shadow-[0_8px_20px_rgba(232,234,122,0.15)]"
                            : isDark ? "border-slate-800 bg-slate-950/20 hover:border-slate-700" : "border-slate-200 bg-slate-50 hover:border-slate-350"
                        }`}
                      >
                        <div 
                          className="w-full h-24 rounded-xl mb-3 flex items-center justify-center border border-slate-850/30"
                          style={{
                            backgroundImage: "url('/retro_blobs.png')",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat"
                          }}
                        >
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-800 bg-white/70 px-2 py-1 rounded">Retro Blobs</span>
                        </div>
                        <span className="text-xs.5 font-bold">Retro Blobs</span>
                        <span className="text-[9px] text-slate-500 mt-0.5">Terracotta, beige, and blue organic shape layers</span>
                      </button>

                      {/* Nature Lake Theme */}
                      <button
                        type="button"
                        onClick={() => {
                          setChatBackground("nature-lake");
                          localStorage.setItem("chatgroup_background", "nature-lake");
                        }}
                        className={`flex flex-col text-left rounded-2xl border p-4 transition-all duration-350 cursor-pointer group ${
                          chatBackground === "nature-lake"
                            ? "border-[#E8EA7A]/80 bg-[#E8EA7A]/5 shadow-[0_8px_20px_rgba(232,234,122,0.15)]"
                            : isDark ? "border-slate-800 bg-slate-950/20 hover:border-slate-700" : "border-slate-200 bg-slate-50 hover:border-slate-350"
                        }`}
                      >
                        <div 
                          className="w-full h-24 rounded-xl mb-3 flex items-center justify-center border border-slate-850/30"
                          style={{
                            backgroundImage: "url('/nature_lake.png')",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat"
                          }}
                        >
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-200 bg-black/60 px-2 py-1 rounded">Nature Lake</span>
                        </div>
                        <span className="text-xs.5 font-bold">Nature Lake</span>
                        <span className="text-[9px] text-slate-500 mt-0.5">A calm autumn lake surrounded by warm orange foliage</span>
                      </button>

                      {/* Rainy Weather Theme */}
                      <button
                        type="button"
                        onClick={() => {
                          setChatBackground("rainy-weather");
                          localStorage.setItem("chatgroup_background", "rainy-weather");
                        }}
                        className={`flex flex-col text-left rounded-2xl border p-4 transition-all duration-350 cursor-pointer group ${
                          chatBackground === "rainy-weather"
                            ? "border-[#E8EA7A]/80 bg-[#E8EA7A]/5 shadow-[0_8px_20px_rgba(232,234,122,0.15)]"
                            : isDark ? "border-slate-800 bg-slate-950/20 hover:border-slate-700" : "border-slate-200 bg-slate-50 hover:border-slate-350"
                        }`}
                      >
                        <div 
                          className="w-full h-24 rounded-xl mb-3 flex items-center justify-center border border-slate-850/30"
                          style={{
                            backgroundImage: "url('/rainy_weather.png')",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat"
                          }}
                        >
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-200 bg-black/60 px-2 py-1 rounded">Rainy Weather</span>
                        </div>
                        <span className="text-xs.5 font-bold">Rainy Weather</span>
                        <span className="text-[9px] text-slate-500 mt-0.5">Cozy evening streets with warm glowing lights and soft rain</span>
                      </button>

                      {/* Tangled Theme */}
                      <button
                        type="button"
                        onClick={() => {
                          setChatBackground("tangled");
                          localStorage.setItem("chatgroup_background", "tangled");
                        }}
                        className={`flex flex-col text-left rounded-2xl border p-4 transition-all duration-350 cursor-pointer group ${
                          chatBackground === "tangled"
                            ? "border-[#E8EA7A]/80 bg-[#E8EA7A]/5 shadow-[0_8px_20px_rgba(232,234,122,0.15)]"
                            : isDark ? "border-slate-800 bg-slate-950/20 hover:border-slate-700" : "border-slate-200 bg-slate-50 hover:border-slate-350"
                        }`}
                      >
                        <div 
                          className="w-full h-24 rounded-xl mb-3 flex items-center justify-center border border-slate-850/30"
                          style={{
                            backgroundImage: "url('/tangled.png')",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat"
                          }}
                        >
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-200 bg-black/60 px-2 py-1 rounded">Tangled</span>
                        </div>
                        <span className="text-xs.5 font-bold">Tangled</span>
                        <span className="text-[9px] text-slate-500 mt-0.5">Rapunzel and Flynn Rider in a flower forest</span>
                      </button>

                      {/* Cute Bows Theme */}
                      <button
                        type="button"
                        onClick={() => {
                          setChatBackground("bows-pattern");
                          localStorage.setItem("chatgroup_background", "bows-pattern");
                        }}
                        className={`flex flex-col text-left rounded-2xl border p-4 transition-all duration-350 cursor-pointer group ${
                          chatBackground === "bows-pattern"
                            ? "border-[#E8EA7A]/80 bg-[#E8EA7A]/5 shadow-[0_8px_20px_rgba(232,234,122,0.15)]"
                            : isDark ? "border-slate-800 bg-slate-950/20 hover:border-slate-700" : "border-slate-200 bg-slate-50 hover:border-slate-350"
                        }`}
                      >
                        <div 
                          className="w-full h-24 rounded-xl mb-3 flex items-center justify-center border border-slate-850/30"
                          style={{
                            backgroundImage: "url('/bows_pattern.png')",
                            backgroundSize: "contain",
                            backgroundPosition: "center",
                            backgroundRepeat: "repeat"
                          }}
                        >
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-800 bg-white/70 px-2 py-1 rounded">Cute Bows</span>
                        </div>
                        <span className="text-xs.5 font-bold">Cute Bows</span>
                        <span className="text-[9px] text-slate-500 mt-0.5">Repeating bows, cherries, and hearts cream pattern</span>
                      </button>

                      {/* Spider-Man Theme */}
                      <button
                        type="button"
                        onClick={() => {
                          setChatBackground("spiderman");
                          localStorage.setItem("chatgroup_background", "spiderman");
                        }}
                        className={`flex flex-col text-left rounded-2xl border p-4 transition-all duration-350 cursor-pointer group ${
                          chatBackground === "spiderman"
                            ? "border-[#E8EA7A]/80 bg-[#E8EA7A]/5 shadow-[0_8px_20px_rgba(232,234,122,0.15)]"
                            : isDark ? "border-slate-800 bg-slate-950/20 hover:border-slate-700" : "border-slate-200 bg-slate-50 hover:border-slate-350"
                        }`}
                      >
                        <div 
                          className="w-full h-24 rounded-xl mb-3 flex items-center justify-center border border-slate-850/30"
                          style={{
                            backgroundImage: "url('/spiderman.png')",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat"
                          }}
                        >
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-200 bg-black/60 px-2 py-1 rounded">Spider-Man</span>
                        </div>
                        <span className="text-xs.5 font-bold">Spider-Man</span>
                        <span className="text-[9px] text-slate-500 mt-0.5">Spider-Man and Gwen Stacy red cityscape theme</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "blocked" && (
                <div className={`border rounded-[32px] p-6 md:p-8 shadow-2xl transition-all duration-500 relative overflow-hidden ${
                  isDark ? "bg-[#1A1A1E]/95 border-slate-800" : "bg-white border-slate-200 shadow-md"
                }`}>
                  <div className="border-b border-slate-800/40 pb-4 flex items-center justify-between select-none mb-6">
                    <div className="flex items-center gap-2">
                      <ShieldBan className="w-5 h-5 text-red-500" />
                      <h2 className="text-lg font-black tracking-wide">Blocked Users</h2>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      Blocked users will not be able to send you messages or view your online status.
                    </p>

                    {blockedUsers.length === 0 ? (
                      <div className={`flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed ${
                        isDark ? "border-[#2E2E33] bg-[#252529]/50" : "border-slate-300 bg-slate-50"
                      }`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${isDark ? "bg-[#2E2E33]" : "bg-slate-200"}`}>
                          <ShieldBan className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className={`text-sm font-bold ${isDark ? "text-slate-300" : "text-slate-600"}`}>No blocked users</p>
                        <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>You haven't blocked anyone yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {blockedUsers.map((username) => {
                          const contact = registeredUsers.find(u => u.username === username);
                          return (
                            <div 
                              key={username}
                              className={`flex items-center justify-between p-3 rounded-2xl border ${
                                isDark ? "bg-[#1F1F23] border-[#2E2E33]" : "bg-white border-slate-200 shadow-sm"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {contact ? (
                                  <img src={contact.avatarUrl} alt={username} className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-200 text-slate-600"}`}>
                                    {username[0]}
                                  </div>
                                )}
                                <div>
                                  <div className={`text-[13px] font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{username}</div>
                                  <div className="text-[10px] text-slate-500">{contact ? contact.email : "Unknown user"}</div>
                                </div>
                              </div>
                              <button
                                onClick={() => toggleBlockUser(username)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  isDark ? "bg-[#2E2E33] hover:bg-[#35353B] text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                }`}
                              >
                                Unblock
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
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
    <div className={`w-full h-screen max-h-screen flex flex-col font-sans antialiased overflow-hidden ${
      theme === "black" 
        ? "bg-black text-slate-100 black-theme" 
        : isDark ? "bg-[#252529] text-[#E8E8F0]" 
          : "bg-[#F5F5FA] text-[#252529]"
    }`}>
      
      {/* 1. TOP NAVBAR - Chitchat Style */}
      <header className={`relative h-[56px] border-b px-5 flex items-center justify-between z-50 flex-shrink-0 ${
        theme === "black"
          ? "bg-black border-neutral-900"
          : isDark ? "bg-[#2E2E33] border-[#2E2E33]" : "bg-white border-[#E0E0EA]"
      }`}>
        
        {/* Placeholder for flex spacing */}
        <div />

        {/* Center: Logo with floating animation */}
        <div className="absolute left-1/2 top-1/2 flex items-center gap-2 select-none animate-float-logo">
          <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
          <span className={`text-[22px] font-black italic tracking-tight ${isDark ? "text-[#E8EA7A]" : "text-[#252529]"}`}>
            Chitchat
          </span>
        </div>

        {/* Right Nav Icons */}
        <div className="flex items-center gap-5">
          {/* Theme Toggle Button */}
          <button
            onClick={() => {
              setTheme(prev => {
                const next = prev === "light" ? "dark" : prev === "dark" ? "black" : "light";
                setToast(next === "light" ? "Light Theme ☀️" : next === "dark" ? "Dark Theme 🌙" : "OLED Black 🌑");
                setTimeout(() => setToast(null), 2500);
                return next;
              });
            }}
            className={`w-[44px] h-[24px] rounded-full relative cursor-pointer transition-all duration-300 ${
              isDark ? "bg-[#E8EA7A]" : "bg-[#D0D0DA]"
            }`}
            title={`Toggle Theme`}
          >
            <div className={`absolute top-[2px] w-[20px] h-[20px] rounded-full bg-white shadow-md transition-all duration-300 ${
              isDark ? "left-[22px]" : "left-[2px]"
            }`} />
          </button>

          {currentUser && (
            <div className="relative group cursor-pointer" onClick={() => {
              if (currentUser) {
                setName(currentUser.username);
                setUsername(currentUser.username);
                setBio(currentUser.bio || "");
                setAvatar(currentUser.avatarUrl);
              }
              setNavView("settings");
              setCurrentView("settings");
            }}>
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.username}
                className="w-8 h-8 rounded-full object-cover border-2 border-[#E8EA7A]/30 hover:border-[#E8EA7A] transition-all"
              />
            </div>
          )}
        </div>
      </header>

      {/* 2. AUTH / LOGOUT / REGISTER CONTAINER */}
      {!currentUser ? (
        <div className={`flex-1 flex items-center justify-center p-6 relative overflow-hidden ${
          theme === "black"
            ? "bg-black black-theme"
            : isDark ? "bg-slate-950" : "bg-slate-50"
        }`}>
          {/* Floating background glowing orbs */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className={`absolute top-[10%] left-[15%] w-[250px] sm:w-[320px] h-[250px] sm:h-[320px] rounded-full blur-[100px] transition-opacity duration-700 animate-float-slow ${
              isDark ? "bg-[#E8EA7A]/12 opacity-100" : "bg-[#E8EA7A]/8 opacity-80"
            }`} />
            <div className={`absolute bottom-[10%] right-[15%] w-[280px] sm:w-[350px] h-[280px] sm:h-[350px] rounded-full blur-[110px] transition-opacity duration-700 animate-float-medium ${
              isDark ? "bg-[#B5B73B]/12 opacity-100" : "bg-[#B5B73B]/8 opacity-80"
            }`} />
          </div>

          <div className={`w-full max-w-[420px] rounded-[32px] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.15)] flex flex-col items-center animate-chat-bubble border relative z-10 ${
            theme === "black"
              ? "bg-[#050505] border-neutral-900 text-slate-100 black-theme"
              : isDark ? "glass-card-dark text-slate-100" : "glass-card-light text-slate-800"
          }`}>
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#E8EA7A]/40 to-transparent" />
            
            <div className="w-14 h-14 rounded-2xl overflow-hidden mb-4 shadow-lg flex items-center justify-center bg-white border border-slate-200">
              <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
            </div>

            <h2 className={`text-2xl font-black tracking-wide mb-1 ${isDark ? "text-slate-100" : "text-slate-800"}`}>
              {authMode === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-[12px] text-slate-400 text-center mb-6 leading-relaxed">
              {authMode === "login" 
                ? "Enter your credentials to access your profile and conversations." 
                : "Sign up with an email and username to connect with others."}
            </p>

            {authError && (
              <div className="w-full mb-4 px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs font-bold flex items-center gap-2">
                <svg className="w-4.5 h-4.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{authError}</span>
              </div>
            )}

            {authMode === "login" ? (
              /* LOGIN FORM */
              <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Username or Email Address</label>
                  <input
                    type="text"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="e.g. paul or paul@chitchat.com"
                    className={`w-full px-4 py-3 border rounded-2xl outline-none text-sm font-medium transition-all focus:ring-4 ${
                      isDark ? "bg-slate-900/50 border-[#2E2E33] text-white placeholder-slate-500 focus:border-[#E8EA7A] focus:ring-[#E8EA7A]/10" 
                        : "bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-[#E8EA7A] focus:ring-[#E8EA7A]/10 shadow-sm"
                    }`}
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Password</label>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 border rounded-2xl outline-none text-sm font-medium transition-all focus:ring-4 ${
                      isDark ? "bg-slate-900/50 border-[#2E2E33] text-white placeholder-slate-500 focus:border-[#E8EA7A] focus:ring-[#E8EA7A]/10" 
                        : "bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-[#E8EA7A] focus:ring-[#E8EA7A]/10 shadow-sm"
                    }`}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className={`w-full py-3.5 bg-gradient-to-r from-[#E8EA7A] to-[#D2D45E] font-bold text-[#1E1E22] rounded-2xl shadow-lg shadow-[#E8EA7A]/10 active:scale-95 transition-all text-sm mt-2 cursor-pointer ${
                    isAuthLoading ? "opacity-70 cursor-not-allowed" : "hover:brightness-110"
                  }`}
                >
                  {isAuthLoading ? "Signing In..." : "Sign In"}
                </button>


                <p className="text-[11.5px] text-slate-450 text-center mt-3 font-semibold">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("register");
                      setAuthError(null);
                    }}
                    className="text-[#E8EA7A] hover:underline font-bold"
                  >
                    Sign Up
                  </button>
                </p>
              </form>
            ) : (
              /* REGISTER FORM */
              <form onSubmit={handleRegister} className="w-full flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Select Face</span>
                  <div className="grid grid-cols-6 gap-2">
                    {PRESET_AVATARS.map((avatarItem, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setSelectedAvatarUrl(avatarItem)}
                        className={`relative w-9 h-9 rounded-full overflow-hidden border-2 transition-all duration-200 hover:scale-110 active:scale-90 shadow-sm ${
                          selectedAvatarUrl === avatarItem 
                            ? "border-[#E8EA7A] ring-2 ring-[#E8EA7A]/20 scale-105" 
                            : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={avatarItem} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Username</label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="e.g. ann123"
                    className={`w-full px-4 py-3 border rounded-2xl outline-none text-sm font-medium transition-all focus:ring-4 ${
                      isDark ? "bg-slate-900/50 border-[#2E2E33] text-white placeholder-slate-500 focus:border-[#E8EA7A] focus:ring-[#E8EA7A]/10" 
                        : "bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-[#E8EA7A] focus:ring-[#E8EA7A]/10 shadow-sm"
                    }`}
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Email Address</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. ann@example.com"
                    className={`w-full px-4 py-3 border rounded-2xl outline-none text-sm font-medium transition-all focus:ring-4 ${
                      isDark ? "bg-slate-900/50 border-[#2E2E33] text-white placeholder-slate-500 focus:border-[#E8EA7A] focus:ring-[#E8EA7A]/10" 
                        : "bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-[#E8EA7A] focus:ring-[#E8EA7A]/10 shadow-sm"
                    }`}
                    required
                  />
                </div>

                <div className="flex flex-col gap-2 relative">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Password</label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Create a password"
                      className={`w-full pl-4 pr-11 py-3 border rounded-2xl outline-none text-sm font-medium transition-all focus:ring-4 ${
                        isDark ? "bg-slate-900/50 border-[#2E2E33] text-white placeholder-slate-500 focus:border-[#E8EA7A] focus:ring-[#E8EA7A]/10" 
                          : "bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-[#E8EA7A] focus:ring-[#E8EA7A]/10 shadow-sm"
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#E8EA7A] transition-colors"
                    >
                      {showRegPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className={`w-full py-3.5 bg-gradient-to-r from-[#E8EA7A] to-[#D2D45E] font-bold text-[#1E1E22] rounded-2xl shadow-lg shadow-[#E8EA7A]/10 active:scale-95 transition-all text-sm mt-2 cursor-pointer ${
                    isAuthLoading ? "opacity-70 cursor-not-allowed" : "hover:brightness-110"
                  }`}
                >
                  {isAuthLoading ? "Creating Account..." : "Create Account"}
                </button>
                <p className="text-[11.5px] text-slate-450 text-center mt-3 font-semibold">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setAuthError(null);
                    }}
                    className="text-[#E8EA7A] hover:underline font-bold"
                  >
                    Sign In
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      ) : (
        /* MAIN LAYOUT: NAV SIDEBAR + CONTENT */
        <div className="flex-1 flex flex-col overflow-hidden w-full relative">
          <div className="flex-1 flex overflow-hidden w-full relative">
          
          {/* LEFT NAVIGATION SIDEBAR */}
          <nav className={`hidden md:flex w-[200px] flex-shrink-0 flex-col border-r transition-all duration-300 ${
            theme === "black"
              ? "bg-black border-neutral-900"
              : isDark ? "bg-[#1F1F23] border-[#2E2E33]" : "bg-[#EEEEF5] border-[#E0E0EA]"
          }`}>
            {/* User Profile Section */}
            <div className={`p-5 border-b ${isDark ? "border-[#2E2E33]" : "border-[#E0E0EA]"}`}>
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.username}
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#E8EA7A]/30"
                />
                <div className="min-w-0">
                  <h3 className={`text-sm font-bold truncate ${isDark ? "text-[#E8E8F0]" : "text-[#252529]"}`}>
                    {currentUser.username}
                  </h3>
                  <p className="text-[10px] text-emerald-400 font-semibold">Available</p>
                </div>
              </div>
            </div>

            {/* Nav Items */}
            <div className="flex-1 py-4 px-3 space-y-1">
              <button
                onClick={() => { setNavView("chat"); setCurrentView("chat"); }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${
                  navView === "chat"
                    ? isDark ? "bg-[#E8EA7A]/12 text-[#E8EA7A] border border-[#E8EA7A]/15" : "bg-[#E8EA7A]/10 text-[#9A9C2D] border border-[#E8EA7A]/20"
                    : isDark ? "text-[#9090B0] hover:bg-[#2E2E33] hover:text-[#E8E8F0] border border-transparent" : "text-[#6B6B8A] hover:bg-[#E0E0EA] hover:text-[#252529] border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                  <span>Chat</span>
                </div>
                {totalUnreadCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-red-500 text-[9px] font-bold flex items-center justify-center text-white animate-pulse">
                    {totalUnreadCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => { setNavView("group"); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${
                  navView === "group"
                    ? isDark ? "bg-[#E8EA7A]/12 text-[#E8EA7A] border border-[#E8EA7A]/15" : "bg-[#E8EA7A]/10 text-[#9A9C2D] border border-[#E8EA7A]/20"
                    : isDark ? "text-[#9090B0] hover:bg-[#2E2E33] hover:text-[#E8E8F0] border border-transparent" : "text-[#6B6B8A] hover:bg-[#E0E0EA] hover:text-[#252529] border border-transparent"
                }`}
              >
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
                Group
              </button>

              <button
                onClick={() => { setNavView("calls"); setCurrentView("chat"); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${
                  navView === "calls"
                    ? isDark ? "bg-[#E8EA7A]/12 text-[#E8EA7A] border border-[#E8EA7A]/15" : "bg-[#E8EA7A]/10 text-[#9A9C2D] border border-[#E8EA7A]/20"
                    : isDark ? "text-[#9090B0] hover:bg-[#2E2E33] hover:text-[#E8EA7A] border border-transparent" : "text-[#6B6B8A] hover:bg-[#E0E0EA] hover:text-[#252529] border border-transparent"
                }`}
              >
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.557-5.118-3.851-6.674-6.674l1.293-.97c.362-.272.528-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                Calls
              </button>

              <button
                onClick={() => {
                  setNavView("settings");
                  if (currentUser) {
                    setName(currentUser.username);
                    setUsername(currentUser.username);
                    setBio(currentUser.bio || "");
                    setAvatar(currentUser.avatarUrl);
                  }
                  setCurrentView("settings");
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${
                  navView === "settings"
                    ? isDark ? "bg-[#E8EA7A]/12 text-[#E8EA7A] border border-[#E8EA7A]/15" : "bg-[#E8EA7A]/10 text-[#9A9C2D] border border-[#E8EA7A]/20"
                    : isDark ? "text-[#9090B0] hover:bg-[#2E2E33] hover:text-[#E8E8F0] border border-transparent" : "text-[#6B6B8A] hover:bg-[#E0E0EA] hover:text-[#252529] border border-transparent"
                }`}
              >
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Setting
              </button>
            </div>

            {/* Logout at bottom */}
            <div className={`p-3 border-t ${isDark ? "border-[#2E2E33]" : "border-[#E0E0EA]"}`}>
              <button
                onClick={handleLogout}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${
                  isDark ? "text-rose-400 hover:bg-rose-500/10" : "text-rose-500 hover:bg-rose-50"
                }`}
              >
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Logout
              </button>
            </div>
          </nav>

          {/* COLUMN 1: CHAT LIST (320px) */}
          <section 
            className={`border-r flex flex-col flex-shrink-0 transition-all duration-300 relative ${
              theme === "black"
                ? "bg-black border-neutral-900"
                : isDark ? "bg-[#252529] border-[#2E2E33]" : "bg-white border-[#E0E0EA]"
            } ${
              activeContact || (activeGroup && navView === "group")
                ? "hidden md:flex w-[320px] h-full" 
                : "w-full md:w-[320px] h-full"
            }`}
          >
            <div className="p-4 flex flex-col gap-3">
              {/* Search Bar */}
              <div className={`w-full h-[38px] border rounded-xl flex items-center px-3 gap-2 ${
                theme === "black"
                  ? "bg-[#0a0a0a] border-neutral-900"
                  : isDark ? "bg-[#2E2E33] border-[#2E2E33]" : "bg-[#F0F0F8] border-[#E0E0EA]"
              }`}>
                <svg className="w-4 h-4 text-[#6B6B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`bg-transparent text-sm w-full outline-none font-normal ${isDark ? "text-[#E8E8F0] placeholder-[#6B6B8A]" : "text-[#252529] placeholder-[#9090B0]"}`}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {navView === "calls" ? (
                filteredContacts.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">No contacts found</div>
                ) : (
                  filteredContacts.map((user) => {
                    const isOnline = onlineUsers[user.username] === "online";
                    const isAway = onlineUsers[user.username] === "away";
                    return (
                      <div
                        key={user.username}
                        className={`w-full p-3 flex items-center justify-between rounded-xl border border-transparent hover:bg-slate-105/5 transition-all`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative flex-shrink-0">
                            <div className="w-[40px] h-[40px] rounded-full overflow-hidden">
                              <img src={user.avatarUrl} className="w-full h-full object-cover" />
                            </div>
                            <span className={`absolute top-0 right-0 w-2.5 h-2.5 rounded-full border-2 ${
                              isDark ? "border-[#252529]" : "border-white"
                            } ${
                              isOnline ? "bg-emerald-500" : isAway ? "bg-amber-500" : "bg-slate-400"
                            }`} />
                          </div>
                          <div className="text-left min-w-0">
                            <span className={`text-[13px] font-bold block truncate ${
                              isDark ? "text-[#E8E8F0]" : "text-[#252529]"
                            }`}>
                              {user.username}
                            </span>
                            <span className="text-[10.5px] text-slate-450 block truncate">
                              {user.email}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setActiveContact(user);
                              startCall("audio");
                            }}
                            title="Audio Call"
                            className="p-2 rounded-xl text-emerald-500 hover:bg-emerald-500/10 active:scale-90 transition-all cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.557-5.118-3.851-6.674-6.674l1.293-.97c.362-.272.528-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              setActiveContact(user);
                              startCall("video");
                            }}
                            title="Video Call"
                            className="p-2 rounded-xl text-sky-500 hover:bg-sky-500/10 active:scale-90 transition-all cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )
              ) : navView === "group" ? (
                <div className="flex flex-col gap-2">
                  {/* Make a Group Button */}
                  <button
                    onClick={() => { setIsCreateGroupModalOpen(true); setNewGroupName(""); setSelectedGroupMembers([]); setGroupSearchQuery(""); }}
                    className="mx-2 mb-1 px-4 py-3 rounded-2xl text-[13px] font-extrabold flex items-center justify-center gap-2.5 transition-all active:scale-[0.97] cursor-pointer bg-gradient-to-r from-[#E8EA7A] to-[#D2D45E] hover:brightness-110 text-[#1E1E22] shadow-md shadow-[#E8EA7A]/15"
                  >
                    <svg className="w-5 h-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                    Make a Group
                  </button>

                  {groups.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center gap-3">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isDark ? "bg-[#2E2E33]" : "bg-slate-100"}`}>
                        <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                        </svg>
                      </div>
                      <p className="text-[11px] text-slate-500 max-w-[180px] leading-relaxed">No groups yet. Create one to start chatting with multiple people!</p>
                    </div>
                  ) : (
                    groups.map((group) => {
                      const lastMsg = getGroupLastMessage(group);
                      const isActive = activeGroup?.id === group.id;
                      return (
                        <button
                          key={group.id}
                          onClick={() => { setActiveGroup(group); setActiveContact(null); }}
                          className={`w-full p-3 flex items-center gap-3 rounded-xl relative transition-all duration-200 cursor-pointer ${
                            isActive
                              ? isDark ? "bg-[#2E2E33] border border-[#2E2E33]" : "bg-[#E8E8F0] border border-[#D0D0DA]"
                              : isDark ? "hover:bg-[#2E2E33]/60 border border-transparent" : "hover:bg-[#E0E0EA]/50 border border-transparent"
                          }`}
                        >
                          {/* Group Avatar */}
                          <div
                            className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-white font-extrabold text-[14px] flex-shrink-0 shadow-sm"
                            style={{ backgroundColor: group.avatarColor }}
                          >
                            {getGroupInitials(group.name)}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex justify-between items-baseline">
                              <span className={`text-[13px] font-bold truncate ${isDark ? "text-[#E8E8F0]" : "text-[#252529]"}`}>
                                {group.name}
                              </span>
                              <span className="text-[9.5px] text-slate-500 flex-shrink-0 ml-2">{lastMsg.time}</span>
                            </div>
                            <div className="flex justify-between items-center mt-0.5">
                              <span className="text-[11px] text-slate-500 truncate max-w-[140px]">{lastMsg.text}</span>
                              <span className="text-[9px] text-slate-500 flex-shrink-0 ml-1">
                                <svg className="w-3 h-3 inline-block mr-0.5 -mt-px" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                </svg>
                                {group.members.length}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              ) : (
                filteredContacts.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">No contacts found</div>
                ) : (
                  filteredContacts.map((user) => {
                    const isOnline = onlineUsers[user.username] === "online";
                    const isAway = onlineUsers[user.username] === "away";
                    const isTyping = typingUsers[user.username];
                    const isActive = activeContact?.username === user.username;
                    const lastMsg = getLastMessage(user.username);
                    const rel = getChatRelationship(user.username);
                    

                    return (
                      <button
                        key={user.username}
                        onClick={() => {
                          setActiveContact(user);
                          if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                            setIsDetailPaneOpen(false);
                          }
                        }}
                        className={`w-full p-3 flex items-center gap-3 rounded-xl relative transition-all duration-200 ${
                          isActive
                            ? isDark ? "bg-[#2E2E33] border border-[#2E2E33]" 
                              : "bg-[#E8E8F0] border border-[#D0D0DA]"
                            : isDark ? "border border-transparent hover:bg-[#2E2E33]/60" 
                              : "border border-transparent hover:bg-[#F0F0F8]"
                        }`}
                      >
                        <div className="relative flex-shrink-0">
                          <div className="w-[46px] h-[46px] rounded-full overflow-hidden">
                            <img 
                              src={user.avatarUrl} 
                              className="w-full h-full rounded-full object-cover" 
                            />
                          </div>
                          
                          <span className={`absolute top-0 right-0 w-2.5 h-2.5 rounded-full border-2 ${
                            isDark ? "border-[#252529]" : "border-white"
                          } ${
                            isTyping ? "bg-amber-400 animate-pulse" :
                            isOnline ? "bg-emerald-500 pulse-online" :
                            isAway ? "bg-amber-500" : "bg-slate-400"
                          }`} />
                        </div>
                        
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className={`text-[13px] font-bold truncate ${
                              isDark ? "text-[#E8E8F0]" : "text-[#252529]"
                            }`}>
                              {user.username}
                            </span>
                            {lastMsg ? (
                              <span className={`text-[10px] font-medium ${isDark ? "text-[#6B6B8A]" : "text-[#9090B0]"}`}>{lastMsg.time}</span>
                            ) : (
                              <span className={`text-[10px] font-medium ${isDark ? "text-[#6B6B8A]" : "text-[#9090B0]"}`}>08:04 AM</span>
                            )}
                          </div>
                          
                          <div className={`text-[11.5px] truncate leading-snug ${isDark ? "text-[#6B6B8A]" : "text-[#9090B0]"}`}>
                            {isTyping ? (
                              <span className="text-[#E8EA7A] font-bold animate-pulse">typing...</span>
                            ) : rel && rel.status === 'pending' ? (
                              rel.sender.toLowerCase() === currentUser.username.toLowerCase()
                                ? <span className="text-amber-500 font-bold">Request Pending ✉️</span>
                                : <span className="text-sky-500 font-bold animate-pulse">Wants to Chat! ✉️</span>
                            ) : rel && rel.status === 'declined' ? (
                              <span className="text-rose-500 font-bold">Request Declined ❌</span>
                            ) : lastMsg ? (
                              <span>{lastMsg.text || "📷 Photo attachment"}</span>
                            ) : (
                              <span>{user.statusText || "Start DM"}</span>
                            )}
                          </div>
                        </div>

                        {rel && rel.status === 'pending' && rel.recipient.toLowerCase() === currentUser.username.toLowerCase() ? (
                          <span className="absolute right-3 px-1.5 py-0.5 rounded-full bg-[#E8EA7A] text-[9px] font-black text-[#252529] flex items-center justify-center select-none shadow animate-pulse">
                            REQ
                          </span>
                        ) : null}
                      </button>
                    );
                  })
                )
              )}
            </div>
          </section>

          {/* COLUMN 2: MIDDLE PANE - ACTIVE DIRECT MESSAGE STREAM / GROUP CHAT */}
          <main 
            className={`flex-1 flex flex-col border-r transition-all duration-300 ${
              theme === "black"
                ? "bg-black border-neutral-900"
                : isDark ? "bg-[#252529] border-[#2E2E33]" : "bg-white border-[#E0E0EA]"
            } ${
              !(activeContact && navView === "chat") && !(activeGroup && navView === "group")
                ? "hidden md:flex h-full items-center justify-center text-center p-8" 
                : "flex h-full"
            }`}
          >
            {activeGroup && navView === "group" ? (
              /* ===== GROUP CHAT VIEW ===== */
              <>
                {/* Group Chat Header */}
                <header className={`h-[56px] px-5 border-b flex items-center justify-between flex-shrink-0 z-40 select-none ${
                  theme === "black"
                    ? "bg-black border-neutral-900"
                    : isDark ? "bg-[#2E2E33] border-[#2E2E33]" : "bg-white border-[#E0E0EA]"
                }`}>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setActiveGroup(null)}
                      className="md:hidden p-1.5 rounded-full text-slate-500 hover:text-slate-800 active:scale-95"
                    >
                      <svg className="w-5 h-5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                    </button>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold text-[13px] flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: activeGroup.avatarColor }}
                    >
                      {getGroupInitials(activeGroup.name)}
                    </div>
                    <div>
                      <h3 className={`text-sm font-bold ${isDark ? "text-[#E8E8F0]" : "text-[#252529]"}`}>{activeGroup.name}</h3>
                      <p className={`text-[10px] font-medium ${isDark ? "text-[#6B6B8A]" : "text-[#9090B0]"}`}>
                        {activeGroup.members.length} members
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Stacked Member Avatars */}
                    <div className="flex -space-x-2">
                      {activeGroup.members.slice(0, 4).map((memberName, idx) => {
                        const memberUser = registeredUsers.find(u => u.username === memberName);
                        return memberUser ? (
                          <img
                            key={memberName}
                            src={memberUser.avatarUrl}
                            alt={memberName}
                            title={memberName}
                            className="w-7 h-7 rounded-full object-cover border-2 shadow-sm"
                            style={{ borderColor: isDark ? "#2E2E33" : "#fff", zIndex: 10 - idx }}
                          />
                        ) : (
                          <div
                            key={memberName}
                            title={memberName}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 shadow-sm"
                            style={{ backgroundColor: "#6B6B8A", borderColor: isDark ? "#2E2E33" : "#fff", zIndex: 10 - idx }}
                          >
                            {memberName[0]}
                          </div>
                        );
                      })}
                      {activeGroup.members.length > 4 && (
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[8px] font-extrabold border-2 shadow-sm"
                          style={{ backgroundColor: isDark ? "#3F3F46" : "#E5E7EB", color: isDark ? "#A1A1AA" : "#6B7280", borderColor: isDark ? "#2E2E33" : "#fff", zIndex: 5 }}
                        >
                          +{activeGroup.members.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                </header>

                {/* Group Messages Area */}
                <div
                  className={`flex-1 overflow-y-auto px-6 py-6 space-y-4 custom-scrollbar flex flex-col ${
                    chatBackground === "default" 
                      ? theme === "black" ? "bg-black" : isDark ? "bg-[#252529]" : "bg-[#F5F5FA]"
                      : ""
                  }`}
                  style={chatBackground === "default" ? {} : getChatBgStyles()}
                >
                  {activeGroup.messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center select-none">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${isDark ? "bg-[#2E2E33]" : "bg-slate-100"}`}>
                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                        </svg>
                      </div>
                      <p className={`text-[11px] font-semibold ${isDark ? "text-slate-500" : "text-slate-400"}`}>Start a conversation in this group!</p>
                      <p className={`text-[10px] mt-1 ${isDark ? "text-slate-600" : "text-slate-400"}`}>Type a message below to get things going.</p>
                    </div>
                  ) : (
                    activeGroup.messages.map((msg) => {
                      const isMe = msg.sender === currentUser?.username;
                      const bubbleConfig = getMessageBubbleStyles(isMe);
                      const shapeClass = isMe ? "rounded-br-sm shadow-sm" : "rounded-bl-sm border";
                      return (
                        <div
                          key={msg.id}
                          className={`flex w-full items-end gap-2.5 group/msg relative ${
                            isMe ? "justify-end" : "justify-start"
                          } ${msg.isNew ? "animate-chat-bubble" : ""}`}
                        >
                          {!isMe && (
                            <img
                              src={msg.senderAvatar}
                              alt={msg.sender}
                              className="w-[28px] h-[28px] rounded-full object-cover border border-slate-200 flex-shrink-0 select-none mb-1"
                            />
                          )}
                          <div className="flex flex-col max-w-[70%]">
                            {!isMe && (
                              <span className={`text-[10px] font-bold mb-0.5 ml-1 ${isDark ? "text-[#E8EA7A]" : "text-[#9A9C2D]"}`}>
                                {msg.sender}
                              </span>
                            )}
                            <div
                              className={`px-4 py-2.5 rounded-[18px] text-[14px] leading-relaxed break-words relative ${shapeClass} ${bubbleConfig.className || ""}`}
                              style={bubbleConfig.style || {}}
                            >
                              {msg.text && <p className="font-normal">{msg.text}</p>}
                              <div className="flex items-center justify-end mt-1 text-[9px] font-medium select-none gap-1">
                                <span className="opacity-75">{msg.time}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Group Message Input */}
                <div className={`p-4 border-t flex-shrink-0 z-40 ${isDark ? "bg-[#1A1A1E] border-[#2E2E33]" : "bg-white border-[#E0E0EA]"}`}>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={groupInputText}
                        onChange={(e) => setGroupInputText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && activeGroup) {
                            sendGroupMessage(activeGroup.id, groupInputText);
                          }
                        }}
                        placeholder="Type a group message..."
                        className={`w-full pl-4 pr-12 py-3 border rounded-2xl outline-none text-sm font-medium transition-all focus:ring-4 ${
                          isDark ? "bg-[#04060a] border-[#2E2E33] text-white placeholder-slate-500 focus:border-sky-500/50 focus:ring-sky-500/5" 
                            : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-sky-500/50 focus:ring-sky-500/5"
                        }`}
                      />
                      <button
                        onClick={() => activeGroup && sendGroupMessage(activeGroup.id, groupInputText)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8.5 h-8.5 rounded-xl bg-[#E8EA7A] text-[#1E1E22] hover:bg-[#F3F59B] flex items-center justify-center active:scale-95 hover:scale-105 transition-all shadow-md shadow-[#E8EA7A]/20 rounded-full cursor-pointer"
                        disabled={!groupInputText.trim()}
                      >
                        <svg className="w-[15px] h-[15px] rotate-45 -translate-x-[0.5px] stroke-[2.8] text-[#1E1E22]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (activeContact && navView === "chat") ? (
              <>
                {/* Active Chat Header */}
                <header className={`h-[56px] px-5 border-b flex items-center justify-between flex-shrink-0 z-40 select-none ${
                  theme === "black"
                    ? "bg-black border-neutral-900"
                    : isDark ? "bg-[#2E2E33] border-[#2E2E33]" : "bg-white border-[#E0E0EA]"
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
                      <h3 className={`text-sm font-bold ${isDark ? "text-[#E8E8F0]" : "text-[#252529]"}`}>{activeContact.username}</h3>
                      <p className={`text-[10px] font-medium ${isDark ? "text-[#6B6B8A]" : "text-[#9090B0]"}`}>
                        {typingUsers[activeContact.username] ? "typing..." : "Last seen 04.10 pm"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Audio Call Button */}
                    {isAccepted && (
                      <button
                        onClick={() => startCall("audio")}
                        title="Audio Call"
                        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100/10 text-slate-400 hover:text-slate-700 transition-all active:scale-90 cursor-pointer"
                      >
                        <svg className="w-5 h-5 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.557-5.118-3.851-6.674-6.674l1.293-.97c.362-.272.528-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                        </svg>
                      </button>
                    )}

                    {/* Video Call Button */}
                    {isAccepted && (
                      <button
                        onClick={() => startCall("video")}
                        title="Video Call"
                        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100/10 text-slate-400 hover:text-slate-700 transition-all active:scale-90 cursor-pointer"
                      >
                        <svg className="w-5 h-5 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </header>

                <div 
                  className={`flex-1 overflow-y-auto px-6 py-6 space-y-4 custom-scrollbar flex flex-col ${
                    chatBackground === "default" 
                      ? theme === "black" ? "bg-black" : isDark ? "bg-[#252529]" : "bg-[#F5F5FA]"
                      : ""
                  }`}
                  style={chatBackground === "default" ? {} : getChatBgStyles()}
                >

                  {conversationMessages.map((msg) => {
                    const isMe = msg.sender === currentUser.username;
                    const bubbleConfig = getMessageBubbleStyles(isMe);
                    const shapeClass = isMe ? "rounded-br-sm shadow-sm" : "rounded-bl-sm border";
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex w-full items-end gap-2.5 group/msg relative ${
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

                        {/* If it is me, show actions on the left of the bubble */}
                        {isMe && (
                          <div className="flex items-center gap-1.5 opacity-0 group-hover/msg:opacity-100 transition-all duration-200 select-none mr-1.5 mb-1.5">
                            {/* Reaction Trigger Button (Hover expands) */}
                            <div className="relative group/react select-none">
                              <button
                                className="p-1 rounded-lg text-slate-400 hover:text-[#E8EA7A] hover:bg-slate-100/10 transition-all cursor-pointer"
                                title="Add reaction"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                              
                              {/* Reactions Popup Panel (appears on hover) */}
                              <div className="absolute bottom-6 right-0 hidden group-hover/react:flex items-center gap-1 p-1 rounded-xl border shadow-xl z-50 animate-chat-bubble bg-slate-900 border-slate-800">
                                {["👍", "❤️", "😂", "😮", "😢", "🙏"].map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleMessageReaction(msg.id, emoji)}
                                    className="w-6 h-6 flex items-center justify-center text-sm hover:scale-125 transition-transform cursor-pointer hover:bg-slate-100/10 rounded-md"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <button
                              onClick={() => setReplyingToMessage(msg)}
                              title="Reply to message"
                              className="p-1 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-slate-100/10 active:scale-90 transition-all cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setForwardingMessage(msg)}
                              title="Forward message"
                              className="p-1 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-100/10 active:scale-90 transition-all cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
                              </svg>
                            </button>
                            {msg.text && (
                              <button
                                onClick={() => {
                                  setEditingMessage(msg);
                                  setInputText(msg.text);
                                }}
                                title="Edit message"
                                className="p-1 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100/10 active:scale-90 transition-all cursor-pointer"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                </svg>
                              </button>
                            )}
                          </div>
                        )}

                        <div className="flex flex-col max-w-[70%]">
                          <div
                            className={`px-4 py-2.5 rounded-[18px] text-[14px] leading-relaxed break-words relative ${shapeClass} ${bubbleConfig.className || ""}`}
                            style={bubbleConfig.style || {}}
                          >
                            {/* Forwarded Header */}
                            {msg.forwarded && (
                              <div className={`text-[9px] font-semibold italic flex items-center gap-1 mb-1 select-none ${
                                isMe ? "text-slate-300" : isDark ? "text-slate-500" : "text-slate-400"
                              }`}>
                                <span>↪️ forwarded</span>
                              </div>
                            )}

                            {/* Reply Header Block */}
                            {msg.replyToSender && (
                              <div className={`px-2.5 py-1 rounded border-l-2 text-xs mb-1.5 select-none truncate max-w-full leading-tight ${
                                isMe ? "bg-black/25 border-sky-400 text-slate-200" 
                                  : isDark ? "bg-slate-900/40 border-sky-500 text-slate-350" 
                                    : "bg-slate-200/50 border-sky-500 text-slate-600"
                              }`}>
                                <span className="font-bold block text-[9px] text-sky-400">
                                  Replying to {msg.replyToSender}
                                </span>
                                <span className="truncate block mt-0.5 text-[11px] opacity-80">
                                  {msg.replyToText}
                                </span>
                              </div>
                            )}

                            {msg.text && <p className="font-normal">{msg.text}</p>}
                            
                            {msg.imageUrl && (
                              <img
                                src={msg.imageUrl}
                                alt="Attachment"
                                className="rounded-lg max-h-[220px] object-cover mt-1 select-none border border-slate-700/20"
                              />
                            )}

                            <div className="flex items-center justify-end mt-1 text-[9px] font-medium select-none gap-1">
                              {msg.edited && <span className="opacity-55 italic">(edited)</span>}
                              <span className="opacity-75">{msg.time}</span>
                              {isMe && msg.status && renderCheckmarks(msg.status)}
                            </div>
                          </div>

                          {/* Reaction Badges Container */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? "justify-end self-end" : "justify-start self-start"}`}>
                              {Object.entries(
                                msg.reactions.reduce((acc, curr) => {
                                  if (!acc[curr.emoji]) acc[curr.emoji] = [];
                                  acc[curr.emoji].push(curr.username);
                                  return acc;
                                }, {} as Record<string, string[]>)
                              ).map(([emoji, usernames]) => {
                                const hasReacted = usernames.some(u => u.toLowerCase() === currentUser.username.toLowerCase());
                                const tooltipText = usernames.join(", ");
                                return (
                                  <button
                                    key={emoji}
                                    onClick={() => handleMessageReaction(msg.id, emoji)}
                                    title={tooltipText}
                                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs.5 border select-none transition-all active:scale-95 cursor-pointer ${
                                      hasReacted
                                        ? "bg-purple-500/20 border-purple-500/40 text-purple-200"
                                        : isDark
                                          ? "bg-slate-800/80 border-slate-700/60 text-slate-350 hover:bg-slate-700"
                                          : "bg-slate-100 border-slate-200 text-slate-650 hover:bg-slate-200"
                                    }`}
                                  >
                                    <span className="text-[11px]">{emoji}</span>
                                    <span className="text-[9.5px] font-black">{usernames.length}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* If it is not me, show actions on the right of the bubble */}
                        {!isMe && (
                          <div className="flex items-center gap-1.5 opacity-0 group-hover/msg:opacity-100 transition-all duration-200 select-none ml-1.5 mb-1.5">
                            <button
                              onClick={() => setReplyingToMessage(msg)}
                              title="Reply to message"
                              className="p-1 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-slate-100/10 active:scale-90 transition-all cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setForwardingMessage(msg)}
                              title="Forward message"
                              className="p-1 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-100/10 active:scale-90 transition-all cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
                              </svg>
                            </button>

                            {/* Reaction Trigger Button (Hover expands) */}
                            <div className="relative group/react select-none">
                              <button
                                className="p-1 rounded-lg text-slate-400 hover:text-[#E8EA7A] hover:bg-slate-100/10 transition-all cursor-pointer"
                                title="Add reaction"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                              
                              {/* Reactions Popup Panel (appears on hover) */}
                              <div className="absolute bottom-6 left-0 hidden group-hover/react:flex items-center gap-1 p-1 rounded-xl border shadow-xl z-50 animate-chat-bubble bg-slate-900 border-slate-800">
                                {["👍", "❤️", "😂", "😮", "😢", "🙏"].map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleMessageReaction(msg.id, emoji)}
                                    className="w-6 h-6 flex items-center justify-center text-sm hover:scale-125 transition-transform cursor-pointer hover:bg-slate-100/10 rounded-md"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

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
                      {(() => {
                        const typingBubbleConfig = getMessageBubbleStyles(false);
                        return (
                          <div
                            className={`px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5 shadow-sm ${
                              typingBubbleConfig.className || ""
                            }`}
                            style={typingBubbleConfig.style || {}}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Floating input dock or Message Request Panel */}
                {isUserBlocked(activeContact.username) ? (
                  <div className="p-4 bg-transparent select-none flex-shrink-0 z-40">
                    <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 shadow-lg ${
                      isDark ? "bg-[#1A1A1E]/95 border-red-500/20 shadow-red-500/5" : "bg-white/95 border-red-200 shadow-red-500/5"
                    }`}>
                      <ShieldBan className="w-6 h-6 text-red-500" />
                      <p className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                        You have blocked {activeContact.username}.
                      </p>
                      <p className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                        Unblock this user from settings or the contact details panel to send messages.
                      </p>
                    </div>
                  </div>
                ) : isAccepted ? (
                  <div className="p-4 bg-transparent select-none flex-shrink-0 z-40">
                    {/* Message Action Preview Bar */}
                    {(replyingToMessage || editingMessage) && (
                      <div className={`mb-2 px-4 py-2.5 rounded-xl border flex items-center justify-between animate-chat-bubble ${
                        isDark ? "bg-slate-900 border-[#2E2E33] text-slate-350" : "bg-slate-100 border-slate-200 text-slate-700"
                      }`}>
                        <div className="flex items-center gap-2 overflow-hidden mr-4">
                          {replyingToMessage ? (
                            <>
                              <svg className="w-4 h-4 text-sky-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                              </svg>
                              <div className="text-xs truncate">
                                <span className="font-bold text-sky-500">Replying to {replyingToMessage.sender}:</span>{" "}
                                <span>{replyingToMessage.text || (replyingToMessage.imageUrl ? "📷 Image" : "")}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                              </svg>
                              <div className="text-xs truncate">
                                <span className="font-bold text-amber-500">Editing message:</span>{" "}
                                <span>{editingMessage?.text}</span>
                              </div>
                            </>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            if (editingMessage) {
                              setInputText("");
                            }
                            setReplyingToMessage(null);
                            setEditingMessage(null);
                          }}
                          className="text-slate-500 hover:text-rose-500 p-0.5 rounded-full hover:bg-slate-100/10 transition-all cursor-pointer flex-shrink-0"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg ${
                      isDark ? "bg-slate-905/90 border-[#2E2E33]/80 backdrop-blur-md shadow-black/20" 
                        : "bg-white/95 border-slate-200 backdrop-blur-md shadow-slate-200/50"
                    }`}>
                      <input
                        type="file"
                        ref={chatImageInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleChatImageChange}
                      />
                      {/* Photo Gallery Upload Button */}
                      <button 
                        onClick={() => chatImageInputRef.current?.click()}
                        title="Upload photo from device storage"
                        className="p-1.5 rounded-full text-slate-500 hover:text-sky-500 hover:bg-slate-100/10 transition-all active:scale-90 cursor-pointer"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                      </button>

                      {/* Live Snap Web Camera Button */}
                      <button 
                        onClick={startLiveCamera}
                        title="Click photo live"
                        className="p-1.5 rounded-full text-slate-500 hover:text-sky-500 hover:bg-slate-100/10 transition-all active:scale-90 cursor-pointer"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15a2.25 2.25 0 0 0 2.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM18 10.5h.008v.008H18V10.5Z" />
                        </svg>
                      </button>

                      {/* Emoji Picker Popover Wrapper */}
                      <div className="relative" ref={emojiPickerRef}>
                        <button 
                          onClick={() => setIsEmojiPickerOpen((prev) => !prev)}
                          title="Insert emoji"
                          className={`p-1.5 rounded-full hover:bg-slate-100/10 transition-all active:scale-90 cursor-pointer ${
                            isEmojiPickerOpen ? "text-sky-500 bg-slate-100/10" : "text-slate-500 hover:text-sky-500"
                          }`}
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                          </svg>
                        </button>

                        {isEmojiPickerOpen && (
                          <div className={`absolute bottom-[52px] left-0 w-[270px] border rounded-2xl p-3 shadow-xl flex flex-col z-50 animate-chat-bubble select-none ${
                            isDark ? "bg-slate-900 border-[#2E2E33]" : "bg-white border-slate-200"
                          }`}>
                            <div className="flex justify-between items-center border-b border-slate-150/10 pb-2 mb-2">
                              {EMOJI_CATEGORIES.map((cat) => (
                                <button
                                  type="button"
                                  key={cat.name}
                                  onClick={() => setActiveEmojiCategory(cat.name)}
                                  title={cat.name}
                                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm transition-all active:scale-95 cursor-pointer ${
                                    activeEmojiCategory === cat.name ? "bg-slate-100/10 text-slate-350" : "opacity-50 hover:opacity-100"
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
                                  className="w-8 h-8 flex items-center justify-center text-[18px] hover:bg-slate-100/10 active:scale-90 rounded-lg transition-all cursor-pointer"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={inputText}
                          onChange={(e) => {
                            setInputText(e.target.value);
                            handleUserTyping(e.target.value.length);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSendMessage();
                            }
                          }}
                          placeholder="Type a message..."
                          className={`w-full pl-4 pr-12 py-3 border rounded-2xl outline-none text-sm font-medium transition-all focus:ring-4 ${
                            isDark ? "bg-[#04060a] border-[#2E2E33] text-white placeholder-slate-500 focus:border-sky-500/50 focus:ring-sky-500/5" 
                              : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-sky-500/50 focus:ring-sky-500/5"
                          }`}
                        />
                        <button
                          onClick={() => handleSendMessage()}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8.5 h-8.5 rounded-xl bg-[#E8EA7A] text-[#1E1E22] hover:bg-[#F3F59B] flex items-center justify-center active:scale-95 hover:scale-105 transition-all shadow-md shadow-[#E8EA7A]/20 rounded-full cursor-pointer"
                          disabled={!inputText.trim()}
                        >
                          <svg className="w-[15px] h-[15px] rotate-45 -translate-x-[0.5px] stroke-[2.8] text-[#1E1E22]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-transparent select-none flex-shrink-0 z-40">
                    <div className={`p-6 rounded-[28px] border flex flex-col items-center justify-center text-center gap-4 shadow-lg ${
                      isDark ? "bg-[#080B12]/90 border-[#2E2E33]/80 backdrop-blur-md shadow-black/20" 
                        : "bg-white/95 border-slate-200 backdrop-blur-md shadow-slate-200/50"
                    }`}>
                      {activeRelationship === null && (
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-slate-400">
                            You need to send a message request to start chatting with {activeContact.username}.
                          </p>
                          <button
                            onClick={() => sendChatRequest(activeContact.username)}
                            className="px-6 py-3 bg-gradient-to-r from-[#E8EA7A] to-[#D2D45E] hover:brightness-105 text-[#1E1E22] font-extrabold text-xs rounded-2xl shadow-md shadow-[#E8EA7A]/10 active:scale-95 transition-all cursor-pointer"
                          >
                            Send Message Request
                          </button>
                        </div>
                      )}

                      {activeRelationship !== null && activeRelationship.status === "pending" && (
                        <>
                          {activeRelationship.sender.toLowerCase() === currentUser.username.toLowerCase() ? (
                            <div className="flex flex-col items-center gap-2">
                              <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                              </span>
                              <p className="text-xs font-bold text-amber-550">
                                Message request pending approval...
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <p className="text-xs font-bold text-slate-400">
                                {activeContact.username} wants to send you messages. Do you accept?
                              </p>
                              <div className="flex justify-center gap-3">
                                <button
                                  onClick={() => updateChatRequest(activeRelationship.id, "accepted")}
                                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-emerald-500/10 active:scale-95 transition-all cursor-pointer"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => updateChatRequest(activeRelationship.id, "declined")}
                                  className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:brightness-110 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-rose-500/10 active:scale-95 transition-all cursor-pointer"
                                >
                                  Decline
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {activeRelationship !== null && activeRelationship.status === "declined" && (
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-rose-500">
                            {activeRelationship.sender.toLowerCase() === currentUser.username.toLowerCase()
                              ? "Your request was declined by the recipient."
                              : "You declined this message request."}
                          </p>
                          <button
                            onClick={() => sendChatRequest(activeContact.username)}
                            className="px-6 py-2.5 bg-[#2E2E33] hover:bg-slate-700 text-white font-bold text-xs rounded-2xl transition-all cursor-pointer"
                          >
                            {activeRelationship.sender.toLowerCase() === currentUser.username.toLowerCase()
                              ? "Try Resending Request"
                              : "Change Mind: Accept Request"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className={`flex-1 flex flex-col items-center justify-center text-center p-8 select-none ${
                isDark ? "bg-black" : "bg-slate-50"
              }`}>
                <div className={`w-20 h-20 rounded-full border flex items-center justify-center text-slate-400 mb-4 shadow-sm ${
                  isDark ? "bg-slate-900 border-[#2E2E33]" : "bg-white border-slate-200"
                }`}>
                  <svg className="w-10 h-10 stroke-[1.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </div>
                <h2 className="text-[17px] font-bold text-slate-500 uppercase tracking-widest">
                  {navView === "group" ? "Group Chats" : "Your Messages"}
                </h2>
                <p className="text-[12px] text-slate-450 max-w-[240px] mt-2 leading-relaxed">
                  {navView === "group" 
                    ? "Create a group or select an existing one to start chatting with your team."
                    : "Send private messages and media photos to a friend or group. Select a conversation to start."
                  }
                </p>
              </div>
            )}
          </main>

          {/* COLUMN 3: RIGHT PANEL - CONTACT DETAIL INFO DISPLAY (320px) */}
          {activeContact && isDetailPaneOpen && (
            <aside 
              className={`w-full lg:w-[320px] border-l flex flex-col items-center text-center select-none z-45 animate-chat-bubble absolute lg:static top-0 right-0 h-full lg:h-auto shadow-2xl lg:shadow-none overflow-y-auto ${
                theme === "black" ? "bg-black border-neutral-900" : isDark ? "bg-[#1F1F23] border-[#2E2E33]" : "bg-white border-slate-200"
              }`}
            >
              {/* Cover Banner Cover */}
              <div className="w-full h-24 bg-gradient-to-r from-[#E8EA7A]/20 via-[#B5B73B]/10 to-transparent relative flex-shrink-0">
                <button 
                  onClick={() => setIsDetailPaneOpen(false)}
                  className="lg:hidden absolute top-4 right-4 p-2 bg-slate-900/60 text-white rounded-full backdrop-blur-sm hover:bg-slate-900 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Profile Avatar */}
              <div className="relative -mt-12 mb-4 select-none flex-shrink-0 z-10">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-[#E8EA7A] via-[#D2D45E] to-[#B5B73B] opacity-60 blur-xs" />
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-950 p-[1.5px] shadow-lg relative bg-slate-900">
                  <img
                    src={activeContact.avatarUrl}
                    alt={activeContact.username}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>

              <div className="px-6 pb-6 flex-1 flex flex-col items-center">
                <h2 className={`text-lg font-black tracking-wide mb-1 ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                  {activeContact.username.toUpperCase()}
                </h2>
                
                <span className="text-[10px] font-extrabold tracking-widest text-[#E8EA7A] bg-[#E8EA7A]/10 border border-[#E8EA7A]/20 px-3 py-1 rounded-full uppercase mb-5">
                  {activeContact.category || "MEMBER"}
                </span>

                <div className={`w-full rounded-2xl p-4 border text-left mb-6 ${
                  theme === "black" ? "bg-[#070709] border-neutral-900" : isDark ? "bg-[#252529] border-[#2E2E33]" : "bg-slate-50 border-slate-150"
                }`}>
                  <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1.5">Biography</h4>
                  <p className={`text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-655"}`}>
                    {activeContact.bio || "No biography provided by this user."}
                  </p>
                </div>

                <button className="w-full py-3.5 rounded-2xl bg-[#E8EA7A] hover:bg-[#F3F59B] text-[#1E1E22] font-extrabold text-xs tracking-wider active:scale-95 transition-all uppercase cursor-pointer shadow-md shadow-[#E8EA7A]/10">
                  View Profile Details
                </button>

                <div className="flex gap-4 mt-8 select-none">
                  {isAccepted && (
                    <button
                      onClick={() => startCall("video")}
                      title="Video Call"
                      className={`w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-all shadow-md cursor-pointer border ${
                        isDark ? "bg-slate-900 border-[#2E2E33] text-slate-300 hover:bg-[#2E2E33] hover:text-white" 
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-850"
                      }`}
                    >
                      <svg className="w-5.5 h-5.5 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </button>
                  )}
                  {isAccepted && (
                    <button
                      onClick={() => startCall("audio")}
                      title="Voice Call"
                      className={`w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-all shadow-md cursor-pointer border ${
                        isDark ? "bg-slate-900 border-[#2E2E33] text-slate-300 hover:bg-[#2E2E33] hover:text-white" 
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-850"
                      }`}
                    >
                      <svg className="w-5.5 h-5.5 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.557-5.118-3.851-6.674-6.674l1.293-.97c.362-.272.528-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                    </button>
                  )}
                </div>

                {isAccepted && (
                  <button
                    onClick={() => toggleBlockUser(activeContact.username)}
                    className={`mt-8 w-full py-3.5 rounded-2xl font-extrabold text-xs tracking-wider active:scale-95 transition-all uppercase cursor-pointer flex items-center justify-center gap-2 ${
                      isUserBlocked(activeContact.username)
                        ? "bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
                        : "bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
                    }`}
                  >
                    <ShieldBan className="w-4 h-4" />
                    {isUserBlocked(activeContact.username) ? "Unblock User" : "Block User"}
                  </button>
                )}
              </div>
            </aside>
          )}

          </div>

          {/* MOBILE BOTTOM NAVIGATION BAR */}
          <nav className={`md:hidden flex items-center justify-around h-[58px] border-t px-2 select-none z-45 ${
            theme === "black" 
              ? "bg-black border-neutral-900" 
              : isDark ? "bg-[#1A1A1E] border-[#2E2E33]/60" : "bg-white border-slate-200/60"
          }`}>
            <button
              onClick={() => { setNavView("chat"); setCurrentView("chat"); }}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition-all relative ${
                navView === "chat"
                  ? isDark ? "text-[#E8EA7A]" : "text-[#9A9C2D]"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-300"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
              <span className="text-[9px] font-black uppercase tracking-wider">Chat</span>
              {totalUnreadCount > 0 && (
                <span className="absolute top-1 right-[30%] w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => { setNavView("group"); setCurrentView("chat"); }}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition-all ${
                navView === "group"
                  ? isDark ? "text-[#E8EA7A]" : "text-[#9A9C2D]"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-300"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              <span className="text-[9px] font-black uppercase tracking-wider">Group</span>
            </button>

            <button
              onClick={() => { setNavView("calls"); setCurrentView("chat"); }}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition-all ${
                navView === "calls"
                  ? isDark ? "text-[#E8EA7A]" : "text-[#9A9C2D]"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-300"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.557-5.118-3.851-6.674-6.674l1.293-.97c.362-.272.528-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              <span className="text-[9px] font-black uppercase tracking-wider">Calls</span>
            </button>

            <button
              onClick={() => {
                setNavView("settings");
                if (currentUser) {
                  setName(currentUser.username);
                  setUsername(currentUser.username);
                  setBio(currentUser.bio || "");
                  setAvatar(currentUser.avatarUrl);
                }
                setCurrentView("settings");
              }}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition-all ${
                navView === "settings"
                  ? isDark ? "text-[#E8EA7A]" : "text-[#9A9C2D]"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-300"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-[9px] font-black uppercase tracking-wider">Setting</span>
            </button>
          </nav>
        </div>
      )}

      {/* Call Screen Overlay Modal */}
      {callState !== "idle" && (
        <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-slate-950 text-white animate-fade-in">
          {/* Background glow or subtle glassmorphism */}
          <div className="absolute inset-0 bg-radial-gradient from-slate-900 via-slate-950 to-black pointer-events-none opacity-80" />

          {/* Main container */}
          <div className="relative z-10 w-full max-w-4xl h-full md:max-h-[85vh] max-h-screen md:rounded-3xl border border-[#2E2E33] bg-slate-900/60 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden">
            
            {/* Call Header info */}
            <div className="p-4 md:p-6 flex items-center justify-between border-b border-[#2E2E33]">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-sm font-bold tracking-wider uppercase text-slate-400">
                  {callType === "video" ? "Video Call" : "Voice Call"} — {callState.toUpperCase()}
                </span>
              </div>

              <div className="text-xs bg-[#2E2E33]/80 px-3 py-1.5 rounded-full font-mono font-bold tracking-wide">
                {currentTime}
              </div>
            </div>

            {/* Call Body: Streams or Ringing profile */}
            <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-3 md:p-6 gap-4 md:gap-6 relative">
              
              {/* If RINGING (receiving a call) or CALLING (outgoing) */}
              {(callState === "calling" || callState === "ringing") && (
                <div className="flex flex-col items-center text-center space-y-6 animate-pulse">
                  <div className="relative">
                    <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-[#E8EA7A] to-[#3D1B5C] opacity-30 blur-md animate-pulse" />
                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#2E2E33] shadow-xl relative bg-[#2E2E33] p-1">
                      <img
                        src={callState === "calling" ? activeContact?.avatarUrl : PRESET_AVATARS[0]}
                        alt="Calling Avatar"
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-black tracking-wide">
                      {callState === "calling" ? calleeName.toUpperCase() : callerName.toUpperCase()}
                    </h2>
                    <p className="text-sm text-slate-450 mt-2">
                      {callState === "calling" ? "Calling..." : "Incoming Call..."}
                    </p>
                  </div>

                  {callState === "ringing" && (
                    <div className="flex gap-4 mt-4 select-none">
                      <button
                        onClick={acceptCall}
                        className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Check className="w-4 h-4 stroke-[3]" /> Accept
                      </button>
                      <button
                        onClick={declineCall}
                        className="px-6 py-3 rounded-full bg-rose-500 hover:bg-rose-400 text-white font-extrabold text-sm shadow-lg shadow-rose-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <svg className="w-4 h-4 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg> Decline
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* If CONNECTED (active streams) */}
              {callState === "connected" && (
                <div className="w-full h-full relative flex items-center justify-center bg-slate-950 rounded-2xl overflow-hidden border border-[#2E2E33]">
                  {callType === "video" ? (
                    <>
                      {/* Remote video (full stream) */}
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />

                      {/* Local video (picture-in-picture) */}
                      {!isCameraOff && (
                        <div className="absolute bottom-4 right-4 w-32 sm:w-44 aspect-video bg-slate-900 border-2 border-white/20 rounded-xl overflow-hidden shadow-2xl z-20">
                          <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Floating Vertical Sidebar Call Controls */}
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-3.5 z-30 bg-slate-950/60 backdrop-blur-md p-2.5 rounded-2xl border border-[#2E2E33] shadow-2xl transition-all duration-300">
                        {/* Mute Microphone Button */}
                        <button
                          onClick={toggleMute}
                          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                            isMicMuted 
                              ? "bg-rose-500/20 text-rose-500 border border-rose-500/30 hover:bg-rose-500/30" 
                              : "bg-slate-900/80 hover:bg-[#2E2E33] text-slate-350 hover:text-white border border-[#2E2E33]/80"
                          }`}
                          title={isMicMuted ? "Unmute Microphone" : "Mute Microphone"}
                        >
                          {isMicMuted ? (
                            <svg className="w-5.5 h-5.5 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6v9a3 3 0 006 0v-9a3 3 0 00-6 0z" />
                            </svg>
                          ) : (
                            <svg className="w-5.5 h-5.5 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                            </svg>
                          )}
                        </button>

                        {/* Camera Toggle Button */}
                        <button
                          onClick={toggleCamera}
                          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                            isCameraOff 
                              ? "bg-rose-500/20 text-rose-500 border border-rose-500/30 hover:bg-rose-500/30" 
                              : "bg-slate-900/80 hover:bg-[#2E2E33] text-slate-350 hover:text-white border border-[#2E2E33]/80"
                          }`}
                          title={isCameraOff ? "Turn Video On" : "Turn Video Off"}
                        >
                          {isCameraOff ? (
                            <svg className="w-5.5 h-5.5 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75h-9a2.25 2.25 0 01-2.25-2.25v-9A2.25 2.25 0 013 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25z" />
                            </svg>
                          ) : (
                            <svg className="w-5.5 h-5.5 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                          )}
                        </button>

                        {/* Flip Camera Button */}
                        <button
                          onClick={flipCamera}
                          disabled={videoDevices.length <= 1}
                          className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all duration-200 ${
                            videoDevices.length > 1
                              ? "bg-slate-900/80 hover:bg-[#2E2E33] text-slate-350 hover:text-white border-[#2E2E33]/80 cursor-pointer"
                              : "bg-slate-950/40 text-slate-600 border-slate-900/50 cursor-not-allowed opacity-50"
                          }`}
                          title={videoDevices.length > 1 ? "Flip Camera" : "No other camera available"}
                        >
                          <RefreshCw className="w-5 h-5 text-emerald-400" />
                        </button>

                        {/* Hang Up Button */}
                        <button
                          onClick={() => handleEndCallRef.current(true)}
                          className="w-11 h-11 rounded-xl flex items-center justify-center bg-rose-600 hover:bg-rose-500 text-white border border-rose-500/30 transition-all duration-200 cursor-pointer shadow-lg shadow-rose-600/30"
                          title="Hang Up"
                        >
                          <svg className="w-5 h-5 rotate-[135deg] stroke-[3.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.557-5.118-3.851-6.674-6.674l1.293-.97c.362-.272.528-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                          </svg>
                        </button>
                      </div>
                    </>
                  ) : (
                    /* Voice call layout */
                    <div className="flex flex-col items-center text-center space-y-6">
                      <div className="relative">
                        <div className="absolute -inset-4 rounded-full bg-emerald-500/20 opacity-70 blur-md animate-pulse" />
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-emerald-500 shadow-xl bg-[#2E2E33]">
                          <img
                            src={activeContact?.avatarUrl}
                            alt="Active voice avatar"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <div>
                        <h2 className="text-xl font-black tracking-wide text-emerald-400">Call Connected</h2>
                        <p className="text-xs text-slate-400 mt-1.5 font-semibold">Ongoing audio communication...</p>
                      </div>
                      {/* Audio element for remote voice tracks */}
                      <audio ref={remoteVideoRef as any} autoPlay />
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Call Footer controls */}
            {!(callState === "connected" && callType === "video") && (
              <div className="p-6 bg-slate-950/80 border-t border-[#2E2E33] flex items-center justify-center gap-6 select-none">
                <button
                  onClick={toggleMute}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isMicMuted ? "bg-rose-500/20 text-rose-500 border border-rose-500/30" : "bg-[#2E2E33] hover:bg-slate-700 text-white"
                  }`}
                  title={isMicMuted ? "Unmute Microphone" : "Mute Microphone"}
                >
                  {isMicMuted ? (
                    <svg className="w-5.5 h-5.5 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6v9a3 3 0 006 0v-9a3 3 0 00-6 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5.5 h-5.5 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                  )}
                </button>

                {callType === "video" && callState === "connected" && (
                  <button
                    onClick={toggleCamera}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isCameraOff ? "bg-rose-500/20 text-rose-500 border border-rose-500/30" : "bg-[#2E2E33] hover:bg-slate-700 text-white"
                    }`}
                    title={isCameraOff ? "Turn Video On" : "Turn Video Off"}
                  >
                    {isCameraOff ? (
                      <svg className="w-5.5 h-5.5 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75h-9a2.25 2.25 0 01-2.25-2.25v-9A2.25 2.25 0 013 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25z" />
                      </svg>
                    ) : (
                      <svg className="w-5.5 h-5.5 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    )}
                  </button>
                )}

                {callType === "video" && callState === "connected" && videoDevices.length > 0 && (
                  <div className="relative flex items-center bg-[#2E2E33] hover:bg-slate-700 border border-slate-700/50 rounded-full px-3 py-2 text-white text-xs font-semibold cursor-pointer max-w-[160px] sm:max-w-[200px] transition-all">
                    <Camera className="w-4 h-4 text-emerald-400 shrink-0 mr-1.5" />
                    <select
                      value={selectedVideoDevice}
                      onChange={(e) => changeVideoDevice(e.target.value)}
                      className="bg-transparent border-none outline-none text-white text-xs font-semibold cursor-pointer pr-5 appearance-none w-full truncate"
                      title="Change Camera"
                    >
                      {videoDevices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId} className="bg-slate-900 text-white">
                          {device.label || `Camera ${videoDevices.indexOf(device) + 1}`}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                      <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleEndCallRef.current(true)}
                  className="px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm tracking-wide shadow-lg shadow-rose-600/30 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
                  title="Hang Up"
                >
                  <svg className="w-5 h-5 rotate-[135deg] stroke-[3.2] animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.557-5.118-3.851-6.674-6.674l1.293-.97c.362-.272.528-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  Hang Up
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Live Camera Snapshot Modal Overlay */}
      {isLiveCameraOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4 select-none animate-fade-in">
          <div className={`w-full max-w-lg rounded-[28px] border overflow-hidden p-6 flex flex-col items-center gap-5 shadow-2xl ${
            isDark ? "bg-[#0b0b0d] border-slate-900" : "bg-white border-slate-200"
          }`}>
            <div className="w-full flex justify-between items-center pb-2 border-b border-slate-100/10">
              <h3 className={`text-base font-extrabold tracking-tight ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                Live Snapshot Camera
              </h3>
              <button 
                onClick={stopLiveCamera}
                className="text-slate-500 hover:text-rose-500 hover:scale-110 active:scale-95 transition-all p-1 cursor-pointer"
                title="Close camera"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {liveCameraError ? (
              <div className="w-full py-12 flex flex-col items-center justify-center text-center gap-3">
                <svg className="w-12 h-12 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-xs font-bold text-rose-500">{liveCameraError}</p>
                <button
                  onClick={startLiveCamera}
                  className="px-6 py-2.5 bg-[#2E2E33] hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Retry Access
                </button>
              </div>
            ) : capturedPhoto ? (
              <div className="w-full flex flex-col items-center gap-4">
                <div className="w-full aspect-video rounded-2xl overflow-hidden border border-slate-100/10 shadow bg-black flex items-center justify-center">
                  <img src={capturedPhoto} alt="Captured snapshot" className="w-full h-full object-contain" />
                </div>
                <div className="flex gap-4 w-full">
                  <button 
                    onClick={() => setCapturedPhoto(null)}
                    className={`flex-1 py-3 border rounded-xl font-extrabold text-xs active:scale-95 transition-all cursor-pointer ${
                      isDark ? "bg-slate-900 border-[#2E2E33] text-slate-300 hover:bg-slate-850" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    Retake
                  </button>
                  <button 
                    onClick={sendLivePhoto}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-extrabold text-xs rounded-xl active:scale-95 transition-all cursor-pointer shadow-lg shadow-emerald-500/15"
                  >
                    Send Photo
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center gap-4">
                <div className="w-full aspect-video rounded-2xl overflow-hidden border border-slate-100/10 bg-black shadow relative">
                  <video 
                    ref={liveCameraVideoRef}
                    autoPlay 
                    playsInline 
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay camera circle guide */}
                  <div className="absolute inset-0 border border-white/5 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 rounded-full border border-white/10" />
                  </div>
                </div>
                <button 
                  onClick={captureLivePhoto}
                  className="w-14 h-14 rounded-full border-4 border-slate-350 hover:border-white bg-rose-600 active:scale-90 transition-all flex items-center justify-center shadow-lg cursor-pointer"
                  title="Snap photo"
                >
                  <div className="w-7 h-7 rounded-full bg-white" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Message Forwarding Modal Overlay */}
      {forwardingMessage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex flex-col items-center justify-center p-4 select-none animate-fade-in animate-chat-bubble">
          <div className={`w-full max-w-sm rounded-[24px] border overflow-hidden p-5 flex flex-col gap-4 shadow-2xl ${
            isDark ? "bg-[#0b0b0d] border-slate-900" : "bg-white border-slate-200"
          }`}>
            <div className="w-full flex justify-between items-center pb-2 border-b border-slate-100/10">
              <h3 className={`text-sm font-extrabold tracking-tight ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                Forward Message
              </h3>
              <button 
                onClick={() => setForwardingMessage(null)}
                className="text-slate-500 hover:text-rose-500 hover:scale-110 active:scale-95 transition-all p-1 cursor-pointer"
                title="Cancel forwarding"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="text-xs text-slate-500 -mt-1 truncate">
              Select a contact to forward this message to:
            </div>

            <div className="flex flex-col gap-1 overflow-y-auto max-h-[260px] custom-scrollbar pr-1">
              {filteredContacts.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 italic">
                  No other contacts available.
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <button
                    key={contact.username}
                    onClick={() => handleForwardMessage(contact.username)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all active:scale-98 cursor-pointer ${
                      isDark ? "hover:bg-slate-900/60 text-slate-200" : "hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <img 
                      src={contact.avatarUrl} 
                      alt={contact.username} 
                      className="w-8 h-8 rounded-full object-cover border border-slate-200/50 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate">{contact.username}</div>
                      <div className="text-[10px] text-slate-500 truncate">{contact.email}</div>
                    </div>
                    <svg className="w-4 h-4 text-emerald-500 opacity-60 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {isCreateGroupModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsCreateGroupModalOpen(false)}
          />
          {/* Modal */}
          <div className={`relative w-full max-w-[420px] rounded-3xl border shadow-2xl overflow-hidden animate-chat-bubble ${
            isDark 
              ? "bg-[#1A1A1E]/95 border-[#2E2E33] backdrop-blur-xl shadow-black/40" 
              : "bg-white/95 border-slate-200 backdrop-blur-xl shadow-slate-300/40"
          }`}>
            {/* Header */}
            <div className={`px-6 pt-6 pb-4 border-b ${isDark ? "border-[#2E2E33]" : "border-slate-100"}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-[16px] font-extrabold ${isDark ? "text-[#E8E8F0]" : "text-[#252529]"}`}>
                  Create New Group
                </h2>
                <button
                  onClick={() => setIsCreateGroupModalOpen(false)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
                    isDark ? "hover:bg-[#2E2E33] text-slate-400" : "hover:bg-slate-100 text-slate-500"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Group Name Input */}
              <div className="mt-4">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  Group Name
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Design Team, Study Group..."
                  className={`w-full mt-1.5 px-4 py-2.5 rounded-xl text-sm font-medium outline-none border transition-all focus:ring-2 ${
                    isDark 
                      ? "bg-[#252529] border-[#2E2E33] text-[#E8E8F0] placeholder-slate-600 focus:border-[#E8EA7A]/40 focus:ring-[#E8EA7A]/10" 
                      : "bg-slate-50 border-slate-200 text-[#252529] placeholder-slate-400 focus:border-[#E8EA7A]/60 focus:ring-[#E8EA7A]/10"
                  }`}
                  autoFocus
                />
              </div>
            </div>

            {/* Selected Members Chips */}
            {selectedGroupMembers.length > 0 && (
              <div className={`px-6 py-3 border-b flex flex-wrap gap-1.5 ${isDark ? "border-[#2E2E33]" : "border-slate-100"}`}>
                {selectedGroupMembers.map(member => (
                  <span
                    key={member}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold border transition-all ${
                      isDark
                        ? "bg-[#E8EA7A]/10 text-[#E8EA7A] border-[#E8EA7A]/20"
                        : "bg-[#E8EA7A]/15 text-[#7A7C1D] border-[#E8EA7A]/30"
                    }`}
                  >
                    {member}
                    <button
                      onClick={() => toggleGroupMember(member)}
                      className="w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-red-500/20 text-current transition-all cursor-pointer"
                    >
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Members Search */}
            <div className={`px-6 pt-3 ${isDark ? "" : ""}`}>
              <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                Add Members ({selectedGroupMembers.length} selected)
              </label>
              <div className={`mt-1.5 flex items-center gap-2 px-3 py-2 border rounded-xl ${
                isDark ? "bg-[#252529] border-[#2E2E33]" : "bg-slate-50 border-slate-200"
              }`}>
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
                </svg>
                <input
                  type="text"
                  value={groupSearchQuery}
                  onChange={(e) => setGroupSearchQuery(e.target.value)}
                  placeholder="Search contacts..."
                  className={`bg-transparent text-xs w-full outline-none ${isDark ? "text-[#E8E8F0] placeholder-slate-600" : "text-[#252529] placeholder-slate-400"}`}
                />
              </div>
            </div>

            {/* Member List */}
            <div className="px-4 py-3 max-h-[220px] overflow-y-auto custom-scrollbar space-y-0.5">
              {filteredContacts
                .filter(u => u.username.toLowerCase().includes(groupSearchQuery.toLowerCase()))
                .map(user => {
                  const isSelected = selectedGroupMembers.includes(user.username);
                  return (
                    <button
                      key={user.username}
                      onClick={() => toggleGroupMember(user.username)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer ${
                        isSelected
                          ? isDark ? "bg-[#E8EA7A]/8 border border-[#E8EA7A]/15" : "bg-[#E8EA7A]/10 border border-[#E8EA7A]/20"
                          : isDark ? "hover:bg-[#2E2E33]/60 border border-transparent" : "hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <img src={user.avatarUrl} alt={user.username} className="w-9 h-9 rounded-full object-cover border border-slate-200/30 flex-shrink-0" />
                      <div className="flex-1 min-w-0 text-left">
                        <div className={`text-[12px] font-bold truncate ${isDark ? "text-[#E8E8F0]" : "text-[#252529]"}`}>{user.username}</div>
                        <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected
                          ? "bg-[#E8EA7A] border-[#E8EA7A]"
                          : isDark ? "border-slate-600" : "border-slate-300"
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-[#1E1E22]" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>

            {/* Footer */}
            <div className={`px-6 py-4 border-t ${isDark ? "border-[#2E2E33]" : "border-slate-100"}`}>
              <button
                onClick={createGroup}
                disabled={!newGroupName.trim() || selectedGroupMembers.length === 0}
                className={`w-full py-3 rounded-2xl text-[13px] font-extrabold transition-all active:scale-[0.97] cursor-pointer ${
                  newGroupName.trim() && selectedGroupMembers.length > 0
                    ? "bg-gradient-to-r from-[#E8EA7A] to-[#D2D45E] hover:brightness-110 text-[#1E1E22] shadow-md shadow-[#E8EA7A]/15"
                    : isDark ? "bg-[#2E2E33] text-slate-600 cursor-not-allowed" : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                Create Group ({selectedGroupMembers.length} member{selectedGroupMembers.length !== 1 ? "s" : ""})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
