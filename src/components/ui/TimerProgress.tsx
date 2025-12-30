import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface TimerProgressProps {
    label?: string;
}

export function TimerProgress({ label = "Processing..." }: TimerProgressProps) {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setSeconds(s => s + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col items-center justify-center gap-3 py-6">
            <div className="relative">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                    <Loader2 className="w-8 h-8 text-primary" />
                </motion.div>
            </div>
            <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-medium text-foreground">{label}</span>
                <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-full">
                    Time Elapsed: {formatTime(seconds)}
                </span>
            </div>
        </div>
    );
}
