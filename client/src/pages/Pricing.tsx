import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Check, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface Plan {
  id: number;
  name: string;
  nameAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  priceMonthly: string;
  priceYearly: string;
  currency: string;
  features: string[];
  featuresAr: string[];
  limits: {
    maxDocuments: number;
    maxStorageGb: number;
    maxUsers: number;
    aiQueriesPerMonth: number;
    hasDigitalSignature: boolean;
    hasAdvancedAnalytics: boolean;
    hasApiAccess: boolean;
    hasWhitelabel: boolean;
  } | null;
}

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  
  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ["/api/plans"],
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/">
            <a className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="p-2 rounded-lg bg-primary/10">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold">SmartMemoryAI</h1>
                <p className="text-xs text-muted-foreground">Pricing Plans</p>
              </div>
            </a>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href="/">
                <Button variant="outline" size="sm" data-testid="button-back-dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              <a href="/api/login">
                <Button data-testid="button-login">Get Started</Button>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/10 blur-[100px]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-4" variant="outline">Simple Pricing</Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Choose Your <span className="text-primary">Plan</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-2">
              Start free, upgrade when you need. No hidden fees.
            </p>
            <p className="text-primary font-arabic">
              ابدأ مجاناً، قم بالترقية عند الحاجة. لا رسوم مخفية.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-1/2 mb-2" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-10 bg-muted rounded w-1/3 mb-4" />
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="h-4 bg-muted rounded" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Default Plans if none in database */}
              {[
                {
                  name: "Free",
                  nameAr: "مجاني",
                  price: "0",
                  description: "Perfect for getting started",
                  features: ["Up to 50 documents", "1 user", "Basic search", "Email support"],
                  popular: false,
                },
                {
                  name: "Business",
                  nameAr: "أعمال",
                  price: "49",
                  description: "For growing teams",
                  features: ["Unlimited documents", "Up to 10 users", "AI-powered search", "Priority support", "Advanced analytics", "Digital signatures"],
                  popular: true,
                },
                {
                  name: "Enterprise",
                  nameAr: "مؤسسات",
                  price: "199",
                  description: "For large organizations",
                  features: ["Everything in Business", "Unlimited users", "Custom integrations", "Dedicated support", "SLA guarantee", "White-label options"],
                  popular: false,
                },
              ].map((plan, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                >
                  <Card className={`relative h-full ${plan.popular ? "border-primary shadow-lg shadow-primary/10" : ""}`}>
                    {plan.popular && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                        Most Popular
                      </Badge>
                    )}
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {plan.name}
                        <span className="text-sm font-normal text-muted-foreground">{plan.nameAr}</span>
                      </CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-6">
                        <span className="text-4xl font-bold">${plan.price}</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                      <ul className="space-y-3">
                        {plan.features.map((feature, fIdx) => (
                          <li key={fIdx} className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-primary flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <a href="/api/login" className="w-full">
                        <Button 
                          className="w-full" 
                          variant={plan.popular ? "default" : "outline"}
                          data-testid={`button-select-plan-${idx}`}
                        >
                          Get Started
                        </Button>
                      </a>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.map((plan, idx) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {plan.name}
                        {plan.nameAr && (
                          <span className="text-sm font-normal text-muted-foreground">{plan.nameAr}</span>
                        )}
                      </CardTitle>
                      {plan.description && (
                        <CardDescription>{plan.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="mb-6">
                        <span className="text-4xl font-bold">${plan.priceMonthly}</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                      {plan.features && plan.features.length > 0 && (
                        <ul className="space-y-3">
                          {plan.features.map((feature, fIdx) => (
                            <li key={fIdx} className="flex items-center gap-2 text-sm">
                              <Check className="w-4 h-4 text-primary flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                    <CardFooter>
                      <a href="/api/login" className="w-full">
                        <Button className="w-full" data-testid={`button-select-plan-${plan.id}`}>
                          Get Started
                        </Button>
                      </a>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-card/50 border-t border-border/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
            {[
              {
                q: "Can I change my plan later?",
                qAr: "هل يمكنني تغيير خطتي لاحقاً؟",
                a: "Yes, you can upgrade or downgrade your plan at any time.",
              },
              {
                q: "Is there a free trial?",
                qAr: "هل هناك نسخة تجريبية مجانية؟",
                a: "Yes, all paid plans come with a 14-day free trial.",
              },
              {
                q: "What payment methods do you accept?",
                qAr: "ما طرق الدفع المقبولة؟",
                a: "We accept all major credit cards, PayPal, and bank transfers.",
              },
              {
                q: "Can I cancel anytime?",
                qAr: "هل يمكنني الإلغاء في أي وقت؟",
                a: "Yes, you can cancel your subscription at any time with no penalties.",
              },
            ].map((faq, idx) => (
              <Card key={idx} className="text-left">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{faq.q}</CardTitle>
                  <p className="text-sm text-primary/70">{faq.qAr}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center border-t border-border/50">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} SmartMemoryAI. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
