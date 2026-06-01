import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, Settings, Plus, Search, Bell, MoreVertical, 
  Smile, Send, Mic, Paperclip, Check, CheckCheck, Info, MessageSquare, Users, Hash, 
  ShieldCheck, Shield, Mail, Github, Video, Phone, UserCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

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
  type: 'group';
  avatar?: string;
  color?: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
};

const CURRENT_USER_ID = 'user-me';

const GROUP_CHATS: ChatSession[] = [
  {
    id: 'g1',
    name: 'Engineering Team',
    type: 'group',
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&h=100&fit=crop',
    lastMessage: 'Marcus: Pushing the fix for the blur issue now.',
    time: '2:51 PM',
    unreadCount: 3,
  },
  {
    id: 'g2',
    name: 'Design Sync',
    type: 'group',
    color: 'bg-purple-500',
    lastMessage: 'Sarah: Updated the Figma board.',
    time: 'Yesterday',
    unreadCount: 0,
  },
  {
    id: 'g3',
    name: 'Project Alpha',
    type: 'group',
    color: 'bg-blue-500',
    lastMessage: 'Elena: Let\'s review the timeline.',
    time: 'Monday',
    unreadCount: 0,
  },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    senderId: 'elena',
    senderName: 'Elena Rostova',
    senderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7S_e5Te6PRqoXDr2zXASVNBUmQnmYL99eLmkMfnXQW21Y8MiA9AEYWn2lauHGr0ZrtMcqJ6BaZqRujmtp9zWaAAKTY5_8Bjrnsyfe0pJzuzVgmKRzthgKCccfFu3aasHkn76T799kIa4H18w5HJAHZjuXkOMc-trko8EXol63D0iq-dIH6RYgXB6P73TJ3IAsE6AfJDvnbIeVatF1PmfTRFw9FaaAMKxoW6nKKf0gSH1lZM161ivaZuUm64h2nkXQTTCu4E5dKe4',
    time: '2:46 PM',
    content: "I've pushed the latest shader updates to the repo. Can someone verify the glow intensity on the emerald accents?",
    isSelf: false,
  },
  {
    id: '2',
    senderId: 'david',
    senderName: 'David Kim',
    senderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBDb5TBpbNkJfluxHLjGl8-kUe8pMW7MLF7Eagw0YcUu0crO0dDe_zgPqAiJao2GrKFtSA3GRpCgZZTT_SMzt1GBkyBZnIPkT3tMFsFBjM0NEIQoq0WhOM_jKczyWdAqJgaLZNdsvlysCr8f-rtybreLjRSU_j1qw97aN5G_ufaPrdRjCcU_lVakN4_SGThuCicGp8fYduL2ImAZEfrnDoELXBLPp0ATXdTyKvf1ZKYbgJbXN35TEprKlkFqJUzVZQoqhkqOvk2mAs',
    time: '2:48 PM',
    content: "On it, Elena. I'm also seeing a slight lag in the glassmorphism rendering on older GPUs.",
    isSelf: false,
  },
  {
    id: '3',
    senderId: CURRENT_USER_ID,
    senderName: 'You',
    time: '2:50 PM',
    content: "I can take a look at the CSS blur filters. Maybe we can optimize it by reducing the radius on mobile devices?",
    status: 'read',
    isSelf: true,
  },
  {
    id: '4',
    senderId: 'marcus',
    senderName: 'Marcus Chen',
    senderColor: 'bg-rose-500',
    time: '2:51 PM',
    content: 'Verified the glow. It looks cinematic. Pushing the fix for the blur issue now.',
    isSelf: false,
  },
];

type Member = {
  id: string;
  name: string;
  role: 'Admin' | 'Engineer' | 'Designer' | 'Guest';
  status: 'online' | 'offline' | 'busy';
  avatar: string;
  color?: string;
};

