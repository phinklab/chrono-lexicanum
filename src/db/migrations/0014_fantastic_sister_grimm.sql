CREATE TABLE "preview_invite_activations" (
	"jti" varchar(64) PRIMARY KEY NOT NULL,
	"first_activated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_activated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"count" integer DEFAULT 1 NOT NULL
);
