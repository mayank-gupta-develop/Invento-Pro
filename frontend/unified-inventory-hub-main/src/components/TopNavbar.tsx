import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Moon, Sun, LogOut, Settings, Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import Logo from '@/components/Logo';
import { useState, useMemo } from 'react';

interface TopNavbarProps {
  userRole?: 'user' | 'admin';
}

export default function TopNavbar({ userRole = 'user' }: TopNavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const storedUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const userNavItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Inventory', path: '/inventory' },
    { label: 'Catalog', path: '/catalog' },
    { label: 'Billing', path: '/billing' },
    { label: 'Sales', path: '/sales' },
    { label: 'Bills', path: '/bills' },
  ];

  const adminNavItems = [
    { label: 'Admin Dashboard', path: '/admin' },
    { label: 'Users', path: '/admin-users' },
  ];

  const navItems = userRole === 'admin' ? adminNavItems : userNavItems;

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="sticky top-0 z-[1000] backdrop-blur-xl bg-background/70 border-b border-border/50 no-print"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Left: Logo */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => navigate(userRole === 'admin' ? '/admin' : '/dashboard')}
          className="cursor-pointer flex-shrink-0"
        >
          <Logo size="sm" showText={true} />
        </motion.div>

        {/* Center: Navigation (Desktop Only) */}
        <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
          {navItems.map((item) => (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              whileHover={{ scale: 1.05 }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {item.label}
            </motion.button>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {theme === 'light' ? (
              <Moon size={18} className="text-muted-foreground" />
            ) : (
              <Sun size={18} className="text-muted-foreground" />
            )}
          </motion.button>

          {/* User Avatar & Menu */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-sm font-semibold text-primary-foreground hover:shadow-lg transition-all"
            >
              {userRole === 'admin' ? 'A' : 'U'}
            </motion.button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 rounded-lg bg-card/90 backdrop-blur-md border border-border/50 shadow-lg z-50"
                >
                  <div className="p-3 border-b border-border/50">
                    <p className="text-sm font-semibold text-foreground">
                      {storedUser?.name || storedUser?.username || (userRole === 'admin' ? 'Admin User' : 'User')}
                    </p>
                  </div>
                  <div className="p-2 space-y-1">

                    <motion.button
                      whileHover={{ x: 4 }}
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <LogOut size={16} />
                      Logout
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {showMobileMenu ? (
              <X size={20} className="text-muted-foreground" />
            ) : (
              <Menu size={20} className="text-muted-foreground" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-border/50 bg-background/50 backdrop-blur-md"
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <motion.button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setShowMobileMenu(false);
                  }}
                  whileHover={{ x: 4 }}
                  className={`w-full text-left px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {item.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
