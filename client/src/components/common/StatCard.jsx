import React from 'react';
import { motion } from 'framer-motion';

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'saffron',
  onClick,
  className = ''
}) {
  const variantStyles = {
    saffron: 'from-amber-500/15 via-orange-500/10 to-transparent border-amber-500/30 text-amber-500 dark:text-amber-400',
    emerald: 'from-emerald-500/15 via-teal-500/10 to-transparent border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
    rose: 'from-rose-500/15 via-pink-500/10 to-transparent border-rose-500/30 text-rose-600 dark:text-rose-400',
    amber: 'from-amber-500/15 via-yellow-500/10 to-transparent border-amber-500/30 text-amber-600 dark:text-amber-400',
    blue: 'from-blue-500/15 via-cyan-500/10 to-transparent border-blue-500/30 text-blue-600 dark:text-blue-400',
    purple: 'from-purple-500/15 via-violet-500/10 to-transparent border-purple-500/30 text-purple-600 dark:text-purple-400'
  };

  const currentVariant = variantStyles[variant] || variantStyles.saffron;

  return (
    <motion.div
      whileHover={onClick ? { scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border p-5 shadow-sm hover:shadow-md transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-amber-500/50' : ''
      } ${currentVariant} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5 flex-1 pr-2">
          <p className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
            {title}
          </p>
          <h3 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-sans">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              {subtitle}
            </p>
          )}
        </div>

        {Icon && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-slate-800/90 text-current flex-shrink-0 border border-amber-500/20">
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      {/* Subtle bottom decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-current opacity-30" />
    </motion.div>
  );
}

export default StatCard;
