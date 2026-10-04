CREATE TABLE "account_consents" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "account_consents_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"account_id" integer NOT NULL,
	"type" varchar(32) NOT NULL,
	"notice_version" varchar(16) DEFAULT '1' NOT NULL,
	"consented_at" timestamp with time zone DEFAULT now() NOT NULL,
	"withdrawn_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "accounts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"mobile" varchar(16) NOT NULL,
	"status" varchar(16) DEFAULT 'active' NOT NULL,
	"role" varchar(16) DEFAULT 'user' NOT NULL,
	"deletion_requested_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"action" varchar(48) NOT NULL,
	"resource_type" varchar(32) NOT NULL,
	"resource_id" text,
	"actor_id" integer,
	"actor_type" varchar(16) DEFAULT 'admin' NOT NULL,
	"reason" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookmarks" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "bookmarks_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"account_id" integer NOT NULL,
	"page_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "career_entries" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "career_entries_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"page_id" integer NOT NULL,
	"year_from" integer NOT NULL,
	"year_to" integer,
	"title" text NOT NULL,
	"institution" text,
	"description" text,
	"sort" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "case_summaries" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "case_summaries_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"page_id" integer NOT NULL,
	"court_id" integer NOT NULL,
	"role" text NOT NULL,
	"year" integer NOT NULL,
	"outcome" varchar(24) NOT NULL,
	"note" text,
	"link" text,
	"post_id" integer,
	"sort" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"code" varchar(8) NOT NULL,
	"slug" varchar(60) NOT NULL,
	"name" text NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "category_translations" (
	"category_id" integer NOT NULL,
	"language" varchar(5) NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "category_translations_category_id_language_pk" PRIMARY KEY("category_id","language")
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "contact_messages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"kind" varchar(16) DEFAULT 'general' NOT NULL,
	"name" text NOT NULL,
	"contact" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "court_details" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "court_details_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"court_id" integer NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"key_name" text NOT NULL,
	"value" text NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "court_translations" (
	"court_id" integer NOT NULL,
	"language" varchar(5) NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "court_translations_court_id_language_pk" PRIMARY KEY("court_id","language")
);
--> statement-breakpoint
CREATE TABLE "courts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "courts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"code" varchar(8) NOT NULL,
	"import_key" text,
	"name" text NOT NULL,
	"local_name" text,
	"kind" varchar(32) NOT NULL,
	"locality_id" integer,
	"district_id" integer,
	"address" text,
	"pincode" varchar(10),
	"lat" double precision,
	"lng" double precision,
	"website" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "domains" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "domains_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"page_id" integer NOT NULL,
	"hostname" varchar(253) NOT NULL,
	"status" varchar(12) DEFAULT 'pending' NOT NULL,
	"cloudflare_id" text,
	"last_checked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "grievances" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "grievances_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"contact" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"status" varchar(12) DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "highlights" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "highlights_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"page_id" integer NOT NULL,
	"number" integer NOT NULL,
	"label" varchar(20) NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "localities" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "localities_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"code" varchar(8) NOT NULL,
	"name" text NOT NULL,
	"local_name" text,
	"parent_id" integer,
	"level" varchar(12) NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"sort" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "memberships_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"firm_page_id" integer NOT NULL,
	"advocate_page_id" integer NOT NULL,
	"title" text,
	"office_id" integer,
	"status" varchar(12) DEFAULT 'pending' NOT NULL,
	"initiated_by" varchar(10) DEFAULT 'advocate' NOT NULL,
	"firm_sort" integer DEFAULT 0 NOT NULL,
	"office_sort" integer DEFAULT 0 NOT NULL,
	"intro" text,
	"hide_on_domain" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "office_courts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "office_courts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"office_id" integer NOT NULL,
	"court_id" integer NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "offices" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "offices_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"page_id" integer NOT NULL,
	"name" text NOT NULL,
	"is_main" boolean DEFAULT false NOT NULL,
	"address" text,
	"locality_id" integer,
	"pincode" varchar(10),
	"phone" varchar(16),
	"phone_verified" boolean DEFAULT false NOT NULL,
	"hours" text,
	"about" text,
	"lat" double precision,
	"lng" double precision,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "otp_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "otp_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"mobile_hash" varchar(64) NOT NULL,
	"otp_hash" varchar(64) NOT NULL,
	"purpose" varchar(24) DEFAULT 'login' NOT NULL,
	"subject_id" integer,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "page_advocate" (
	"page_id" integer PRIMARY KEY NOT NULL,
	"enrolment_no" varchar(40) NOT NULL,
	"year_enrolled" integer,
	"deleted_at" timestamp with time zone,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "page_categories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "page_categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"page_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "page_courts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "page_courts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"page_id" integer NOT NULL,
	"court_id" integer NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "page_custom" (
	"page_id" integer PRIMARY KEY NOT NULL,
	"brand_colour" varchar(7),
	"theme" varchar(16) DEFAULT 'ink' NOT NULL,
	"show_member_of" boolean DEFAULT true NOT NULL,
	"allow_members" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_daily_events" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "page_daily_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"page_id" integer NOT NULL,
	"host" varchar(253) NOT NULL,
	"day" varchar(10) NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"connects" integer DEFAULT 0 NOT NULL,
	"raw_impressions" integer DEFAULT 0 NOT NULL,
	"raw_views" integer DEFAULT 0 NOT NULL,
	"raw_connects" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_events_raw" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "page_events_raw_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"page_id" integer NOT NULL,
	"host" varchar(253) NOT NULL,
	"visitor_id" varchar(64) NOT NULL,
	"event_type" varchar(12) NOT NULL,
	"context" varchar(24),
	"action" varchar(12),
	"is_owner" boolean DEFAULT false NOT NULL,
	"is_bot" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_firm" (
	"page_id" integer PRIMARY KEY NOT NULL,
	"established_year" integer,
	"deleted_at" timestamp with time zone,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "page_languages" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "page_languages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"page_id" integer NOT NULL,
	"language_code" varchar(5) NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "page_links" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "page_links_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"page_id" integer NOT NULL,
	"url" text NOT NULL,
	"icon_key" varchar(24) DEFAULT 'link' NOT NULL,
	"label" text,
	"sort" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "page_photos" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "page_photos_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"page_id" integer NOT NULL,
	"kind" varchar(12) NOT NULL,
	"storage_key" text NOT NULL,
	"size_bytes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "page_scores" (
	"page_id" integer PRIMARY KEY NOT NULL,
	"quality" double precision DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_seo" (
	"page_id" integer PRIMARY KEY NOT NULL,
	"title" text,
	"description" text,
	"social_image_key" text,
	"photo_alt" text,
	"banner_alt" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"account_id" integer NOT NULL,
	"type" varchar(10) NOT NULL,
	"slug" varchar(30) NOT NULL,
	"name" text NOT NULL,
	"plan" varchar(12) DEFAULT 'basic' NOT NULL,
	"status" varchar(12) DEFAULT 'active' NOT NULL,
	"suspended_reason" text,
	"district_id" integer NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"bio" text,
	"about" text,
	"language" varchar(5) DEFAULT 'en' NOT NULL,
	"photo_key" text,
	"banner_key" text,
	"contact_mobile" varchar(16),
	"contact_verified" boolean DEFAULT true NOT NULL,
	"completeness" integer DEFAULT 0 NOT NULL,
	"score" double precision DEFAULT 0 NOT NULL,
	"slug_changed_at" timestamp with time zone,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "post_categories" (
	"post_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "post_categories_post_id_category_id_pk" PRIMARY KEY("post_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "posts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"page_id" integer,
	"type" varchar(16) NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"cover_image_key" text,
	"source_url" text,
	"court_id" integer,
	"language" varchar(5) DEFAULT 'en' NOT NULL,
	"status" varchar(12) DEFAULT 'published' NOT NULL,
	"suspended_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key_hash" varchar(64) NOT NULL,
	"bucket" varchar(32) NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rate_limits_key_hash_bucket_pk" PRIMARY KEY("key_hash","bucket")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "reports_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"target_type" varchar(12) NOT NULL,
	"target_id" integer NOT NULL,
	"reason" varchar(32) NOT NULL,
	"details" text,
	"status" varchar(12) DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by" text
);
--> statement-breakpoint
CREATE TABLE "search_index" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "search_index_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"page_id" integer NOT NULL,
	"office_id" integer,
	"type" varchar(8) NOT NULL,
	"kind" varchar(10) NOT NULL,
	"district_code" varchar(8) NOT NULL,
	"locality_codes" text DEFAULT ',' NOT NULL,
	"category_codes" text DEFAULT ',' NOT NULL,
	"court_codes" text DEFAULT ',' NOT NULL,
	"language_codes" text DEFAULT ',' NOT NULL,
	"years" integer DEFAULT 0 NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"score" double precision DEFAULT 0 NOT NULL,
	"search_text" text DEFAULT '' NOT NULL,
	"created_page" timestamp with time zone DEFAULT now() NOT NULL,
	"last_active" timestamp with time zone DEFAULT now() NOT NULL,
	"has_location" boolean DEFAULT false NOT NULL,
	"indexable" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sessions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"account_id" integer NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"acting_page_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slug_history" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "slug_history_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"page_id" integer,
	"old_slug" varchar(30) NOT NULL,
	"new_slug" varchar(30),
	"valid_from" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_to" timestamp with time zone NOT NULL,
	"reason" varchar(16) NOT NULL
);
--> statement-breakpoint
CREATE INDEX "consents_account_idx" ON "account_consents" USING btree ("account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_mobile_uq" ON "accounts" USING btree ("mobile");--> statement-breakpoint
CREATE INDEX "audit_resource_idx" ON "audit_log" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "bookmarks_account_idx" ON "bookmarks" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "career_page_idx" ON "career_entries" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "case_summaries_page_idx" ON "case_summaries" USING btree ("page_id");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_code_uq" ON "categories" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_uq" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "court_details_court_idx" ON "court_details" USING btree ("court_id");--> statement-breakpoint
CREATE UNIQUE INDEX "courts_code_uq" ON "courts" USING btree ("code");--> statement-breakpoint
CREATE INDEX "courts_district_idx" ON "courts" USING btree ("district_id");--> statement-breakpoint
CREATE INDEX "courts_import_key_idx" ON "courts" USING btree ("import_key");--> statement-breakpoint
CREATE UNIQUE INDEX "domains_hostname_uq" ON "domains" USING btree ("hostname");--> statement-breakpoint
CREATE INDEX "domains_page_idx" ON "domains" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "highlights_page_idx" ON "highlights" USING btree ("page_id");--> statement-breakpoint
CREATE UNIQUE INDEX "localities_code_uq" ON "localities" USING btree ("code");--> statement-breakpoint
CREATE INDEX "localities_parent_idx" ON "localities" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "memberships_firm_idx" ON "memberships" USING btree ("firm_page_id");--> statement-breakpoint
CREATE INDEX "memberships_advocate_idx" ON "memberships" USING btree ("advocate_page_id");--> statement-breakpoint
CREATE INDEX "office_courts_office_idx" ON "office_courts" USING btree ("office_id");--> statement-breakpoint
CREATE INDEX "offices_page_idx" ON "offices" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "otp_logs_mobile_idx" ON "otp_logs" USING btree ("mobile_hash");--> statement-breakpoint
CREATE INDEX "page_advocate_enrolment_idx" ON "page_advocate" USING btree ("enrolment_no");--> statement-breakpoint
CREATE INDEX "page_categories_page_idx" ON "page_categories" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "page_categories_cat_idx" ON "page_categories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "page_courts_page_idx" ON "page_courts" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "page_courts_court_idx" ON "page_courts" USING btree ("court_id");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_events_uq" ON "page_daily_events" USING btree ("page_id","host","day");--> statement-breakpoint
CREATE INDEX "daily_events_day_idx" ON "page_daily_events" USING btree ("day");--> statement-breakpoint
CREATE INDEX "events_raw_created_idx" ON "page_events_raw" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "events_raw_page_idx" ON "page_events_raw" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "page_languages_page_idx" ON "page_languages" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "page_links_page_idx" ON "page_links" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "page_photos_page_idx" ON "page_photos" USING btree ("page_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pages_slug_uq" ON "pages" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "pages_district_idx" ON "pages" USING btree ("district_id");--> statement-breakpoint
CREATE INDEX "pages_status_idx" ON "pages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pages_account_idx" ON "pages" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "post_categories_cat_idx" ON "post_categories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "posts_page_idx" ON "posts" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "posts_court_idx" ON "posts" USING btree ("court_id");--> statement-breakpoint
CREATE INDEX "posts_type_status_idx" ON "posts" USING btree ("type","status");--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "search_district_idx" ON "search_index" USING btree ("district_code");--> statement-breakpoint
CREATE INDEX "search_latlng_idx" ON "search_index" USING btree ("lat","lng");--> statement-breakpoint
CREATE INDEX "search_page_idx" ON "search_index" USING btree ("page_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_uq" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "sessions_account_idx" ON "sessions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "slug_history_old_idx" ON "slug_history" USING btree ("old_slug");--> statement-breakpoint
CREATE INDEX "slug_history_page_idx" ON "slug_history" USING btree ("page_id");