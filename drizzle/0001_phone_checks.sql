CREATE TYPE "public"."phone_check_outcome" AS ENUM('answered_live', 'voicemail', 'voicemail_full', 'recorded_message', 'redirected', 'no_voicemail', 'line_off', 'busy');--> statement-breakpoint
CREATE TABLE "phone_checks" (
	"id" serial PRIMARY KEY NOT NULL,
	"official_id" integer NOT NULL,
	"office_id" integer,
	"phone_number" text,
	"checked_at" timestamp with time zone NOT NULL,
	"outcome" "phone_check_outcome" NOT NULL,
	"in_session" boolean,
	"source" text NOT NULL,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "phone_checks" ADD CONSTRAINT "phone_checks_official_id_officials_id_fk" FOREIGN KEY ("official_id") REFERENCES "public"."officials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phone_checks" ADD CONSTRAINT "phone_checks_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE set null ON UPDATE no action;