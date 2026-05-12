import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Send, Brain, Cpu, Sparkles, ChevronRight, Star, GitFork, Github, LogIn, Shield, Lock, Globe } from "lucide-react";
import { insertSubscriberSchema, type InsertSubscriber } from "@shared/schema";
import { useCreateSubscriber } from "@/hooks/use-subscribers";
import { useQuery } from "@tanstack/react-query";
import { NeuralLoader } from "@/components/NeuralLoader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

interface RepoInfo {
  name: string;
  fullName: string;
  description: string | null;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  language: string | null;
  url: string;
}

export default function Landing() {
  const [loadingComplete, setLoadingComplete] = useState(false);
  const { mutate: subscribe, isPending, isSuccess } = useCreateSubscriber();
  
  const { data: repoInfo } = useQuery<RepoInfo>({
    queryKey: ["/api/github/repo"],
  });

  const form = useForm<InsertSubscriber>({
    resolver: zodResolver(insertSubscriberSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: InsertSubscriber) => {
    subscribe(data, {
      onSuccess: () => {
        form.reset();
      },
    });
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {!loadingComplete && (
          <NeuralLoader onComplete={() => setLoadingComplete(true)} />
        )}
      </AnimatePresence>

      <motion.div
        className="min-h-screen bg-background relative overflow-hidden flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: loadingComplete ? 1 : 0 }}
        transition={{ duration: 1 }}
      >
        {/* Ambient Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/10 blur-[100px]" />
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
        </div>

        {/* Navigation Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="relative z-20 border-b border-white/5 bg-background/50 backdrop-blur-sm"
        >
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              <span className="font-bold text-lg">SmartMemoryAI</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/pricing">
                <Button variant="ghost" size="sm" data-testid="button-pricing">
                  Pricing
                </Button>
              </Link>
              <a href="/api/login">
                <Button size="sm" data-testid="button-login">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </a>
            </div>
          </div>
        </motion.header>

        {/* Content Container */}
        <div className="relative z-10 flex-grow flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-24">
          
          <div className="w-full max-w-4xl mx-auto text-center space-y-8 sm:space-y-12">
            
            {/* Logo / Icon */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex justify-center mb-8"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary blur-xl opacity-30 animate-pulse" />
                <div className="relative p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <Brain className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />
                </div>
              </div>
            </motion.div>

            {/* Typography Section */}
            <div className="space-y-6">
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="text-3xl xs:text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold tracking-tighter px-2"
              >
                <span className="text-white block sm:inline">Smart</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-300 to-white text-glow block sm:inline">
                  MemoryAI
                </span>
              </motion.h1>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.8 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-lg sm:text-2xl md:text-3xl font-light tracking-wide text-muted-foreground"
              >
                <span className="uppercase tracking-[0.15em] sm:tracking-[0.2em]">Coming Soon</span>
                <span className="hidden sm:inline w-2 h-2 rounded-full bg-primary/50" />
                <span className="font-display font-medium text-primary/90 text-xl sm:text-2xl md:text-3xl">قريباً</span>
              </motion.div>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.8 }}
                className="max-w-2xl mx-auto text-sm sm:text-lg md:text-xl text-muted-foreground/80 leading-relaxed px-2"
              >
                Unlock the future of intelligent memory assistance. 
                Enhance your cognitive recall with our neural-adaptive technology.
              </motion.p>
            </div>

            {/* Interaction Area (Subscription Form) */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.3, duration: 0.8 }}
              className="w-full max-w-md mx-auto px-2"
            >
              <div className="glass-card p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-20 group-hover:opacity-50 transition-opacity" />
                
                {isSuccess ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center py-4 space-y-3 text-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Access Granted</h3>
                    <p className="text-muted-foreground">Thanks for subscribing! We'll notify you when the neural link is established.</p>
                  </motion.div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative group/input">
                                <Input
                                  placeholder="Enter your email address..."
                                  className="bg-background/50 border-white/10 focus:border-primary/50 h-12 pl-4 pr-12 transition-all duration-300 rounded-xl"
                                  {...field}
                                  disabled={isPending}
                                />
                                <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover/input:opacity-100 pointer-events-none transition-opacity duration-300" />
                              </div>
                            </FormControl>
                            <FormMessage className="text-red-400 text-xs mt-1 ml-1" />
                          </FormItem>
                        )}
                      />
                      
                      <Button
                        type="submit"
                        disabled={isPending}
                        className="w-full h-12 rounded-xl text-base font-medium relative overflow-hidden group/btn bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {isPending ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              Notify Me <Send className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                            </>
                          )}
                        </span>
                      </Button>
                    </form>
                  </Form>
                )}
              </div>
            </motion.div>

            {/* Feature Highlights (Subtle) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6, duration: 1 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 md:gap-8 pt-6 sm:pt-8 max-w-3xl mx-auto px-2"
            >
              {[
                { icon: Brain, label: "Neural Search", labelAr: "بحث ذكي" },
                { icon: Cpu, label: "Adaptive AI", labelAr: "ذكاء متكيف" },
                { icon: Sparkles, label: "Smart Recall", labelAr: "استرجاع ذكي" },
                { icon: ChevronRight, label: "Early Access", labelAr: "وصول مبكر" },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1.5 sm:gap-2 text-muted-foreground/50 hover:text-primary/70 transition-colors duration-300 group cursor-default">
                  <div className="p-2 sm:p-3 rounded-full bg-white/5 group-hover:bg-primary/10 transition-colors">
                    <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider sm:tracking-widest">{item.label}</span>
                  <span className="text-[9px] sm:text-[10px] text-primary/60">{item.labelAr}</span>
                </div>
              ))}
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.7, duration: 0.8 }}
              className="flex flex-wrap justify-center gap-4 sm:gap-6 pt-6 text-muted-foreground/40"
            >
              <div className="flex items-center gap-2 text-xs">
                <Shield className="w-4 h-4" />
                <span>Enterprise Security</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Lock className="w-4 h-4" />
                <span>End-to-End Encryption</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Globe className="w-4 h-4" />
                <span>GDPR Compliant</span>
              </div>
            </motion.div>

            {/* GitHub Repository Stats */}
            {repoInfo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8, duration: 0.8 }}
                className="pt-6 sm:pt-8 px-2"
              >
                <a 
                  href={repoInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-4 px-4 sm:px-6 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-primary/30 transition-all duration-300 group"
                  data-testid="link-github-repo"
                >
                  <div className="flex items-center gap-2">
                    <Github className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-xs sm:text-sm text-muted-foreground group-hover:text-foreground transition-colors font-mono">
                      {repoInfo.fullName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground/70">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      {repoInfo.stars}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      {repoInfo.forks}
                    </span>
                  </div>
                </a>
              </motion.div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 py-6 text-center border-t border-white/5 bg-background/50 backdrop-blur-sm">
          <p className="text-sm text-muted-foreground font-mono">
            © {new Date().getFullYear()} SmartMemoryAI. All rights reserved.
          </p>
        </div>
      </motion.div>
    </>
  );
}
