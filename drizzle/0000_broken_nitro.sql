CREATE TABLE "auth_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"provider" "auth_provider" NOT NULL,
	"providerId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"tokenExpiry" timestamp with time zone,
	"passwordHash" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource" text NOT NULL,
	"action" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"token" text NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"deviceInfo" jsonb,
	"lastActiveAt" timestamp with time zone DEFAULT now() NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"firstName" text NOT NULL,
	"lastName" text NOT NULL,
	"displayName" text,
	"avatarUrl" text,
	"bio" text,
	"birthDate" timestamp with time zone,
	"gender" text,
	"language" text DEFAULT 'en' NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"preferences" jsonb,
	CONSTRAINT "user_profiles_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "user_role_assignments" (
	"userId" uuid NOT NULL,
	"permissionId" uuid NOT NULL,
	"grantedBy" text NOT NULL,
	"grantedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"expiresAt" timestamp with time zone,
	CONSTRAINT "user_role_assignments_pk" PRIMARY KEY("userId","permissionId")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"role" "user_role" DEFAULT 'CUSTOMER' NOT NULL,
	"status" "user_status" DEFAULT 'PENDING_VERIFICATION' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_permissionId_permissions_id_fk" FOREIGN KEY ("permissionId") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "auth_accounts_provider_provider_id_unique" ON "auth_accounts" USING btree ("provider","providerId");--> statement-breakpoint
CREATE INDEX "auth_accounts_user_id_idx" ON "auth_accounts" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "permissions_resource_action_unique" ON "permissions" USING btree ("resource","action");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "sessions_token_idx" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "user_role_assignments_user_id_idx" ON "user_role_assignments" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_status_role_idx" ON "users" USING btree ("status","role");--> statement-breakpoint
CREATE INDEX "users_created_at_idx" ON "users" USING btree ("createdAt");