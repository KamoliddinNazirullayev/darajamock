CREATE TABLE "invites" (
	"code" text PRIMARY KEY NOT NULL,
	"max_uses" integer NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"note" text,
	"disabled" boolean DEFAULT false NOT NULL,
	"created_by" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "access_granted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "invite_code" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_invite_code_invites_code_fk" FOREIGN KEY ("invite_code") REFERENCES "public"."invites"("code") ON DELETE no action ON UPDATE no action;