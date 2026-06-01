import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Terminal, Settings, Plus, Search, Bell, MoreVertical,
  FileText, Image as ImageIcon, FileArchive, Download, Folder, File, HardDrive, Trash2,
  MessageSquare, Users, Hash, Code, LogOut
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

type FileItem = {
  id: string;
  name: string;
  type: 'folder' | 'image' | 'document' | 'archive' | 'code';
  size: string;
  modified: string;
  owner: string;
};

const FILES: FileItem[] = [
  { id: '1', name: 'UI_Assets', type: 'folder', size: '--', modified: '2 hours ago', owner: 'Elena Rostova' },
  { id: '2', name: 'Core_Architecture', type: 'folder', size: '--', modified: '1 day ago', owner: 'David Kim' },
  { id: '3', name: 'hero_background_v2.png', type: 'image', size: '4.2 MB', modified: '3 hours ago', owner: 'Elena Rostova' },
  { id: '4', name: 'api_spec_v1.4.pdf', type: 'document', size: '1.1 MB', modified: '5 hours ago', owner: 'Marcus Chen' },
  { id: '5', name: 'legacy_auth_backup.zip', type: 'archive', size: '156 MB', modified: '2 days ago', owner: 'System' },
  { id: '6', name: 'websocket_handler.ts', type: 'code', size: '14 KB', modified: '4 hours ago', owner: 'David Kim' },
];

function getIconForType(type: string) {
  switch (type) {
    case 'folder': return <Folder size={20} className="text-[#4edea3]" />;
    case 'image': return <ImageIcon size={20} className="text-[#3b82f6]" />;
    case 'document': return <FileText size={20} className="text-[#a855f7]" />;
    case 'archive': return <FileArchive size={20} className="text-[#f59e0b]" />;
    case 'code': return <Code size={20} className="text-[#ef4444]" />;
    default: return <File size={20} className="text-[#bbcabf]" />;
  }
}

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

export default function Files() {
  const { logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChat, setActiveChat] = useState(RECENT_CHATS[0].id);
  const location = useLocation();

  const filteredFiles = FILES.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

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
            <Folder size={24} className="text-[#4edea3]" />
            <h2 className="text-[16px] font-bold tracking-tight">Project Files</h2>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative hidden lg:block mr-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbcabf] opacity-50" size={16} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files..." 
                className="bg-[#202225] text-sm text-[#e5e2e1] rounded-full pl-10 pr-4 py-1.5 w-64 border border-transparent focus:border-[#4edea3] focus:ring-1 focus:ring-[#4edea3]/50 outline-none transition-all placeholder:text-[#bbcabf]/30"
              />
            </div>
            <button className="p-2 text-[#bbcabf] hover:text-[#4edea3] transition-colors">
              <Bell size={20} />
            </button>
          </div>
        </header>

        {/* Files Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 relative z-10">
          <div className="max-w-6xl mx-auto">
            
            {/* Storage Info Widget */}
            <div className="flex flex-wrap items-center justify-between mb-8 p-6 bg-[#202225]/60 backdrop-blur-md rounded-2xl border border-[#2a2d31] shadow-lg">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-[#4edea3]/10 rounded-xl">
                  <HardDrive size={24} className="text-[#4edea3]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#e5e2e1]">Engineering Vault</h3>
                  <p className="text-sm text-[#bbcabf]">Shared workspace files and assets</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-6 mt-4 sm:mt-0">
                <div className="text-right">
                  <div className="text-sm font-bold text-[#e5e2e1]">12.4 GB <span className="text-[#bbcabf] font-normal">used of 50 GB</span></div>
                  <div className="w-48 h-2 bg-[#131313] rounded-full mt-2 overflow-hidden border border-[#2a2d31]">
                    <div className="h-full bg-gradient-to-r from-[#4edea3] to-[#3b82f6] w-1/4 rounded-full"></div>
                  </div>
                </div>
                <button className="flex items-center space-x-2 bg-[#4edea3] text-[#002113] px-4 py-2 rounded-lg font-bold hover:shadow-[0_0_15px_rgba(78,222,163,0.4)] transition-all active:scale-95">
                  <Plus size={18} />
                  <span>Upload</span>
                </button>
              </div>
            </div>

            {/* File List */}
            <div className="bg-[#202225]/40 border border-[#2a2d31] rounded-2xl overflow-hidden backdrop-blur-sm">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 p-4 border-b border-[#2a2d31] text-xs font-semibold text-[#bbcabf] uppercase tracking-wider bg-[#131313]/50">
                <div className="col-span-6 md:col-span-5">Name</div>
                <div className="hidden md:block col-span-3">Owner</div>
                <div className="col-span-3 md:col-span-2">Modified</div>
                <div className="col-span-2 md:col-span-1 text-right">Size</div>
                <div className="col-span-1 text-right"></div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-[#2a2d31]">
                {filteredFiles.map((file, index) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={file.id} 
                    className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-[#2a2d31]/50 transition-colors cursor-pointer group"
                  >
                    <div className="col-span-6 md:col-span-5 flex items-center space-x-3">
                      {getIconForType(file.type)}
                      <span className="text-sm font-medium text-[#e5e2e1] group-hover:text-[#4edea3] transition-colors">{file.name}</span>
                    </div>
                    <div className="hidden md:block col-span-3 text-sm text-[#bbcabf]">
                      {file.owner}
                    </div>
                    <div className="col-span-3 md:col-span-2 text-sm text-[#bbcabf]">
                      {file.modified}
                    </div>
                    <div className="col-span-2 md:col-span-1 text-sm text-[#bbcabf] text-right">
                      {file.size}
                    </div>
                    <div className="col-span-1 flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {file.type !== 'folder' && (
                        <button className="p-1.5 text-[#bbcabf] hover:text-[#4edea3] rounded-md hover:bg-[#4edea3]/10 transition-colors">
                          <Download size={16} />
                        </button>
                      )}
                      <button className="p-1.5 text-[#bbcabf] hover:text-[#ef4444] rounded-md hover:bg-[#ef4444]/10 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
                
                {filteredFiles.length === 0 && (
                  <div className="p-10 text-center text-[#bbcabf]">
                    <Search size={32} className="mx-auto mb-4 opacity-50" />
                    <p>No files matched your search.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
