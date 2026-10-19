CREATE TYPE "public"."comment_status" AS ENUM('pending', 'published', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."contact_channel" AS ENUM('call', 'email', 'webform');--> statement-breakpoint
CREATE TYPE "public"."contact_outcome" AS ENUM('pending', 'responded', 'no_response', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."government_level" AS ENUM('federal', 'state', 'county', 'municipal');--> statement-breakpoint
CREATE TYPE "public"."jurisdiction_type" AS ENUM('state', 'congressional_district', 'state_senate_district', 'assembly_district', 'county', 'county_district', 'municipality', 'council_district');--> statement-breakpoint
CREATE TYPE "public"."meeting_kind" AS ENUM('constituent', 'lobbyist', 'organization', 'government', 'other');--> statement-breakpoint
CREATE TYPE "public"."office_kind" AS ENUM('district', 'satellite', 'mobile', 'mailing', 'capitol');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('unverified', 'pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"official_id" integer NOT NULL,
	"constituent_id" uuid NOT NULL,
	"body" text NOT NULL,
	"status" "comment_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "constituent_jurisdictions" (
	"constituent_id" uuid NOT NULL,
	"jurisdiction_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "constituents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"email_verified_at" timestamp with time zone,
	"display_name" text,
	"verification_status" "verification_status" DEFAULT 'unverified' NOT NULL,
	"verification_method" text,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "constituents_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "contact_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"official_id" integer NOT NULL,
	"office_id" integer,
	"constituent_id" uuid,
	"channel" "contact_channel" NOT NULL,
	"outcome" "contact_outcome" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone,
	"follow_up_due_at" timestamp with time zone,
	"outcome_source" text,
	"follow_up_token" text,
	CONSTRAINT "contact_attempts_follow_up_token_unique" UNIQUE("follow_up_token")
);
--> statement-breakpoint
CREATE TABLE "contact_profiles" (
	"official_id" integer PRIMARY KEY NOT NULL,
	"email_public" text,
	"webform_url" text,
	"webform_requires_zip" boolean,
	"phone" boolean,
	"meeting_request_url" text,
	"in_person" boolean,
	"in_person_notes" text,
	"mobile_office_hours" boolean,
	"casework_url" text
);
--> statement-breakpoint
CREATE TABLE "jurisdictions" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"type" "jurisdiction_type" NOT NULL,
	"geoid" text,
	"land_area_sq_mi" double precision NOT NULL,
	"population" integer NOT NULL,
	"area_source" text NOT NULL,
	"population_source" text NOT NULL,
	"sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "jurisdictions_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" serial PRIMARY KEY NOT NULL,
	"official_id" integer NOT NULL,
	"date" date NOT NULL,
	"who" text NOT NULL,
	"topic" text,
	"kind" "meeting_kind" DEFAULT 'other' NOT NULL,
	"source_url" text
);
--> statement-breakpoint
CREATE TABLE "offices" (
	"id" serial PRIMARY KEY NOT NULL,
	"official_id" integer NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"kind" "office_kind" NOT NULL,
	"address" text,
	"suite" text,
	"city" text,
	"state" text,
	"zip" text,
	"phone" text,
	"hours" text,
	"latitude" double precision,
	"longitude" double precision
);
--> statement-breakpoint
CREATE TABLE "officials" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"bioguide" text,
	"name" text NOT NULL,
	"full_name" text NOT NULL,
	"level" "government_level" NOT NULL,
	"chamber" text NOT NULL,
	"title" text NOT NULL,
	"district" integer,
	"party" text,
	"jurisdiction_id" integer NOT NULL,
	"website_url" text,
	"photo_url" text,
	"status_note" text,
	"in_office" boolean DEFAULT true NOT NULL,
	"sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"research_notes" text,
	"verified_at" date,
	CONSTRAINT "officials_slug_unique" UNIQUE("slug"),
	CONSTRAINT "officials_bioguide_unique" UNIQUE("bioguide")
);
--> statement-breakpoint
CREATE TABLE "review_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"office_id" integer NOT NULL,
	"platform" text NOT NULL,
	"url" text NOT NULL,
	"rating" double precision,
	"review_count" integer,
	"fetched_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "schedules" (
	"official_id" integer PRIMARY KEY NOT NULL,
	"publishes_daily_schedule" boolean,
	"schedule_url" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "scorecards" (
	"id" serial PRIMARY KEY NOT NULL,
	"official_id" integer NOT NULL,
	"org" text NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"score" text,
	"period" text
);
--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_official_id_officials_id_fk" FOREIGN KEY ("official_id") REFERENCES "public"."officials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_constituent_id_constituents_id_fk" FOREIGN KEY ("constituent_id") REFERENCES "public"."constituents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "constituent_jurisdictions" ADD CONSTRAINT "constituent_jurisdictions_constituent_id_constituents_id_fk" FOREIGN KEY ("constituent_id") REFERENCES "public"."constituents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "constituent_jurisdictions" ADD CONSTRAINT "constituent_jurisdictions_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_attempts" ADD CONSTRAINT "contact_attempts_official_id_officials_id_fk" FOREIGN KEY ("official_id") REFERENCES "public"."officials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_attempts" ADD CONSTRAINT "contact_attempts_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_attempts" ADD CONSTRAINT "contact_attempts_constituent_id_constituents_id_fk" FOREIGN KEY ("constituent_id") REFERENCES "public"."constituents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_profiles" ADD CONSTRAINT "contact_profiles_official_id_officials_id_fk" FOREIGN KEY ("official_id") REFERENCES "public"."officials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_official_id_officials_id_fk" FOREIGN KEY ("official_id") REFERENCES "public"."officials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offices" ADD CONSTRAINT "offices_official_id_officials_id_fk" FOREIGN KEY ("official_id") REFERENCES "public"."officials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "officials" ADD CONSTRAINT "officials_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_sources" ADD CONSTRAINT "review_sources_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_official_id_officials_id_fk" FOREIGN KEY ("official_id") REFERENCES "public"."officials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorecards" ADD CONSTRAINT "scorecards_official_id_officials_id_fk" FOREIGN KEY ("official_id") REFERENCES "public"."officials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "constituent_jurisdictions_pk" ON "constituent_jurisdictions" USING btree ("constituent_id","jurisdiction_id");--> statement-breakpoint
CREATE UNIQUE INDEX "offices_official_slug" ON "offices" USING btree ("official_id","slug");