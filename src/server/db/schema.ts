import { freePricingPlan } from "@/config/pricing";
import { relations, sql } from "drizzle-orm";
import { bigint } from "drizzle-orm/mysql-core";
import {
    boolean,
    index,
    integer,
    jsonb,
    pgEnum,
    pgTableCreator,
    primaryKey,
    text,
    timestamp,
    unique,
    varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { type AdapterAccount } from "next-auth/adapters";
import { json } from "stream/consumers";
import { z } from "zod";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator(
    (name) => `sg_${name}`,
);

export const usersRoleEnum = pgEnum("role", ["User", "Admin", "Super Admin"]);


export const users = createTable("user", {
    id: varchar("id", { length: 255 }).notNull().primaryKey(),
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 255 }).notNull(),
    emailVerified: timestamp("emailVerified", {
        mode: "date",
    }).default(sql`CURRENT_TIMESTAMP`),
    image: varchar("image", { length: 255 }),
    role: usersRoleEnum("role").default("User").notNull(),
    isNewUser: boolean("isNewUser").default(true).notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
    accounts: many(accounts),
    membersToOrganizations: many(membersToOrganizations),
    feedback: many(feedback),
}));

export const userInsertSchema = createInsertSchema(users, {
    name: z
        .string()
        .trim()
        .min(3, "Name must be at least 3 characters long")
        .max(50, "Name must be at most 50 characters long"),
    email: z.string().email(),
    image: z.string().url(),
});

export const accounts = createTable(
    "account",
    {
        userId: varchar("userId", { length: 255 })
            .notNull()
            .references(() => users.id),
        type: varchar("type", { length: 255 })
            .$type<AdapterAccount["type"]>()
            .notNull(),
        provider: varchar("provider", { length: 255 }).notNull(),
        providerAccountId: varchar("providerAccountId", {
            length: 255,
        }).notNull(),
        refresh_token: text("refresh_token"),
        access_token: text("access_token"),
        expires_at: integer("expires_at"),
        token_type: varchar("token_type", { length: 255 }),
        scope: varchar("scope", { length: 255 }),
        id_token: text("id_token"),
        session_state: varchar("session_state", { length: 255 }),
    },
    (account) => ({
        compoundKey: primaryKey({
            columns: [account.provider, account.providerAccountId],
        }),
        userIdIdx: index("account_userId_idx").on(account.userId),
    }),
);

export const accountsRelations = relations(accounts, ({ one }) => ({
    user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
    "session",
    {
        sessionToken: varchar("sessionToken", { length: 255 })
            .notNull()
            .primaryKey(),
        userId: varchar("userId", { length: 255 })
            .notNull()
            .references(() => users.id),
        expires: timestamp("expires", { mode: "date" }).notNull(),
    },
    (session) => ({
        userIdIdx: index("session_userId_idx").on(session.userId),
    }),
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
    "verificationToken",
    {
        identifier: varchar("identifier", { length: 255 }).notNull(),
        token: varchar("token", { length: 255 }).notNull(),
        expires: timestamp("expires", { mode: "date" }).notNull(),
    },
    (vt) => ({
        compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
    }),
);

export const organizations = createTable("organization", {
    id: varchar("id", { length: 255 })
        .notNull()
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 255 }).notNull(),
    tokens: integer("tokens").default(0),
    max_tokens: integer("max_tokens").default(freePricingPlan?.monthlyTokens || 0),
    email: varchar("email", { length: 255 }).notNull(),
    image: varchar("image", { length: 255 }),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    ownerId: varchar("ownerId", { length: 255 })
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
});

export const createOrgInsertSchema = createInsertSchema(organizations, {
    name: z
        .string()
        .min(3, "Name must be at least 3 characters long")
        .max(50, "Name must be at most 50 characters long"),
    image: z.string().url({ message: "Invalid image URL" }),
});

export const organizationsRelations = relations(
    organizations,
    ({ one, many }) => ({
        owner: one(users, {
            fields: [organizations.ownerId],
            references: [users.id],
        }),
        membersToOrganizations: many(membersToOrganizations),
        subscriptions: one(subscriptions, {
            fields: [organizations.id],
            references: [subscriptions.orgId],
        }),
    }),
);

export const membersToOrganizationsRoleEnum = pgEnum("org-member-role", [
    "Director",
    "Property Manager",
    "Agent",
    "IT",
    "Analyst",
    "Billing",
    "Viewer",
    "Developer",
    "Billing",
    "Admin",
]);

