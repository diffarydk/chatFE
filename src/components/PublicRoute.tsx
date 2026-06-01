import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Terminal } from 'lucide-react';
import { motion } from 'motion/react';

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="absolute inset-0 z-[200] bg-[#0a0a0a] flex flex-col items-center justify-center min-h-screen">
        <Terminal size={48} className="text-[#4edea3] mb-4 animate-pulse" />
        <div className="w-48 h-1 bg-[#202225] rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="h-full bg-[#4edea3]"
          />
        </div>
        <p className="mt-4 text-[#bbcabf] text-sm font-bold tracking-widest uppercase">Initializing Matrix...</p>
      </div>
    );
  }

  if (token) {
    return <Navigate to="/chat" replace />;
  }

  return <>{children}</>;
};
