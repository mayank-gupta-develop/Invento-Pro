import { motion } from 'framer-motion';
import {
  BarChart3,
  FileText,
  Grid3x3,
  Home,
  LogOut,
  Package,
  Settings,
  Users,
  X,
  CreditCard,
  Shield,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from '@/components/Logo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: 'user' | 'admin';
}

export default function AppSidebar({ isOpen, onClose, userRole = 'user' }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const userMenuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Package, label: 'Inventory', path: '/inventory' },
    { icon: Grid3x3, label: 'Catalog', path: '/catalog' },
    { icon: CreditCard, label: 'Billing', path: '/billing' },
    { icon: BarChart3, label: 'Sales', path: '/sales' },
    { icon: FileText, label: 'Bills', path: '/bills' },
  ];

  const adminMenuItems = [
    { icon: Shield, label: 'Admin Dashboard', path: '/admin' },
    { icon: Users, label: 'Users', path: '/admin-users' },
  ];

  const menuItems = userRole === 'admin' ? adminMenuItems : userMenuItems;

  const isActive = (path: string) => location.pathname === path;

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}

      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: isOpen ? 0 : -280 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 h-screen w-72 bg-card/70 backdrop-blur-md border-r border-border/50 z-50 lg:static lg:translate-x-0 lg:w-64 flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <Logo size="sm" showText={true} />
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-muted rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <motion.button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                whileHover={{ x: 4 }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-r from-blue-600/20 to-cyan-500/20 text-primary font-medium border border-primary/30 shadow-lg shadow-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon size={20} />
                <span className="text-sm">{item.label}</span>
              </motion.button>
            );
          })}
        </nav>

        <div className="border-t border-border/50 p-4 space-y-2 mt-auto">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200">
            <Settings size={20} />
            <span className="text-sm">Settings</span>
          </button>
          <button
            onClick={() => handleNavigation('/login')}
            className="w-full flex items-center gap-3 px-4 py-3 text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
