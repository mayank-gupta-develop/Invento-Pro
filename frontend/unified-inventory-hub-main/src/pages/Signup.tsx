import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Lock, User, Phone, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import Logo from '@/components/Logo';
import api from '@/lib/api';

export default function Signup() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      if (res.data) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setError(null);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Signup failed');
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
        className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-border/50"
      >
        <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between h-16">
          <Logo size="sm" showText={true} />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
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
              <h1 className="text-2xl font-bold text-foreground mb-2">Create Account</h1>
              <p className="text-muted-foreground">Join Invento Pro today</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input type="text" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} required className="pl-10 bg-input/50 border-border/50 focus:border-primary" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required className="pl-10 bg-input/50 border-border/50 focus:border-primary" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Phone</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input type="tel" name="phone" placeholder="+91 98765 43210" value={formData.phone} onChange={handleChange} required className="pl-10 bg-input/50 border-border/50 focus:border-primary" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Username</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input type="text" name="username" placeholder="johndoe" value={formData.username} onChange={handleChange} required className="pl-10 bg-input/50 border-border/50 focus:border-primary" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required className="pl-10 bg-input/50 border-border/50 focus:border-primary" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Confirm Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input type="password" name="confirmPassword" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required className="pl-10 bg-input/50 border-border/50 focus:border-primary" />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" required className="w-4 h-4 rounded border-border/50" />
                <span className="text-muted-foreground">
                  I agree to the <a href="#" className="text-primary hover:text-primary/80 transition-colors">Terms & Conditions</a>
                </span>
              </label>

              {error && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">{error}</div>}
              <Button type="submit" className="w-full btn-gradient py-6 text-base" disabled={loading}>
                {loading ? 'Creating...' : 'Create Account'}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-4">
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-xs text-muted-foreground">OR</span>
              <div className="flex-1 h-px bg-border/50" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="border-border/50 hover:bg-muted/50">Google</Button>
              <Button variant="outline" className="border-border/50 hover:bg-muted/50">GitHub</Button>
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="text-primary hover:text-primary/80 transition-colors font-medium">Sign in</button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
