import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Terminal, Settings, Plus, Search, Bell, MoreVertical,
  Smile, Send, Mic, Paperclip, Check, CheckCheck, Info, MessageSquare,
  Hash, Users, User, X, CheckSquare, Square, Trash2, LogOut
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

// --- Types & Mock Data ---

type Message = {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderColor?: string;
  time: string;
  content: string | React.ReactNode;
  image?: string;
  status?: 'sent' | 'delivered' | 'read';
  isSelf: boolean;
};

type ChatSession = {
  id: string;
  name: string;
  type: 'direct' | 'group';
  avatar?: string;
  color?: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  online: boolean;
};

type Category = {
  id: string;
  name: string;
  chatIds: string[];
};

type FriendRequest = {
  id: string;
  fromId: string;
  fromName: string;
};

type Member = {
  id: string;
  name: string;
  role: 'Admin' | 'Engineer' | 'Designer' | 'Guest';
  status: 'online' | 'offline' | 'busy';
  avatar: string;
  color?: string;
};

// --- Components ---

function WorkspaceItem({
  icon: Icon,
  label,
  active = false,
  isLast = false,
  onClick,
  onDelete,
  letter
}: {
  icon?: any,
  label: string,
  active?: boolean,
  isLast?: boolean,
  onClick?: () => void,
  onDelete?: (e: React.MouseEvent) => void,
  letter?: string,
  key?: React.Key
}) {
  return (
    <div className={`relative group flex justify-center w-full ${isLast ? 'mt-auto' : ''}`}>
      <div className="relative">
        <button
          onClick={onClick}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all scale-95 active:scale-90 ${active
            ? `bg-[#4edea3] text-[#131313] shadow-[0_0_12px_rgba(78,222,163,0.4)]`
            : `bg-[#201f22] text-[#bbcabf] hover:bg-[#3c4a42] hover:text-[#e5e2e1] hover:rounded-xl`
            }`}
        >
          {Icon && <Icon size={24} />}
          {letter && !Icon && <span className="font-bold text-lg uppercase">{letter}</span>}
        </button>
        {onDelete && (
          <button
            onClick={onDelete}
            className="absolute -top-1 -right-1 bg-[#ef4444] text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110 z-50"
            title="Delete category"
          >
            <X size={12} strokeWidth={3} />
          </button>
        )}
      </div>
      <div className="absolute left-full ml-[calc(100%-8px)] px-3 py-1 bg-[#2a2a2a] border border-[#3c4a42] rounded-md text-xs font-medium text-[#e5e2e1] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        {label}
      </div>
    </div>
  );
}

const MessageBubble: React.FC<{ message: Message; showAvatar: boolean }> = ({ message, showAvatar }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex w-full mb-1 ${message.isSelf ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex max-w-[75%] ${message.isSelf ? 'flex-row-reverse' : 'flex-row'} items-end`}>
        {!message.isSelf && (
          <div className="w-8 flex-shrink-0 mr-2">
            {showAvatar ? (
              message.senderAvatar ? (
                <img src={message.senderAvatar} alt={message.senderName} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className={`w-8 h-8 rounded-full ${message.senderColor || 'bg-gray-500'} text-white flex items-center justify-center text-xs font-bold`}>
                  {message.senderName.charAt(0)}
                </div>
              )
            ) : <div className="w-8 h-8"></div>}
          </div>
        )}

        <div className={`relative flex flex-col ${message.isSelf ? 'items-end' : 'items-start'}`}>
          <div className={`px-4 py-2 rounded-2xl ${message.isSelf
            ? 'bg-[#4edea3] text-[#002113] rounded-br-sm'
            : 'bg-[#2a2d31] text-[#e5e2e1] rounded-bl-sm border border-[#3c4a42]/50'
            }`}>
            {!message.isSelf && showAvatar && (
              <span className="text-xs font-bold mb-1 block" style={{ color: message.isSelf ? 'inherit' : '#4edea3' }}>
                {message.senderName}
              </span>
            )}
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
            <div className={`flex items-center justify-end space-x-1 mt-1 ${message.isSelf ? 'text-[#002113]/70' : 'text-[#bbcabf]/60'}`}>
              <span className="text-[10px]">{message.time}</span>
              {message.isSelf && message.status === 'read' && <CheckCheck size={14} className="text-[#059669]" />}
              {message.isSelf && message.status === 'delivered' && <CheckCheck size={14} />}
              {message.isSelf && message.status === 'sent' && <Check size={14} />}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Chat() {
  const { user, token, logout } = useAuth();
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [inputValue, setInputValue] = useState("");

  // Navigation State
  const [activeWorkspace, setActiveWorkspace] = useState<'all' | 'direct' | 'group' | string>('all');
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [customCategories, setCustomCategories] = useState<Category[]>([]);

  // Loading States
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isAddingChat, setIsAddingChat] = useState(false);
  const [addChatError, setAddChatError] = useState<string | null>(null);

  // Friend Requests State
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [showFriendRequests, setShowFriendRequests] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(new Set());

  // Dropdown Menu State
  const [dropdownMenu, setDropdownMenu] = useState<{ visible: boolean; x: number; y: number; chatId: string | null }>({ visible: false, x: 0, y: 0, chatId: null });

  // Delete Confirm Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  // Add Chat Modal State
  const [showAddChatModal, setShowAddChatModal] = useState(false);
  const [newChatId, setNewChatId] = useState('');

  // Right Sidebar State
  const [showMembersPanel, setShowMembersPanel] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // --- BE INTEGRATION: INITIAL DATA FETCH ---
  useEffect(() => {
    const fetchData = async () => {
      const apiBase = import.meta.env.VITE_API_URL || '';
      try {
        if (apiBase) {
          // Fetch active chat rooms
          const chatsData = await api.get('/chats');
          setChats(chatsData);

          // Fetch active workspace members
          const membersData = await api.get('/members');
          setMembers(membersData);

          // Fetch friend requests
          const reqData = await api.get('/friend-requests');
          setFriendRequests(reqData);
        } else {
          // Fallback: Populate mock data for testing if offline
          await new Promise(resolve => setTimeout(resolve, 800));
          setChats([
            {
              id: 'c1',
              name: 'Engineering Team',
              type: 'group',
              avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&h=100&fit=crop',
              lastMessage: 'David: Let\'s look at the blur-radius.',
              time: '2:51 PM',
              unreadCount: 3,
              online: true,
            },
            {
              id: 'c2',
              name: 'Elena Rostova',
              type: 'direct',
              avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7S_e5Te6PRqoXDr2zXASVNBUmQnmYL99eLmkMfnXQW21Y8MiA9AEYWn2lauHGr0ZrtMcqJ6BaZqRujmtp9zWaAAKTY5_8Bjrnsyfe0pJzuzVgmKRzthgKCccfFu3aasHkn76T799kIa4H18w5HJAHZjuXkOMc-trko8EXol63D0iq-dIH6RYgXB6P73TJ3IAsE6AfJDvnbIeVatF1PmfTRFw9FaaAMKxoW6nKKf0gSH1lZM161ivaZuUm64h2nkXQTTCu4E5dKe4',
              lastMessage: 'Verification complete!',
              time: '2:46 PM',
              unreadCount: 0,
              online: true,
            }
          ]);
          setMembers([
            { id: '1', name: 'Elena Rostova', role: 'Admin', status: 'online', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7S_e5Te6PRqoXDr2zXASVNBUmQnmYL99eLmkMfnXQW21Y8MiA9AEYWn2lauHGr0ZrtMcqJ6BaZqRujmtp9zWaAAKTY5_8Bjrnsyfe0pJzuzVgmKRzthgKCccfFu3aasHkn76T799kIa4H18w5HJAHZjuXkOMc-trko8EXol63D0iq-dIH6RYgXB6P73TJ3IAsE6AfJDvnbIeVatF1PmfTRFw9FaaAMKxoW6nKKf0gSH1lZM161ivaZuUm64h2nkXQTTCu4E5dKe4' },
            { id: '2', name: 'David Kim', role: 'Engineer', status: 'busy', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBDb5TBpbNkJfluxHLjGl8-kUe8pMW7MLF7Eagw0YcUu0crO0dDe_zgPqAiJao2GrKFtSA3GRpCgZZTT_SMzt1GBkyBZnIPkT3tMFsFBjM0NEIQoq0WhOM_jKczyWdAqJgaLZNdsvlysCr8f-rtybreLjRSU_j1qw97aN5G_ufaPrdRjCcU_lVakN4_SGThuCicGp8fYduL2ImAZEfrnDoELXBLPp0ATXdTyKvf1ZKYbgJbXN35TEprKlkFqJUzVZQoqhkqOvk2mAs' },
            { id: '3', name: 'Marcus Chen', role: 'Engineer', status: 'online', avatar: '', color: 'bg-rose-500' },
            { id: '4', name: 'Sarah O\'Connor', role: 'Designer', status: 'offline', avatar: '', color: 'bg-purple-500' }
          ]);
          setFriendRequests([{ id: 'req-1', fromId: 'bob-99', fromName: 'Bob Engineer' }]);
        }
      } catch (err) {
        console.error('Error fetching dynamic initial data:', err);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, [token]);

  // --- SOCKET.IO CONNECTION & REAL-TIME EVENTS ---
  useEffect(() => {
    if (!token) return;

    const apiBase = import.meta.env.VITE_API_URL || '';
    const socketUrl = import.meta.env.VITE_WS_URL || apiBase.replace(/\/api\/?$/, '');
    if (!socketUrl) return;

    const socket = io(socketUrl, {
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('receiveMessage', (message: Message) => {
      const normalizedMessage = {
        ...message,
        isSelf: message.senderId === user?.id,
      };
      setMessages(prev =>
        prev.some(existing => existing.id === normalizedMessage.id)
          ? prev
          : [...prev, normalizedMessage]
      );
    });

    socket.on('messageStatusUpdate', ({ messageId, status }) => {
      setMessages(prev =>
        prev.map(message =>
          message.id === messageId ? { ...message, status } : message
        )
      );
    });

    socket.on('chatUpdated', (update: Partial<ChatSession> & { id: string }) => {
      setChats(prev =>
        prev.map(chat => chat.id === update.id ? { ...chat, ...update } : chat)
      );
    });

    socket.on('friendRequestReceived', (request: FriendRequest) => {
      setFriendRequests(prev =>
        prev.some(existing => existing.id === request.id)
          ? prev
          : [request, ...prev]
      );
    });

    socket.on('friendRequestAccepted', ({ chat }: { chat: ChatSession }) => {
      setChats(prev => [chat, ...prev.filter(existing => existing.id !== chat.id)]);
    });

    socket.on('memberStatusUpdate', ({ id, status }) => {
      setMembers(prev =>
        prev.map(member => member.id === id ? { ...member, status } : member)
      );
    });

    socket.on('connect_error', error => {
      console.error('Socket.IO connection failed:', error.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user?.id]);

  // Load persisted messages and subscribe to the selected chat room.
  useEffect(() => {
    if (!activeChat || !import.meta.env.VITE_API_URL) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    const socket = socketRef.current;
    socket?.emit('joinChat', { chatId: activeChat });

    const fetchMessages = async () => {
      try {
        const data = await api.get(`/chats/${activeChat}/messages`);
        if (!cancelled) setMessages(data);
      } catch (error) {
        if (!cancelled) {
          console.error(`Failed to load messages for ${activeChat}:`, error);
          setMessages([]);
        }
      }
    };
    fetchMessages();

    return () => {
      cancelled = true;
      socket?.emit('leaveChat', { chatId: activeChat });
    };
  }, [activeChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleClick = () => {
      if (dropdownMenu.visible) setDropdownMenu({ ...dropdownMenu, visible: false });
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [dropdownMenu]);

  const handleSendMessage = () => {
    const content = inputValue.trim();
    if (!content || !activeChat) return;

    const socket = socketRef.current;
    if (!socket) {
      console.error('Cannot send message: Socket.IO is not connected.');
      return;
    }

    socket.emit('sendMessage', {
      chatId: activeChat,
      content,
    });
    setInputValue('');
  };

  const toggleChatSelection = (id: string) => {
    const newSet = new Set(selectedChatIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedChatIds(newSet);
  };

  const handleCreateCategory = () => {
    if (!newCatName.trim() || selectedChatIds.size === 0) return;
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      chatIds: Array.from(selectedChatIds)
    };
    setCustomCategories([...customCategories, newCategory]);
    setShowModal(false);
    setNewCatName('');
    setSelectedChatIds(new Set());
    setActiveWorkspace(newCategory.id); // switch to the new category
  };

  const handleDeleteChat = (chatId: string) => {
    if (!['all', 'direct', 'group'].includes(activeWorkspace)) {
      // Remove from custom category
      setCustomCategories(prevCategories =>
        prevCategories.map(cat => {
          if (cat.id === activeWorkspace) {
            return {
              ...cat,
              chatIds: cat.chatIds.filter(id => id !== chatId)
            };
          }
          return cat;
        })
      );
    } else {
      // Global delete
      const updatedChats = chats.filter(c => c.id !== chatId);
      setChats(updatedChats);

      // Also remove this chat from any custom categories
      setCustomCategories(prevCategories =>
        prevCategories.map(cat => ({
          ...cat,
          chatIds: cat.chatIds.filter(id => id !== chatId)
        }))
      );
    }
    
    setShowConfirmModal(false);
    setChatToDelete(null);
  };

  const handleDeleteCategory = (e: React.MouseEvent, categoryId: string) => {
    e.stopPropagation();
    setCustomCategories(customCategories.filter(cat => cat.id !== categoryId));
    if (activeWorkspace === categoryId) {
      setActiveWorkspace('all');
    }
  };

  const handleAddChat = async () => {
    if (!newChatId.trim()) return;
    
    setAddChatError(null);
    setIsAddingChat(true);

    try {
      const targetId = newChatId.trim();

      // Check if chat already exists locally
      const existingChat = chats.find(c => c.id === targetId);
      if (existingChat) {
        setActiveChat(existingChat.id);
        setShowAddChatModal(false);
        setNewChatId('');
        return;
      }

      // --- BACKEND INTEGRATION POINT (ID VALIDATION & FRIEND REQUEST) ---
      const apiBase = import.meta.env.VITE_API_URL || '';
      let validUserName = '';

      if (apiBase) {
        const data = await api.get(`/users/${targetId}`);
        validUserName = data.name;

        await api.post('/friend-requests', { to: targetId });
      } else {
        // Fallback: Simulate API Call using local mock users for offline showcase
        await new Promise(resolve => setTimeout(resolve, 800));
        const mockUsers = [
          { id: 'dev-123', name: 'Alice Node' },
          { id: 'ada-77', name: 'Ada Lovelace' }
        ];
        const validUser = mockUsers.find(u => u.id === targetId);
        if (!validUser) {
          throw new Error("User ID not found. Please check the ID and try again.");
        }
        validUserName = validUser.name;
      }

      // Instead of creating the chat instantly, we notify the user
      alert(`Friend request sent to ${validUserName}! Waiting for their acceptance.`);
      
      setShowAddChatModal(false);
      setNewChatId('');
    } catch (err: any) {
      setAddChatError(err.message);
    } finally {
      setIsAddingChat(false);
    }
  };

  const handleAcceptFriendRequest = async (requestId: string) => {
    try {
      const response = await api.post(`/friend-requests/${requestId}/accept`);
      const newChat = response.chat as ChatSession;

      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
      setChats(prev => [newChat, ...prev.filter(chat => chat.id !== newChat.id)]);
      if (activeWorkspace !== 'all' && activeWorkspace !== 'direct') {
        setActiveWorkspace('all');
      }
      setActiveChat(newChat.id);
      setShowFriendRequests(false);
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      alert(error instanceof Error ? error.message : 'Failed to accept friend request.');
    }
  };

  const handleRejectFriendRequest = async (requestId: string) => {
    try {
      await api.post(`/friend-requests/${requestId}/reject`);
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Failed to reject friend request:', error);
      alert(error instanceof Error ? error.message : 'Failed to reject friend request.');
    }
  };

  // Determine which chats to show in the sidebar
  const displayedChats = chats.filter(chat => {
    if (activeWorkspace === 'all') return true;
    if (activeWorkspace === 'direct') return chat.type === 'direct';
    if (activeWorkspace === 'group') return chat.type === 'group';
    // Custom Category
    const category = customCategories.find(c => c.id === activeWorkspace);
    if (category) return category.chatIds.includes(chat.id);
    return false;
  });

  const currentChatDetails = chats.find(c => c.id === activeChat);

  // When switching workspaces, auto-select the first chat if the current activeChat is not in the new list
  useEffect(() => {
    if (displayedChats.length > 0 && (!activeChat || !displayedChats.find(c => c.id === activeChat))) {
      setActiveChat(displayedChats[0].id);
    } else if (displayedChats.length === 0) {
      setActiveChat(null);
    }
  }, [activeWorkspace, displayedChats, activeChat]);

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] text-[#e5e2e1] font-sans selection:bg-[#10b981]/30 selection:text-[#4edea3] overflow-hidden relative">

      {/* Global Loading Overlay */}
      <AnimatePresence>
        {isLoadingData && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[200] bg-[#0a0a0a] flex flex-col items-center justify-center"
          >
            <Terminal size={48} className="text-[#4edea3] mb-4 animate-pulse" />
            <div className="w-48 h-1 bg-[#202225] rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="h-full bg-[#4edea3]"
              />
            </div>
            <p className="mt-4 text-[#bbcabf] text-sm font-bold tracking-widest uppercase">Syncing Workspace...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {dropdownMenu.visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-[100] bg-[#1a1d21] border border-[#3c4a42] shadow-2xl rounded-lg py-1 w-48 overflow-hidden"
            style={{ top: dropdownMenu.y, left: dropdownMenu.x }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (dropdownMenu.chatId) handleDeleteChat(dropdownMenu.chatId);
                setDropdownMenu({ ...dropdownMenu, visible: false });
              }}
              className="w-full text-left px-4 py-2 text-sm text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors flex items-center"
            >
              <Trash2 size={14} className="mr-2" />
              Remove from list
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Workspace Rail (Leftmost) */}
      <nav className="w-[72px] h-screen bg-[#131313] border-r border-[#202225] flex flex-col items-center py-4 space-y-4 z-40 flex-shrink-0">

        {/* The "All" Icon at the top */}
        <div
          onClick={() => setActiveWorkspace('all')}
          className={`mb-2 w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-2xl transition-colors cursor-pointer ${activeWorkspace === 'all' ? 'bg-[#4edea3] text-[#131313] shadow-[0_0_12px_rgba(78,222,163,0.4)]' : 'bg-[#4edea3]/10 text-[#4edea3] hover:bg-[#4edea3]/30'
            }`}
        >
          <MessageSquare size={24} />
        </div>
        <div className="w-8 h-[2px] bg-[#2a2d31] rounded-full"></div>

        {/* Main Workspaces */}
        <div className="flex-1 w-full flex flex-col items-center space-y-2 overflow-y-auto no-scrollbar pb-4">
          <WorkspaceItem
            icon={User}
            label="Direct Messages"
            active={activeWorkspace === 'direct'}
            onClick={() => setActiveWorkspace('direct')}
          />
          <WorkspaceItem
            icon={Users}
            label="Group Chats"
            active={activeWorkspace === 'group'}
            onClick={() => setActiveWorkspace('group')}
          />

          {/* Custom Categories */}
          {customCategories.length > 0 && <div className="w-8 h-[2px] bg-[#2a2d31] rounded-full my-2"></div>}
          {customCategories.map(cat => (
            <WorkspaceItem
              key={cat.id}
              letter={cat.name.charAt(0)}
              label={cat.name}
              active={activeWorkspace === cat.id}
              onClick={() => setActiveWorkspace(cat.id)}
              onDelete={(e) => handleDeleteCategory(e, cat.id)}
            />
          ))}

          {/* Add Custom Workspace/Category */}
          <div
            onClick={() => setShowModal(true)}
            className="w-12 h-12 rounded-2xl bg-[#201f22] text-[#4edea3] flex items-center justify-center hover:bg-[#4edea3] hover:text-[#131313] transition-colors cursor-pointer border border-[#3c4a42] border-dashed mt-2"
            title="Create Category"
          >
            <Plus size={24} />
          </div>
        </div>

        <div className="w-full pt-4 border-t border-[#202225] flex flex-col items-center space-y-3">
          {/* Friend Requests Bell */}
          <div className="relative">
            <div 
              onClick={() => setShowFriendRequests(true)}
              className="w-12 h-12 rounded-2xl bg-[#201f22] text-[#bbcabf] flex items-center justify-center hover:bg-[#2a2d31] hover:text-[#e5e2e1] transition-colors cursor-pointer"
              title="Friend Requests"
            >
              <Bell size={22} />
            </div>
            {friendRequests.length > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#ef4444] rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#131313]">
                {friendRequests.length}
              </div>
            )}
          </div>

          <WorkspaceItem icon={Settings} label="Settings" />
          <WorkspaceItem icon={LogOut} label="Log Out" onClick={logout} />
        </div>
      </nav>

      {/* WhatsApp Style: Chat List Sidebar */}
      <aside className="w-[320px] h-screen bg-[#111214] flex flex-col border-r border-[#2a2d31] z-30 flex-shrink-0">
        <div className="p-4 bg-[#111214]">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold tracking-tight text-[#e5e2e1] capitalize">
              {activeWorkspace === 'all' ? 'All Chats' :
                activeWorkspace === 'direct' ? 'Direct Messages' :
                  activeWorkspace === 'group' ? 'Group Chats' :
                    customCategories.find(c => c.id === activeWorkspace)?.name || 'Chats'}
            </h1>
            <button
              onClick={() => setShowAddChatModal(true)}
              className="w-8 h-8 rounded-full bg-[#202225] flex items-center justify-center text-[#bbcabf] hover:text-[#4edea3] hover:bg-[#2a2d31] transition-colors"
              title="Add New Chat"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbcabf] opacity-50" size={16} />
            <input
              type="text"
              placeholder="Search chats"
              className="w-full bg-[#202225] text-sm text-[#e5e2e1] rounded-lg pl-10 pr-4 py-2 border-none focus:ring-1 focus:ring-[#4edea3]/50 outline-none transition-all placeholder:text-[#bbcabf]/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-4">
          {displayedChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#bbcabf] opacity-50 p-6 text-center">
              <MessageSquare size={48} className="mb-4" />
              <p>No chats found in this category.</p>
            </div>
          ) : (
            displayedChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setActiveChat(chat.id)}
                className={`group flex items-center p-3 mx-2 rounded-lg cursor-pointer transition-colors ${activeChat === chat.id ? 'bg-[#2a2d31]' : 'hover:bg-[#202225]'}`}
              >
                <div className="relative mr-3 flex-shrink-0">
                  {chat.avatar ? (
                    <img src={chat.avatar} alt={chat.name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className={`w-12 h-12 rounded-full ${chat.color || 'bg-gray-600'} flex items-center justify-center text-lg font-bold text-white`}>
                      {chat.type === 'group' ? <Hash size={20} /> : chat.name.charAt(0)}
                    </div>
                  )}
                  {chat.online && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#4edea3] border-2 border-[#111214] rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className={`text-[15px] font-semibold truncate ${activeChat === chat.id ? 'text-[#e5e2e1]' : 'text-[#e5e2e1]'}`}>{chat.name}</h3>
                    <span className={`text-[11px] ${chat.unreadCount > 0 ? 'text-[#4edea3]' : 'text-[#bbcabf]/70'} group-hover:hidden`}>{chat.time}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDropdownMenu({ visible: true, x: e.pageX, y: e.pageY, chatId: chat.id });
                      }}
                      className="hidden group-hover:flex items-center justify-center text-[#bbcabf] hover:text-[#e5e2e1] hover:bg-[#3c4a42]/50 rounded-md p-1 transition-colors"
                      title="Options"
                    >
                      <MoreVertical size={14} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[13px] text-[#bbcabf]/80 truncate pr-2">{chat.lastMessage}</p>
                    {chat.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-[#4edea3] text-[#002113] flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative bg-[#0b0c0e]">
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        ></div>

        {currentChatDetails ? (
          <>
            <header className="h-16 bg-[#111214]/95 backdrop-blur-md border-b border-[#2a2d31] flex justify-between items-center px-6 z-30 flex-shrink-0">
              <div className="flex items-center space-x-3 cursor-pointer group">
                <div className="relative">
                  {currentChatDetails.avatar ? (
                    <img src={currentChatDetails.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className={`w-10 h-10 rounded-full ${currentChatDetails.color || 'bg-gray-600'} flex items-center justify-center text-white font-bold`}>
                      {currentChatDetails.type === 'group' ? <Hash size={18} /> : currentChatDetails.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-[#e5e2e1] group-hover:text-[#4edea3] transition-colors">{currentChatDetails.name}</h2>
                  <p className="text-[12px] text-[#bbcabf]/70">
                    {currentChatDetails.type === 'group' ? 'Tap to view group members' : (currentChatDetails.online ? 'Online' : 'Offline')}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button className="text-[#bbcabf] hover:text-[#4edea3] transition-colors"><Search size={20} /></button>
                <div className="w-px h-6 bg-[#2a2d31] mx-1"></div>
                {currentChatDetails.type === 'group' && (
                  <button
                    onClick={() => setShowMembersPanel(!showMembersPanel)}
                    className={`p-1.5 rounded-lg transition-colors flex items-center space-x-2 ${showMembersPanel ? 'bg-[#4edea3]/20 text-[#4edea3]' : 'text-[#bbcabf] hover:text-[#4edea3] hover:bg-[#202225]'}`}
                  >
                    <Users size={20} />
                    <span className="text-sm font-bold hidden md:block">Members</span>
                  </button>
                )}
                <button className="text-[#bbcabf] hover:text-[#4edea3] transition-colors"><MoreVertical size={20} /></button>
              </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative z-10 flex flex-col">
                <div className="max-w-4xl mx-auto flex-1 w-full flex flex-col">
                  <div className="flex items-center justify-center w-full my-6">
                    <div className="bg-[#202225]/80 backdrop-blur text-[11px] font-bold text-[#bbcabf] px-4 py-1 rounded-lg shadow-sm border border-[#3c4a42]/30">
                      TODAY
                    </div>
                  </div>
                  <div className="space-y-2">
                    {messages.map((msg, index) => {
                      const nextMsg = messages[index + 1];
                      const showAvatar = !nextMsg || nextMsg.senderId !== msg.senderId;
                      const addMargin = !nextMsg || nextMsg.senderId !== msg.senderId;
                      return (
                        <div key={msg.id} className={addMargin ? 'mb-4' : ''}>
                          <MessageBubble message={msg} showAvatar={showAvatar} />
                        </div>
                      );
                    })}
                  </div>
                  <div ref={messagesEndRef} />
                </div>

              </div>

              {/* Members Panel (Discord-style right sidebar) */}
              <AnimatePresence>
                {showMembersPanel && currentChatDetails.type === 'group' && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 260, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="h-full bg-[#111214] border-l border-[#2a2d31] overflow-y-auto flex-shrink-0 z-20"
                  >
                    <div className="p-4 w-[260px]">
                      <h3 className="text-xs font-bold text-[#bbcabf] uppercase tracking-wider mb-4">Online — 3</h3>
                      <div className="space-y-3">
                        {members.filter(m => m.status === 'online' || m.status === 'busy').map(member => (
                          <div key={member.id} className="flex items-center space-x-3 group cursor-pointer hover:bg-[#202225] p-2 rounded-lg -mx-2 transition-colors">
                            <div className="relative">
                              {member.avatar ? (
                                <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full object-cover" />
                              ) : (
                                <div className={`w-8 h-8 rounded-full ${member.color} flex items-center justify-center text-xs font-bold text-white`}>
                                  {member.name.charAt(0)}
                                </div>
                              )}
                              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-[#111214] rounded-full ${member.status === 'online' ? 'bg-[#4edea3]' : 'bg-[#ef4444]'}`}></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-1">
                                <h4 className="text-[13px] font-semibold text-[#e5e2e1] group-hover:text-[#4edea3] truncate">{member.name}</h4>
                              </div>
                              <p className="text-[11px] text-[#bbcabf]">{member.role}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <h3 className="text-xs font-bold text-[#bbcabf] uppercase tracking-wider mt-6 mb-4">Offline — 1</h3>
                      <div className="space-y-3">
                        {members.filter(m => m.status === 'offline').map(member => (
                          <div key={member.id} className="flex items-center space-x-3 group cursor-pointer hover:bg-[#202225] p-2 rounded-lg -mx-2 transition-colors opacity-60 hover:opacity-100">
                            <div className="relative">
                              {member.avatar ? (
                                <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full object-cover grayscale" />
                              ) : (
                                <div className={`w-8 h-8 rounded-full ${member.color} flex items-center justify-center text-xs font-bold text-white grayscale`}>
                                  {member.name.charAt(0)}
                                </div>
                              )}
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-[#111214] rounded-full bg-[#bbcabf]"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[13px] font-semibold text-[#e5e2e1] truncate">{member.name}</h4>
                              <p className="text-[11px] text-[#bbcabf]">{member.role}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="px-4 pb-6 pt-2 z-20 bg-[#0b0c0e]">
              <div className="max-w-4xl mx-auto">
                <div className="bg-[#202225] rounded-xl flex items-end transition-colors shadow-lg border border-[#2a2d31] focus-within:border-[#4edea3]/50 focus-within:shadow-[0_0_15px_rgba(78,222,163,0.1)] pr-2">
                  <button className="p-3 text-[#bbcabf] hover:text-[#4edea3] transition-colors flex-shrink-0"><Smile size={24} /></button>
                  <button className="p-3 text-[#bbcabf] hover:text-[#4edea3] transition-colors flex-shrink-0"><Paperclip size={22} /></button>
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="w-full bg-transparent border-none text-[#e5e2e1] text-[15px] p-3 pl-1 resize-none focus:ring-0 placeholder:text-[#bbcabf]/40 max-h-32 overflow-y-auto"
                    placeholder="Type a message"
                    rows={1}
                  />
                  {inputValue.trim() ? (
                    <button onClick={handleSendMessage} className="p-3 text-[#4edea3] transition-colors flex-shrink-0 animate-in zoom-in duration-200"><Send size={22} /></button>
                  ) : (
                    <button className="p-3 text-[#bbcabf] hover:text-[#4edea3] transition-colors flex-shrink-0"><Mic size={22} /></button>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-[#bbcabf]/50">
              <MessageSquare size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium text-[#bbcabf]">Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </main>

      {/* Create Custom Category Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1d21] border border-[#3c4a42] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between p-5 border-b border-[#3c4a42]/50">
                <h2 className="text-lg font-bold text-[#e5e2e1]">Create Workspace Category</h2>
                <button onClick={() => setShowModal(false)} className="text-[#bbcabf] hover:text-[#e5e2e1] transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 flex-1 overflow-y-auto">
                <div className="mb-6">
                  <label className="block text-xs font-semibold text-[#bbcabf] uppercase tracking-wider mb-2">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Kerjaan, Project Beta..."
                    autoFocus
                    className="w-full bg-[#111214] text-[#e5e2e1] rounded-lg px-4 py-3 border border-[#3c4a42]/50 focus:border-[#4edea3] focus:ring-1 focus:ring-[#4edea3]/50 outline-none transition-all placeholder:text-[#bbcabf]/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#bbcabf] uppercase tracking-wider mb-2">
                    Select Chats to Include
                  </label>
                  <div className="space-y-1 border border-[#3c4a42]/30 rounded-xl overflow-hidden bg-[#111214]">
                    {chats.map(chat => (
                      <div
                        key={chat.id}
                        onClick={() => toggleChatSelection(chat.id)}
                        className="flex items-center space-x-3 p-3 hover:bg-[#202225] cursor-pointer transition-colors border-b border-[#3c4a42]/20 last:border-0"
                      >
                        <div className="text-[#4edea3]">
                          {selectedChatIds.has(chat.id) ? <CheckSquare size={20} /> : <Square size={20} className="text-[#bbcabf]/50" />}
                        </div>
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-[#2a2d31] flex items-center justify-center text-xs font-bold text-white">
                          {chat.avatar ? <img src={chat.avatar} alt="" className="w-full h-full object-cover" /> : (chat.type === 'group' ? <Hash size={14} /> : chat.name.charAt(0))}
                        </div>
                        <div className="flex-1 min-w-0 text-sm font-medium text-[#e5e2e1] truncate">
                          {chat.name}
                        </div>
                        <div className="text-[10px] text-[#bbcabf]/50 uppercase">{chat.type}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-[#3c4a42]/50 bg-[#111214] flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-[#bbcabf] hover:text-[#e5e2e1] hover:bg-[#202225] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCategory}
                  disabled={!newCatName.trim() || selectedChatIds.size === 0}
                  className="px-5 py-2 rounded-lg text-sm font-bold bg-[#4edea3] text-[#002113] hover:shadow-[0_0_15px_rgba(78,222,163,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                >
                  Create Category
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Chat Modal */}
      <AnimatePresence>
        {showAddChatModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1d21] border border-[#3c4a42] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-[#3c4a42]/50">
                <h2 className="text-lg font-bold text-[#e5e2e1]">Start New Chat</h2>
                <button onClick={() => setShowAddChatModal(false)} className="text-[#bbcabf] hover:text-[#e5e2e1] transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-5">
                <label className="block text-xs font-semibold text-[#bbcabf] uppercase tracking-wider mb-2">
                  User ID
                </label>
                <input
                  type="text"
                  value={newChatId}
                  onChange={(e) => {
                    setNewChatId(e.target.value);
                    if (addChatError) setAddChatError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddChat();
                    }
                  }}
                  placeholder="Enter User ID..."
                  autoFocus
                  disabled={isAddingChat}
                  className="w-full bg-[#111214] text-[#e5e2e1] rounded-lg px-4 py-3 border border-[#3c4a42]/50 focus:border-[#4edea3] focus:ring-1 focus:ring-[#4edea3]/50 outline-none transition-all placeholder:text-[#bbcabf]/30 disabled:opacity-50"
                />
                
                {addChatError && (
                  <div className="mt-3 p-2 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-md text-xs text-[#ef4444]">
                    {addChatError}
                  </div>
                )}
              </div>

              <div className="p-5 border-t border-[#3c4a42]/50 bg-[#111214] flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddChatModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-[#bbcabf] hover:text-[#e5e2e1] hover:bg-[#202225] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddChat}
                  disabled={!newChatId.trim() || isAddingChat}
                  className="px-5 py-2 rounded-lg text-sm font-bold bg-[#4edea3] text-[#002113] hover:shadow-[0_0_15px_rgba(78,222,163,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center space-x-2"
                >
                  <span>{isAddingChat ? 'Verifying...' : 'Start Chat'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Friend Requests Modal */}
      <AnimatePresence>
        {showFriendRequests && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1d21] border border-[#3c4a42] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between p-5 border-b border-[#3c4a42]/50">
                <div className="flex items-center space-x-2">
                  <Bell className="text-[#4edea3]" size={20} />
                  <h2 className="text-lg font-bold text-[#e5e2e1]">Friend Requests</h2>
                </div>
                <button onClick={() => setShowFriendRequests(false)} className="text-[#bbcabf] hover:text-[#e5e2e1] transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 flex-1 overflow-y-auto bg-[#111214]">
                {friendRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto mb-3 text-[#bbcabf]/30" size={48} />
                    <p className="text-[#bbcabf] text-sm">No pending friend requests.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {friendRequests.map((req) => (
                      <div key={req.id} className="bg-[#1a1d21] border border-[#3c4a42]/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                            {req.fromName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-[14px] font-bold text-[#e5e2e1]">{req.fromName}</p>
                            <p className="text-[11px] text-[#bbcabf]/60 uppercase tracking-wider">{req.fromId}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleRejectFriendRequest(req.id)}
                            className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold text-[#ef4444] bg-[#ef4444]/10 hover:bg-[#ef4444]/20 transition-colors"
                          >
                            Ignore
                          </button>
                          <button
                            onClick={() => handleAcceptFriendRequest(req.id)}
                            className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold text-[#002113] bg-[#4edea3] hover:shadow-[0_0_10px_rgba(78,222,163,0.3)] transition-all"
                          >
                            Accept
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {dropdownMenu.visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-[100] bg-[#1a1d21] border border-[#3c4a42] shadow-2xl rounded-lg py-1 w-48 overflow-hidden"
            style={{ top: dropdownMenu.y, left: dropdownMenu.x }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setChatToDelete(dropdownMenu.chatId);
                setShowConfirmModal(true);
                setDropdownMenu({ ...dropdownMenu, visible: false });
              }}
              className="w-full text-left px-4 py-2 text-sm text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors flex items-center"
            >
              <Trash2 size={14} className="mr-2" />
              {['all', 'direct', 'group'].includes(activeWorkspace) ? 'Delete Room Globally' : 'Remove from Category'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-[#0a0a0a]/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1d21] border border-[#3c4a42] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-[#ef4444]/10 rounded-full flex items-center justify-center mx-auto mb-4 text-[#ef4444]">
                  <Trash2 size={32} />
                </div>
                <h2 className="text-xl font-bold text-[#e5e2e1] mb-2">Delete Room?</h2>
                <p className="text-[#bbcabf] text-sm">
                  Apakah Anda yakin ingin menghapus room ini dari kategori?
                </p>
              </div>

              <div className="p-4 bg-[#111214] border-t border-[#3c4a42]/50 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setChatToDelete(null);
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-[#bbcabf] hover:text-[#e5e2e1] hover:bg-[#202225] transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => chatToDelete && handleDeleteChat(chatToDelete)}
                  className="px-5 py-2 rounded-lg text-sm font-bold bg-[#ef4444] text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
