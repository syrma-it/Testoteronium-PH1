import {
  customType,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const ticketCategory = pgEnum("ticket_category", [
  "hardware",
  "software",
  "network",
  "access",
  "other",
]);

export const ticketPriority = pgEnum("ticket_priority", ["low", "medium", "high"]);

export const ticketStatus = pgEnum("ticket_status", [
  "open",
  "in_progress",
  "waiting_on_user",
  "resolved",
  "closed",
]);

export const commentRole = pgEnum("comment_role", ["user", "agent"]);

const bytea = customType<{ data: Buffer; default: false }>({
  dataType() {
    return "bytea";
  },
});

export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  deviceId: text("device_id").notNull(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  category: ticketCategory("category").notNull().default("other"),
  priority: ticketPriority("priority").notNull().default("medium"),
  status: ticketStatus("status").notNull().default("open"),
  assignedAgent: text("assigned_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  attachmentName: text("attachment_name"),
  attachmentMime: text("attachment_mime"),
  attachmentSize: integer("attachment_size"),
  attachmentData: bytea("attachment_data"),
});

export const ticketComments = pgTable("ticket_comments", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id")
    .notNull()
    .references(() => tickets.id, { onDelete: "cascade" }),
  author: text("author").notNull(),
  authorRole: commentRole("author_role").notNull().default("user"),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
export type TicketComment = typeof ticketComments.$inferSelect;
export type NewTicketComment = typeof ticketComments.$inferInsert;

export type TicketStatus = (typeof ticketStatus.enumValues)[number];
export type TicketCategory = (typeof ticketCategory.enumValues)[number];
export type TicketPriority = (typeof ticketPriority.enumValues)[number];
