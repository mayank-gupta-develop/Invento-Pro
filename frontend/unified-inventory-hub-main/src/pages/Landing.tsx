import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, Package, Zap, Moon, Sun, Users, Shield, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import Logo from '@/components/Logo';

export default function Landing() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const features = [
    { icon: Package, title: 'Inventory Tracking', description: 'Real-time stock tracking with automated low-stock alerts and batch management.' },
    { icon: Zap, title: 'Catalog Builder', description: 'Build and publish beautiful product catalogs from your inventory instantly.' },
    { icon: BarChart3, title: 'Sales Dashboard', description: 'Comprehensive sales analytics with trend analysis and revenue insights.' },
    { icon: Shield, title: 'Admin Analytics', description: 'System-wide metrics, traffic monitoring, and user growth analytics.' },
    { icon: Users, title: 'User Management', description: 'Manage team roles, permissions, and user access with ease.' },
    { icon: FileText, title: 'Reports Export', description: 'Generate and export detailed reports in multiple formats.' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <motion.header
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="sticky top-0 z-[1000] backdrop-blur-md bg-background/70 border-b border-border/50"
      >
        <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between h-16">
          <Logo size="md" showText={true} />
          <div className="flex items-center gap-4">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={toggleTheme} className="p-2 hover:bg-muted rounded-lg transition-colors">
              {theme === 'light' ? <Moon size={18} className="text-muted-foreground" /> : <Sun size={18} className="text-muted-foreground" />}
            </motion.button>
            <button onClick={() => navigate('/login')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Login</button>
            <Button onClick={() => navigate('/signup')} variant="outline" className="border-border/50 hover:bg-muted/50">Signup</Button>
            <Button onClick={() => navigate('/signup')} className="btn-gradient">Get Started</Button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="max-w-[1400px] mx-auto px-6 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
            <motion.h1 variants={itemVariants} className="text-3xl lg:text-5xl font-bold text-foreground leading-tight">
              Inventory Management for{' '}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Modern Businesses</span>
            </motion.h1>
            <motion.p variants={itemVariants} className="text-lg text-muted-foreground max-w-xl">
              Manage inventory, catalog, and sales in one powerful dashboard. Streamline your operations with real-time analytics and intuitive tools.
            </motion.p>
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
              <Button onClick={() => navigate('/signup')} className="btn-gradient px-8 py-3">
                Get Started <ArrowRight className="ml-2" size={18} />
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')} className="px-8 py-3 border-border/50 hover:bg-muted/50">
                View Demo
              </Button>
            </motion.div>
          </motion.div>

          {/* Dashboard Preview Card */}
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.3 }} className="hidden lg:block">
            <div className="rounded-xl glass-card p-6 shadow-2xl shadow-primary/5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-2 text-xs text-muted-foreground">Dashboard Preview</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[{ label: 'Products', value: '1,234' }, { label: 'Revenue', value: '$24.5K' }, { label: 'Orders', value: '342' }, { label: 'Users', value: '2,087' }].map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.1 }} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-lg font-bold text-foreground">{s.value}</p>
                  </motion.div>
                ))}
              </div>
              <div className="h-32 rounded-lg bg-gradient-to-r from-blue-600/10 to-cyan-500/10 border border-border/50 flex items-end p-3 gap-1">
                {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95].map((h, i) => (
                  <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: 0.8 + i * 0.05, duration: 0.4 }} className="flex-1 bg-gradient-to-t from-blue-600 to-cyan-500 rounded-t opacity-70" />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-[1400px] mx-auto px-6 py-20">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Powerful Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Everything you need to manage your business efficiently</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: idx * 0.1 }} viewport={{ once: true }} className="p-6 rounded-lg glass-card-hover">
                  <Icon className="w-12 h-12 text-primary mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* Screenshot Section */}
      <section className="max-w-[1400px] mx-auto px-6 py-20">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="text-center space-y-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">See It In Action</h2>
          <div className="rounded-xl glass-card p-8 shadow-2xl shadow-primary/5 max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-2 text-xs text-muted-foreground">Invento Pro — Admin Dashboard</span>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[{ l: 'Total Users', v: '3,142' }, { l: 'Active', v: '2,087' }, { l: 'Products', v: '847' }, { l: 'Sales', v: '$24.5K' }].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="p-4 rounded-lg bg-muted/30 border border-border/50 text-center">
                  <p className="text-xs text-muted-foreground">{s.l}</p>
                  <p className="text-xl font-bold text-foreground">{s.v}</p>
                </motion.div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[[30, 50, 40, 70, 60, 85, 55], [50, 35, 65, 45, 80, 55, 70]].map((bars, gi) => (
                <div key={gi} className="h-40 rounded-lg bg-gradient-to-br from-blue-600/10 to-cyan-500/10 border border-border/50 flex items-end p-4 gap-2">
                  {bars.map((h, i) => (
                    <motion.div key={i} initial={{ height: 0 }} whileInView={{ height: `${h}%` }} transition={{ delay: i * 0.08 }} viewport={{ once: true }} className={`flex-1 bg-gradient-to-t ${gi === 0 ? 'from-blue-600 to-cyan-500' : 'from-cyan-500 to-blue-600'} rounded-t opacity-60`} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="max-w-[1400px] mx-auto px-6 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="rounded-xl bg-gradient-to-r from-blue-600/10 to-cyan-500/10 border border-primary/20 p-12 text-center space-y-6">
          <h2 className="text-3xl font-bold text-foreground">Start Managing Inventory Today</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">Join thousands of businesses streamlining operations with Invento Pro.</p>
          <Button onClick={() => navigate('/signup')} className="btn-gradient px-8 py-3">
            Get Started <ArrowRight className="ml-2" size={18} />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-[1400px] mx-auto px-6 text-center text-sm text-muted-foreground">
          © 2026 Invento Pro. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
