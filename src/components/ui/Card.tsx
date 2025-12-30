import React from 'react';
import { cn } from '../../lib/utils';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<"div"> {
    variant?: 'default' | 'glass' | 'filled';
}

export function Card({ className, variant = 'glass', children, ...props }: CardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={cn(
                "rounded-2xl transition-all duration-300",
                {
                    "glass-premium text-card-foreground": variant === 'glass',
                    "bg-card/50 border border-border/50 text-card-foreground": variant === 'default',
                    "bg-muted/30 border-none": variant === 'filled',
                },
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("flex flex-col space-y-1.5 mb-5", className)} {...props}>{children}</div>;
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <h3 className={cn("font-bold leading-none tracking-tight text-xl text-foreground", className)} {...props}>{children}</h3>;
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("p-6 pt-0", className)} {...props}>{children}</div>;
}