export const membersToOrganizations = createTable(
    "membersToOrganizations",
    {
        id: varchar("id", { length: 255 }).default(sql`gen_random_uuid()`),
        memberId: varchar("memberId", { length: 255 })
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        memberEmail: varchar("memberEmail", { length: 255 }).notNull(),
        organizationId: varchar("organizationId", { length: 255 })
            .notNull()
            .references(() => organizations.id, { onDelete: "cascade" }),
        role: membersToOrganizationsRoleEnum("role")
            .default("Viewer")
            .notNull(),
        createdAt: timestamp("createdAt", { mode: "date" })
            .notNull()
            .defaultNow(),
    },
    (mto) => ({
        compoundKey: primaryKey({
            columns: [mto.id, mto.memberId, mto.organizationId],
        }),
    }),
);

export const membersToOrganizationsRelations = relations(
    membersToOrganizations,
    ({ one }) => ({
        member: one(users, {
            fields: [membersToOrganizations.memberId],
            references: [users.id],
        }),
        organization: one(organizations, {
            fields: [membersToOrganizations.organizationId],
            references: [organizations.id],
        }),
    }),
);

export const membersToOrganizationsInsertSchema = createInsertSchema(
    membersToOrganizations,
);

export const orgRequests = createTable(
    "orgRequest",
    {
        id: varchar("id", { length: 255 })
            .notNull()
            .primaryKey()
            .default(sql`gen_random_uuid()`),
        userId: varchar("userId", { length: 255 })
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),

        organizationId: varchar("organizationId", {
            length: 255,
        })
            .notNull()
            .references(() => organizations.id, { onDelete: "cascade" }),
        createdAt: timestamp("createdAt", { mode: "date" })
            .notNull()
            .defaultNow(),
    },
    (or) => ({
        orgIdIdx: index("orgRequest_organizationId_idx").on(or.organizationId),
    }),
);

export const orgRequestsRelations = relations(orgRequests, ({ one }) => ({
    user: one(users, { fields: [orgRequests.userId], references: [users.id] }),
    organization: one(organizations, {
        fields: [orgRequests.organizationId],
        references: [organizations.id],
    }),
}));

export const orgRequestInsertSchema = createInsertSchema(orgRequests);

// Property schema


// Enum for alert types
export const alertTypeEnum = pgEnum("alert_type", [
    "Subleasing",
    "Notice to Vacate",
    "Unauthorized Tenants",
    "Court Complaints",
]);


// tenants schema

export const tenantStatusEnum = pgEnum("tenant-status", [
    "Active",
    "Inactive",
    "Pending",
]);

export const tenantTypeEnum = pgEnum("tenant-type", [
    "Individual",
    "Corporate",
]);

export const blacklistedData = createTable("blacklisted_email_config", {
    blacklistedEmail: varchar("email", { length: 255 }).notNull(),
    blacklistedDomain: varchar("domain", { length: 255 }).notNull(),
    note: text("note").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),

})

export const emailLogs = createTable("email_logs", {
    id: integer("id").primaryKey(),
    email: varchar("email", { length: 255 })
        .notNull()
        .references(() => connected.email, { onDelete: "cascade" }),
    orgId: text("orgId")
        .notNull()
        .unique()
        .references(() => organizations.id, { onDelete: "cascade" }),
    recipient: varchar("recipient", { length: 255 }).notNull(),
    subject: varchar("subject", { length: 255 }),
    content: text("content").notNull(),
    status: varchar("status", { length: 50 }).notNull().default("sent"),
    threadId: varchar("threadId", { length: 255 }),
    messageId: varchar("messageId", { length: 255 }),
    response_data: jsonb("response_data"),
    tokens: integer("tokens").default(0),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedOn: timestamp("updatedOn").notNull().defaultNow(),
});

// Zod schema for insert operations
export const emailLogInsertSchema = createInsertSchema(emailLogs, {
    email: z.string().email("Email must be a valid email address"),
    orgId: z.string().uuid("Organization ID must be a valid UUID"),
    recipient: z.string().email("Recipient must be a valid email address"),
    subject: z.string().max(255, "Subject must be 255 characters or less").optional(),
    content: z.string().min(1, "Content is required"),
    status: z.enum(["sent", "failed", "draft", "scheduled"]).default("sent"),
    threadId: z.string().max(255, "Thread ID must be 255 characters or less").optional(),
    messageId: z.string().max(255, "Message ID must be 255 characters or less").optional(),
    response_data: z.object({}).passthrough().optional(),
});

// Zod schema for select operations
export const emailLogSelectSchema = createSelectSchema(emailLogs);

// Zod schema for update operations
export const emailLogUpdateSchema = emailLogInsertSchema.partial().omit({ id: true, createdAt: true });


