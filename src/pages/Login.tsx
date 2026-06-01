import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Terminal, Lock, Mail, ArrowRight, Github, Code, Layers, Zap } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // --- BACKEND INTEGRATION POINT ---
      // Replace this timeout with your actual API call:
      // const response = await fetch('YOUR_BE_URL/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password })
      // });
      // const data = await response.json();
      // if (!response.ok) throw new Error(data.message);
      // localStorage.setItem('token', data.token);

      // Simulate API Call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // On success, redirect to chat
      navigate('/chat');
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen w-full bg-[#0b0c0e] text-[#e5e2e1] font-sans selection:bg-[#10b981]/30 selection:text-[#4edea3] flex relative overflow-hidden">
      
      {/* Background Decor for Right Side */}
      <div className="absolute top-0 right-0 w-full h-full lg:w-1/2 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-[#4edea3]/10 rounded-full blur-[120px] mix-blend-screen"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#3b82f6]/10 rounded-full blur-[120px] mix-blend-screen"></div>
      </div>

      {/* Left Panel: Graphic / Brand (Hidden on Mobile) */}
      <div className="hidden lg:flex w-[45%] relative bg-[#111214] border-r border-[#2a2d31] flex-col justify-between p-12 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none" 
          style={{ backgroundImage: 'radial-gradient(#e5e2e1 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        ></div>

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10"
        >
          <div className="flex items-center space-x-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-[#4edea3] flex items-center justify-center text-[#002113]">
              <Terminal size={24} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Dev Collective</span>
          </div>

          <div className="max-w-md">
            <h2 className="text-5xl font-bold leading-tight tracking-tight mb-6 text-white">
              Welcome back to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4edea3] to-[#3b82f6]">the matrix.</span>
            </h2>
            <p className="text-[#bbcabf] text-lg leading-relaxed mb-12">
              Authenticate to sync with your engineering team and access your secure workspaces.
            </p>

            <div className="space-y-6">
              {[
                { icon: Code, title: 'Code-first design', desc: 'Syntax highlighting built-in' },
                { icon: Zap, title: 'Lightning fast', desc: 'Real-time WebSocket sync' },
                { icon: Layers, title: 'Organized logic', desc: 'Custom workspace categories' }
              ].map((feature, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1) }}
                  key={i} 
                  className="flex items-start space-x-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#202225] flex items-center justify-center text-[#4edea3] border border-[#2a2d31]">
                    <feature.icon size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#e5e2e1]">{feature.title}</h4>
                    <p className="text-sm text-[#bbcabf]">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="relative z-10 text-sm text-[#bbcabf]/50 font-medium">
          © 2026 Dev Collective. Secure end-to-end.
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-[420px]">
          
          {/* Mobile Logo (Visible only on mobile) */}
          <div className="lg:hidden flex items-center justify-center space-x-3 mb-10">
            <div className="w-12 h-12 rounded-xl bg-[#4edea3] flex items-center justify-center text-[#002113] shadow-[0_0_20px_rgba(78,222,163,0.3)]">
              <Terminal size={28} strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">Dev Collective</span>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="bg-[#111214]/60 backdrop-blur-2xl border border-[#2a2d31] p-8 sm:p-10 rounded-3xl shadow-2xl relative"
          >
            <motion.div variants={itemVariants} className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 text-white">Authenticate</h1>
              <p className="text-[#bbcabf] text-sm">Enter your credentials to access the workspace.</p>
            </motion.div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-3 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg text-sm text-[#ef4444] font-medium text-center">
                {error}
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              
              <motion.div variants={itemVariants} className="space-y-1.5 group">
                <label className="text-[11px] font-bold text-[#bbcabf] uppercase tracking-wider group-focus-within:text-[#4edea3] transition-colors">
                  Comm Link (Email)
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbcabf] group-focus-within:text-[#4edea3] transition-colors">
                    <Mail size={18} />
                  </div>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ada@node.local" 
                    className="w-full bg-[#1a1d21] text-[#e5e2e1] rounded-xl pl-10 pr-4 py-3.5 border border-[#3c4a42]/40 focus:border-[#4edea3] focus:ring-1 focus:ring-[#4edea3]/50 outline-none transition-all placeholder:text-[#bbcabf]/30 font-medium disabled:opacity-50"
                    disabled={isLoading}
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-1.5 group">
                <label className="text-[11px] font-bold text-[#bbcabf] uppercase tracking-wider group-focus-within:text-[#4edea3] transition-colors flex justify-between">
                  <span>Security Key (Password)</span>
                  <a href="#" className="text-[#4edea3]/80 hover:text-[#4edea3] normal-case tracking-normal hover:underline">Forgot?</a>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbcabf] group-focus-within:text-[#4edea3] transition-colors">
                    <Lock size={18} />
                  </div>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full bg-[#1a1d21] text-[#e5e2e1] rounded-xl pl-10 pr-4 py-3.5 border border-[#3c4a42]/40 focus:border-[#4edea3] focus:ring-1 focus:ring-[#4edea3]/50 outline-none transition-all placeholder:text-[#bbcabf]/30 font-medium disabled:opacity-50"
                    disabled={isLoading}
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="pt-2">
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#4edea3] text-[#002113] font-bold rounded-xl py-3.5 flex items-center justify-center space-x-2 hover:shadow-[0_0_20px_rgba(78,222,163,0.4)] transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:shadow-none"
                >
                  <span>{isLoading ? 'Authenticating...' : 'Initialize Session'}</span>
                  {!isLoading && <ArrowRight size={18} />}
                </button>
              </motion.div>
            </form>

            <motion.div variants={itemVariants} className="mt-6">
              <div className="relative flex items-center justify-center mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#3c4a42]/40"></div>
                </div>
                <div className="relative bg-[#111214] px-4 text-[11px] font-bold text-[#bbcabf]/60 uppercase tracking-widest">
                  Or bypass with
                </div>
              </div>

              <button className="w-full bg-[#1a1d21] text-[#e5e2e1] hover:bg-[#202225] border border-[#3c4a42]/40 rounded-xl py-3 flex items-center justify-center space-x-3 transition-all hover:border-[#3c4a42]">
                <Github size={18} />
                <span className="font-semibold text-sm">GitHub OAuth</span>
              </button>
            </motion.div>

            <motion.p variants={itemVariants} className="mt-8 text-center text-[13px] text-[#bbcabf]">
              First time here? <Link to="/register" className="text-[#4edea3] hover:underline font-bold">Request Access</Link>
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
