// Client-facing data shapes. These intentionally mirror the DB enums but live
// here (with no Buffer/Drizzle) so the browser bundle never pulls in the schema.

export type TicketCategory = "hardware" | "software" | "network" | "access" | "other";
export type TicketPriority = "low" | "medium" | "high";
export type TicketStatus =
  | "open"
  | "in_progress"
  | "waiting_on_user"
  | "resolved"
  | "closed";
export type CommentRole = "user" | "agent";

export interface ClientTicket {
  id: number;
  deviceId: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedAgent: string | null;
  createdAt: string;
  updatedAt: string;
  attachmentName: string | null;
  attachmentMime: string | null;
  attachmentSize: number | null;
}

export interface ClientComment {
  id: number;
  ticketId: number;
  author: string;
  authorRole: CommentRole;
  body: string;
  createdAt: string;
}