export const sources = createTable("sources", {
    id: varchar("id", { length: 255 })
        .notNull()
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    orgId: text("orgId")
        .notNull()
        .unique()
        .references(() => organizations.id, { onDelete: "cascade" }),
    // Q&A Source as JSONB (key-value map)
    qa_source: jsonb("qa_source"), // Stores question-answer pairs
    // Text source
    text_source: text("text_source"), // Stores large text data
    mail_source: jsonb("mail_source"), // Stores mail source
    // Website crawling results as JSONB (URL-text map)
    website_data: jsonb("website_data"), // Stores page links and corresponding text
    llamaIndex: jsonb("llamaIndex"), // Stores question-answer pairs
    lastTrained: timestamp("lastTrained", { mode: "date" }),
    // Documents as JSONB (file name-text map)
    documents: jsonb("documents"), // Stores file names and corresponding text
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedOn: timestamp("updatedOn", { mode: "date" }).defaultNow(),
});

export const sourcesInsertSchema = z.object({
    id: z.string().optional(), // ID is auto-generated
    orgId: z.string(), // Organization ID
    qa_source: z.record(z.string(), z.string()).nullable(), // Map of question-answer pairs
    text_source: z.string().nullable(), // Large text data
    mail_source: z.record(z.string(), z.string()).nullable(), // URL-text map
    website_data: z.record(z.string(), z.string()).nullable(), // URL-text map
    llamaIndex: z.string().nullable(), // Large text data
    lastTrained: z.string().optional(), // ISO date string for last update timestamp
    documents: z.record(z.string(), z.string()).nullable(), // File name-text map
    createdAt: z.date().optional(), // ISO date string for creation timestamp
    updatedOn: z.date().optional(), // ISO date string for last update timestamp
});

export const sourcesUpdateSchema = z.object({
    id: z.string().optional(), // ID should not change
    orgId: z.string().optional(), // Optional field; typically not updated
    qa_source: z.record(z.string(), z.string()).nullable(), // Map of question-answer pairs
    text_source: z.string().nullable(), // Large text data
    llamaIndex: z.string().nullable(), // Large text data
    lastTrained: z.string().optional(), // Large text data
    mail_source: z.record(z.string(), z.string()).nullable(), // URL-text map
    website_data: z.record(z.string(), z.string()).nullable(), // URL-text map
    documents: z.record(z.string(), z.string()).nullable(), // File name-text map
    createdAt: z.date().optional(), // ISO date string for creation timestamp
    updatedOn: z.date().optional(), // ISO date string for last update timestamp
});

export const sourcesSelectSchema = z.object({
    id: z.string(), // Primary key
    orgId: z.string(), // Foreign key to organizations table
    qa_source: z.record(z.string(), z.string()).nullable(), // Map of question-answer pairs
    text_source: z.string().nullable(), // Large text data
    mail_source: z.record(z.string(), z.string()).nullable(), // URL-text map
    website_data: z.record(z.string(), z.string()).nullable(), // URL-text map
    documents: z.record(z.string(), z.string()).nullable(), // File name-text map
    createdAt: z.string().optional(), // ISO date string for creation timestamp
    lastTrained: z.date().optional(), // Large text data
    updatedOn: z.date().optional(), // ISO date string for last update timestamp
});


