import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Bell,
  Plus,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreVertical,
  Trash2,
  Edit,
  ChevronLeft,
  FileText,
  User,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Reminder {
  id: number;
  tenantId: number;
  documentId?: number;
  title: string;
  titleAr?: string;
  description?: string;
  priority: string;
  dueDate: string;
  reminderDate?: string;
  status: string;
  assignedTo?: string;
  channels?: string[];
  escalationLevel?: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

type Language = "en" | "ar";

const translations = {
  en: {
    title: "Reminders",
    subtitle: "Manage your reminders and deadlines",
    addNew: "Add Reminder",
    searchPlaceholder: "Search reminders...",
    noReminders: "No reminders yet",
    noRemindersDesc: "Create your first reminder to stay on track",
    reminderTitle: "Title",
    description: "Description",
    priority: "Priority",
    dueDate: "Due Date",
    reminderDate: "Reminder Date",
    assignedTo: "Assigned To",
    status: "Status",
    cancel: "Cancel",
    save: "Save",
    create: "Create",
    priorities: {
      low: "Low",
      medium: "Medium",
      high: "High",
      critical: "Critical",
    },
    statuses: {
      pending: "Pending",
      sent: "Sent",
      acknowledged: "Acknowledged",
      completed: "Completed",
      escalated: "Escalated",
    },
    tabs: {
      all: "All",
      pending: "Pending",
      completed: "Completed",
    },
    document: "Linked Document",
    channels: "Notification Channels",
    back: "Back",
    edit: "Edit",
    delete: "Delete",
    markComplete: "Mark Complete",
    overdue: "Overdue",
    upcoming: "Upcoming",
    dueToday: "Due Today",
    selectTenant: "Please select a company to view reminders",
    noCompanies: "Join or create a company to manage reminders",
  },
  ar: {
    title: "التذكيرات",
    subtitle: "إدارة التذكيرات والمواعيد النهائية",
    addNew: "إضافة تذكير",
    searchPlaceholder: "البحث في التذكيرات...",
    noReminders: "لا توجد تذكيرات",
    noRemindersDesc: "أنشئ أول تذكير للبقاء منظماً",
    reminderTitle: "العنوان",
    description: "الوصف",
    priority: "الأولوية",
    dueDate: "تاريخ الاستحقاق",
    reminderDate: "تاريخ التذكير",
    assignedTo: "مخصص لـ",
    status: "الحالة",
    cancel: "إلغاء",
    save: "حفظ",
    create: "إنشاء",
    priorities: {
      low: "منخفضة",
      medium: "متوسطة",
      high: "عالية",
      critical: "حرجة",
    },
    statuses: {
      pending: "قيد الانتظار",
      sent: "تم الإرسال",
      acknowledged: "تم الإقرار",
      completed: "مكتمل",
      escalated: "تم التصعيد",
    },
    tabs: {
      all: "الكل",
      pending: "قيد الانتظار",
      completed: "مكتمل",
    },
    document: "الوثيقة المرتبطة",
    channels: "قنوات الإشعار",
    back: "رجوع",
    edit: "تعديل",
    delete: "حذف",
    markComplete: "تم الإكمال",
    overdue: "متأخر",
    upcoming: "قادم",
    dueToday: "مستحق اليوم",
    selectTenant: "الرجاء اختيار شركة لعرض التذكيرات",
    noCompanies: "انضم أو أنشئ شركة لإدارة التذكيرات",
  },
};

export default function Reminders() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [language, setLanguage] = useState<Language>("en");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    titleAr: "",
    description: "",
    priority: "medium",
    dueDate: "",
    reminderDate: "",
    assignedTo: "",
  });

  const t = translations[language];
  const dir = language === "ar" ? "rtl" : "ltr";

  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);

  const { data: tenants = [] } = useQuery<any[]>({
    queryKey: ["/api/tenants/my"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (tenants.length > 0 && !selectedTenantId) {
      setSelectedTenantId(tenants[0].id);
    }
  }, [tenants, selectedTenantId]);

  const { data: remindersData, isLoading } = useQuery<{ reminders: Reminder[] }>({
    queryKey: ["/api/reminders", selectedTenantId],
    queryFn: async () => {
      const res = await fetch(`/api/reminders?tenantId=${selectedTenantId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch reminders");
      return res.json();
    },
    enabled: !!selectedTenantId && isAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", `/api/reminders?tenantId=${selectedTenantId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders", selectedTenantId] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: language === "en" ? "Reminder created" : "تم إنشاء التذكير" });
    },
    onError: () => {
      toast({ title: language === "en" ? "Failed to create reminder" : "فشل إنشاء التذكير", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Reminder> }) => {
      return apiRequest("PATCH", `/api/reminders/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders", selectedTenantId] });
      setEditingReminder(null);
      setIsDialogOpen(false);
      resetForm();
      toast({ title: language === "en" ? "Reminder updated" : "تم تحديث التذكير" });
    },
    onError: () => {
      toast({ title: language === "en" ? "Failed to update reminder" : "فشل تحديث التذكير", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/reminders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders", selectedTenantId] });
      toast({ title: language === "en" ? "Reminder deleted" : "تم حذف التذكير" });
    },
    onError: () => {
      toast({ title: language === "en" ? "Failed to delete reminder" : "فشل حذف التذكير", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      titleAr: "",
      description: "",
      priority: "medium",
      dueDate: "",
      reminderDate: "",
      assignedTo: "",
    });
    setEditingReminder(null);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.dueDate) {
      toast({ title: language === "en" ? "Title and due date are required" : "العنوان وتاريخ الاستحقاق مطلوبان", variant: "destructive" });
      return;
    }

    if (editingReminder) {
      updateMutation.mutate({ id: editingReminder.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title,
      titleAr: reminder.titleAr || "",
      description: reminder.description || "",
      priority: reminder.priority,
      dueDate: reminder.dueDate.split("T")[0],
      reminderDate: reminder.reminderDate ? reminder.reminderDate.split("T")[0] : "",
      assignedTo: reminder.assignedTo || "",
    });
    setIsDialogOpen(true);
  };

  const handleMarkComplete = (reminder: Reminder) => {
    updateMutation.mutate({ id: reminder.id, data: { status: "completed" } });
  };

  const reminders = remindersData?.reminders || [];

  const filteredReminders = reminders.filter((reminder) => {
    const matchesSearch = reminder.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reminder.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedTab === "pending") {
      return matchesSearch && reminder.status !== "completed";
    }
    if (selectedTab === "completed") {
      return matchesSearch && reminder.status === "completed";
    }
    return matchesSearch;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "escalated": return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const isDueToday = (dueDate: string) => {
    return new Date(dueDate).toDateString() === new Date().toDateString();
  };

  const stats = {
    total: reminders.length,
    pending: reminders.filter(r => r.status !== "completed").length,
    overdue: reminders.filter(r => isOverdue(r.dueDate) && r.status !== "completed").length,
    completed: reminders.filter(r => r.status === "completed").length,
  };

  if (!selectedTenantId) {
    return (
      <div className="min-h-screen bg-background p-6" dir={dir}>
        <div className="max-w-7xl mx-auto">
          <Card className="text-center p-12">
            <Bell className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t.noCompanies}</h2>
            <p className="text-muted-foreground">{t.selectTenant}</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.location.href = "/"}
                data-testid="button-back"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{t.title}</h1>
                <p className="text-muted-foreground">{t.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Select
                value={selectedTenantId?.toString() || ""}
                onValueChange={(v) => setSelectedTenantId(Number(v))}
              >
                <SelectTrigger className="w-48" data-testid="select-tenant">
                  <SelectValue placeholder={language === "en" ? "Select company" : "اختر الشركة"} />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant: any) => (
                    <SelectItem key={tenant.id} value={tenant.id.toString()}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanguage(language === "en" ? "ar" : "en")}
                data-testid="button-toggle-language"
              >
                {language === "en" ? "العربية" : "English"}
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-reminder">
                    <Plus className="w-4 h-4 mr-2" />
                    {t.addNew}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingReminder ? t.edit : t.addNew}</DialogTitle>
                    <DialogDescription>
                      {language === "en" ? "Fill in the reminder details" : "أدخل تفاصيل التذكير"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>{t.reminderTitle} (EN)</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Enter title..."
                        data-testid="input-reminder-title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t.reminderTitle} (AR)</Label>
                      <Input
                        value={formData.titleAr}
                        onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                        placeholder="أدخل العنوان..."
                        dir="rtl"
                        data-testid="input-reminder-title-ar"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t.description}</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder={language === "en" ? "Add description..." : "أضف وصفاً..."}
                        data-testid="input-reminder-description"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t.priority}</Label>
                        <Select
                          value={formData.priority}
                          onValueChange={(value) => setFormData({ ...formData, priority: value })}
                        >
                          <SelectTrigger data-testid="select-priority">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">{t.priorities.low}</SelectItem>
                            <SelectItem value="medium">{t.priorities.medium}</SelectItem>
                            <SelectItem value="high">{t.priorities.high}</SelectItem>
                            <SelectItem value="critical">{t.priorities.critical}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t.assignedTo}</Label>
                        <Input
                          value={formData.assignedTo}
                          onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                          placeholder="user@email.com"
                          data-testid="input-assigned-to"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t.dueDate}</Label>
                        <Input
                          type="date"
                          value={formData.dueDate}
                          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                          data-testid="input-due-date"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t.reminderDate}</Label>
                        <Input
                          type="date"
                          value={formData.reminderDate}
                          onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
                          data-testid="input-reminder-date"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline" data-testid="button-cancel-reminder">{t.cancel}</Button>
                    </DialogClose>
                    <Button 
                      onClick={handleSubmit} 
                      disabled={createMutation.isPending || updateMutation.isPending}
                      data-testid="button-save-reminder"
                    >
                      {editingReminder ? t.save : t.create}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{language === "en" ? "Total" : "الإجمالي"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t.tabs.pending}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t.overdue}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t.tabs.completed}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="relative flex-1 max-w-md">
                <Input
                  placeholder={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-reminders"
                />
                <Bell className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList>
                  <TabsTrigger value="all" data-testid="tab-all">{t.tabs.all}</TabsTrigger>
                  <TabsTrigger value="pending" data-testid="tab-pending">{t.tabs.pending}</TabsTrigger>
                  <TabsTrigger value="completed" data-testid="tab-completed">{t.tabs.completed}</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <Clock className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : filteredReminders.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t.noReminders}</h3>
                <p className="text-muted-foreground">{t.noRemindersDesc}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className={`flex items-center justify-between p-4 border rounded-lg hover-elevate ${
                      reminder.status === "completed" ? "opacity-60" : ""
                    }`}
                    data-testid={`reminder-item-${reminder.id}`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {getStatusIcon(reminder.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`font-medium ${reminder.status === "completed" ? "line-through" : ""}`}>
                            {language === "ar" && reminder.titleAr ? reminder.titleAr : reminder.title}
                          </h4>
                          <Badge variant={getPriorityColor(reminder.priority)}>
                            {t.priorities[reminder.priority as keyof typeof t.priorities] || reminder.priority}
                          </Badge>
                          {isOverdue(reminder.dueDate) && reminder.status !== "completed" && (
                            <Badge variant="destructive">{t.overdue}</Badge>
                          )}
                          {isDueToday(reminder.dueDate) && reminder.status !== "completed" && (
                            <Badge variant="outline">{t.dueToday}</Badge>
                          )}
                        </div>
                        {reminder.description && (
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {reminder.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(reminder.dueDate).toLocaleDateString()}
                          </span>
                          {reminder.assignedTo && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {reminder.assignedTo}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`button-reminder-menu-${reminder.id}`}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {reminder.status !== "completed" && (
                          <DropdownMenuItem onClick={() => handleMarkComplete(reminder)} data-testid={`button-complete-${reminder.id}`}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {t.markComplete}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleEdit(reminder)} data-testid={`button-edit-${reminder.id}`}>
                          <Edit className="w-4 h-4 mr-2" />
                          {t.edit}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteMutation.mutate(reminder.id)}
                          className="text-destructive"
                          data-testid={`button-delete-${reminder.id}`}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t.delete}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
