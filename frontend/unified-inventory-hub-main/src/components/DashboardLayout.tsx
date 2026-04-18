import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import TopNavbar from './TopNavbar';
import AppSidebar from './AppSidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole?: 'user' | 'admin';
}

export default function DashboardLayout({ children, userRole = 'user' }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-background">
      <TopNavbar userRole={userRole} />

      <div className="flex flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userRole={userRole} />
        </AnimatePresence>

        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="flex-1 overflow-y-auto"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
