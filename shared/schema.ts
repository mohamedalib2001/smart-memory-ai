import { pgTable, text, serial, timestamp, varchar, integer, boolean, jsonb, decimal, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Re-export auth models
export * from "./models/auth";

// Re-export chat models for AI integrations
export * from "./models/chat";

// ============================================
// Newsletter Subscribers (existing)
// ============================================
export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSubscriberSchema = createInsertSchema(subscribers).pick({
  email: true,
}).extend({
  email: z.string().email("Please enter a valid email address"),
});

export type Subscriber = typeof subscribers.$inferSelect;
export type InsertSubscriber = z.infer<typeof insertSubscriberSchema>;

// ============================================
// Subscription Plans
// ============================================
export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nameAr: varchar("name_ar", { length: 100 }),
  description: text("description"),
  descriptionAr: text("description_ar"),
  priceMonthly: decimal("price_monthly", { precision: 10, scale: 2 }).notNull(),
  priceYearly: decimal("price_yearly", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  features: jsonb("features").$type<string[]>().default([]),
  featuresAr: jsonb("features_ar").$type<string[]>().default([]),
  limits: jsonb("limits").$type<{
    maxDocuments: number;
    maxStorageGb: number;
    maxUsers: number;
    aiQueriesPerMonth: number;
    hasDigitalSignature: boolean;
    hasAdvancedAnalytics: boolean;
    hasApiAccess: boolean;
    hasWhitelabel: boolean;
  }>(),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  stripePriceIdMonthly: varchar("stripe_price_id_monthly", { length: 255 }),
  stripePriceIdYearly: varchar("stripe_price_id_yearly", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPlanSchema = createInsertSchema(plans).omit({ id: true, createdAt: true });
export type Plan = typeof plans.$inferSelect;
export type InsertPlan = z.infer<typeof insertPlanSchema>;

// ============================================
// Tenants (Organizations/Companies)
// ============================================
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("name_ar", { length: 255 }),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  logo: text("logo"),
  planId: integer("plan_id").references(() => plans.id),
  status: varchar("status", { length: 50 }).default("active"), // active, suspended, cancelled
  settings: jsonb("settings").$type<{
    locale: string;
    timezone: string;
    dateFormat: string;
    allowedDomains: string[];
  }>().default({ locale: "en", timezone: "UTC", dateFormat: "YYYY-MM-DD", allowedDomains: [] }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true, createdAt: true, updatedAt: true });
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;

// ============================================
// Subscriptions (Billing)
// ============================================
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  planId: integer("plan_id").references(() => plans.id).notNull(),
  status: varchar("status", { length: 50 }).default("active"), // active, trialing, past_due, cancelled, expired
  billingCycle: varchar("billing_cycle", { length: 20 }).default("monthly"), // monthly, yearly
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  trialEndsAt: timestamp("trial_ends_at"),
  cancelledAt: timestamp("cancelled_at"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  paypalSubscriptionId: varchar("paypal_subscription_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

// ============================================
// Invoices
// ============================================
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id).notNull(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending"), // pending, paid, failed, refunded
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  stripeInvoiceId: varchar("stripe_invoice_id", { length: 255 }),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true });
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

// ============================================
// Roles (Per Tenant)
// ============================================
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id),
  name: varchar("name", { length: 100 }).notNull(),
  nameAr: varchar("name_ar", { length: 100 }),
  description: text("description"),
  isSystem: boolean("is_system").default(false), // System roles can't be deleted
  permissions: jsonb("permissions").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRoleSchema = createInsertSchema(roles).omit({ id: true, createdAt: true });
export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

// ============================================
// Tenant Members (User-Tenant relationship)
// ============================================
export const tenantMembers = pgTable("tenant_members", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  roleId: integer("role_id").references(() => roles.id),
  status: varchar("status", { length: 50 }).default("active"), // active, invited, suspended
  invitedAt: timestamp("invited_at"),
  joinedAt: timestamp("joined_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_tenant_members_tenant").on(table.tenantId),
  index("idx_tenant_members_user").on(table.userId),
]);

export const insertTenantMemberSchema = createInsertSchema(tenantMembers).omit({ id: true, createdAt: true });
export type TenantMember = typeof tenantMembers.$inferSelect;
export type InsertTenantMember = z.infer<typeof insertTenantMemberSchema>;

// ============================================
// Projects
// ============================================
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("name_ar", { length: 255 }),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("active"),
  ownerId: varchar("owner_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_projects_tenant").on(table.tenantId),
]);

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true, updatedAt: true });
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

