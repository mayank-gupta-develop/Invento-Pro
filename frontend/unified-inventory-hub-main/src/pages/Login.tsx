import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Lock, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import Logo from '@/components/Logo';
import api from '@/lib/api';

export default function Login() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/auth/login", {
        email: identifier,
        password
      });

      if (res.data) {
        localStorage.setItem('user', JSON.stringify(res.data.user || res.data));
        setError(null);
        if ((res.data.user?.role || res.data.role) === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <motion.header
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="sticky top-0 z-[1000] backdrop-blur-md bg-background/70 border-b border-border/50"
      >
        <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between h-16">
          <Logo size="sm" showText={true} />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={toggleTheme} className="p-2 hover:bg-muted rounded-lg transition-colors">
            {theme === 'light' ? <Moon size={18} className="text-muted-foreground" /> : <Sun size={18} className="text-muted-foreground" />}
          </motion.button>
        </div>
      </motion.header>

      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          <motion.button whileHover={{ x: -4 }} onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft size={20} />
            Back to home
          </motion.button>

          <div className="p-8 rounded-lg glass-card">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-foreground mb-2">Welcome back</h1>
              <p className="text-muted-foreground">Sign in to your Invento Pro account</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email / Phone / Username</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input type="text" placeholder="you@example.com or phone or username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="pl-10 bg-input/50 border-border/50 focus:border-primary" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 bg-input/50 border-border/50 focus:border-primary" />
                </div>
              </div>

              <div className="flex items-center text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-border/50" />
                  <span className="text-muted-foreground">Remember me</span>
                </label>
              </div>

              {error && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">{error}</div>}

              <Button type="submit" className="w-full btn-gradient py-6 text-base" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
