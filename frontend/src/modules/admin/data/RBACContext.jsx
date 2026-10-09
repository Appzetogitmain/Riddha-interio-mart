import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../../../shared/utils/api';
import { useUser } from '../../user/data/UserContext';
import { DEFAULT_ASSISTANT_PERMISSIONS } from './permissionsMap';

const RBACContext = createContext();

export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
};

export const RBACProvider = ({ children }) => {
  const { user } = useUser();
  
  const getStoredAdmin = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('riddha_admin') || 'null');
      return (stored?.role === 'admin' && stored?.token) ? stored : null;
    } catch {
      return null;
    }
  };

  const initialAdmin = (user?.role === 'admin') ? user : getStoredAdmin();

  // State for current role and permissions - synced with Admin session
  const [role, setRole] = useState(() => {
    if (!initialAdmin) {
      const isInsideAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
      return isInsideAdmin ? 'admin' : 'user';
    }
    return initialAdmin.type === 'assistant' ? 'assistant' : 'admin';
  });

  const [currentPermissions, setCurrentPermissions] = useState(() => {
    if (!initialAdmin || initialAdmin.type !== 'assistant') return null;
    return initialAdmin.permissions || DEFAULT_ASSISTANT_PERMISSIONS;
  });

  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const currentAdmin = (user?.role === 'admin') ? user : getStoredAdmin();
    if (currentAdmin) {
      const isAssistant = currentAdmin.type === 'assistant';
      setRole(isAssistant ? 'assistant' : 'admin');
      setCurrentPermissions(isAssistant ? (currentAdmin.permissions || DEFAULT_ASSISTANT_PERMISSIONS) : null);
      fetchAssistants();
    } else {
      const isInsideAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
      setRole(isInsideAdmin ? 'admin' : 'user');
      setCurrentPermissions(null);
    }
  }, [user]);

  const fetchAssistants = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/auth/admin/assistants');
      if (data.success) {
        setAssistants(data.data.map(a => ({
          id: a._id,
          name: a.fullName,
          email: a.email,
          role: a.type,
          permissions: a.permissions
        })));
      }
    } catch (err) {
      console.error('Failed to fetch assistants:', err);
    } finally {
      setLoading(false);
    }
  };

  const switchRole = (newRole, permissions = null) => {
    setRole(newRole);
    if (newRole === 'admin') {
      setCurrentPermissions(null); // Admin has full access
    } else {
      setCurrentPermissions(permissions || DEFAULT_ASSISTANT_PERMISSIONS);
    }
  };

  const hasPermission = (permissionKey) => {
    if (role === 'admin') return true;
    if (!currentPermissions) return false;
    return !!currentPermissions[permissionKey];
  };

  const addAssistant = async (assistantData) => {
    try {
      const { data } = await api.post('/auth/admin/assistants', assistantData);
      if (data.success) {
        fetchAssistants(); // Refresh list
        return data.data;
      }
    } catch (err) {
      console.error('Failed to add assistant:', err);
      throw err;
    }
  };

  const updateAssistant = async (id, updatedData) => {
    try {
      const { data } = await api.put(`/auth/admin/assistants/${id}`, updatedData);
      if (data.success) {
        fetchAssistants();
        return data.data;
      }
    } catch (err) {
      console.error('Failed to update assistant:', err);
      throw err;
    }
  };

  const removeAssistant = async (id) => {
    try {
      const { data } = await api.delete(`/auth/admin/assistants/${id}`);
      if (data.success) {
        setAssistants(prev => prev.filter(a => a.id !== id));
      }
    } catch (err) {
      console.error('Failed to remove assistant:', err);
      throw err;
    }
  };

  return (
    <RBACContext.Provider value={{
      role,
      currentPermissions,
      assistants,
      switchRole,
      hasPermission,
      addAssistant,
      updateAssistant,
      removeAssistant,
      loading
    }}>
      {children}
    </RBACContext.Provider>
  );
};
