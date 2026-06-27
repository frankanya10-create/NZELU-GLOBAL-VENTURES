import { create } from 'zustand';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => {
    set({ user, isAuthenticated: true, isLoading: false });
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('ngv_user', JSON.stringify(user)); } catch (e) {}
    }
  },

  setToken: (token) => {
    set({ token });
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('ngv_token', token); } catch (e) {}
    }
  },

  initialize: () => {
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('ngv_token');
        const raw = localStorage.getItem('ngv_user');
        if (token && raw) {
          const user = JSON.parse(raw);
          if (user && user.role) {
            set({ token, user, isAuthenticated: true, isLoading: false });
            return;
          }
        }
      } catch (e) {
        try {
          localStorage.removeItem('ngv_token');
          localStorage.removeItem('ngv_user');
        } catch (_) {}
      }
      set({ isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('ngv_token');
        localStorage.removeItem('ngv_user');
      } catch (e) {}
    }
  },

  getRoleRedirect: () => {
    const { user } = get();
    if (!user?.role) return '/login';
    const map = {
      administrator: '/admin/dashboard',
      manager: '/manager/dashboard',
      cashier: '/cashier/dashboard',
      storekeeper: '/storekeeper/dashboard',
    };
    return map[user.role] || '/dashboard';
  },

  hasPermission: (permission) => {
    const { user } = get();
    return user?.permissions?.[permission] === true;
  },

  isRole: (...roles) => {
    const { user } = get();
    return user && roles.includes(user.role);
  },
}));

export default useAuthStore;
