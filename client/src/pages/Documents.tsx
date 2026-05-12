import { useState, useRef } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Upload,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Download,
  Trash2,
  Clock,
  History,
  Tag,
  Folder,
  Plus,
  ChevronLeft,
  FileWarning,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Loader2,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Document {
  id: number;
  tenantId: number;
  projectId?: number;
  title: string;
  titleAr?: string;
  description?: string;
  type: string;
  status: string;
  storagePath?: string;
  fileSize?: number;
  mimeType?: string;
  checksum?: string;
  version: number;
  metadata?: {
    tags?: string[];
    categories?: string[];
    parties?: string[];
    startDate?: string;
    endDate?: string;
    value?: number;
    currency?: string;
  };
  uploadedBy?: string;
  signedBy?: string[];
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface DocumentVersion {
  id: number;
  documentId: number;
  version: number;
  storagePath: string;
  fileSize?: number;
  checksum?: string;
  changeLog?: string;
  createdBy?: string;
  createdAt: string;
}

type Language = "en" | "ar";

const translations = {
  en: {
    title: "Document Management",
    subtitle: "Upload, organize, and manage your documents with version control",
    uploadNew: "Upload Document",
    searchPlaceholder: "Search documents...",
    filterByType: "Filter by type",
    allTypes: "All Types",
    totalDocuments: "Total Documents",
    activeDocuments: "Active",
    archivedDocuments: "Archived",
    draftDocuments: "Drafts",
    noDocuments: "No documents yet",
    noDocumentsDesc: "Start by uploading your first document",
    documentTitle: "Document Title",
    documentDescription: "Description",
    documentType: "Document Type",
    documentStatus: "Status",
    uploadFile: "Upload File",
    dragDrop: "Drag and drop or click to browse",
    supportedFormats: "Supported: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG",
    cancel: "Cancel",
    upload: "Upload",
    save: "Save",
    types: {
      document: "Document",
      contract: "Contract",
      letter: "Letter",
      memo: "Memo",
      reminder: "Reminder",
      other: "Other",
    },
    statuses: {
      draft: "Draft",
      active: "Active",
      archived: "Archived",
      expired: "Expired",
    },
    versionHistory: "Version History",
    version: "Version",
    uploadedBy: "Uploaded by",
    changeLog: "Change Log",
    noVersions: "No version history",
    tags: "Tags",
    addTag: "Add tag...",
    expiryDate: "Expiry Date",
    back: "Back",
    viewDetails: "View Details",
    download: "Download",
    delete: "Delete",
    archive: "Archive",
    uploadNewVersion: "Upload New Version",
    selectTenant: "Please select a company to view documents",
    noCompanies: "Join or create a company to manage documents",
  },
  ar: {
    title: "إدارة الوثائق",
    subtitle: "رفع وتنظيم وإدارة الوثائق مع التحكم بالإصدارات",
    uploadNew: "رفع وثيقة",
    searchPlaceholder: "البحث في الوثائق...",
    filterByType: "تصفية حسب النوع",
    allTypes: "جميع الأنواع",
    totalDocuments: "إجمالي الوثائق",
    activeDocuments: "نشطة",
    archivedDocuments: "مؤرشفة",
    draftDocuments: "مسودات",
    noDocuments: "لا توجد وثائق بعد",
    noDocumentsDesc: "ابدأ برفع أول وثيقة",
    documentTitle: "عنوان الوثيقة",
    documentDescription: "الوصف",
    documentType: "نوع الوثيقة",
    documentStatus: "الحالة",
    uploadFile: "رفع الملف",
    dragDrop: "اسحب وأفلت أو انقر للاستعراض",
    supportedFormats: "المدعوم: PDF، DOC، DOCX، XLS، XLSX، JPG، PNG",
    cancel: "إلغاء",
    upload: "رفع",
    save: "حفظ",
    types: {
      document: "مستند",
      contract: "عقد",
      letter: "خطاب",
      memo: "مذكرة",
      reminder: "تذكير",
      other: "أخرى",
    },
    statuses: {
      draft: "مسودة",
      active: "نشط",
      archived: "مؤرشف",
      expired: "منتهي",
    },
    versionHistory: "سجل الإصدارات",
    version: "الإصدار",
    uploadedBy: "رفع بواسطة",
    changeLog: "سجل التغييرات",
    noVersions: "لا يوجد سجل إصدارات",
    tags: "الوسوم",
    addTag: "إضافة وسم...",
    expiryDate: "تاريخ الانتهاء",
    back: "رجوع",
    viewDetails: "عرض التفاصيل",
    download: "تنزيل",
    delete: "حذف",
    archive: "أرشفة",
    uploadNewVersion: "رفع إصدار جديد",
    selectTenant: "الرجاء اختيار شركة لعرض الوثائق",
    noCompanies: "انضم أو أنشئ شركة لإدارة الوثائق",
  },
};

function formatFileSize(bytes?: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString();
}

function getStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "bg-green-500/10 text-green-500";
    case "draft":
      return "bg-yellow-500/10 text-yellow-500";
    case "archived":
      return "bg-gray-500/10 text-gray-500";
    case "expired":
      return "bg-red-500/10 text-red-500";
    default:
      return "bg-blue-500/10 text-blue-500";
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case "contract":
      return <FileText className="w-5 h-5 text-primary" />;
    case "letter":
      return <FileText className="w-5 h-5 text-blue-500" />;
    case "memo":
      return <FileText className="w-5 h-5 text-purple-500" />;
    default:
      return <FileText className="w-5 h-5 text-muted-foreground" />;
  }
}

