import {
  pgTable as table,
  index,
  uniqueIndex,
  primaryKey,
  pgEnum,
  AnyPgColumn,
} from "drizzle-orm/pg-core";

/* ================= ENUMS ================= */

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

export const addressTypeEnum = pgEnum("address_type", [
  "BILLING",
  "SHIPPING",
  "BOTH",
]);

/* ================= TYPES ================= */

export type UserPreferences = {
  theme: "dark" | "light";
  emailNotifs: boolean;
  currency: string;
};

/* ================= USERS ================= */

export const users = table(
  "users",
  (t) => ({
    id: t.uuid().primaryKey().defaultRandom(),
    email: t.text().notNull().unique(),
    phone: t.text().unique(),
    role: userRoleEnum().notNull().default("CUSTOMER"),
    status: userStatusEnum().notNull().default("PENDING_VERIFICATION"),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()), // drizzle-only
    deletedAt: t.timestamp("deleted_at", { withTimezone: true }),
  }),
  (t) => [
    index("users_email_idx").on(t.email),
    index("users_status_role_idx").on(t.status, t.role),
    index("users_created_at_idx").on(t.createdAt),
  ],
);

/* ================= USER PROFILE ================= */

export const userProfiles = table("user_profiles", (t) => ({
  id: t.uuid().primaryKey().defaultRandom(),
  userId: t
    .uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),

  firstName: t.text("first_name").notNull(),
  lastName: t.text("last_name").notNull(),
  displayName: t.text("display_name"),
  avatarUrl: t.text("avatar_url"),
  bio: t.text(),
  birthDate: t.timestamp("birth_date", { withTimezone: true }),
  gender: t.text(),

  language: t.text().notNull().default("en"),
  timezone: t.text().notNull().default("UTC"),

  preferences: t.jsonb().$type<UserPreferences>(),
}));

/* ================= AUTH ================= */

export const authAccounts = table(
  "auth_accounts",
  (t) => ({
    id: t.uuid().primaryKey().defaultRandom(),

    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    provider: authProviderEnum().notNull(),
    providerId: t.text("provider_id").notNull(),

    accessToken: t.text("access_token"),
    refreshToken: t.text("refresh_token"),
    tokenExpiry: t.timestamp("token_expiry", { withTimezone: true }),
    passwordHash: t.text("password_hash"),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
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

/* ================= SESSIONS ================= */

export const sessions = table(
  "sessions",
  (t) => ({
    id: t.uuid().primaryKey().defaultRandom(),

    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    token: t.text().notNull().unique(),

    ipAddress: t.text("ip_address"),
    userAgent: t.text("user_agent"),
    deviceInfo: t.jsonb("device_info"),

    lastActiveAt: t
      .timestamp("last_active_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    expiresAt: t.timestamp("expires_at", { withTimezone: true }).notNull(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  }),
  (t) => [
    index("sessions_user_id_idx").on(t.userId),
    index("sessions_token_idx").on(t.token),
    index("sessions_expires_at_idx").on(t.expiresAt),
  ],
);

/* ================= PERMISSIONS ================= */

export const permissions = table(
  "permissions",
  (t) => ({
    id: t.uuid().primaryKey().defaultRandom(),
    resource: t.text().notNull(),
    action: t.text().notNull(),
    description: t.text(),
  }),
  (t) => [
    uniqueIndex("permissions_resource_action_unique").on(t.resource, t.action),
  ],
);

/* ================= RBAC ================= */

export const userRoleAssignments = table(
  "user_role_assignments",
  (t) => ({
    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    permissionId: t
      .uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),

    grantedBy: t.text("granted_by").notNull(),

    grantedAt: t
      .timestamp("granted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    expiresAt: t.timestamp("expires_at", { withTimezone: true }),
  }),
  (t) => [
    primaryKey({
      name: "user_role_assignments_pk",
      columns: [t.userId, t.permissionId],
    }),
    index("user_role_assignments_user_id_idx").on(t.userId),
  ],
);

/* ================= VENDOR ================= */

export const vendorProfiles = table(
  "vendor_profiles",
  (t) => ({
    id: t.uuid().primaryKey().defaultRandom(),

    userId: t
      .uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),

    storeName: t.text("store_name").notNull(),
    slug: t.text().notNull().unique(),

    logoUrl: t.text("logo_url"),
    bannerUrl: t.text("banner_url"),
    description: t.text(),

    businessAddress: t.jsonb("business_address"),

    taxId: t.text("tax_id"),

    isVerified: t.boolean("is_verified").notNull().default(false),

    rating: t.numeric({ precision: 3, scale: 2 }).notNull().default("0"),

    totalSales: t.integer("total_sales").notNull().default(0),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  }),
  (t) => [
    index("vendor_profiles_slug_idx").on(t.slug),
    index("vendor_profiles_is_verified_idx").on(t.isVerified),
  ],
);

/* ================= ADDRESSES ================= */

export const addresses = table(
  "addresses",
  (t) => ({
    id: t.uuid().primaryKey().defaultRandom(),

    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    type: addressTypeEnum().notNull().default("BOTH"),

    label: t.text(),

    recipientName: t.text("recipient_name").notNull(),
    phone: t.text().notNull(),

    line1: t.text().notNull(),
    line2: t.text(),

    city: t.text().notNull(),
    province: t.text().notNull(),

    country: t.text().notNull().default("PH"),

    postalCode: t.text("postal_code").notNull(),

    isDefault: t.boolean("is_default").notNull().default(false),

    latitude: t.numeric({ precision: 10, scale: 8 }),
    longitude: t.numeric({ precision: 11, scale: 8 }),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  }),
  (t) => [
    index("addresses_user_id_idx").on(t.userId),
    index("addresses_user_id_is_default_idx").on(t.userId, t.isDefault),
  ],
);

/* ================= CATEGORY (SELF RELATION) ================= */

export const categories = table(
  "categories",
  (t) => ({
    id: t.uuid().primaryKey().defaultRandom(),

    parentId: t.uuid("parent_id").references((): AnyPgColumn => categories.id),

    name: t.text().notNull(),

    slug: t.text().notNull().unique(),

    description: t.text(),
    imageUrl: t.text("image_url"),

    sortOrder: t.integer("sort_order").notNull().default(0),
    isActive: t.boolean("is_active").notNull().default(true),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  }),
  (t) => [
    index("categories_parent_id_idx").on(t.parentId),
    index("categories_slug_idx").on(t.slug),
    index("categories_is_active_sort_order_idx").on(t.isActive, t.sortOrder),
  ],
);

/* ================= BRAND ================= */

export const brands = table("brands", (t) => ({
  id: t.uuid().primaryKey().defaultRandom(),
  name: t.text().notNull().unique(),
  slug: t.text().notNull().unique(),
  logoUrl: t.text("logo_url"),
  description: t.text(),
  isActive: t.boolean("is_active").notNull().default(true),
  createdAt: t
    .timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}));
