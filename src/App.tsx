import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import GroupChats from './pages/GroupChats';
import Files from './pages/Files';
import Members from './pages/Members';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Guest routes */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />

          {/* Guarded application routes */}
          <Route path="/chat" element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } />
          <Route path="/groups" element={
            <ProtectedRoute>
              <GroupChats />
            </ProtectedRoute>
          } />
          <Route path="/files" element={
            <ProtectedRoute>
              <Files />
            </ProtectedRoute>
          } />
          <Route path="/members" element={
            <ProtectedRoute>
              <Members />
            </ProtectedRoute>
          } />

          {/* Wildcard / Fallback redirects */}
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="*" element={<Navigate to="/chat" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
