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
  Palette
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
  const [navView, setNavView] = useState<"chat" | "group" | "settings">("chat"); // left nav sidebar active view

  // Settings Theme
  const theme = "dark"; const setTheme = () => {}; // "dark", "light", or "black"
  const isDark = theme === "dark" || theme === "black";

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

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
                    email: parsed.email || `${parsed.username.toLowerCase().replace(/\s+/g, "")}@chatgroup.com`,
                    password: storedToken || ("chatgroup_auto_restore_" + parsed.username),
                    avatarUrl: parsed.avatarUrl,
                    category: parsed.category || "MEMBER",
                    bio: parsed.bio || "Joined ChatGroup."
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
      if (currentActive && currentActive.username === newMsg.sender) {
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
    if (!regEmail.trim().toLowerCase().endsWith("@gmail.com")) {
      setAuthError("Registration is restricted to original @gmail.com email addresses.");
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
      bio: "Joined ChatGroup. Let's communicate in real-time."
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

  // Filters contacts list for sidebar search (real humans with Gmail accounts only)
  const filteredContacts = registeredUsers.filter(
    (u) =>
      currentUser &&
      currentUser.username &&
      u &&
      u.username &&
      u.email &&
      u.email.toLowerCase().endsWith("@gmail.com") &&
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
    if (status === "sent") {
      return (
        <Check className="w-3.5 h-3.5 inline ml-1 text-slate-400 transition-colors duration-300" strokeWidth={3} />
      );
    }
    const color = status === "read" ? "text-sky-400" : "text-slate-400";
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
      .then(res => res.json())
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
        setToast("Error updating profile. Please try again. ❌");
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
              </div>
            </aside>
          )}

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
    </div>
  );
}
