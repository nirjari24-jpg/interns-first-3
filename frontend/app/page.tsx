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
  Award
} from "lucide-react";

// Types
interface User {
  username: string;
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
const MOCK_CONTACTS: User[] = [
  {
    username: "Ana Malbasa",
    avatarUrl: PRESET_AVATARS[0],
    category: "PERSONAL BLOG",
    bio: "Lorem Ipsum Dolor Sit Amet, Consectetur Adipiscing Elit. Donec Sit Amet Nunc Augue. Pellentesque Vel Pellentesque Tellus. Nam Lacinia Leo Sed Eleifend Dignissim.",
    statusText: "Active 5m ago"
  },
  {
    username: "Paul Osmand",
    avatarUrl: PRESET_AVATARS[1],
    category: "CREATIVE DESIGNER",
    bio: "Passionate about layouts, dark themes, and rich aesthetics. UI developer & animator based in London.",
    statusText: "hahah, nice!"
  },
  {
    username: "Edward Davis",
    avatarUrl: PRESET_AVATARS[4],
    category: "PHOTOGRAPHER",
    bio: "Capturing moments and cityscapes. Let's grab coffee and share our logs.",
    statusText: "Are we still going for a coffee?"
  },
  {
    username: "Naomi Riste",
    avatarUrl: PRESET_AVATARS[5],
    category: "WRITER",
    bio: "Words shape worlds. Blogging, script-writing, and coffee lover.",
    statusText: "What did your boss say?"
  },
  {
    username: "Jonathan Blake",
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

  function fetchUsers() {
    fetch(`${API_BASE}/api/users`)
      .then(res => res.json())
      .then(users => {
        if (users && Array.isArray(users)) {
          setRegisteredUsers(users);
          setActiveContact(prev => {
            if (!prev) {
              return users.length > 0 ? users[0] : null;
            }
            const exists = users.some(u => u.username === prev.username);
            if (!exists) {
              return users.length > 0 ? users[0] : null;
            }
            return prev;
          });
        }
      })
      .catch(err => console.warn("Error fetching users:", err));
  }

  // Navigation View State
  const [currentView, setCurrentView] = useState("chat"); // "chat" or "settings"

  // Settings Theme
  const [theme, setTheme] = useState<"light" | "dark" | "black">("dark"); // "dark", "light", or "black"
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
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState(PRESET_AVATARS[0]);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);

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
  const socketRef = useRef<any>(null);
  const tempMessageIdRef = useRef<string | null>(null);
  const activeContactRef = useRef<User | null>(null);
  const chatImageInputRef = useRef<HTMLInputElement>(null);

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

  // Helper to resolve request status between current user and a contact
  const getChatRelationship = (contactUsername: string) => {
    if (!currentUser || !currentUser.username || !contactUsername) return null;
    
    // Automatically accept mock contacts
    const isMock = MOCK_CONTACTS.some(c => c.username.toLowerCase() === contactUsername.toLowerCase());
    if (isMock) {
      return {
        id: `mock-request-${contactUsername.toLowerCase()}`,
        sender: currentUser.username,
        recipient: contactUsername,
        status: 'accepted' as const
      };
    }

    const match = messageRequests.find(r => 
      (r.sender.toLowerCase() === currentUser.username.toLowerCase() && r.recipient.toLowerCase() === contactUsername.toLowerCase()) ||
      (r.sender.toLowerCase() === contactUsername.toLowerCase() && r.recipient.toLowerCase() === currentUser.username.toLowerCase())
    );
    return match || null;
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
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.username) {
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

    fetchUsers();
    fetchRequests();
  }, [API_BASE]);

  // Save theme changes to Local Cache
  useEffect(() => {
    localStorage.setItem("chatgroup_theme", theme);
  }, [theme]);

