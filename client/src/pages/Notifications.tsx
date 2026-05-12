import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Bell,
  Check,
  CheckCheck,
  ChevronLeft,
  Loader2,
  AlertCircle,
  CreditCard,
  FileText,
  Clock,
  Mail,
  Trash2,
  MailOpen,
} from "lucide-react";

interface Notification {
  id: number;
  tenantId?: number;
  userId?: string;
  type: string;
  channel: string;
  title: string;
  titleAr?: string;
  message?: string;
  messageAr?: string;
  payload?: any;
  status: string;
  scheduledFor?: string;
  sentAt?: string;
  readAt?: string;
  createdAt: string;
}

type Language = "en" | "ar";

const translations = {
  en: {
    title: "Notifications",
    subtitle: "Stay updated with your latest alerts and messages",
    all: "All",
    unread: "Unread",
    read: "Read",
    noNotifications: "No notifications",
    noNotificationsDesc: "You're all caught up!",
    markAllRead: "Mark all as read",
    markAsRead: "Mark as read",
    delete: "Delete",
    back: "Back",
    types: {
      billing: "Billing",
      document: "Document",
      reminder: "Reminder",
      alert: "Alert",
      system: "System",
    },
    channels: {
      in_app: "In-App",
      email: "Email",
      sms: "SMS",
      whatsapp: "WhatsApp",
      slack: "Slack",
    },
  },
  ar: {
    title: "الإشعارات",
    subtitle: "ابق على اطلاع بآخر التنبيهات والرسائل",
    all: "الكل",
    unread: "غير مقروء",
    read: "مقروء",
    noNotifications: "لا توجد إشعارات",
    noNotificationsDesc: "أنت محدث!",
    markAllRead: "تحديد الكل كمقروء",
    markAsRead: "تحديد كمقروء",
    delete: "حذف",
    back: "رجوع",
    types: {
      billing: "الفواتير",
      document: "الوثائق",
      reminder: "التذكيرات",
      alert: "التنبيهات",
      system: "النظام",
    },
    channels: {
      in_app: "داخل التطبيق",
      email: "بريد إلكتروني",
      sms: "رسالة نصية",
      whatsapp: "واتساب",
      slack: "سلاك",
    },
  },
};

function getNotificationIcon(type: string) {
  switch (type) {
    case "billing":
      return <CreditCard className="w-5 h-5 text-green-500" />;
    case "document":
      return <FileText className="w-5 h-5 text-blue-500" />;
    case "reminder":
      return <Clock className="w-5 h-5 text-yellow-500" />;
    case "alert":
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    default:
      return <Bell className="w-5 h-5 text-primary" />;
  }
}

function getChannelIcon(channel: string) {
  switch (channel) {
    case "email":
      return <Mail className="w-4 h-4" />;
    default:
      return <Bell className="w-4 h-4" />;
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Notifications() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [lang] = useState<Language>("en");
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState("all");

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: isAuthenticated,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PATCH", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", "/api/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: "Success", description: "All notifications marked as read" });
    },
  });

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "unread") return n.status !== "read";
    if (activeTab === "read") return n.status === "read";
    return true;
  });

  const unreadCount = notifications.filter((n) => n.status !== "read").length;

  return (
    <div className="min-h-screen bg-background" dir={lang === "ar" ? "rtl" : "ltr"}>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => (window.location.href = "/dashboard")}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                {t.title}
              </h1>
              <p className="text-sm text-muted-foreground">{t.subtitle}</p>
            </div>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              data-testid="button-mark-all-read"
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              {t.markAllRead}
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all">
              {t.all}
              <Badge variant="secondary" className="ml-2">
                {notifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread" data-testid="tab-unread">
              {t.unread}
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="read" data-testid="tab-read">
              {t.read}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <MailOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">{t.noNotifications}</h3>
              <p className="text-muted-foreground">{t.noNotificationsDesc}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`hover-elevate transition-all ${
                  notification.status !== "read" ? "border-l-4 border-l-primary" : ""
                }`}
                data-testid={`notification-card-${notification.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-muted">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4
                          className={`font-medium ${
                            notification.status !== "read" ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {lang === "ar" && notification.titleAr ? notification.titleAr : notification.title}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {getChannelIcon(notification.channel)}
                          <span className="ml-1">
                            {t.channels[notification.channel as keyof typeof t.channels] || notification.channel}
                          </span>
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {t.types[notification.type as keyof typeof t.types] || notification.type}
                        </Badge>
                      </div>
                      {notification.message && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {lang === "ar" && notification.messageAr ? notification.messageAr : notification.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">{formatDate(notification.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {notification.status !== "read" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsReadMutation.mutate(notification.id)}
                          disabled={markAsReadMutation.isPending}
                          data-testid={`button-mark-read-${notification.id}`}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      ) : (
                        <CheckCheck className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
