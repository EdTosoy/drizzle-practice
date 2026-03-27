import { relations } from "drizzle-orm";
import {
  users,
  userProfiles,
  authAccounts,
  sessions,
  permissions,
  userRoleAssignments,
  vendorProfiles,
  adresses,
  categories,
  brands,
} from "./schema";

// ------------------------
// USERS
// ------------------------
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles),
  authAccounts: many(authAccounts),
  sessions: many(sessions),
  roleAssignments: many(userRoleAssignments),
  vendorProfile: one(vendorProfiles),
  addresses: many(adresses),
}));

// ------------------------
// USER PROFILES
// ------------------------
export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

// ------------------------
// AUTH ACCOUNTS
// ------------------------
export const authAccountsRelations = relations(authAccounts, ({ one }) => ({
  user: one(users, {
    fields: [authAccounts.userId],
    references: [users.id],
  }),
}));

// ------------------------
// SESSIONS
// ------------------------
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

// ------------------------
// PERMISSIONS
// ------------------------
export const permissionsRelations = relations(permissions, ({ many }) => ({
  roleAssignments: many(userRoleAssignments),
}));

// ------------------------
// USER ROLE ASSIGNMENTS
// ------------------------
export const userRoleAssignmentsRelations = relations(
  userRoleAssignments,
  ({ one }) => ({
    user: one(users, {
      fields: [userRoleAssignments.userId],
      references: [users.id],
    }),
    permission: one(permissions, {
      fields: [userRoleAssignments.permissionId],
      references: [permissions.id],
    }),
  }),
);

// ------------------------
// VENDOR PROFILES
// ------------------------
export const vendorProfilesRelations = relations(vendorProfiles, ({ one }) => ({
  user: one(users, {
    fields: [vendorProfiles.userId],
    references: [users.id],
  }),
}));

// ------------------------
// ADDRESSES
// ------------------------
export const addressesRelations = relations(adresses, ({ one }) => ({
  user: one(users, {
    fields: [adresses.userId],
    references: [users.id],
  }),
}));

// ------------------------
// CATEGORIES (Self-relation)
// ------------------------
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  children: many(categories),
}));

// ------------------------
// BRANDS
// ------------------------
export const brandsRelations = relations(brands, ({}) => ({}));
// Brands currently has no foreign keys or relations
