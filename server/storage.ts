import { db } from "./db";
import { 
  subscribers, type InsertSubscriber, type Subscriber,
  plans, type Plan, type InsertPlan,
  tenants, type Tenant, type InsertTenant,
  subscriptions, type Subscription, type InsertSubscription,
  tenantMembers, type TenantMember, type InsertTenantMember,
  roles, type Role, type InsertRole,
  documents, type Document, type InsertDocument,
  documentVersions, type DocumentVersion, type InsertDocumentVersion,
  projects, type Project, type InsertProject,
  reminders, type Reminder, type InsertReminder,
  notifications, type Notification, type InsertNotification,
  auditLogs, type AuditLog, type InsertAuditLog,
  invoices, type Invoice, type InsertInvoice,
  users,
  DEFAULT_ROLES,
} from "@shared/schema";
import { eq, desc, and, sql, count } from "drizzle-orm";

export interface IStorage {
  // Subscribers
  createSubscriber(subscriber: InsertSubscriber): Promise<Subscriber>;
  getSubscriberByEmail(email: string): Promise<Subscriber | undefined>;
  
  // Plans
  getPlans(): Promise<Plan[]>;
  getPlan(id: number): Promise<Plan | undefined>;
  createPlan(plan: InsertPlan): Promise<Plan>;
  
  // Tenants
  getTenant(id: number): Promise<Tenant | undefined>;
  getTenantsByUserId(userId: string): Promise<Tenant[]>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  createTenantWithOwner(tenant: InsertTenant, userId: string): Promise<Tenant>;
  updateTenant(id: number, tenant: Partial<InsertTenant>): Promise<Tenant | undefined>;
  
  // Tenant Members
  getTenantMember(tenantId: number, userId: string): Promise<TenantMember | undefined>;
  getTenantMembers(tenantId: number): Promise<TenantMember[]>;
  addTenantMember(member: InsertTenantMember): Promise<TenantMember>;
  
  // Roles
  getRoles(tenantId: number): Promise<Role[]>;
  createRole(role: InsertRole): Promise<Role>;
  
  // Documents
  getDocuments(tenantId: number): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(doc: InsertDocument): Promise<Document>;
  updateDocument(id: number, doc: Partial<InsertDocument>): Promise<Document | undefined>;
  
  // Document Versions
  getDocumentVersions(documentId: number): Promise<DocumentVersion[]>;
  createDocumentVersion(version: InsertDocumentVersion): Promise<DocumentVersion>;
  
  // Projects
  getProjects(tenantId: number): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  
  // Reminders
  getReminders(tenantId: number): Promise<Reminder[]>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  updateReminder(id: number, data: Partial<InsertReminder>): Promise<Reminder>;
  deleteReminder(id: number): Promise<void>;
  getReminder(id: number): Promise<Reminder | undefined>;
  
  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  
  // Audit Logs
  getAuditLogs(tenantId: number, limit?: number): Promise<AuditLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  
  // Subscriptions
  getSubscription(tenantId: number): Promise<Subscription | undefined>;
  createSubscription(sub: InsertSubscription): Promise<Subscription>;
  
