import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { getRepoInfo } from "./github";
import { syncToGitHub } from "./sync-github";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Setup authentication BEFORE other routes
  await setupAuth(app);
  registerAuthRoutes(app);
  
  // Newsletter subscription (public)
  app.post(api.subscribers.create.path, async (req, res) => {
    try {
      const input = api.subscribers.create.input.parse(req.body);
      
      const existing = await storage.getSubscriberByEmail(input.email);
      if (existing) {
        return res.status(409).json({ message: "Email already subscribed" });
      }

      const subscriber = await storage.createSubscriber(input);
      res.status(201).json(subscriber);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GitHub repo info endpoint (public)
  app.get("/api/github/repo", async (req, res) => {
    try {
      const repoInfo = await getRepoInfo("mohamedalib2001", "SmartMemoryAI");
      res.json(repoInfo);
    } catch (err) {
      console.error("GitHub API error:", err);
      res.status(500).json({ message: "Failed to fetch repository info" });
    }
  });

  // GitHub sync endpoint (public for now)
  app.post("/api/github/sync", async (req, res) => {
    try {
      const result = await syncToGitHub();
      res.json(result);
    } catch (err) {
      console.error("GitHub sync error:", err);
      res.status(500).json({ message: "Failed to sync to GitHub" });
    }
  });

  // ============================================
  // Plans (public)
  // ============================================
  app.get("/api/plans", async (req, res) => {
    try {
      const plans = await storage.getPlans();
      res.json(plans);
    } catch (err) {
      console.error("Error fetching plans:", err);
      res.status(500).json({ message: "Failed to fetch plans" });
    }
  });

  // ============================================
  // Tenant Management (protected)
  // ============================================
  app.get("/api/tenants/my", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tenants = await storage.getTenantsByUserId(userId);
      res.json(tenants);
    } catch (err) {
      console.error("Error fetching tenants:", err);
      res.status(500).json({ message: "Failed to fetch tenants" });
    }
  });

  app.post("/api/tenants", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tenant = await storage.createTenantWithOwner(req.body, userId);
      res.status(201).json(tenant);
    } catch (err) {
      console.error("Error creating tenant:", err);
      res.status(500).json({ message: "Failed to create tenant" });
    }
  });

  app.get("/api/tenants/:id", isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Check user has access to this tenant
      const member = await storage.getTenantMember(tenantId, userId);
      if (!member) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const tenant = await storage.getTenant(tenantId);
      res.json(tenant);
    } catch (err) {
      console.error("Error fetching tenant:", err);
      res.status(500).json({ message: "Failed to fetch tenant" });
    }
  });

  // ============================================
  // Documents (protected)
  // ============================================
  app.get("/api/tenants/:tenantId/documents", isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      const userId = req.user.claims.sub;
      
      const member = await storage.getTenantMember(tenantId, userId);
      if (!member) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const documents = await storage.getDocuments(tenantId);
      res.json(documents);
    } catch (err) {
      console.error("Error fetching documents:", err);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/tenants/:tenantId/documents", isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      const userId = req.user.claims.sub;
      
      const member = await storage.getTenantMember(tenantId, userId);
      if (!member) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const document = await storage.createDocument({
        ...req.body,
        tenantId,
        uploadedBy: userId,
      });
      
      // Log the action
      await storage.createAuditLog({
        tenantId,
        userId,
        action: "create",
        entityType: "document",
        entityId: document.id.toString(),
        newValue: document,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });
      
      res.status(201).json(document);
    } catch (err) {
      console.error("Error creating document:", err);
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  // ============================================
  // Projects (protected)
  // ============================================
  app.get("/api/tenants/:tenantId/projects", isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      const userId = req.user.claims.sub;
      
      const member = await storage.getTenantMember(tenantId, userId);
      if (!member) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const projects = await storage.getProjects(tenantId);
      res.json(projects);
    } catch (err) {
      console.error("Error fetching projects:", err);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post("/api/tenants/:tenantId/projects", isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      const userId = req.user.claims.sub;
      
      const member = await storage.getTenantMember(tenantId, userId);
      if (!member) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const project = await storage.createProject({
        ...req.body,
        tenantId,
        ownerId: userId,
      });
      res.status(201).json(project);
    } catch (err) {
      console.error("Error creating project:", err);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  // ============================================
  // Dashboard Stats (protected)
  // ============================================
  app.get("/api/tenants/:tenantId/stats", isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      const userId = req.user.claims.sub;
      
      const member = await storage.getTenantMember(tenantId, userId);
      if (!member) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const stats = await storage.getDashboardStats(tenantId);
      res.json(stats);
    } catch (err) {
      console.error("Error fetching stats:", err);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // ============================================
  // Audit Logs (protected - admin only)
  // ============================================
  app.get("/api/tenants/:tenantId/audit-logs", isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      const userId = req.user.claims.sub;
      
      const member = await storage.getTenantMember(tenantId, userId);
      if (!member) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const logs = await storage.getAuditLogs(tenantId, parseInt(req.query.limit) || 50);
      res.json(logs);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // ============================================
  // Notifications (protected)
  // ============================================
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ success: true });
    } catch (err) {
      console.error("Error marking notification as read:", err);
      res.status(500).json({ message: "Failed to update notification" });
    }
  });

  app.patch("/api/notifications/read-all", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      res.status(500).json({ message: "Failed to update notifications" });
    }
  });

  app.post("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type, channel, title, titleAr, message, messageAr, tenantId } = req.body;
      
      const notification = await storage.createNotification({
        userId,
        tenantId,
        type: type || "system",
        channel: channel || "in_app",
        title,
        titleAr,
        message,
        messageAr,
        status: "pending",
      });
      
      res.status(201).json(notification);
    } catch (err) {
      console.error("Error creating notification:", err);
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  // ============================================
  // Reminders (protected)
  // ============================================
  app.get("/api/reminders", isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = parseInt(req.query.tenantId);
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID required" });
      }
      
      const userId = req.user.claims.sub;
      const member = await storage.getTenantMember(tenantId, userId);
      if (!member) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const reminders = await storage.getReminders(tenantId);
      res.json({ reminders });
    } catch (err) {
      console.error("Error fetching reminders:", err);
      res.status(500).json({ message: "Failed to fetch reminders" });
    }
  });

  app.post("/api/reminders", isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = parseInt(req.query.tenantId);
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID required" });
      }
      
      const userId = req.user.claims.sub;
      const member = await storage.getTenantMember(tenantId, userId);
      if (!member) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { title, titleAr, description, priority, dueDate, reminderDate, assignedTo, channels, documentId } = req.body;
      
      const reminder = await storage.createReminder({
        tenantId,
        title,
        titleAr,
        description,
        priority: priority || "medium",
        dueDate: new Date(dueDate),
        reminderDate: reminderDate ? new Date(reminderDate) : undefined,
        assignedTo,
        channels: channels || ["email"],
        documentId: documentId ? parseInt(documentId) : undefined,
        createdBy: userId,
      });
      
      res.status(201).json(reminder);
    } catch (err) {
      console.error("Error creating reminder:", err);
      res.status(500).json({ message: "Failed to create reminder" });
    }
  });

  app.patch("/api/reminders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const reminderId = parseInt(req.params.id);
      const reminder = await storage.getReminder(reminderId);
      
      if (!reminder) {
        return res.status(404).json({ message: "Reminder not found" });
      }
      
      const userId = req.user.claims.sub;
      const member = await storage.getTenantMember(reminder.tenantId, userId);
      if (!member) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { title, titleAr, description, priority, dueDate, reminderDate, status, assignedTo } = req.body;
      
      const updated = await storage.updateReminder(reminderId, {
        title,
        titleAr,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        reminderDate: reminderDate ? new Date(reminderDate) : undefined,
        status,
        assignedTo,
      });
      
      res.json(updated);
    } catch (err) {
      console.error("Error updating reminder:", err);
      res.status(500).json({ message: "Failed to update reminder" });
    }
  });

  app.delete("/api/reminders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const reminderId = parseInt(req.params.id);
      const reminder = await storage.getReminder(reminderId);
      
      if (!reminder) {
        return res.status(404).json({ message: "Reminder not found" });
      }
      
      const userId = req.user.claims.sub;
      const member = await storage.getTenantMember(reminder.tenantId, userId);
      if (!member) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteReminder(reminderId);
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting reminder:", err);
      res.status(500).json({ message: "Failed to delete reminder" });
    }
  });

  // ============================================
  // Documents (protected)
  // ============================================
  app.get("/api/documents", isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = parseInt(req.query.tenantId);
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID required" });
      }
      
      const userId = req.user.claims.sub;
      const member = await storage.getTenantMember(tenantId, userId);
      if (!member) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const documents = await storage.getDocuments(tenantId);
      res.json({ documents });
    } catch (err) {
      console.error("Error fetching documents:", err);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get("/api/documents/:id", isAuthenticated, async (req: any, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      const userId = req.user.claims.sub;
      const member = await storage.getTenantMember(document.tenantId, userId);
      if (!member) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(document);
    } catch (err) {
      console.error("Error fetching document:", err);
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  app.post("/api/documents", isAuthenticated, async (req: any, res) => {
    try {
      const tenantId = parseInt(req.query.tenantId);
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID required" });
      }
      
      const userId = req.user.claims.sub;
      const member = await storage.getTenantMember(tenantId, userId);
      if (!member) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { title, description, type, tags } = req.body;
      
      const document = await storage.createDocument({
        tenantId,
        title,
        description,
        type: type || "document",
        status: "draft",
        uploadedBy: userId,
        metadata: { tags: Array.isArray(tags) ? tags : [], categories: [], parties: [] },
        version: 1,
      });
      
      await storage.createAuditLog({
        tenantId,
        userId,
        action: "document.create",
        entityType: "document",
        entityId: document.id.toString(),
        metadata: { title, type },
      });
      
      res.status(201).json(document);
    } catch (err) {
      console.error("Error creating document:", err);
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  app.patch("/api/documents/:id", isAuthenticated, async (req: any, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      const userId = req.user.claims.sub;
      const member = await storage.getTenantMember(document.tenantId, userId);
      if (!member) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updated = await storage.updateDocument(documentId, req.body);
      
      await storage.createAuditLog({
        tenantId: document.tenantId,
        userId,
        action: "document.update",
        entityType: "document",
        entityId: documentId.toString(),
        newValue: req.body,
      });
      
      res.json(updated);
    } catch (err) {
      console.error("Error updating document:", err);
      res.status(500).json({ message: "Failed to update document" });
    }
  });

  app.get("/api/documents/:id/versions", isAuthenticated, async (req: any, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      const userId = req.user.claims.sub;
      const member = await storage.getTenantMember(document.tenantId, userId);
      if (!member) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const versions = await storage.getDocumentVersions(documentId);
      res.json({ versions });
    } catch (err) {
      console.error("Error fetching versions:", err);
      res.status(500).json({ message: "Failed to fetch versions" });
    }
  });

  // ============================================
  // AI Document Classification
  // ============================================
  app.post("/api/documents/classify", isAuthenticated, async (req: any, res) => {
    try {
      const { title, description, content } = req.body;
      
      if (!title) {
        return res.status(400).json({ message: "Document title is required" });
      }
      
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a document classification assistant for SmartMemoryAI. Analyze the document and provide classification in JSON format.
Categories to classify into: contract, letter, memo, invoice, report, proposal, agreement, certificate, receipt, other
Priority levels: low, medium, high, critical
Return JSON with: { "type": string, "suggestedTags": string[], "priority": string, "summary": string, "summaryAr": string }`
          },
          {
            role: "user",
            content: `Classify this document:
Title: ${title}
${description ? `Description: ${description}` : ""}
${content ? `Content preview: ${content.substring(0, 500)}` : ""}`
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 500,
      });
      
      const classification = JSON.parse(response.choices[0]?.message?.content || "{}");
      
      res.json({
        type: classification.type || "document",
        suggestedTags: classification.suggestedTags || [],
        priority: classification.priority || "medium",
        summary: classification.summary || "",
        summaryAr: classification.summaryAr || "",
      });
    } catch (err) {
      console.error("Error classifying document:", err);
      res.status(500).json({ message: "Failed to classify document" });
    }
  });

  // ============================================
  // Stripe Products & Checkout
  // ============================================
  app.get("/api/stripe/products", async (req, res) => {
    try {
      const rows = await storage.listStripeProductsWithPrices();
      
      const productsMap = new Map();
      for (const row of rows) {
        if (!productsMap.has(row.product_id)) {
          productsMap.set(row.product_id, {
            id: row.product_id,
            name: row.product_name,
            description: row.product_description,
            active: row.product_active,
            metadata: row.product_metadata,
            prices: []
          });
        }
        if (row.price_id) {
          productsMap.get(row.product_id).prices.push({
            id: row.price_id,
            unit_amount: row.unit_amount,
            currency: row.currency,
            recurring: row.recurring,
            active: row.price_active,
          });
        }
      }
      
      res.json({ data: Array.from(productsMap.values()) });
    } catch (err) {
      console.error("Error fetching Stripe products:", err);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/stripe/prices", async (req, res) => {
    try {
      const prices = await storage.listStripePrices();
      res.json({ data: prices });
    } catch (err) {
      console.error("Error fetching Stripe prices:", err);
      res.status(500).json({ message: "Failed to fetch prices" });
    }
  });

  app.post("/api/stripe/checkout", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { priceId, tenantId } = req.body;
      
      if (!priceId) {
        return res.status(400).json({ message: "Price ID is required" });
      }
      
      const { getUncachableStripeClient } = await import("./stripeClient");
      const stripe = await getUncachableStripeClient();
      
      const user = await storage.getUserById(userId);
      
      let customerId = user?.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user?.email || undefined,
          metadata: { userId },
        });
        customerId = customer.id;
        await storage.updateUserStripeInfo(userId, { stripeCustomerId: customerId });
      }
      
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${req.protocol}://${req.get('host')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get('host')}/pricing`,
        metadata: { tenantId: tenantId?.toString() || '' },
      });
      
      res.json({ url: session.url });
    } catch (err) {
      console.error("Error creating checkout session:", err);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  app.post("/api/stripe/portal", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserById(userId);
      
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ message: "No Stripe customer found" });
      }
      
      const { getUncachableStripeClient } = await import("./stripeClient");
      const stripe = await getUncachableStripeClient();
      
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${req.protocol}://${req.get('host')}/`,
      });
      
      res.json({ url: session.url });
    } catch (err) {
      console.error("Error creating portal session:", err);
      res.status(500).json({ message: "Failed to create portal session" });
    }
  });

  app.get("/api/stripe/publishable-key", async (req, res) => {
    try {
      const { getStripePublishableKey } = await import("./stripeClient");
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (err) {
      console.error("Error fetching publishable key:", err);
      res.status(500).json({ message: "Failed to fetch publishable key" });
    }
  });

  return httpServer;
}
