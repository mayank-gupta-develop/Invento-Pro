import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizeMap = {
    xs: { icon: 'w-6 h-6 text-xs', text: 'text-xs' },
    sm: { icon: 'w-8 h-8 text-sm', text: 'text-sm' },
    md: { icon: 'w-10 h-10 text-base', text: 'text-lg' },
    lg: { icon: 'w-12 h-12 text-lg', text: 'text-2xl' },
    xl: { icon: 'w-16 h-16 text-xl', text: 'text-4xl' },
  };

  const { icon, text } = sizeMap[size];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center gap-2 ${className}`}
    >
      <div className={`${icon} rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center font-bold text-primary-foreground`}>
        IP
      </div>
      {showText && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className={`${text} font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent whitespace-nowrap`}
        >
          Invento Pro
        </motion.span>
      )}
    </motion.div>
  );
}