  // Poll users periodically
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUsers();
      fetchRequests();
    }, 10000);
    return () => clearInterval(interval);
  }, [API_BASE]);

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
      } else {
        playSound("receive");
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
      .catch(err => console.warn("Error marking messages as read:", err));
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

      fetchUsers();
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

      fetchUsers();
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

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
    playSound("send");
    setTimeout(() => scrollToBottom("smooth"), 50);

    // Emit message through Socket
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("sendMessage", {
        sender: currentUser.username,
        recipient: activeContact.username,
        text: textContent,
        imageUrl: imageLink,
        time: timeStringVal
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

        if (!currentUser) return;

        fetch(`${API_BASE}/api/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: contactName,
            recipient: currentUser.username,
            text,
            time: timeStringVal,
            status: "sent"
          })
        })
        .then(res => res.json())
        .then(savedMsg => {
          setMessages(prev => [...prev, savedMsg]);
          setTypingUsers((prev) => ({ ...prev, [contactName]: false }));
          playSound("receive");
          setTimeout(() => scrollToBottom("smooth"), 50);
        })
        .catch(err => console.error("Error saving mock reply:", err));
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

  function handleLogout() {
    setCurrentUser(null);
    setActiveContact(null);
    localStorage.removeItem("chatgroup_current_user");
    localStorage.removeItem("chatgroup_session_token");
  }

  // Resolve chat relationship and status
  const activeRelationship = activeContact ? getChatRelationship(activeContact.username) : null;
  const isAccepted = activeRelationship?.status === "accepted";

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
      currentUser.username &&
      u &&
      u.username &&
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
      // Backend /api/users/profile requires 'email' to identify the user
      const reqBody = {
        email: (currentUser as any).email || email,
        avatarUrl: avatar,
        bio: bio.trim()
      };

      fetch(`${API_BASE}/api/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody)
      })
      .then(res => res.json())
      .then(updatedUser => {
        setCurrentUser(updatedUser);
        localStorage.setItem("chatgroup_current_user", JSON.stringify(updatedUser));
        
        fetchUsers();

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
          : isDark ? "bg-[#04060A] text-[#E4E6EB]" 
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
            isDark ? "bg-gradient-to-r from-black via-[#08080C] to-black border-slate-900" 
              : "bg-white border-slate-200"
          }`}>
            
            <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-purple-500 to-transparent" />

            <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
              {/* Back to Chat Trigger */}
              <button
                onClick={() => setCurrentView("chat")}
                className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                  isDark ? "bg-slate-900 border-slate-800 text-cyan-400 hover:bg-slate-800"
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
                    ? "bg-[#121212] border-neutral-900 text-amber-400 hover:bg-neutral-900"
                    : isDark ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-850"
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
                isDark ? "bg-[#0A0A0C]/90 border-slate-900" : "bg-white border-slate-200 shadow-md"
              }`}>
                <h3 className={`text-xs font-extrabold uppercase tracking-wider mb-4 px-1.5 ${isDark ? "text-slate-400" : "text-black"}`}>Settings Hub</h3>
                
                <div className="space-y-1.5">
                  <button
                    onClick={() => setActiveSection("profile")}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl font-black text-xs.5 transition-all text-left border cursor-pointer ${
                      activeSection === "profile"
                        ? "bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-indigo-500/15 text-cyan-400 border-cyan-500/30 shadow-md shadow-cyan-500/5"
                        : "bg-black/40 border-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-800"
                    }`}
                  >
                    <UserIcon className="w-4.5 h-4.5" />
                    <span>Account Details</span>
                  </button>

                  <button
                    onClick={() => setActiveSection("security")}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl font-black text-xs.5 transition-all text-left border cursor-pointer ${
                      activeSection === "security"
                        ? "bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-indigo-500/15 text-cyan-400 border-cyan-500/30 shadow-md shadow-cyan-500/5"
                        : "bg-black/40 border-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-800"
                    }`}
                  >
                    <Lock className="w-4.5 h-4.5" />
                    <span>Password & Security</span>
                  </button>
                </div>
              </div>

              <div className={`border rounded-[28px] p-5 shadow-xl transition-all duration-500 overflow-hidden relative ${
                isDark ? "bg-[#0A0A0C]/90 border-slate-900" : "bg-white border-slate-200 shadow-md"
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
                isDark ? "bg-slate-950/40 border-slate-800/80" 
                  : "bg-white border-slate-200 shadow-sm"
              }`}>
                <button
                  type="button"
                  onClick={() => setActiveSection("profile")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs.5 transition-all cursor-pointer ${
                    activeSection === "profile"
                      ? isDark ? "bg-gradient-to-r from-cyan-500/15 to-indigo-500/15 text-cyan-400 border border-cyan-500/20"
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
                      ? isDark ? "bg-gradient-to-r from-cyan-500/15 to-indigo-500/15 text-cyan-400 border border-cyan-500/20"
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
                  isDark ? "bg-[#0A0A0C]/90 border-slate-900" : "bg-white border-slate-200 shadow-md"
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
                              isDark ? "bg-[#07070A] border-slate-900 text-white focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/10" 
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
                              isDark ? "bg-[#07070A] border-slate-900 text-white focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/10" 
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
                              isDark ? "bg-[#07070A] border-slate-900 text-white focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/10" 
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
                              isDark ? "bg-[#07070A] border-slate-900 text-white focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/10" 
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
                            isDark ? "bg-[#07070A] border-slate-900 text-white focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/10" 
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
                  isDark ? "bg-[#0A0A0C]/90 border-slate-900" : "bg-white border-slate-200 shadow-md"
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
                              isDark ? "bg-[#07070A] border-slate-900 text-white focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/10" 
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
                              isDark ? "bg-[#07070A] border-slate-900 text-white focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/10" 
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
                              isDark ? "bg-[#07070A] border-slate-900 text-white focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/10" 
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
                isDark ? "bg-[#0A0A0C]/90 border-slate-900" : "bg-white border-slate-200 shadow-md"
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
        : isDark ? "bg-slate-950 text-slate-100" 
          : "bg-white text-slate-800"
    }`}>
      
      {/* 1. TOP CHATGROUP NAVBAR */}
      <header className={`h-[60px] border-b px-6 flex items-center justify-between z-50 flex-shrink-0 backdrop-blur-md ${
        theme === "black"
          ? "bg-black border-neutral-900"
          : isDark ? "bg-[#000000]/95 border-slate-900" : "bg-white/95 border-slate-200"
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
        <div className={`hidden md:flex w-[260px] h-[36px] border rounded-lg items-center px-3 gap-2 ${
          theme === "black"
            ? "bg-[#0a0a0a] border-neutral-900"
            : isDark ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"
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

        {/* Right Nav Icons */}
        <div className="flex items-center gap-5">
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

          {/* Theme Toggle Button */}
          <button
            onClick={() => {
              setTheme(prev => {
                const next = prev === "light" ? "dark" : prev === "dark" ? "black" : "light";
                setToast(next === "light" ? "Light Theme Activated ☀️" : next === "dark" ? "Dark Theme Activated 🌙" : "OLED Black Theme Activated 🌑");
                setTimeout(() => setToast(null), 2500);
                return next;
              });
            }}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
              theme === "black"
                ? "bg-[#121212] border-neutral-900 text-yellow-400 hover:bg-neutral-900 shadow-md"
                : isDark ? "bg-slate-900 border-slate-800 text-yellow-400 hover:bg-slate-850 hover:text-yellow-300 shadow-md shadow-yellow-500/5" 
                  : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 shadow-sm"
            }`}
            title={`Toggle Theme (Current: ${theme === "black" ? "OLED Black" : isDark ? "Dark Mode" : "Light Mode"})`}
          >
            {theme === "black" ? (
              <Sun className="w-4 h-4 text-yellow-400" />
            ) : isDark ? (
              <Sparkles className="w-4.5 h-4.5" />
            ) : (
              <Moon className="w-4 h-4 text-slate-650" />
            )}
          </button>

          {/* Settings gear icon */}
          <button 
            onClick={() => {
              if (currentUser) {
                setName(currentUser.username);
                setUsername(currentUser.username);
                setBio(currentUser.bio || "");
                setAvatar(currentUser.avatarUrl);
              }
              setCurrentView("settings");
            }}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 border border-cyan-500/30 text-cyan-400 hover:text-cyan-300 hover:border-cyan-400 hover:scale-105 transition-all shadow-md shadow-cyan-500/5 active:scale-95 flex items-center gap-1.5 font-extrabold text-xs cursor-pointer"
            title="Settings Dashboard"
          >
            <svg className="w-4.5 h-4.5 stroke-[2.2] animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="hidden sm:inline">Profile Settings</span>
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
          {currentUser ? (
            <div className="relative group cursor-pointer" onClick={() => {
              if (currentUser) {
                setName(currentUser.username);
                setUsername(currentUser.username);
                setBio(currentUser.bio || "");
                setAvatar(currentUser.avatarUrl);
              }
              setCurrentView("settings");
            }}>
              <div className="absolute -inset-0.5 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-500 opacity-60 blur-xs group-hover:opacity-100 transition duration-300" />
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.username}
                className="relative w-8 h-8 rounded-full object-cover border border-black active:scale-95 transition-transform"
              />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 border border-white/20 flex items-center justify-center text-white">
              <span className="text-[10px] font-bold">U</span>
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
              isDark ? "bg-indigo-600/15 opacity-100" : "bg-indigo-400/10 opacity-80"
            }`} />
            <div className={`absolute bottom-[10%] right-[15%] w-[280px] sm:w-[350px] h-[280px] sm:h-[350px] rounded-full blur-[110px] transition-opacity duration-700 animate-float-medium ${
              isDark ? "bg-sky-500/15 opacity-100" : "bg-sky-400/10 opacity-80"
            }`} />
          </div>

          <div className={`w-full max-w-[420px] rounded-[32px] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.15)] flex flex-col items-center animate-chat-bubble border relative z-10 ${
            theme === "black"
              ? "bg-[#050505] border-neutral-900 text-slate-100 black-theme"
              : isDark ? "glass-card-dark text-slate-100" : "glass-card-light text-slate-800"
          }`}>
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-sky-500/40 to-transparent" />
            
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/10 mb-4 text-white">
              <svg className="w-7 h-7 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
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
                    placeholder="e.g. paul or paul@chatgroup.com"
                    className={`w-full px-4 py-3 border rounded-2xl outline-none text-sm font-medium transition-all focus:ring-4 ${
                      isDark ? "bg-slate-900/50 border-slate-800 text-white placeholder-slate-500 focus:border-sky-500 focus:ring-sky-500/10" 
                        : "bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:ring-sky-500/10 shadow-sm"
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
                      isDark ? "bg-slate-900/50 border-slate-800 text-white placeholder-slate-500 focus:border-sky-500 focus:ring-sky-500/10" 
                        : "bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:ring-sky-500/10 shadow-sm"
                    }`}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className={`w-full py-3.5 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 font-bold text-white rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-sm mt-2 cursor-pointer ${
                    isAuthLoading ? "opacity-70 cursor-not-allowed" : "hover:brightness-110"
                  }`}
                >
                  {isAuthLoading ? "Signing In..." : "Sign In"}
                </button>

                {/* Demo credentials hint */}
                <div className={`w-full mt-1 px-3 py-2.5 rounded-xl border text-[10px] leading-relaxed ${
                  isDark
                    ? "bg-sky-500/5 border-sky-500/15 text-slate-400"
                    : "bg-sky-50 border-sky-100 text-slate-500"
                }`}>
                  <span className="font-extrabold text-sky-400 uppercase tracking-wider text-[9px]">Demo Accounts</span>
                  <br />
                  <span className="font-semibold">paul@chatgroup.com</span> · <span className="opacity-70">password123</span>
                  <br />
                  <span className="font-semibold">ana@chatgroup.com</span> · <span className="opacity-70">password123</span>
                  <br />
                  <span className="opacity-60 text-[9px]">Or sign up to create your own account.</span>
                </div>

                <p className="text-[11.5px] text-slate-450 text-center mt-3 font-semibold">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("register");
                      setAuthError(null);
                    }}
                    className="text-sky-500 hover:underline font-bold"
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
                            ? "border-sky-500 ring-2 ring-sky-500/20 scale-105" 
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
                    maxLength={30}
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="e.g. Ann"
                    className={`w-full px-4 py-3 border rounded-2xl outline-none text-sm font-medium transition-all focus:ring-4 ${
                      isDark ? "bg-slate-900/50 border-slate-800 text-white placeholder-slate-500 focus:border-sky-500 focus:ring-sky-500/10" 
                        : "bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:ring-sky-500/10 shadow-sm"
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
                      isDark ? "bg-slate-900/50 border-slate-800 text-white placeholder-slate-500 focus:border-sky-500 focus:ring-sky-500/10" 
                        : "bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:ring-sky-500/10 shadow-sm"
                    }`}
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Password</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create a password"
                    className={`w-full px-4 py-3 border rounded-2xl outline-none text-sm font-medium transition-all focus:ring-4 ${
                      isDark ? "bg-slate-900/50 border-slate-800 text-white placeholder-slate-500 focus:border-sky-500 focus:ring-sky-500/10" 
                        : "bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:ring-sky-500/10 shadow-sm"
                    }`}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className={`w-full py-3.5 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 font-bold text-white rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-sm mt-2 cursor-pointer ${
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
                    className="text-sky-500 hover:underline font-bold"
                  >
                    Sign In
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      ) : (
        /* MAIN 3-COLUMN FLEXBOARD VIEWPORT */
        <div className="flex-1 flex overflow-hidden w-full relative">
          
          {/* COLUMN 1: LEFT SIDEBAR MESSAGES LIST (350px) */}
          <section 
            className={`border-r flex flex-col flex-shrink-0 transition-all duration-300 ${
              isDark ? "bg-black border-slate-900" : "bg-white border-slate-200"
            } ${
              activeContact 
                ? "hidden md:flex w-[350px] h-full" 
                : "w-full md:w-[350px] h-full"
            }`}
          >
            <div className="p-4 flex flex-col gap-3 border-b border-slate-100/10">
              <div className={`w-full h-[36px] border rounded-lg flex items-center px-3 gap-2 ${
                isDark ? "bg-[#070709] border-slate-900" : "bg-slate-50 border-slate-200"
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
                  const rel = getChatRelationship(user.username);
                  
                  const hasMockBadge = (user.username === "Paul Osmand" || user.username === "Edward Davis") && !lastMsg;

                  return (
                    <button
                      key={user.username}
                      onClick={() => setActiveContact(user)}
                      className={`w-full p-3 flex items-center gap-3.5 rounded-2xl relative transition-all duration-300 hover:translate-x-1 ${
                        isActive
                          ? isDark ? "bg-slate-800/80 border border-slate-700/50 shadow-md shadow-black/10" 
                            : "bg-slate-100 border border-slate-200/80 shadow-sm"
                          : isDark ? "border border-transparent hover:bg-slate-900/40 hover:border-slate-850/50" 
                            : "border border-transparent hover:bg-slate-50/80 hover:border-slate-100"
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
                        
                        <div className="text-[11.5px] text-slate-500 truncate leading-snug">
                          {isTyping ? (
                            <span className="text-purple-500 font-bold animate-pulse">typing...</span>
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
                        <span className="absolute right-4 w-7 h-4.5 rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 text-[9px] font-black text-white flex items-center justify-center select-none shadow animate-pulse">
                          REQ
                        </span>
                      ) : hasMockBadge ? (
                        <span className="absolute right-4 w-4.5 h-4.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-[10px] font-black text-white flex items-center justify-center select-none shadow">
                          1
                        </span>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* COLUMN 2: MIDDLE PANE - ACTIVE DIRECT MESSAGE STREAM */}
          <main 
            className={`flex-1 flex flex-col border-r transition-all duration-300 ${
              isDark ? "bg-black border-slate-900" : "bg-white border-slate-200"
            } ${
              !activeContact 
                ? "hidden md:flex h-full items-center justify-center text-center p-8" 
                : "flex h-full"
            }`}
          >
            {activeContact ? (
              <>
                {/* Active Chat Header */}
                <header className={`h-[60px] px-6 border-b flex items-center justify-between flex-shrink-0 z-40 select-none backdrop-blur-md ${
                  isDark ? "bg-[#000000]/95 border-slate-900" : "bg-white/95 border-slate-200"
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

                    <button 
                      onClick={() => setIsDetailPaneOpen((prev) => !prev)}
                      className={`w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100/10 text-slate-400 hover:text-slate-700 transition-all active:scale-90 cursor-pointer ${
                        isDetailPaneOpen ? "bg-slate-100/10 text-slate-300" : ""
                      }`}
                    >
                      <svg className="w-5.5 h-5.5 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.063.852l-.708 2.836a.75.75 0 001.063.852l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                      </svg>
                    </button>
                  </div>
                </header>

                {/* Message feeds stream */}
                <div className={`flex-1 overflow-y-auto px-6 py-6 space-y-5 custom-scrollbar flex flex-col ${
                  isDark ? "bg-black" : "bg-white"
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
                            className={`px-4 py-2.5 rounded-[20px] text-[14px] leading-relaxed shadow-md break-words relative transition-all ${
                              isMe
                                ? "bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 text-white rounded-br-xs shadow-blue-500/10 border border-blue-500/20"
                                : isDark ? "bg-slate-900/90 text-slate-100 rounded-bl-xs border border-slate-800/80 shadow-black/10"
                                  : "bg-slate-100/90 text-slate-800 rounded-bl-xs border border-slate-200/50 shadow-slate-100/50"
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

                {/* Floating input dock or Message Request Panel */}
                {isAccepted ? (
                  <div className="p-4 bg-transparent select-none flex-shrink-0 z-40">
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg ${
                      isDark ? "bg-slate-905/90 border-slate-800/80 backdrop-blur-md shadow-black/20" 
                        : "bg-white/95 border-slate-200 backdrop-blur-md shadow-slate-200/50"
                    }`}>
                      <input
                        type="file"
                        ref={chatImageInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleChatImageChange}
                      />
                      <button 
                        onClick={() => chatImageInputRef.current?.click()}
                        title="Send photo from camera or files"
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
                            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
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
                            isDark ? "bg-[#04060a] border-slate-850 text-white placeholder-slate-500 focus:border-sky-500/50 focus:ring-sky-500/5" 
                              : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-sky-500/50 focus:ring-sky-500/5"
                          }`}
                        />
                        <button
                          onClick={() => handleSendMessage()}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 hover:brightness-110 text-white flex items-center justify-center active:scale-90 transition-transform shadow shadow-sky-500/10 cursor-pointer"
                          disabled={!inputText.trim()}
                        >
                          <svg className="w-[15px] h-[15px] rotate-45 -translate-x-[0.5px] stroke-[2.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-transparent select-none flex-shrink-0 z-40">
                    <div className={`p-6 rounded-[28px] border flex flex-col items-center justify-center text-center gap-4 shadow-lg ${
                      isDark ? "bg-[#080B12]/90 border-slate-800/80 backdrop-blur-md shadow-black/20" 
                        : "bg-white/95 border-slate-200 backdrop-blur-md shadow-slate-200/50"
                    }`}>
                      {activeRelationship === null && (
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-slate-400">
                            You need to send a message request to start chatting with {activeContact.username}.
                          </p>
                          <button
                            onClick={() => sendChatRequest(activeContact.username)}
                            className="px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-110 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-sky-500/10 active:scale-95 transition-all cursor-pointer"
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
                            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-2xl transition-all cursor-pointer"
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
              className={`w-full lg:w-[320px] border-l flex flex-col items-center text-center select-none z-45 animate-chat-bubble absolute lg:static top-0 right-0 h-full lg:h-auto shadow-2xl lg:shadow-none overflow-y-auto ${
                isDark ? "bg-black border-slate-900" : "bg-white border-slate-200"
              }`}
            >
              {/* Cover Banner Cover */}
              <div className="w-full h-24 bg-gradient-to-r from-sky-500/20 via-indigo-500/20 to-purple-500/20 relative flex-shrink-0">
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
                <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 opacity-60 blur-xs" />
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
                
                <span className="text-[10px] font-extrabold tracking-widest text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full uppercase mb-5">
                  {activeContact.category || "MEMBER"}
                </span>

                <div className={`w-full rounded-2xl p-4 border text-left mb-6 ${
                  isDark ? "bg-[#070709] border-slate-900" : "bg-slate-50 border-slate-150"
                }`}>
                  <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1.5">Biography</h4>
                  <p className={`text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-655"}`}>
                    {activeContact.bio || "No biography provided by this user."}
                  </p>
                </div>

                <button className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:brightness-110 hover:shadow-cyan-500/20 text-white font-extrabold text-xs tracking-wider shadow-lg shadow-blue-500/20 active:scale-95 transition-all uppercase cursor-pointer">
                  View Profile Details
                </button>

                <div className="flex gap-4 mt-8 select-none">
                  {isAccepted && (
                    <button
                      onClick={() => startCall("video")}
                      title="Video Call"
                      className={`w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-all shadow-md cursor-pointer border ${
                        isDark ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white" 
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
                        isDark ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white" 
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
          <div className="relative z-10 w-full max-w-4xl h-full md:max-h-[85vh] max-h-screen md:rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden">
            
            {/* Call Header info */}
            <div className="p-4 md:p-6 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-sm font-bold tracking-wider uppercase text-slate-400">
                  {callType === "video" ? "Video Call" : "Voice Call"} — {callState.toUpperCase()}
                </span>
              </div>

              <div className="text-xs bg-slate-800/80 px-3 py-1.5 rounded-full font-mono font-bold tracking-wide">
                {currentTime}
              </div>
            </div>

            {/* Call Body: Streams or Ringing profile */}
            <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-3 md:p-6 gap-4 md:gap-6 relative">
              
              {/* If RINGING (receiving a call) or CALLING (outgoing) */}
              {(callState === "calling" || callState === "ringing") && (
                <div className="flex flex-col items-center text-center space-y-6 animate-pulse">
                  <div className="relative">
                    <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 opacity-30 blur-md animate-pulse" />
                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-slate-850 shadow-xl relative bg-slate-800 p-1">
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
                <div className="w-full h-full relative flex items-center justify-center bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
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
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-3.5 z-30 bg-slate-950/60 backdrop-blur-md p-2.5 rounded-2xl border border-slate-800 shadow-2xl transition-all duration-300">
                        {/* Mute Microphone Button */}
                        <button
                          onClick={toggleMute}
                          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                            isMicMuted 
                              ? "bg-rose-500/20 text-rose-500 border border-rose-500/30 hover:bg-rose-500/30" 
                              : "bg-slate-900/80 hover:bg-slate-800 text-slate-350 hover:text-white border border-slate-800/80"
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
                              : "bg-slate-900/80 hover:bg-slate-800 text-slate-350 hover:text-white border border-slate-800/80"
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
                              ? "bg-slate-900/80 hover:bg-slate-800 text-slate-350 hover:text-white border-slate-800/80 cursor-pointer"
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
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-emerald-500 shadow-xl bg-slate-800">
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
              <div className="p-6 bg-slate-950/80 border-t border-slate-800 flex items-center justify-center gap-6 select-none">
                <button
                  onClick={toggleMute}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isMicMuted ? "bg-rose-500/20 text-rose-500 border border-rose-500/30" : "bg-slate-800 hover:bg-slate-700 text-white"
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
                      isCameraOff ? "bg-rose-500/20 text-rose-500 border border-rose-500/30" : "bg-slate-800 hover:bg-slate-700 text-white"
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
                  <div className="relative flex items-center bg-slate-800 hover:bg-slate-700 border border-slate-700/50 rounded-full px-3 py-2 text-white text-xs font-semibold cursor-pointer max-w-[160px] sm:max-w-[200px] transition-all">
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
    </div>
  );
}
