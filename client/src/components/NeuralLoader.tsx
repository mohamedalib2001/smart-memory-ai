import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Brain, Sparkles, Cpu } from "lucide-react";

interface NeuralLoaderProps {
  onComplete: () => void;
}

export function NeuralLoader({ onComplete }: NeuralLoaderProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 1;
      });
    }, 25); // ~2.5 seconds total

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => {
      clearInterval(timer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background text-primary overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
    >
      {/* Background Neural Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
      <div className="absolute inset-0 neural-gradient pointer-events-none" />

      {/* Central Brain Animation */}
      <div className="relative mb-8 sm:mb-12">
        <motion.div
          className="relative z-10 p-5 sm:p-8 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20"
          animate={{
            boxShadow: [
              "0 0 20px rgba(6, 182, 212, 0.2)",
              "0 0 60px rgba(6, 182, 212, 0.6)",
              "0 0 20px rgba(6, 182, 212, 0.2)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Brain className="w-16 h-16 sm:w-24 sm:h-24 text-primary" strokeWidth={1.5} />
        </motion.div>

        {/* Orbiting particles */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 w-32 h-32 sm:w-48 sm:h-48 border border-primary/30 rounded-full"
            style={{
              translateX: "-50%",
              translateY: "-50%",
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.5,
            }}
          >
            <div className="absolute top-0 left-1/2 w-2 h-2 sm:w-3 sm:h-3 bg-primary rounded-full shadow-[0_0_10px_currentColor] -translate-x-1/2 -translate-y-1/2" />
          </motion.div>
        ))}
      </div>

      {/* Loading Text */}
      <motion.div
        className="flex flex-col items-center space-y-3 sm:space-y-4 z-10 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-base sm:text-xl md:text-2xl font-display font-bold tracking-wider sm:tracking-widest text-white text-center">
          INITIALIZING CORE MEMORY
        </h2>
        
        <div className="w-48 sm:w-64 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary shadow-[0_0_10px_currentColor]"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="font-mono text-xs sm:text-sm text-primary/70">
          SYSTEM_CHECK: {progress}%
        </div>
      </motion.div>

      {/* Floating binary bits */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`bit-${i}`}
          className="absolute text-primary/10 font-mono text-xs select-none"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: 0,
          }}
          animate={{
            y: [null, Math.random() * -100],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: Math.random() * 2 + 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        >
          {Math.random() > 0.5 ? "1" : "0"}
        </motion.div>
      ))}
    </motion.div>
  );
}
