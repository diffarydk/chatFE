import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Terminal, Settings, Plus, Search, Bell, MoreVertical,
  UserPlus, Mail, Shield, ShieldCheck, Github, MessageSquare, Users, Hash, LogOut
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// --- Types & Mock Data ---

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

const RECENT_CHATS: ChatSession[] = [
  {
    id: 'c1',
    name: 'Engineering Team',
    type: 'group',
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&h=100&fit=crop',
    lastMessage: 'Marcus: Pushing the fix for the blur issue now.',
    time: '2:51 PM',
    unreadCount: 3,
    online: true,
  },
  {
    id: 'c2',
    name: 'Elena Rostova',
    type: 'direct',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7S_e5Te6PRqoXDr2zXASVNBUmQnmYL99eLmkMfnXQW21Y8MiA9AEYWn2lauHGr0ZrtMcqJ6BaZqRujmtp9zWaAAKTY5_8Bjrnsyfe0pJzuzVgmKRzthgKCccfFu3aasHkn76T799kIa4H18w5HJAHZjuXkOMc-trko8EXol63D0iq-dIH6RYgXB6P73TJ3IAsE6AfJDvnbIeVatF1PmfTRFw9FaaAMKxoW6nKKf0gSH1lZM161ivaZuUm64h2nkXQTTCu4E5dKe4',
    lastMessage: 'Can someone verify the glow intensity?',
    time: '2:46 PM',
    unreadCount: 0,
    online: true,
  },
  {
    id: 'c3',
    name: 'David Kim',
    type: 'direct',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBDb5TBpbNkJfluxHLjGl8-kUe8pMW7MLF7Eagw0YcUu0crO0dDe_zgPqAiJao2GrKFtSA3GRpCgZZTT_SMzt1GBkyBZnIPkT3tMFsFBjM0NEIQoq0WhOM_jKczyWdAqJgaLZNdsvlysCr8f-rtybreLjRSU_j1qw97aN5G_ufaPrdRjCcU_lVakN4_SGThuCicGp8fYduL2ImAZEfrnDoELXBLPp0ATXdTyKvf1ZKYbgJbXN35TEprKlkFqJUzVZQoqhkqOvk2mAs',
    lastMessage: 'Let\'s look at the blur-radius.',
    time: 'Yesterday',
    unreadCount: 0,
    online: false,
  },
  {
    id: 'c4',
    name: 'Design Sync',
    type: 'group',
    color: 'bg-purple-500',
    lastMessage: 'Sarah: Updated the Figma board.',
    time: 'Yesterday',
    unreadCount: 0,
    online: false,
  },
];

type Member = {
  id: string;
  name: string;
  role: 'Admin' | 'Engineer' | 'Designer' | 'Guest';
  status: 'online' | 'offline' | 'busy';
  avatar: string;
  email: string;
  github: string;
  color?: string;
};