// ============================================
// Documents
// ============================================
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  projectId: integer("project_id").references(() => projects.id),
  title: varchar("title", { length: 500 }).notNull(),
  titleAr: varchar("title_ar", { length: 500 }),
  description: text("description"),
  type: varchar("type", { length: 50 }).default("document"), // contract, letter, memo, reminder, other
  status: varchar("status", { length: 50 }).default("draft"), // draft, active, archived, expired
  storagePath: text("storage_path"),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  checksum: varchar("checksum", { length: 64 }),
  version: integer("version").default(1),
  metadata: jsonb("metadata").$type<{
    tags: string[];
    categories: string[];
    parties: string[];
    startDate?: string;
    endDate?: string;
    value?: number;
    currency?: string;
  }>().default({ tags: [], categories: [], parties: [] }),
  uploadedBy: varchar("uploaded_by", { length: 255 }),
  signedBy: jsonb("signed_by").$type<string[]>().default([]),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_documents_tenant").on(table.tenantId),
  index("idx_documents_type").on(table.type),
  index("idx_documents_status").on(table.status),
]);

export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true, updatedAt: true });
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

// ============================================
// Document Versions
// ============================================
export const documentVersions = pgTable("document_versions", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  version: integer("version").notNull(),
  storagePath: text("storage_path").notNull(),
  fileSize: integer("file_size"),
  checksum: varchar("checksum", { length: 64 }),
  changeLog: text("change_log"),
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_doc_versions_document").on(table.documentId),
]);

export const insertDocumentVersionSchema = createInsertSchema(documentVersions).omit({ id: true, createdAt: true });
export type DocumentVersion = typeof documentVersions.$inferSelect;
export type InsertDocumentVersion = z.infer<typeof insertDocumentVersionSchema>;

// ============================================
// Document AI Metadata
// ============================================
export const documentAiMetadata = pgTable("document_ai_metadata", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull().unique(),
  summary: text("summary"),
  summaryAr: text("summary_ar"),
  extractedText: text("extracted_text"),
  entities: jsonb("entities").$type<{
    dates: string[];
    amounts: { value: number; currency: string }[];
    parties: string[];
    obligations: string[];
    penalties: string[];
  }>(),
  classification: varchar("classification", { length: 100 }),
  sentiment: varchar("sentiment", { length: 50 }),
  keyTerms: jsonb("key_terms").$type<string[]>().default([]),
  reminders: jsonb("reminders").$type<{
    date: string;
    description: string;
    priority: string;
  }[]>().default([]),
  embedding: jsonb("embedding").$type<number[]>(),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDocumentAiMetadataSchema = createInsertSchema(documentAiMetadata).omit({ id: true, createdAt: true, updatedAt: true });
export type DocumentAiMetadata = typeof documentAiMetadata.$inferSelect;
export type InsertDocumentAiMetadata = z.infer<typeof insertDocumentAiMetadataSchema>;

// ============================================
// Reminders
// ============================================
export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  documentId: integer("document_id").references(() => documents.id),
  title: varchar("title", { length: 255 }).notNull(),
  titleAr: varchar("title_ar", { length: 255 }),
  description: text("description"),
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high, critical
  dueDate: timestamp("due_date").notNull(),
  reminderDate: timestamp("reminder_date"),
  status: varchar("status", { length: 50 }).default("pending"), // pending, sent, acknowledged, completed, escalated
  assignedTo: varchar("assigned_to", { length: 255 }),
  channels: jsonb("channels").$type<string[]>().default(["email"]), // email, sms, whatsapp, slack, teams
  escalationLevel: integer("escalation_level").default(0),
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_reminders_tenant").on(table.tenantId),
  index("idx_reminders_due").on(table.dueDate),
]);

export const insertReminderSchema = createInsertSchema(reminders).omit({ id: true, createdAt: true, updatedAt: true });
export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;

// ============================================
// Notifications
// ============================================
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id),
  userId: varchar("user_id", { length: 255 }),
  type: varchar("type", { length: 50 }).notNull(), // reminder, alert, system, billing
  channel: varchar("channel", { length: 50 }).notNull(), // email, sms, whatsapp, slack, teams, in_app
  title: varchar("title", { length: 255 }).notNull(),
  titleAr: varchar("title_ar", { length: 255 }),
  message: text("message"),
  messageAr: text("message_ar"),
  payload: jsonb("payload"),
  status: varchar("status", { length: 50 }).default("pending"), // pending, sent, delivered, failed, read
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  readAt: timestamp("read_at"),
  retryCount: integer("retry_count").default(0),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_notifications_user").on(table.userId),
  index("idx_notifications_status").on(table.status),
]);

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// ============================================
// Audit Logs
// ============================================
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id),
  userId: varchar("user_id", { length: 255 }),
  action: varchar("action", { length: 100 }).notNull(), // create, read, update, delete, sign, approve, etc.
  entityType: varchar("entity_type", { length: 100 }).notNull(), // document, user, project, etc.
  entityId: varchar("entity_id", { length: 255 }),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_audit_tenant").on(table.tenantId),
  index("idx_audit_user").on(table.userId),
  index("idx_audit_entity").on(table.entityType, table.entityId),
]);

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// ============================================
// Integrations (External Services)
// ============================================
export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // slack, teams, whatsapp, google_calendar, etc.
  name: varchar("name", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).default("active"),
  config: jsonb("config"), // Encrypted credentials and settings
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertIntegrationSchema = createInsertSchema(integrations).omit({ id: true, createdAt: true, updatedAt: true });
export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;

