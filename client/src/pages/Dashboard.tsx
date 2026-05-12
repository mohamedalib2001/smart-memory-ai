import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import NotificationsDropdown from "@/components/NotificationsDropdown";
import { 
  Brain, 
  FileText, 
  FolderOpen, 
  Bell, 
  Activity, 
  Plus, 
  Settings, 
  LogOut,
  Building2,
  Users,
  CreditCard
} from "lucide-react";

interface Tenant {
  id: number;
  name: string;
  nameAr: string | null;
  slug: string;
  logo: string | null;
  status: string;
}

export default function Dashboard() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "Please log in to access the dashboard.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, isLoading]);

  const { data: tenants = [], isLoading: tenantsLoading } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants/my"],
    enabled: isAuthenticated,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  const userName = user?.firstName || user?.email?.split("@")[0] || "User";
  const userInitials = userName.substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">SmartMemoryAI</h1>
              <p className="text-xs text-muted-foreground">Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationsDropdown />
            <Button variant="ghost" size="icon" data-testid="button-settings">
              <Settings className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 pl-3 border-l border-border">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{userName}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => logout()}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            Welcome back, <span className="text-primary">{userName}</span>
          </h2>
          <p className="text-muted-foreground">
            Manage your organizations and documents from here.
          </p>
        </div>

        {/* Organizations Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Your Organizations
            </h3>
            <Button size="sm" data-testid="button-create-org">
              <Plus className="w-4 h-4 mr-1" />
              New Organization
            </Button>
          </div>

          {tenantsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-5 bg-muted rounded w-1/2 mb-2" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : tenants.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-medium mb-2">No Organizations Yet</h4>
                <p className="text-muted-foreground mb-4">
                  Create your first organization to start managing documents.
                </p>
                <Button data-testid="button-create-first-org">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Organization
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tenants.map((tenant) => (
                <Card 
                  key={tenant.id} 
                  className="hover-elevate cursor-pointer group"
                  data-testid={`card-tenant-${tenant.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{tenant.name}</CardTitle>
                          {tenant.nameAr && (
                            <CardDescription className="text-xs">{tenant.nameAr}</CardDescription>
                          )}
                        </div>
                      </div>
                      <Badge variant={tenant.status === "active" ? "default" : "secondary"}>
                        {tenant.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" /> 0 docs
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" /> 1 member
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: FileText, label: "Manage Documents", labelAr: "إدارة الوثائق", href: "/documents" },
              { icon: FolderOpen, label: "New Project", labelAr: "مشروع جديد", href: "#" },
              { icon: Bell, label: "Reminders", labelAr: "التذكيرات", href: "/reminders" },
              { icon: CreditCard, label: "Upgrade Plan", labelAr: "ترقية الخطة", href: "/pricing" },
            ].map((action, idx) => (
              <Card 
                key={idx} 
                className="hover-elevate cursor-pointer group text-center py-6"
                data-testid={`card-action-${idx}`}
                onClick={() => window.location.href = action.href}
              >
                <CardContent className="p-0">
                  <action.icon className="w-8 h-8 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />
                  <p className="font-medium text-sm">{action.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{action.labelAr}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Activity Feed */}
        <section>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Recent Activity
          </h3>
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity to display.</p>
              <p className="text-sm mt-1">Your actions will appear here.</p>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