export const connected = createTable("connected", {
    email: varchar("email", { length: 255 })
        .notNull()
        .primaryKey()
        .unique(),
    orgId: text("orgId")
        .notNull()
        .unique()
        .references(() => organizations.id, { onDelete: "cascade" }),
    frequency: integer("frequency"),
    access_token: text("access_token").notNull(),
    refresh_token: text("refresh_token").notNull(),
    purpose: text("purpose"),
    sendMode: text("sendMode").notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    isActive: boolean("isActive").default(true),
    reveal_ai: boolean("reveal_ai").default(true),
    expires_at: integer("expires_at"),
    lastOn: timestamp("lastOn", { mode: "date" }),
    //gmail watchlist
    historyId: integer("historyId").notNull(),
    //outlook
    subscriptionId: text("subscriptionId"),
    userId: text("userId"),
    expiration: integer("expiration"),
    lastThreadId: varchar("lastThreadId"),
    updatedOn: timestamp("updatedOn", { mode: "date" }).defaultNow(),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const connectedInsertSchema = z.object({
    email: z.string().email("Email must be a valid email address"),
    orgId: z.string(), // Generic string instead of UUID
    frequency: z.number().int().optional(), // Optional if not required
    access_token: z.string().min(1, "Access token is required"),
    refresh_token: z.string().min(1, "Refresh token is required"),
    historyId: z.number().int(), // Add expiration as optional
    expiration: z.bigint().optional(), // Add expiration as optional
    purpose: z.string().optional(),
    sendMode: z.string().default("draft"),
    reveal_ai: z.boolean().default(true),
    subscriptionId: z.string().optional(),
    userId: z.string().optional(),
    isActive: z.boolean().default(true),
    provider: z.string().min(1, "Provider is required"),
    expires_at: z.number().int().optional(), // Optional if not required
    lastOn: z.string().optional(), // Ensure proper format if needed
    lastThreadId: z.string().optional(),
});

export const connectedUpdateSchema = z.object({
    email: z.string().email("Email must be a valid email address").optional(), // Typically not updated
    orgId: z.string(), // Generic string instead of UUID
    frequency: z.number().int().optional(),
    access_token: z.string().optional(),
    refresh_token: z.string().optional(),
    purpose: z.string().optional(),
    provider: z.string().optional(),
    expires_at: z.number().int().optional(),
    lastOn: z.string().optional(), // Ensure proper format if needed
    lastThreadId: z.string().optional(),
});


export const connectedSelectSchema = z.object({
    email: z.string().email("Email must be a valid email address"),
    orgId: z.string(), // Generic string instead of UUID
    frequency: z.number().int().optional(),
    access_token: z.string(),
    refresh_token: z.string(),
    purpose: z.string().optional(),
    provider: z.string(),
    isActive: z.boolean(),
    expires_at: z.number().int().optional(),
    lastOn: z.string().optional(), // Ensure proper format if needed
    lastThreadId: z.string().optional(),
    createdAt: z.date().optional() // Date format, adjust as needed
});


// Feedback schema

export const feedbackLabelEnum = pgEnum("feedback-label", [
    "Issue",
    "Idea",
    "Question",
    "Complaint",
    "Feature Request",
    "Other",
]);

export const feedbackStatusEnum = pgEnum("feedback-status", [
    "Open",
    "In Progress",
    "Closed",
]);

export const feedback = createTable("feedback", {
    id: varchar("id", { length: 255 })
        .notNull()
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    userId: varchar("userId", { length: 255 })
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }),
    message: text("message").notNull(),
    label: feedbackLabelEnum("label").notNull(),
    status: feedbackStatusEnum("status").default("Open").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const feedbackRelations = relations(feedback, ({ one }) => ({
    user: one(users, { fields: [feedback.userId], references: [users.id] }),
}));

export const feedbackInsertSchema = createInsertSchema(feedback, {
    title: z
        .string()
        .min(3, "Title is too short")
        .max(255, "Title is too long"),
    message: z
        .string()
        .min(10, "Message is too short")
        .max(1000, "Message is too long"),
});

export const feedbackSelectSchema = createSelectSchema(feedback, {
    title: z
        .string()
        .min(3, "Title is too short")
        .max(255, "Title is too long"),
    message: z
        .string()
        .min(10, "Message is too short")
        .max(1000, "Message is too long"),
});

export const webhookEvents = createTable("webhookEvent", {
    id: varchar("id", { length: 255 })
        .notNull()
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    eventName: text("eventName").notNull(),
    processed: boolean("processed").default(false),
    body: jsonb("body").notNull(),
    processingError: text("processingError"),
});

export const subscriptions = createTable("subscription", {
    id: varchar("id", { length: 255 })
        .notNull()
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    stripeSubscriptionId: text("stripeSubscriptionId").unique().notNull(),
    orderId: text("orderId").notNull(),
    orgId: text("orgId")
        .notNull()
        .unique()
        .references(() => organizations.id, { onDelete: "cascade" }),
    priceId: text("priceId").notNull()
});

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
    organization: one(organizations, {
        fields: [subscriptions.orgId],
        references: [organizations.id],
    }),
}));

export const waitlistUsers = createTable("waitlistUser", {
    id: varchar("id", { length: 255 })
        .notNull()
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const waitlistUsersSchema = createInsertSchema(waitlistUsers, {
    email: z.string().email("Email must be a valid email address"),
    name: z.string().min(3, "Name must be at least 3 characters long"),
});

export const escalationPriority = pgEnum("priority", ["low", "medium", "high"]);


export const sgAlert = createTable("escalations", {
    id: varchar("id", { length: 255 })
        .notNull()
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    organizationId: varchar("organizationId", { length: 255 })
        .notNull()
        .references(() => organizations.id, { onDelete: "cascade" }),
    archived: boolean("archived").default(false).notNull(),
    summary: varchar("summary").notNull(),
    subject: varchar("subject").notNull(),
    account: varchar("account", { length: 255 }).notNull(),
    recipient: varchar("recipient", { length: 255 }).notNull(),
    threadId: varchar("threadId", { length: 255 }).notNull(),
    category: varchar("category", { length: 255 }).default("Other"),
    priority: escalationPriority("priority").default("low"),
    escalationLink: varchar("escalationLink"),
    updatedAt: timestamp("updatedAt", { mode: "date" }),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});


export const sgAlertInsertSchema = createInsertSchema(sgAlert, {
    organizationId: z.string().uuid("Invalid organization ID format"),
    archived: z.boolean().optional(),
    summary: z.string().min(1, "Summary is required"), 
    account: z.string().min(1, "Account is required"),
    recipient: z.string().min(1, "Recipient is required"), 
    escalationLink: z.string().url().optional(), 
    updatedAt: z.date().optional(),
    createdAt: z.date().optional(),

});