  // Invoices
  getInvoices(tenantId: number): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  
  // Dashboard Stats
  getDashboardStats(tenantId: number): Promise<{
    totalDocuments: number;
    totalProjects: number;
    pendingReminders: number;
    recentActivity: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // ============================================
  // Subscribers
  // ============================================
  async createSubscriber(insertSubscriber: InsertSubscriber): Promise<Subscriber> {
    const [subscriber] = await db
      .insert(subscribers)
      .values(insertSubscriber)
      .returning();
    return subscriber;
  }

  async getSubscriberByEmail(email: string): Promise<Subscriber | undefined> {
    const [subscriber] = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.email, email));
    return subscriber;
  }

  // ============================================
  // Plans
  // ============================================
  async getPlans(): Promise<Plan[]> {
    return db.select().from(plans).where(eq(plans.isActive, true)).orderBy(plans.sortOrder);
  }

  async getPlan(id: number): Promise<Plan | undefined> {
    const [plan] = await db.select().from(plans).where(eq(plans.id, id));
    return plan;
  }

  async createPlan(plan: InsertPlan): Promise<Plan> {
    const [created] = await db.insert(plans).values(plan as any).returning();
    return created;
  }

  // ============================================
  // Tenants
  // ============================================
  async getTenant(id: number): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant;
  }

  async getTenantsByUserId(userId: string): Promise<Tenant[]> {
    const members = await db
      .select({ tenantId: tenantMembers.tenantId })
      .from(tenantMembers)
      .where(eq(tenantMembers.userId, userId));
    
    if (members.length === 0) return [];
    
    const tenantIds = members.map(m => m.tenantId);
    const result = await db
      .select()
      .from(tenants)
      .where(sql`${tenants.id} IN ${tenantIds}`);
    return result;
  }

  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    const [created] = await db.insert(tenants).values(tenant as any).returning();
    return created;
  }

  async createTenantWithOwner(tenant: InsertTenant, userId: string): Promise<Tenant> {
    // Create tenant
    const [created] = await db.insert(tenants).values(tenant as any).returning();
    
    // Create admin role for this tenant
    const [adminRole] = await db.insert(roles).values({
      tenantId: created.id,
      name: DEFAULT_ROLES.COMPANY_ADMIN.name,
      nameAr: DEFAULT_ROLES.COMPANY_ADMIN.nameAr,
      permissions: [...DEFAULT_ROLES.COMPANY_ADMIN.permissions],
      isSystem: true,
    } as any).returning();
    
    // Create default roles
    for (const [key, roleData] of Object.entries(DEFAULT_ROLES)) {
      if (key !== 'COMPANY_ADMIN' && key !== 'SUPER_ADMIN') {
        await db.insert(roles).values({
          tenantId: created.id,
          name: roleData.name,
          nameAr: roleData.nameAr,
          permissions: roleData.permissions as string[],
          isSystem: true,
        });
      }
    }
    
    // Add user as admin member
    await db.insert(tenantMembers).values({
      tenantId: created.id,
      userId,
      roleId: adminRole.id,
      status: "active",
      joinedAt: new Date(),
    });
    
    return created;
  }

  async updateTenant(id: number, tenant: Partial<InsertTenant>): Promise<Tenant | undefined> {
    const [updated] = await db
      .update(tenants)
      .set({ ...tenant, updatedAt: new Date() } as any)
      .where(eq(tenants.id, id))
      .returning();
    return updated;
  }

  // ============================================
  // Tenant Members
  // ============================================
  async getTenantMember(tenantId: number, userId: string): Promise<TenantMember | undefined> {
    const [member] = await db
      .select()
      .from(tenantMembers)
      .where(and(eq(tenantMembers.tenantId, tenantId), eq(tenantMembers.userId, userId)));
    return member;
  }

  async getTenantMembers(tenantId: number): Promise<TenantMember[]> {
    return db.select().from(tenantMembers).where(eq(tenantMembers.tenantId, tenantId));
  }

  async addTenantMember(member: InsertTenantMember): Promise<TenantMember> {
    const [created] = await db.insert(tenantMembers).values(member).returning();
    return created;
  }

  // ============================================
  // Roles
  // ============================================
  async getRoles(tenantId: number): Promise<Role[]> {
    return db.select().from(roles).where(eq(roles.tenantId, tenantId));
  }

  async createRole(role: InsertRole): Promise<Role> {
    const [created] = await db.insert(roles).values(role as any).returning();
    return created;
  }

  // ============================================
  // Documents
  // ============================================
  async getDocuments(tenantId: number): Promise<Document[]> {
    return db.select().from(documents).where(eq(documents.tenantId, tenantId)).orderBy(desc(documents.createdAt));
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    return doc;
  }

  async createDocument(doc: InsertDocument): Promise<Document> {
    const [created] = await db.insert(documents).values(doc as any).returning();
    return created;
  }

  async updateDocument(id: number, doc: Partial<InsertDocument>): Promise<Document | undefined> {
    const [updated] = await db
      .update(documents)
      .set({ ...doc, updatedAt: new Date() } as any)
      .where(eq(documents.id, id))
      .returning();
    return updated;
  }

  // ============================================
  // Document Versions
  // ============================================
  async getDocumentVersions(documentId: number): Promise<DocumentVersion[]> {
    return db.select().from(documentVersions).where(eq(documentVersions.documentId, documentId)).orderBy(desc(documentVersions.version));
  }

  async createDocumentVersion(version: InsertDocumentVersion): Promise<DocumentVersion> {
    const [created] = await db.insert(documentVersions).values(version).returning();
    return created;
  }

  // ============================================
  // Projects
  // ============================================
  async getProjects(tenantId: number): Promise<Project[]> {
    return db.select().from(projects).where(eq(projects.tenantId, tenantId)).orderBy(desc(projects.createdAt));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [created] = await db.insert(projects).values(project).returning();
    return created;
  }

  // ============================================
  // Reminders
  // ============================================
  async getReminders(tenantId: number): Promise<Reminder[]> {
    return db.select().from(reminders).where(eq(reminders.tenantId, tenantId)).orderBy(reminders.dueDate);
  }

  async createReminder(reminder: InsertReminder): Promise<Reminder> {
    const [created] = await db.insert(reminders).values(reminder as any).returning();
    return created;
  }

  async getReminder(id: number): Promise<Reminder | undefined> {
    const [reminder] = await db.select().from(reminders).where(eq(reminders.id, id));
    return reminder;
  }

  async updateReminder(id: number, data: Partial<InsertReminder>): Promise<Reminder> {
    const [updated] = await db.update(reminders).set({ ...data, updatedAt: new Date() }).where(eq(reminders.id, id)).returning();
    return updated;
  }

  async deleteReminder(id: number): Promise<void> {
    await db.delete(reminders).where(eq(reminders.id, id));
  }

  // ============================================
  // Notifications
  // ============================================
  async getNotifications(userId: string): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db.update(notifications).set({ status: "read", readAt: new Date() }).where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({ status: "read", readAt: new Date() })
      .where(and(eq(notifications.userId, userId), sql`${notifications.status} != 'read'`));
  }

  // ============================================
  // Audit Logs
  // ============================================
  async getAuditLogs(tenantId: number, limit = 50): Promise<AuditLog[]> {
    return db.select().from(auditLogs).where(eq(auditLogs.tenantId, tenantId)).orderBy(desc(auditLogs.createdAt)).limit(limit);
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db.insert(auditLogs).values(log).returning();
    return created;
  }

  // ============================================
  // Subscriptions
  // ============================================
  async getSubscription(tenantId: number): Promise<Subscription | undefined> {
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.tenantId, tenantId));
    return sub;
  }

  async createSubscription(sub: InsertSubscription): Promise<Subscription> {
    const [created] = await db.insert(subscriptions).values(sub).returning();
    return created;
  }

  // ============================================
  // Invoices
  // ============================================
  async getInvoices(tenantId: number): Promise<Invoice[]> {
    return db.select().from(invoices).where(eq(invoices.tenantId, tenantId)).orderBy(desc(invoices.createdAt));
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [created] = await db.insert(invoices).values(invoice).returning();
    return created;
  }

  // ============================================
  // Dashboard Stats
  // ============================================
  async getDashboardStats(tenantId: number): Promise<{
    totalDocuments: number;
    totalProjects: number;
    pendingReminders: number;
    recentActivity: number;
  }> {
    const [docsCount] = await db.select({ count: count() }).from(documents).where(eq(documents.tenantId, tenantId));
    const [projectsCount] = await db.select({ count: count() }).from(projects).where(eq(projects.tenantId, tenantId));
    const [remindersCount] = await db.select({ count: count() }).from(reminders).where(and(eq(reminders.tenantId, tenantId), eq(reminders.status, "pending")));
    const [activityCount] = await db.select({ count: count() }).from(auditLogs).where(eq(auditLogs.tenantId, tenantId));
    
    return {
      totalDocuments: docsCount.count,
      totalProjects: projectsCount.count,
      pendingReminders: remindersCount.count,
      recentActivity: activityCount.count,
    };
  }

  // ============================================
  // Stripe Data Queries (from stripe schema)
  // ============================================
  async getStripeProduct(productId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.products WHERE id = ${productId}`
    );
    return (result as any).rows?.[0] || null;
  }

  async listStripeProducts(active = true, limit = 20, offset = 0) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.products WHERE active = ${active} LIMIT ${limit} OFFSET ${offset}`
    );
    return (result as any).rows || [];
  }

  async listStripeProductsWithPrices(active = true, limit = 20, offset = 0) {
    const result = await db.execute(
      sql`
        WITH paginated_products AS (
          SELECT id, name, description, metadata, active
          FROM stripe.products
          WHERE active = ${active}
          ORDER BY id
          LIMIT ${limit} OFFSET ${offset}
        )
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.active as product_active,
          p.metadata as product_metadata,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.recurring,
          pr.active as price_active,
          pr.metadata as price_metadata
        FROM paginated_products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        ORDER BY p.id, pr.unit_amount
      `
    );
    return (result as any).rows || [];
  }

  async getStripePrice(priceId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.prices WHERE id = ${priceId}`
    );
    return (result as any).rows?.[0] || null;
  }

  async listStripePrices(active = true, limit = 20, offset = 0) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.prices WHERE active = ${active} LIMIT ${limit} OFFSET ${offset}`
    );
    return (result as any).rows || [];
  }

  async getStripePricesForProduct(productId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.prices WHERE product = ${productId} AND active = true`
    );
    return (result as any).rows || [];
  }

  async getStripeSubscription(subscriptionId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.subscriptions WHERE id = ${subscriptionId}`
    );
    return (result as any).rows?.[0] || null;
  }

  async getStripeCustomer(customerId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.customers WHERE id = ${customerId}`
    );
    return (result as any).rows?.[0] || null;
  }

  // ============================================
  // User Operations (for Stripe integration)
  // ============================================
  async getUserById(userId: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user;
  }

  async updateUserStripeInfo(userId: string, stripeInfo: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  }) {
    const updateData: Record<string, any> = {};
    if (stripeInfo.stripeCustomerId) {
      updateData.stripeCustomerId = stripeInfo.stripeCustomerId;
    }
    if (stripeInfo.stripeSubscriptionId) {
      updateData.stripeSubscriptionId = stripeInfo.stripeSubscriptionId;
    }
    
    if (Object.keys(updateData).length > 0) {
      await db.update(users).set(updateData).where(eq(users.id, userId));
    }
    
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user;
  }
}

export const storage = new DatabaseStorage();