// ============================================
// Webhook Events
// ============================================
export const webhookEvents = pgTable("webhook_events", {
  id: serial("id").primaryKey(),
  source: varchar("source", { length: 50 }).notNull(), // stripe, paypal, github, etc.
  eventType: varchar("event_type", { length: 100 }).notNull(),
  payload: jsonb("payload").notNull(),
  status: varchar("status", { length: 50 }).default("pending"), // pending, processed, failed
  processedAt: timestamp("processed_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWebhookEventSchema = createInsertSchema(webhookEvents).omit({ id: true, createdAt: true });
export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type InsertWebhookEvent = z.infer<typeof insertWebhookEventSchema>;

// ============================================
// Permission Constants
// ============================================
export const PERMISSIONS = {
  // Documents
  DOCUMENTS_VIEW: "documents:view",
  DOCUMENTS_CREATE: "documents:create",
  DOCUMENTS_EDIT: "documents:edit",
  DOCUMENTS_DELETE: "documents:delete",
  DOCUMENTS_SIGN: "documents:sign",
  DOCUMENTS_APPROVE: "documents:approve",
  
  // Projects
  PROJECTS_VIEW: "projects:view",
  PROJECTS_CREATE: "projects:create",
  PROJECTS_EDIT: "projects:edit",
  PROJECTS_DELETE: "projects:delete",
  
  // Users
  USERS_VIEW: "users:view",
  USERS_INVITE: "users:invite",
  USERS_MANAGE: "users:manage",
  
  // Billing
  BILLING_VIEW: "billing:view",
  BILLING_MANAGE: "billing:manage",
  
  // Settings
  SETTINGS_VIEW: "settings:view",
  SETTINGS_MANAGE: "settings:manage",
  
  // Analytics
  ANALYTICS_VIEW: "analytics:view",
  
  // AI
  AI_QUERY: "ai:query",
  AI_SUMMARIZE: "ai:summarize",
  
  // Admin
  ADMIN_FULL: "admin:full",
} as const;

export const DEFAULT_ROLES = {
  SUPER_ADMIN: {
    name: "Super Admin",
    nameAr: "المدير العام",
    permissions: Object.values(PERMISSIONS),
  },
  COMPANY_ADMIN: {
    name: "Company Admin",
    nameAr: "مدير الشركة",
    permissions: [
      PERMISSIONS.DOCUMENTS_VIEW, PERMISSIONS.DOCUMENTS_CREATE, PERMISSIONS.DOCUMENTS_EDIT,
      PERMISSIONS.DOCUMENTS_DELETE, PERMISSIONS.DOCUMENTS_SIGN, PERMISSIONS.DOCUMENTS_APPROVE,
      PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_CREATE, PERMISSIONS.PROJECTS_EDIT, PERMISSIONS.PROJECTS_DELETE,
      PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_INVITE, PERMISSIONS.USERS_MANAGE,
      PERMISSIONS.BILLING_VIEW, PERMISSIONS.BILLING_MANAGE,
      PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.SETTINGS_MANAGE,
      PERMISSIONS.ANALYTICS_VIEW,
      PERMISSIONS.AI_QUERY, PERMISSIONS.AI_SUMMARIZE,
    ],
  },
  LEGAL: {
    name: "Legal",
    nameAr: "القانوني",
    permissions: [
      PERMISSIONS.DOCUMENTS_VIEW, PERMISSIONS.DOCUMENTS_CREATE, PERMISSIONS.DOCUMENTS_EDIT,
      PERMISSIONS.DOCUMENTS_SIGN, PERMISSIONS.DOCUMENTS_APPROVE,
      PERMISSIONS.PROJECTS_VIEW,
      PERMISSIONS.AI_QUERY, PERMISSIONS.AI_SUMMARIZE,
    ],
  },
  MANAGER: {
    name: "Manager",
    nameAr: "مدير",
    permissions: [
      PERMISSIONS.DOCUMENTS_VIEW, PERMISSIONS.DOCUMENTS_CREATE, PERMISSIONS.DOCUMENTS_EDIT,
      PERMISSIONS.DOCUMENTS_APPROVE,
      PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_CREATE, PERMISSIONS.PROJECTS_EDIT,
      PERMISSIONS.USERS_VIEW,
      PERMISSIONS.ANALYTICS_VIEW,
      PERMISSIONS.AI_QUERY,
    ],
  },
  EMPLOYEE: {
    name: "Employee",
    nameAr: "موظف",
    permissions: [
      PERMISSIONS.DOCUMENTS_VIEW, PERMISSIONS.DOCUMENTS_CREATE,
      PERMISSIONS.PROJECTS_VIEW,
    ],
  },
} as const;