const MEMBERS: Member[] = [
  { id: '1', name: 'Elena Rostova', role: 'Admin', status: 'online', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7S_e5Te6PRqoXDr2zXASVNBUmQnmYL99eLmkMfnXQW21Y8MiA9AEYWn2lauHGr0ZrtMcqJ6BaZqRujmtp9zWaAAKTY5_8Bjrnsyfe0pJzuzVgmKRzthgKCccfFu3aasHkn76T799kIa4H18w5HJAHZjuXkOMc-trko8EXol63D0iq-dIH6RYgXB6P73TJ3IAsE6AfJDvnbIeVatF1PmfTRFw9FaaAMKxoW6nKKf0gSH1lZM161ivaZuUm64h2nkXQTTCu4E5dKe4' },
  { id: '2', name: 'David Kim', role: 'Engineer', status: 'busy', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBDb5TBpbNkJfluxHLjGl8-kUe8pMW7MLF7Eagw0YcUu0crO0dDe_zgPqAiJao2GrKFtSA3GRpCgZZTT_SMzt1GBkyBZnIPkT3tMFsFBjM0NEIQoq0WhOM_jKczyWdAqJgaLZNdsvlysCr8f-rtybreLjRSU_j1qw97aN5G_ufaPrdRjCcU_lVakN4_SGThuCicGp8fYduL2ImAZEfrnDoELXBLPp0ATXdTyKvf1ZKYbgJbXN35TEprKlkFqJUzVZQoqhkqOvk2mAs' },
  { id: '3', name: 'Marcus Chen', role: 'Engineer', status: 'online', avatar: '', color: 'bg-rose-500' },
  { id: '4', name: 'Sarah O\'Connor', role: 'Designer', status: 'offline', avatar: '', color: 'bg-purple-500' },
];

// --- Components ---

function WorkspaceItem({ icon: Icon, label, active = false, isLast = false, to }: { icon: any, label: string, active?: boolean, isLast?: boolean, to?: string }) {
  const content = (
    <div className={`relative group ${isLast ? 'mt-auto' : ''}`}>
      <button className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all scale-95 active:scale-90 ${
        active 
          ? `bg-[#4edea3] text-[#131313] shadow-[0_0_12px_rgba(78,222,163,0.4)]` 
          : `bg-[#201f22] text-[#bbcabf] hover:bg-[#3c4a42] hover:text-[#e5e2e1] hover:rounded-xl`
      }`}>
        <Icon size={24} />
      </button>
      <div className="absolute left-full ml-3 px-3 py-1 bg-[#2a2a2a] border border-[#3c4a42] rounded-md text-xs font-medium text-[#e5e2e1] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        {label}
      </div>
    </div>
  );

  return to ? <Link to={to}>{content}</Link> : content;
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
          <div className={`px-4 py-2 rounded-2xl ${
            message.isSelf 
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

export default function GroupChats() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [activeChat, setActiveChat] = useState(GROUP_CHATS[0].id);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: CURRENT_USER_ID,
      senderName: 'You',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: inputValue,
      status: 'sent',
      isSelf: true,
    };

    setMessages([...messages, newMessage]);
    setInputValue("");
    
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'delivered' } : m));
    }, 1000);
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'read' } : m));
    }, 2500);
  };

  const currentChatDetails = GROUP_CHATS.find(c => c.id === activeChat);

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] text-[#e5e2e1] font-sans selection:bg-[#10b981]/30 selection:text-[#4edea3] overflow-hidden">
      
      {/* Workspace Rail */}
      <nav className="w-[72px] h-screen bg-[#131313] border-r border-[#202225] flex flex-col items-center py-4 space-y-4 z-50 flex-shrink-0">
        <div className="mb-2 w-12 h-12 rounded-2xl bg-[#4edea3]/10 flex items-center justify-center font-bold text-2xl text-[#4edea3]">
          <Terminal size={24} />
        </div>
        <div className="w-8 h-[2px] bg-[#2a2d31] rounded-full"></div>
        <div className="flex-1 w-full flex flex-col items-center space-y-2">
          <WorkspaceItem icon={MessageSquare} label="Chats" to="/chat" />
          <WorkspaceItem icon={Users} label="Group Chats" to="/groups" active />
          <div className="w-12 h-12 rounded-2xl bg-[#201f22] text-[#4edea3] flex items-center justify-center hover:bg-[#4edea3] hover:text-[#131313] transition-colors cursor-pointer border border-[#3c4a42] border-dashed">
            <Plus size={24} />
          </div>
          <WorkspaceItem icon={Settings} label="Settings" isLast />
        </div>
      </nav>

      {/* Chat List Sidebar */}
      <aside className="w-[320px] h-screen bg-[#111214] flex flex-col border-r border-[#2a2d31] z-40 flex-shrink-0">
        <div className="p-4 bg-[#111214]">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold tracking-tight text-[#e5e2e1]">Groups</h1>
            <div className="flex space-x-2">
              <button className="p-2 text-[#bbcabf] hover:text-[#4edea3] hover:bg-[#202225] rounded-full transition-colors"><Plus size={20} /></button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbcabf] opacity-50" size={16} />
            <input 
              type="text" 
              placeholder="Search groups" 
              className="w-full bg-[#202225] text-sm text-[#e5e2e1] rounded-lg pl-10 pr-4 py-2 border-none focus:ring-1 focus:ring-[#4edea3]/50 outline-none transition-all placeholder:text-[#bbcabf]/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {GROUP_CHATS.map((chat) => (
            <div 
              key={chat.id}
              onClick={() => setActiveChat(chat.id)}
              className={`flex items-center p-3 mx-2 rounded-lg cursor-pointer transition-colors ${activeChat === chat.id ? 'bg-[#2a2d31]' : 'hover:bg-[#202225]'}`}
            >
              <div className="relative mr-3 flex-shrink-0">
                {chat.avatar ? (
                  <img src={chat.avatar} alt={chat.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className={`w-12 h-12 rounded-full ${chat.color || 'bg-gray-600'} flex items-center justify-center text-lg font-bold text-white`}>
                    <Hash size={20} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className={`text-[15px] font-semibold truncate ${activeChat === chat.id ? 'text-[#e5e2e1]' : 'text-[#e5e2e1]'}`}>{chat.name}</h3>
                  <span className={`text-[11px] ${chat.unreadCount > 0 ? 'text-[#4edea3]' : 'text-[#bbcabf]/70'}`}>{chat.time}</span>
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
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative bg-[#0b0c0e]">
        <div 
          className="absolute inset-0 opacity-[0.02] pointer-events-none" 
          style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        ></div>

        <header className="h-16 bg-[#111214]/95 backdrop-blur-md border-b border-[#2a2d31] flex justify-between items-center px-6 z-30 flex-shrink-0">
          <div className="flex items-center space-x-3 cursor-pointer group">
            <div className="relative">
               {currentChatDetails?.avatar ? (
                  <img src={currentChatDetails.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className={`w-10 h-10 rounded-full ${currentChatDetails?.color || 'bg-gray-600'} flex items-center justify-center text-white font-bold`}>
                    <Hash size={18} />
                  </div>
                )}
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-[#e5e2e1] group-hover:text-[#4edea3] transition-colors">{currentChatDetails?.name}</h2>
              <p className="text-[12px] text-[#bbcabf]/70">
                12 members, 3 online
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="text-[#bbcabf] hover:text-[#4edea3] transition-colors"><Video size={20} /></button>
            <button className="text-[#bbcabf] hover:text-[#4edea3] transition-colors"><Phone size={20} /></button>
            <div className="w-px h-6 bg-[#2a2d31] mx-1"></div>
            <button 
              onClick={() => setShowMembersPanel(!showMembersPanel)}
              className={`p-1.5 rounded-lg transition-colors flex items-center space-x-2 ${showMembersPanel ? 'bg-[#4edea3]/20 text-[#4edea3]' : 'text-[#bbcabf] hover:text-[#4edea3] hover:bg-[#202225]'}`}
            >
              <Users size={20} />
              <span className="text-sm font-bold hidden md:block">Members</span>
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Chat Bubbles */}
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
            {showMembersPanel && (
              <motion.div 
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 260, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="h-full bg-[#111214] border-l border-[#2a2d31] overflow-y-auto flex-shrink-0 z-20"
              >
                <div className="p-4 w-[260px]">
                  <h3 className="text-xs font-bold text-[#bbcabf] uppercase tracking-wider mb-4">Online — 3</h3>
                  <div className="space-y-3">
                    {MEMBERS.filter(m => m.status === 'online' || m.status === 'busy').map(member => (
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
                            {member.role === 'Admin' && <ShieldCheck size={12} className="text-[#4edea3]" />}
                          </div>
                          <p className="text-[11px] text-[#bbcabf]">{member.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <h3 className="text-xs font-bold text-[#bbcabf] uppercase tracking-wider mt-6 mb-4">Offline — 1</h3>
                  <div className="space-y-3">
                    {MEMBERS.filter(m => m.status === 'offline').map(member => (
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
                placeholder="Message group..." 
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
      </main>
    </div>
  );
}