const MEMBERS: Member[] = [
  { 
    id: '1', 
    name: 'Elena Rostova', 
    role: 'Admin', 
    status: 'online', 
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7S_e5Te6PRqoXDr2zXASVNBUmQnmYL99eLmkMfnXQW21Y8MiA9AEYWn2lauHGr0ZrtMcqJ6BaZqRujmtp9zWaAAKTY5_8Bjrnsyfe0pJzuzVgmKRzthgKCccfFu3aasHkn76T799kIa4H18w5HJAHZjuXkOMc-trko8EXol63D0iq-dIH6RYgXB6P73TJ3IAsE6AfJDvnbIeVatF1PmfTRFw9FaaAMKxoW6nKKf0gSH1lZM161ivaZuUm64h2nkXQTTCu4E5dKe4',
    email: 'elena@node.local',
    github: 'erostova'
  },
  { 
    id: '2', 
    name: 'David Kim', 
    role: 'Engineer', 
    status: 'busy', 
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBDb5TBpbNkJfluxHLjGl8-kUe8pMW7MLF7Eagw0YcUu0crO0dDe_zgPqAiJao2GrKFtSA3GRpCgZZTT_SMzt1GBkyBZnIPkT3tMFsFBjM0NEIQoq0WhOM_jKczyWdAqJgaLZNdsvlysCr8f-rtybreLjRSU_j1qw97aN5G_ufaPrdRjCcU_lVakN4_SGThuCicGp8fYduL2ImAZEfrnDoELXBLPp0ATXdTyKvf1ZKYbgJbXN35TEprKlkFqJUzVZQoqhkqOvk2mAs',
    email: 'david.k@node.local',
    github: 'dkim_dev'
  },
  { 
    id: '3', 
    name: 'Marcus Chen', 
    role: 'Engineer', 
    status: 'online', 
    avatar: '',
    color: 'bg-rose-500',
    email: 'marcus.c@node.local',
    github: 'marcus_code'
  },
  { 
    id: '4', 
    name: 'Sarah O\'Connor', 
    role: 'Designer', 
    status: 'offline', 
    avatar: '',
    color: 'bg-purple-500',
    email: 'sarah.o@node.local',
    github: 's_oconnor_ui'
  },
  { 
    id: '5', 
    name: 'James Wilson', 
    role: 'Engineer', 
    status: 'offline', 
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAgLotp49QSoOZcj3uMr3XikCt9iY8B4cgZdGVVp0TPJzaiiStfrBvyQpqStxVbT-4Q2V1eRbjDv1NTsLduNsKyYYpyVy2-1CvJU97gOWjJquJZB0F1HS7sXzz5jnedru7-_0mX4Toc6mXSCP11aGdnF5oMtduyujjTEmDx9qybbnlIwp7r0w2elhDTdOVjhD2Rr01MbMVEZDVAqu-CVybOselig5MYPodJ1Bst1W2xo2Jg8g-BBX4PkYPWBOL1ruvOTCXtKYM6kTo',
    email: 'james.w@node.local',
    github: 'jwilson'
  },
  { 
    id: '6', 
    name: 'Ada Lovelace', 
    role: 'Guest', 
    status: 'online', 
    avatar: '',
    color: 'bg-emerald-500',
    email: 'ada@node.local',
    github: 'ada_love'
  },
];

// --- Components ---

