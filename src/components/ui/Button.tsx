import React from 'react';
import { cn } from '../../lib/utils';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<"button"> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
    size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
        return (
            <motion.button
                ref={ref}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                    "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                    {
                        "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25": variant === 'primary',
                        "bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === 'secondary',
                        "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground": variant === 'outline',
                        "hover:bg-accent hover:text-accent-foreground": variant === 'ghost',
                        "bg-destructive text-destructive-foreground hover:bg-destructive/90": variant === 'destructive',
                        "h-8 px-3 text-xs": size === 'sm',
                        "h-10 px-8 py-2": size === 'md',
                        "h-12 px-10 text-lg": size === 'lg',
                    },
                    className
                )}
                {...props}
            />
        );
    }
);
