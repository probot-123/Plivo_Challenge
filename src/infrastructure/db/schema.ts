import { InferModel } from 'drizzle-orm';
import { 
  integer, 
  pgEnum, 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  uuid, 
  varchar,
  boolean
} from 'drizzle-orm/pg-core';

// Enums
export const roleEnum = pgEnum('role', ['admin', 'member']);
export const statusEnum = pgEnum('status', ['operational', 'degraded', 'partial_outage', 'major_outage']);
export const incidentStatusEnum = pgEnum('incident_status', ['investigating', 'identified', 'monitoring', 'resolved']);
export const maintenanceStatusEnum = pgEnum('maintenance_status', ['scheduled', 'in_progress', 'completed']);

// Organizations (Tenants)
export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  logoUrl: text('logo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Teams
export const teams = pgTable('teams', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Users
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 100 }),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Team Members
export const teamMembers = pgTable('team_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  role: roleEnum('role').default('member').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Services
export const services = pgTable('services', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  status: statusEnum('status').default('operational').notNull(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  isPublic: boolean('is_public').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Incidents
export const incidents = pgTable('incidents', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  status: incidentStatusEnum('status').default('investigating').notNull(),
  impact: statusEnum('impact').default('degraded').notNull(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  createdById: uuid('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
});

// Incident Updates
export const incidentUpdates = pgTable('incident_updates', {
  id: uuid('id').defaultRandom().primaryKey(),
  incidentId: uuid('incident_id').references(() => incidents.id, { onDelete: 'cascade' }).notNull(),
  message: text('message').notNull(),
  status: incidentStatusEnum('status').notNull(),
  createdById: uuid('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Service Incidents (Join table)
export const serviceIncidents = pgTable('service_incidents', {
  id: uuid('id').defaultRandom().primaryKey(),
  serviceId: uuid('service_id').references(() => services.id, { onDelete: 'cascade' }).notNull(),
  incidentId: uuid('incident_id').references(() => incidents.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Maintenance
export const maintenances = pgTable('maintenances', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  status: maintenanceStatusEnum('status').default('scheduled').notNull(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  createdById: uuid('created_by_id').references(() => users.id),
  scheduledStartTime: timestamp('scheduled_start_time').notNull(),
  scheduledEndTime: timestamp('scheduled_end_time').notNull(),
  actualStartTime: timestamp('actual_start_time'),
  actualEndTime: timestamp('actual_end_time'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Service Maintenances (Join table)
export const serviceMaintenances = pgTable('service_maintenances', {
  id: uuid('id').defaultRandom().primaryKey(),
  serviceId: uuid('service_id').references(() => services.id, { onDelete: 'cascade' }).notNull(),
  maintenanceId: uuid('maintenance_id').references(() => maintenances.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Status History
export const statusHistory = pgTable('status_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  serviceId: uuid('service_id').references(() => services.id, { onDelete: 'cascade' }).notNull(),
  status: statusEnum('status').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Comments
export const comments = pgTable('comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  content: text('content').notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  maintenanceId: uuid('maintenance_id').references(() => maintenances.id, { onDelete: 'cascade' }),
  incidentId: uuid('incident_id').references(() => incidents.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type Inference
export type Organization = InferModel<typeof organizations>;
export type Team = InferModel<typeof teams>;
export type User = InferModel<typeof users>;
export type TeamMember = InferModel<typeof teamMembers>;
export type Service = InferModel<typeof services>;
export type Incident = InferModel<typeof incidents>;
export type IncidentUpdate = InferModel<typeof incidentUpdates>;
export type ServiceIncident = InferModel<typeof serviceIncidents>;
export type Maintenance = InferModel<typeof maintenances>;
export type ServiceMaintenance = InferModel<typeof serviceMaintenances>;
export type StatusHistory = InferModel<typeof statusHistory>;
export type Comment = InferModel<typeof comments>; 