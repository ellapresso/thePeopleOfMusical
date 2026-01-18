'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAdminMe } from '@/lib/adminApi';

interface Admin {
  id: number;
  loginId: string;
  name: string;
  adminType: string;
  member?: any;
}

interface AdminContextType {
  currentAdmin: Admin | null;
  loading: boolean;
  isAuthenticated: boolean;
  isSystemAdmin: boolean;
  refreshAdmin: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAdmin = async () => {
    try {
      const adminData = await getAdminMe();
      setCurrentAdmin(adminData);
    } catch (error) {
      setCurrentAdmin(null);
      // 인증 실패 시 로그인 페이지로 리다이렉트는 각 페이지에서 처리
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAdmin();
  }, []);

  const value: AdminContextType = {
    currentAdmin,
    loading,
    isAuthenticated: !!currentAdmin,
    isSystemAdmin: currentAdmin?.adminType === 'SYSTEM',
    refreshAdmin,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}

