import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  status: varchar('status', { length: 50 }).default('offline'),
  lastSeenAt: timestamp('last_seen_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Conversations table (DM or Group)
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: varchar('type', { length: 20 }).notNull(), // 'dm' or 'group'
  name: varchar('name', { length: 255 }), // null for DMs, required for groups
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Conversation participants
export const conversationParticipants = pgTable('conversation_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id')
    .references(() => conversations.id, { onDelete: 'cascade' })
    .notNull(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  role: varchar('role', { length: 20 }).default('member'), // 'admin' or 'member'
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  lastReadAt: timestamp('last_read_at'),
})

// Messages table (no type field - derived from assets)
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id')
    .references(() => conversations.id, { onDelete: 'cascade' })
    .notNull(),
  senderId: uuid('sender_id')
    .references(() => users.id)
    .notNull(),
  content: text('content').notNull(), // can be empty for file-only messages
  replyToId: uuid('reply_to_id').references(() => messages.id), // for threading
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // soft delete
})

// Message assets (file attachments with rich metadata)
export const messageAssets = pgTable('message_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id')
    .references(() => messages.id, { onDelete: 'cascade' })
    .notNull(),
  fileUrl: text('file_url').notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileType: varchar('file_type', { length: 100 }).notNull(), // MIME type
  fileSize: integer('file_size').notNull(), // bytes
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Message reactions
export const messageReactions = pgTable('message_reactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id')
    .references(() => messages.id, { onDelete: 'cascade' })
    .notNull(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  emoji: varchar('emoji', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Read receipts
export const readReceipts = pgTable('read_receipts', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id')
    .references(() => messages.id, { onDelete: 'cascade' })
    .notNull(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  readAt: timestamp('read_at').defaultNow().notNull(),
})

// Relations for better query experience
export const usersRelations = relations(users, ({ many }) => ({
  sentMessages: many(messages),
  conversationParticipants: many(conversationParticipants),
  reactions: many(messageReactions),
  readReceipts: many(readReceipts),
}))

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  creator: one(users, {
    fields: [conversations.createdBy],
    references: [users.id],
  }),
  participants: many(conversationParticipants),
  messages: many(messages),
}))

export const conversationParticipantsRelations = relations(
  conversationParticipants,
  ({ one }) => ({
    conversation: one(conversations, {
      fields: [conversationParticipants.conversationId],
      references: [conversations.id],
    }),
    user: one(users, {
      fields: [conversationParticipants.userId],
      references: [users.id],
    }),
  })
)

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  replyTo: one(messages, {
    fields: [messages.replyToId],
    references: [messages.id],
  }),
  assets: many(messageAssets),
  reactions: many(messageReactions),
  readReceipts: many(readReceipts),
}))

export const messageAssetsRelations = relations(messageAssets, ({ one }) => ({
  message: one(messages, {
    fields: [messageAssets.messageId],
    references: [messages.id],
  }),
}))

export const messageReactionsRelations = relations(messageReactions, ({ one }) => ({
  message: one(messages, {
    fields: [messageReactions.messageId],
    references: [messages.id],
  }),
  user: one(users, {
    fields: [messageReactions.userId],
    references: [users.id],
  }),
}))

export const readReceiptsRelations = relations(readReceipts, ({ one }) => ({
  message: one(messages, {
    fields: [readReceipts.messageId],
    references: [messages.id],
  }),
  user: one(users, {
    fields: [readReceipts.userId],
    references: [users.id],
  }),
}))