export default function Documents() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [lang] = useState<Language>("en");
  const t = translations[lang];
  
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadType, setUploadType] = useState("document");
  const [uploadTags, setUploadTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  const { data: tenants = [] } = useQuery<any[]>({
    queryKey: ["/api/tenants/my"],
    enabled: isAuthenticated,
  });

  const { data: documentsData, isLoading: documentsLoading } = useQuery<{ documents: Document[] }>({
    queryKey: ["/api/documents", { tenantId: selectedTenantId }],
    queryFn: async () => {
      const res = await fetch(`/api/documents?tenantId=${selectedTenantId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch documents");
      return res.json();
    },
    enabled: !!selectedTenantId,
  });

  const documents = documentsData?.documents || [];

  const { data: versionsData } = useQuery<{ versions: DocumentVersion[] }>({
    queryKey: ["/api/documents", selectedDocument?.id, "versions"],
    queryFn: async () => {
      const res = await fetch(`/api/documents/${selectedDocument?.id}/versions`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch versions");
      return res.json();
    },
    enabled: !!selectedDocument,
  });

  const versions = versionsData?.versions || [];

  const uploadMutation = useMutation({
    mutationFn: async (docData: { title: string; description: string; type: string; tags: string[] }) => {
      const response = await fetch(`/api/documents?tenantId=${selectedTenantId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(docData),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents", { tenantId: selectedTenantId }] });
      toast({ title: "Success", description: "Document created successfully" });
      resetUploadForm();
      setIsUploadOpen(false);
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to create document" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Document> }) => {
      return apiRequest("PATCH", `/api/documents/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents", { tenantId: selectedTenantId }] });
      toast({ title: "Success", description: "Document updated successfully" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to update document" });
    },
  });

  const classifyMutation = useMutation({
    mutationFn: async (data: { title: string; description: string }) => {
      const response = await fetch("/api/documents/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Classification failed");
      return response.json();
    },
    onSuccess: (data: { type: string; suggestedTags: string[]; priority: string; summary: string }) => {
      setUploadType(data.type || "document");
      if (data.suggestedTags?.length > 0) {
        setUploadTags(data.suggestedTags);
      }
      if (data.summary && !uploadDescription) {
        setUploadDescription(data.summary);
      }
      toast({ title: "AI Classification", description: `Detected as: ${data.type}` });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to classify document" });
    },
  });

  function handleAutoClassify() {
    if (!uploadTitle) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a document title first" });
      return;
    }
    classifyMutation.mutate({ title: uploadTitle, description: uploadDescription });
  }

  function resetUploadForm() {
    setUploadFile(null);
    setUploadTitle("");
    setUploadDescription("");
    setUploadType("document");
    setUploadTags([]);
    setNewTag("");
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      if (!uploadTitle) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  }

  function handleUpload() {
    if (!uploadTitle || !selectedTenantId) return;
    
    uploadMutation.mutate({
      title: uploadTitle,
      description: uploadDescription,
      type: uploadType,
      tags: uploadTags,
    });
  }

  function handleAddTag() {
    if (newTag.trim() && !uploadTags.includes(newTag.trim())) {
      setUploadTags([...uploadTags, newTag.trim()]);
      setNewTag("");
    }
  }

  function handleRemoveTag(tag: string) {
    setUploadTags(uploadTags.filter((t) => t !== tag));
  }

  function handleArchive(doc: Document) {
    updateMutation.mutate({ id: doc.id, data: { status: "archived" } });
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || doc.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: documents.length,
    active: documents.filter((d) => d.status === "active").length,
    archived: documents.filter((d) => d.status === "archived").length,
    draft: documents.filter((d) => d.status === "draft").length,
  };

  if (!tenants.length) {
    return (
      <div className="min-h-screen bg-background p-8" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="max-w-4xl mx-auto text-center py-20">
          <FileWarning className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t.noCompanies}</h2>
          <Button onClick={() => window.location.href = "/dashboard"}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            {t.back}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={lang === "ar" ? "rtl" : "ltr"}>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => window.location.href = "/dashboard"}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{t.title}</h1>
              <p className="text-sm text-muted-foreground">{t.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select
              value={selectedTenantId?.toString() || ""}
              onValueChange={(v) => setSelectedTenantId(Number(v))}
            >
              <SelectTrigger className="w-48" data-testid="select-tenant">
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id.toString()}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-upload-document" disabled={!selectedTenantId}>
                  <Upload className="w-4 h-4 mr-2" />
                  {t.uploadNew}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{t.uploadNew}</DialogTitle>
                  <DialogDescription>{t.dragDrop}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover-elevate"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="upload-dropzone"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    />
                    {uploadFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span>{uploadFile.name}</span>
                        <span className="text-muted-foreground">({formatFileSize(uploadFile.size)})</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">{t.supportedFormats}</p>
                      </>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>{t.documentTitle}</Label>
                    <Input
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder={t.documentTitle}
                      data-testid="input-document-title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t.documentDescription}</Label>
                    <Textarea
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      placeholder={t.documentDescription}
                      data-testid="input-document-description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t.documentType}</Label>
                      <Select value={uploadType} onValueChange={setUploadType}>
                        <SelectTrigger data-testid="select-document-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(t.types).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>AI Classification</Label>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAutoClassify}
                        disabled={!uploadTitle || classifyMutation.isPending}
                        className="w-full"
                        data-testid="button-auto-classify"
                      >
                        {classifyMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        Auto-Classify
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t.tags}</Label>
                    <div className="flex gap-2 flex-wrap mb-2">
                      {uploadTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder={t.addTag}
                        onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                        data-testid="input-add-tag"
                      />
                      <Button type="button" variant="secondary" onClick={handleAddTag}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="ghost">{t.cancel}</Button>
                  </DialogClose>
                  <Button
                    onClick={handleUpload}
                    disabled={!uploadTitle || uploadMutation.isPending}
                    data-testid="button-confirm-upload"
                  >
                    {uploadMutation.isPending ? "..." : t.upload}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {!selectedTenantId ? (
          <Card className="text-center py-16">
            <CardContent>
              <Folder className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">{t.selectTenant}</h3>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-sm text-muted-foreground">{t.totalDocuments}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.active}</p>
                    <p className="text-sm text-muted-foreground">{t.activeDocuments}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-500/10">
                    <Folder className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.archived}</p>
                    <p className="text-sm text-muted-foreground">{t.archivedDocuments}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.draft}</p>
                    <p className="text-sm text-muted-foreground">{t.draftDocuments}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-documents"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48" data-testid="select-type-filter">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder={t.filterByType} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allTypes}</SelectItem>
                  {Object.entries(t.types).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {documentsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-20 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredDocuments.length === 0 ? (
              <Card className="text-center py-16">
                <CardContent>
                  <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t.noDocuments}</h3>
                  <p className="text-muted-foreground mb-4">{t.noDocumentsDesc}</p>
                  <Button onClick={() => setIsUploadOpen(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    {t.uploadNew}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDocuments.map((doc) => (
                  <Card
                    key={doc.id}
                    className="hover-elevate cursor-pointer"
                    onClick={() => setSelectedDocument(doc)}
                    data-testid={`card-document-${doc.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getTypeIcon(doc.type)}
                          <div>
                            <h3 className="font-medium line-clamp-1">{doc.title}</h3>
                            <p className="text-xs text-muted-foreground">
                              v{doc.version} • {formatFileSize(doc.fileSize)}
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedDocument(doc); }}>
                              <Eye className="w-4 h-4 mr-2" /> {t.viewDetails}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleArchive(doc); }}>
                              <Folder className="w-4 h-4 mr-2" /> {t.archive}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {doc.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {doc.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <Badge className={getStatusColor(doc.status)}>
                          {t.statuses[doc.status as keyof typeof t.statuses] || doc.status}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDate(doc.createdAt)}
                        </div>
                      </div>

                      {doc.metadata?.tags && doc.metadata.tags.length > 0 && (
                        <div className="flex items-center gap-1 mt-3 flex-wrap">
                          <Tag className="w-3 h-3 text-muted-foreground" />
                          {doc.metadata.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {doc.metadata.tags.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{doc.metadata.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
        <DialogContent className="max-w-2xl">
          {selectedDocument && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getTypeIcon(selectedDocument.type)}
                  {selectedDocument.title}
                </DialogTitle>
                <DialogDescription>
                  {t.types[selectedDocument.type as keyof typeof t.types]} • v{selectedDocument.version}
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="details">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="details">{t.viewDetails}</TabsTrigger>
                  <TabsTrigger value="versions">{t.versionHistory}</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">{t.documentStatus}</Label>
                      <Badge className={getStatusColor(selectedDocument.status)}>
                        {t.statuses[selectedDocument.status as keyof typeof t.statuses]}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">{t.documentType}</Label>
                      <p>{t.types[selectedDocument.type as keyof typeof t.types]}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">File Size</Label>
                      <p>{formatFileSize(selectedDocument.fileSize)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">{t.expiryDate}</Label>
                      <p>{formatDate(selectedDocument.expiresAt)}</p>
                    </div>
                  </div>

                  {selectedDocument.description && (
                    <div>
                      <Label className="text-muted-foreground">{t.documentDescription}</Label>
                      <p>{selectedDocument.description}</p>
                    </div>
                  )}

                  {selectedDocument.metadata?.tags && selectedDocument.metadata.tags.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground">{t.tags}</Label>
                      <div className="flex gap-2 flex-wrap mt-1">
                        {selectedDocument.metadata.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="versions">
                  <ScrollArea className="h-64">
                    {versions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <History className="w-8 h-8 mx-auto mb-2" />
                        <p>{t.noVersions}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {versions.map((version) => (
                          <Card key={version.id}>
                            <CardContent className="p-3 flex items-center justify-between">
                              <div>
                                <p className="font-medium">{t.version} {version.version}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(version.createdAt)} • {formatFileSize(version.fileSize)}
                                </p>
                                {version.changeLog && (
                                  <p className="text-sm text-muted-foreground mt-1">{version.changeLog}</p>
                                )}
                              </div>
                              <Button variant="ghost" size="icon">
                                <Download className="w-4 h-4" />
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setSelectedDocument(null)}>
                  {t.cancel}
                </Button>
                <Button variant="secondary">
                  <Download className="w-4 h-4 mr-2" />
                  {t.download}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
