import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AdminLogin } from '../components/AdminLogin';
import { CMSDashboard } from '../components/CMSDashboard';
import { useDocumentMeta, PAGE_META } from '../hooks/useDocumentMeta';

export function CMSPage() {
  useDocumentMeta(PAGE_META.cms);

  const { user, loading } = useAuth();
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    if (user) {
      setShowDashboard(true);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#013fac] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !showDashboard) {
    return <AdminLogin onSuccess={() => setShowDashboard(true)} />;
  }

  return <CMSDashboard />;
}