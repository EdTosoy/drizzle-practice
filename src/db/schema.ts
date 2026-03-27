import {
  pgTable as table,
  index,
  uniqueIndex,
  primaryKey,
  pgEnum,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "CUSTOMER",
  "VENDOR",
  "SUPPORT_AGENT",
  "ADMIN",
  "SUPER_ADMIN",
]);

export const userStatusEnum = pgEnum("user_status", [
  "PENDING_VERIFICATION",
  "ACTIVE",
  "SUSPENDED",
  "DEACTIVATED",
]);

export const authProviderEnum = pgEnum("auth_provider", [
  "EMAIL",
  "GOOGLE",
  "GITHUB",
  "FACEBOOK",
]);

export const addressType = pgEnum("address_type", [
  "BILLING",
  "SHIPPING",
  "BOTH",
]);

export type UserPreferences = {
  theme: "dark" | "light";
  emailNotifs: boolean;
  currency: string;
};

export const users = table(
  "users",
  (t) => ({
    id: t.uuid().defaultRandom().primaryKey(),

    email: t.text().notNull().unique(),
    phone: t.text().unique(),

    role: userRoleEnum().notNull().default("CUSTOMER"),
    status: userStatusEnum().notNull().default("PENDING_VERIFICATION"),

    createdAt: t.timestamp({ withTimezone: true }).notNull().defaultNow(),

    updatedAt: t
      .timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()), // ⚠️ drizzle-only trigger

    deletedAt: t.timestamp({ withTimezone: true }),
  }),
  (t) => [
    index("users_email_idx").on(t.email),
    index("users_status_role_idx").on(t.status, t.role),
    index("users_created_at_idx").on(t.createdAt),
  ],
);
export const userProfiles = table("user_profiles", (t) => ({
  id: t.uuid().defaultRandom().primaryKey(),

  userId: t
    .uuid()
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),

  firstName: t.text().notNull(),
  lastName: t.text().notNull(),

  displayName: t.text(),
  avatarUrl: t.text(),
  bio: t.text(),

  birthDate: t.timestamp({ withTimezone: true }),
  gender: t.text(),

  language: t.text().notNull().default("en"),
  timezone: t.text().notNull().default("UTC"),

  preferences: t.jsonb().$type<UserPreferences>(),
}));

export const authAccounts = table(
  "auth_accounts",
  (t) => ({
    id: t.uuid().defaultRandom().primaryKey(),

    userId: t
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    provider: authProviderEnum().notNull(),
    providerId: t.text().notNull(),

    accessToken: t.text(),
    refreshToken: t.text(),
    tokenExpiry: t.timestamp({ withTimezone: true }),

    passwordHash: t.text(),

    createdAt: t.timestamp({ withTimezone: true }).notNull().defaultNow(),

    updatedAt: t
      .timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  }),
  (t) => [
    uniqueIndex("auth_accounts_provider_provider_id_unique").on(
      t.provider,
      t.providerId,
    ),
    index("auth_accounts_user_id_idx").on(t.userId),
  ],
);

export const sessions = table(
  "sessions",
  (t) => ({
    id: t.uuid().defaultRandom().primaryKey(),

    userId: t
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    token: t.text().notNull().unique(),

    ipAddress: t.text(),
    userAgent: t.text(),

    deviceInfo: t.jsonb(),

    lastActiveAt: t.timestamp({ withTimezone: true }).notNull().defaultNow(),

    expiresAt: t.timestamp({ withTimezone: true }).notNull(),

    createdAt: t.timestamp({ withTimezone: true }).notNull().defaultNow(),
  }),
  (t) => [
    index("sessions_user_id_idx").on(t.userId),
    index("sessions_token_idx").on(t.token),
    index("sessions_expires_at_idx").on(t.expiresAt),
  ],
);

export const permissions = table(
  "permissions",
  (t) => ({
    id: t.uuid().defaultRandom().primaryKey(),

    resource: t.text().notNull(),
    action: t.text().notNull(),

    description: t.text(),
  }),
  (t) => [
    uniqueIndex("permissions_resource_action_unique").on(t.resource, t.action),
  ],
);

export const userRoleAssignments = table(
  "user_role_assignments",
  (t) => ({
    userId: t
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    permissionId: t
      .uuid()
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),

    grantedBy: t.text().notNull(),

    grantedAt: t.timestamp({ withTimezone: true }).notNull().defaultNow(),

    expiresAt: t.timestamp({ withTimezone: true }),
  }),
  (t) => [
    primaryKey({
      name: "user_role_assignments_pk",
      columns: [t.userId, t.permissionId],
    }),
    index("user_role_assignments_user_id_idx").on(t.userId),
  ],
);

export const vendorProfiles = table(
  "vendor_profiles",
  (t) => ({
    id: t.uuid().defaultRandom().primaryKey(),
    userId: t
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    storeName: t.text().notNull(),
    slug: t.text().notNull().unique(),
    logoUrl: t.text(),
    bannerUrl: t.text(),
    description: t.text(),
    businessAddress: t.jsonb(),
    taxId: t.text(),
    isVerified: t.boolean().notNull().default(false),
    rating: t.numeric({ precision: 3, scale: 2 }).notNull().default("0"),
    totalSales: t.integer().notNull().default(0),
    createdAt: t.timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: t
      .timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  }),
  (t) => [
    index("vendor_profiles_slug_idx").on(t.slug),
    index("vendor_profiles_is_verified_idx").on(t.isVerified),
  ],
);

export const adresses = table(
  "addresses",
  (t) => ({
    id: t.uuid().defaultRandom().primaryKey(),
    userId: t
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: addressType().notNull().default("BOTH"),
    label: t.text(),
    recipientName: t.text().notNull(),
    phone: t.text().notNull(),
    line1: t.text().notNull(),
    line2: t.text(),
    city: t.text().notNull(),
    province: t.text().notNull(),
    country: t.text().notNull(),
    postalCode: t.text().notNull(),
    isDefault: t.boolean().notNull().default(false),
    latitude: t.numeric({ precision: 10, scale: 8 }),
    longitude: t.numeric({ precision: 11, scale: 8 }),
    createdAt: t.timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: t
      .timestamp({ withTimezone: true })
      .notNull()
      .$onUpdateFn(() => new Date()),
  }),
  (t) => [
    index("addresses_user_id_idx").on(t.userId),
    index("addresses_user_id_is_default_idx").on(t.userId, t.isDefault),
  ],
);

export const categories = table(
  "categories",
  (t) => ({
    id: t.uuid().defaultRandom().primaryKey(),
    parentId: t.uuid().references(() => categories.id),
    name: t.text().notNull(),
    slug: t.text().unique(),
    description: t.text(),
    imageUrl: t.text(),
    sortOrder: t.integer().notNull().default(0),
    isActive: t.boolean().notNull().default(true),
    createdAt: t.timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: t
      .timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  }),
  (t) => [
    index("categories_parent_id_idx").on(t.parentId),
    index("categories_slug_idx").on(t.slug),
    index("categories_is_active_sort_order").on(t.isActive, t.sortOrder),
  ],
);

export const brands = table("brands", (t) => ({
  id: t.uuid().defaultRandom().primaryKey(),
  name: t.text().notNull().unique(),
  slug: t.text().notNull().unique(),
  logoUrl: t.text(),
  description: t.text(),
  isActive: t.boolean().notNull().default(true),
  createdAt: t.timestamp({ withTimezone: true }).notNull().defaultNow(),
}));