function WorkspaceItem({ icon: Icon, label, active = false, isLast = false, to, onClick }: { icon?: any, label: string, active?: boolean, isLast?: boolean, to?: string, onClick?: () => void }) {
  const content = (
    <div className={`relative group ${isLast ? 'mt-auto' : ''}`}>
      <button 
        onClick={onClick}
        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all scale-95 active:scale-90 ${
          active 
            ? `bg-[#4edea3] text-[#131313] shadow-[0_0_12px_rgba(78,222,163,0.4)]` 
            : `bg-[#201f22] text-[#bbcabf] hover:bg-[#3c4a42] hover:text-[#e5e2e1] hover:rounded-xl`
        }`}
      >
        {Icon ? <Icon size={24} /> : <span className="font-bold text-lg">{label}</span>}
      </button>
      <div className="absolute left-full ml-3 px-3 py-1 bg-[#2a2a2a] border border-[#3c4a42] rounded-md text-xs font-medium text-[#e5e2e1] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        {label}
      </div>
    </div>
  );

  return to ? <Link to={to}>{content}</Link> : content;
}

export default function Members() {
  const { logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChat, setActiveChat] = useState(RECENT_CHATS[0].id);
  const location = useLocation();

  const filteredMembers = MEMBERS.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] text-[#e5e2e1] font-sans selection:bg-[#10b981]/30 selection:text-[#4edea3] overflow-hidden">
      
      {/* Workspace Rail (Leftmost) */}
      <nav className="w-[72px] h-screen bg-[#131313] border-r border-[#202225] flex flex-col items-center py-4 space-y-4 z-50 flex-shrink-0">
        <div className="mb-2 w-12 h-12 rounded-2xl bg-[#4edea3]/10 flex items-center justify-center font-bold text-2xl text-[#4edea3] hover:bg-[#4edea3] hover:text-[#131313] transition-colors cursor-pointer">
          <Terminal size={24} />
        </div>
        <div className="w-8 h-[2px] bg-[#2a2d31] rounded-full"></div>
        <div className="flex-1 w-full flex flex-col items-center space-y-2">
          <WorkspaceItem icon={MessageSquare} label="Chats" to="/chat" active />
          <WorkspaceItem icon={Users} label="Group Chats" to="/groups" />
          <div className="w-12 h-12 rounded-2xl bg-[#201f22] text-[#4edea3] flex items-center justify-center hover:bg-[#4edea3] hover:text-[#131313] transition-colors cursor-pointer border border-[#3c4a42] border-dashed">
            <Plus size={24} />
          </div>
          <WorkspaceItem icon={Settings} label="Settings" />
          <WorkspaceItem icon={LogOut} label="Log Out" onClick={logout} isLast />
        </div>
      </nav>

      {/* WhatsApp Style: Chat List Sidebar */}
      <aside className="w-[320px] h-screen bg-[#111214] flex flex-col border-r border-[#2a2d31] z-40 flex-shrink-0">
        {/* Header & App Navigation */}
        <div className="p-4 bg-[#111214]">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold tracking-tight text-[#e5e2e1]">Chats</h1>
            <div className="flex space-x-2">
              <button className="p-2 text-[#bbcabf] hover:text-[#4edea3] hover:bg-[#202225] rounded-full transition-colors"><Plus size={20} /></button>
              <button className="p-2 text-[#bbcabf] hover:text-[#4edea3] hover:bg-[#202225] rounded-full transition-colors"><MoreVertical size={20} /></button>
            </div>
          </div>
          
          {/* App Navigation */}
          <div className="flex items-center space-x-2 mb-4 bg-[#202225] p-1 rounded-lg">
            <Link to="/chat" className={`flex-1 py-1.5 px-3 text-center text-xs font-bold rounded-md transition-colors ${location.pathname === '/chat' ? 'bg-[#3c4a42] text-[#4edea3]' : 'text-[#bbcabf] hover:text-[#e5e2e1]'}`}>Chats</Link>
            <Link to="/files" className={`flex-1 py-1.5 px-3 text-center text-xs font-bold rounded-md transition-colors ${location.pathname === '/files' ? 'bg-[#3c4a42] text-[#4edea3]' : 'text-[#bbcabf] hover:text-[#e5e2e1]'}`}>Files</Link>
            <Link to="/members" className={`flex-1 py-1.5 px-3 text-center text-xs font-bold rounded-md transition-colors ${location.pathname === '/members' ? 'bg-[#3c4a42] text-[#4edea3]' : 'text-[#bbcabf] hover:text-[#e5e2e1]'}`}>Members</Link>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbcabf] opacity-50" size={16} />
            <input 
              type="text" 
              placeholder="Search or start new chat" 
              className="w-full bg-[#202225] text-sm text-[#e5e2e1] rounded-lg pl-10 pr-4 py-2 border-none focus:ring-1 focus:ring-[#4edea3]/50 outline-none transition-all placeholder:text-[#bbcabf]/50"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {RECENT_CHATS.map((chat) => (
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

      {/* Main Content */}
      <main className="flex-1 h-screen flex flex-col relative bg-[#0b0c0e]">
        <div 
          className="absolute inset-0 opacity-[0.02] pointer-events-none" 
          style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        ></div>

        {/* Header */}
        <header className="h-16 bg-[#111214]/95 backdrop-blur-xl border-b border-[#2a2d31] flex justify-between items-center px-6 z-30 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <Users size={24} className="text-[#4edea3]" />
            <h2 className="text-[16px] font-bold tracking-tight">Team Directory</h2>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative hidden lg:block mr-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbcabf] opacity-50" size={16} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search members..." 
                className="bg-[#202225] text-sm text-[#e5e2e1] rounded-full pl-10 pr-4 py-1.5 w-64 border border-transparent focus:border-[#4edea3] focus:ring-1 focus:ring-[#4edea3]/50 outline-none transition-all placeholder:text-[#bbcabf]/30"
              />
            </div>
            <button className="p-2 text-[#bbcabf] hover:text-[#4edea3] transition-colors">
              <Bell size={20} />
            </button>
          </div>
        </header>

        {/* Members Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 relative z-10">
          <div className="max-w-6xl mx-auto">
            
            <div className="flex flex-wrap items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-[#e5e2e1] mb-1">Directory</h1>
                <p className="text-[#bbcabf]">Manage access and view engineering team members.</p>
              </div>
              <button className="flex items-center space-x-2 bg-[#4edea3] text-[#002113] px-4 py-2 rounded-lg font-bold hover:shadow-[0_0_15px_rgba(78,222,163,0.4)] transition-all active:scale-95 mt-4 sm:mt-0">
                <UserPlus size={18} />
                <span>Invite Members</span>
              </button>
            </div>

            {/* Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMembers.map((member, index) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  key={member.id} 
                  className="bg-[#202225]/60 backdrop-blur-md border border-[#2a2d31] rounded-2xl p-5 hover:border-[#4edea3]/50 transition-colors group relative overflow-hidden"
                >
                  {/* Status Indicator at top right */}
                  <div className="absolute top-5 right-5 flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#bbcabf] opacity-0 group-hover:opacity-100 transition-opacity">
                      {member.status}
                    </span>
                    <div className={`w-2.5 h-2.5 rounded-full ring-2 ring-[#202225] ${
                      member.status === 'online' ? 'bg-[#4edea3] shadow-[0_0_8px_rgba(78,222,163,0.8)]' : 
                      member.status === 'busy' ? 'bg-[#ef4444]' : 
                      'bg-[#bbcabf]/50'
                    }`}></div>
                  </div>

                  <div className="flex items-center space-x-4 mb-4">
                    {/* Avatar */}
                    <div className="relative">
                      {member.avatar ? (
                        <img 
                          src={member.avatar} 
                          alt={member.name} 
                          className="w-14 h-14 rounded-xl object-cover ring-1 ring-[#3c4a42]"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className={`w-14 h-14 rounded-xl ${member.color} text-white flex items-center justify-center text-xl font-bold ring-1 ring-[#3c4a42]`}>
                          {member.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div>
                      <h3 className="text-base font-bold text-[#e5e2e1] group-hover:text-[#4edea3] transition-colors">{member.name}</h3>
                      <div className="flex items-center space-x-1 mt-0.5">
                        {member.role === 'Admin' ? <ShieldCheck size={14} className="text-[#4edea3]" /> : <Shield size={14} className="text-[#bbcabf]/50" />}
                        <span className={`text-xs font-medium ${member.role === 'Admin' ? 'text-[#4edea3]' : 'text-[#bbcabf]'}`}>{member.role}</span>
                      </div>
                    </div>
                  </div>

                  {/* Social/Contact Links */}
                  <div className="bg-[#131313]/50 rounded-xl p-3 space-y-2 mt-2 border border-[#2a2d31]">
                    <div className="flex items-center text-xs text-[#bbcabf]">
                      <Mail size={14} className="mr-2 opacity-70" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    <div className="flex items-center text-xs text-[#bbcabf]">
                      <Github size={14} className="mr-2 opacity-70" />
                      <span>{member.github}</span>
                    </div>
                  </div>

                  {/* Actions (Hidden until hover on desktop) */}
                  <div className="mt-4 flex items-center justify-between opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="flex-1 flex items-center justify-center space-x-2 bg-[#2a2d31] hover:bg-[#3c4a42] text-[#e5e2e1] py-2 rounded-lg text-xs font-bold transition-colors border border-[#3c4a42]/50">
                      <MessageSquare size={14} />
                      <span>Message</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredMembers.length === 0 && (
              <div className="p-10 text-center text-[#bbcabf] bg-[#202225]/30 rounded-2xl border border-[#2a2d31] mt-6">
                <Search size={32} className="mx-auto mb-4 opacity-50" />
                <p>No members found matching your criteria.</p>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
