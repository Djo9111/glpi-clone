--
-- PostgreSQL database dump (MINIMAL SEED)
-- Basé sur ton dump Postgres 17.x
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- *not* creating schema, since initdb creates it
ALTER SCHEMA public OWNER TO postgres;
COMMENT ON SCHEMA public IS '';

--
-- ENUMS
--

CREATE TYPE public."Role" AS ENUM (
    'EMPLOYE',
    'TECHNICIEN',
    'CHEF_DSI'
);
ALTER TYPE public."Role" OWNER TO postgres;

CREATE TYPE public."Statut" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'CLOSED',
    'A_CLOTURER',
    'REJETE',
    'TRANSFERE_MANTIS'
);
ALTER TYPE public."Statut" OWNER TO postgres;

CREATE TYPE public."TypeTicket" AS ENUM (
    'ASSISTANCE',
    'INTERVENTION'
);
ALTER TYPE public."TypeTicket" OWNER TO postgres;

SET default_tablespace = '';
SET default_table_access_method = heap;

--
-- TABLES + SEQUENCES
--

CREATE TABLE public."Application" (
    id integer NOT NULL,
    nom text NOT NULL
);
ALTER TABLE public."Application" OWNER TO postgres;

CREATE SEQUENCE public."Application_id_seq"
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public."Application_id_seq" OWNER TO postgres;
ALTER SEQUENCE public."Application_id_seq" OWNED BY public."Application".id;

CREATE TABLE public."Commentaire" (
    id integer NOT NULL,
    contenu text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "ticketId" integer NOT NULL,
    "auteurId" integer NOT NULL
);
ALTER TABLE public."Commentaire" OWNER TO postgres;

CREATE SEQUENCE public."Commentaire_id_seq"
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public."Commentaire_id_seq" OWNER TO postgres;
ALTER SEQUENCE public."Commentaire_id_seq" OWNED BY public."Commentaire".id;

CREATE TABLE public."Departement" (
    id integer NOT NULL,
    nom text NOT NULL,
    "responsableId" integer
);
ALTER TABLE public."Departement" OWNER TO postgres;

CREATE SEQUENCE public."Departement_id_seq"
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public."Departement_id_seq" OWNER TO postgres;
ALTER SEQUENCE public."Departement_id_seq" OWNED BY public."Departement".id;

CREATE TABLE public."Materiel" (
    id integer NOT NULL,
    nom text NOT NULL
);
ALTER TABLE public."Materiel" OWNER TO postgres;

CREATE SEQUENCE public."Materiel_id_seq"
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public."Materiel_id_seq" OWNER TO postgres;
ALTER SEQUENCE public."Materiel_id_seq" OWNED BY public."Materiel".id;

CREATE TABLE public."Notification" (
    id integer NOT NULL,
    message text NOT NULL,
    "dateEnvoi" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "ticketId" integer NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "userId" integer NOT NULL
);
ALTER TABLE public."Notification" OWNER TO postgres;

CREATE SEQUENCE public."Notification_id_seq"
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public."Notification_id_seq" OWNER TO postgres;
ALTER SEQUENCE public."Notification_id_seq" OWNED BY public."Notification".id;

CREATE TABLE public."PieceJointe" (
    id integer NOT NULL,
    "nomFichier" text NOT NULL,
    chemin text NOT NULL,
    "dateAjout" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "ticketId" integer NOT NULL
);
ALTER TABLE public."PieceJointe" OWNER TO postgres;

CREATE SEQUENCE public."PieceJointe_id_seq"
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public."PieceJointe_id_seq" OWNER TO postgres;
ALTER SEQUENCE public."PieceJointe_id_seq" OWNED BY public."PieceJointe".id;

CREATE TABLE public."Ticket" (
    id integer NOT NULL,
    description text NOT NULL,
    "dateCreation" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    statut public."Statut" DEFAULT 'OPEN'::public."Statut",
    type public."TypeTicket" NOT NULL,
    "createdById" integer NOT NULL,
    "assignedToId" integer,
    "departementId" integer,
    "mailSentAt" timestamp(3) without time zone,
    "applicationId" integer,
    "clotureAt" timestamp(3) without time zone,
    "dureeTraitementMinutes" integer,
    "materielId" integer,
    "prisEnChargeAt" timestamp(3) without time zone,
    "mantisAt" timestamp(3) without time zone,
    "mantisNumero" text
);
ALTER TABLE public."Ticket" OWNER TO postgres;

CREATE SEQUENCE public."Ticket_id_seq"
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public."Ticket_id_seq" OWNER TO postgres;
ALTER SEQUENCE public."Ticket_id_seq" OWNED BY public."Ticket".id;

CREATE TABLE public."Utilisateur" (
    id integer NOT NULL,
    nom text NOT NULL,
    prenom text NOT NULL,
    email text NOT NULL,
    "motDePasse" text NOT NULL,
    role public."Role" DEFAULT 'EMPLOYE'::public."Role" NOT NULL,
    matricule text,
    "departementId" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "codeHierarchique" integer DEFAULT 0 NOT NULL
);
ALTER TABLE public."Utilisateur" OWNER TO postgres;

CREATE SEQUENCE public."Utilisateur_id_seq"
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public."Utilisateur_id_seq" OWNER TO postgres;
ALTER SEQUENCE public."Utilisateur_id_seq" OWNED BY public."Utilisateur".id;

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);
ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- DEFAULTS
--

ALTER TABLE ONLY public."Application" ALTER COLUMN id SET DEFAULT nextval('public."Application_id_seq"'::regclass);
ALTER TABLE ONLY public."Commentaire" ALTER COLUMN id SET DEFAULT nextval('public."Commentaire_id_seq"'::regclass);
ALTER TABLE ONLY public."Departement" ALTER COLUMN id SET DEFAULT nextval('public."Departement_id_seq"'::regclass);
ALTER TABLE ONLY public."Materiel" ALTER COLUMN id SET DEFAULT nextval('public."Materiel_id_seq"'::regclass);
ALTER TABLE ONLY public."Notification" ALTER COLUMN id SET DEFAULT nextval('public."Notification_id_seq"'::regclass);
ALTER TABLE ONLY public."PieceJointe" ALTER COLUMN id SET DEFAULT nextval('public."PieceJointe_id_seq"'::regclass);
ALTER TABLE ONLY public."Ticket" ALTER COLUMN id SET DEFAULT nextval('public."Ticket_id_seq"'::regclass);
ALTER TABLE ONLY public."Utilisateur" ALTER COLUMN id SET DEFAULT nextval('public."Utilisateur_id_seq"'::regclass);

--
-- DATA MINIMALE (SEED)
--

COPY public."Application" (id, nom) FROM stdin;
1	Word
2	Delta
3	Lotus
5	Outlook
6	Navigateur
7	Autre ( à précisez dans la description )
\.

COPY public."Departement" (id, nom, "responsableId") FROM stdin;
1	DSI	\N
2	RH	\N
3	Audit	\N
4	RG	\N
\.

COPY public."Materiel" (id, nom) FROM stdin;
1	Imprimante
2	Écran
3	UC
4	Scanner
5	Téléphone
6	Autre ( à précisez dans la description )
\.

-- Un seul admin (mot de passe bcrypt conservé)
COPY public."Utilisateur" (id, nom, prenom, email, "motDePasse", role, matricule, "departementId", "createdAt", "codeHierarchique") FROM stdin;
3	Admin	System	lmagicien526@gmail.com	$2b$10$2YlgQ/lDcoMxnBLsGjtp7u0Cedx73WCPyH.Ke9HSjz91vZ3VGVndm	CHEF_DSI	ADMIN-001	1	2025-11-10 21:07:56.794	10
\.

-- Prisma migrations (OK à garder)
COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
7529ab33-31eb-483a-940b-aecbb15f5f7a	b5c44070ec34a692b3dd8bdf4d73b64ebf789d7d0290f7911363d2c871c79359	2025-11-10 20:41:19.725806+00	20251006100805_init	\N	\N	2025-11-10 20:41:19.630215+00	1
9e184b19-ceea-4188-8709-7fa952f7ab3b	63584e737543d97a4d1c1f217a44dbe5cc4c3ffa307422cebf3b077e146e0e63	2025-11-10 20:41:20.125845+00	20251021131723_add_code_hierarchique	\N	\N	2025-11-10 20:41:20.114814+00	1
4947e1ef-81ee-4f81-a7e7-44db268b6a08	3ce3ca62099ded7477f03d6135dda0a2e6d6453290fe06a81ab89b442ebddae9	2025-11-10 20:41:19.7376+00	20251006205122_ajout_userid_notifications	\N	\N	2025-11-10 20:41:19.727703+00	1
6b2a05f7-46a6-4281-a35c-57a814237e5f	4f3a5b7ed2986adb0a61e17bc7f165001b235f4215251f5ff5da7b69ac476f6b	2025-11-10 20:41:19.745949+00	20251007143027_add_mail_sent_at_to_ticket	\N	\N	2025-11-10 20:41:19.739367+00	1
2a97e25f-fa1a-40a4-8e5e-54dbc09e2923	baf280373eef6b68c0031aa1e0f14b4d9d653398a86dbe187b3c2c42f24590ef	2025-11-10 20:41:19.783085+00	20251007152028_ajout_commentaires_technicien	\N	\N	2025-11-10 20:41:19.748229+00	1
5863995a-1ad8-4173-9d28-a6b7bfba82a2	999a22eded1438310c203f8c943818d788bc1c3d8248cdd8021d715c801eec43	2025-11-10 20:41:20.151596+00	20251110162129_rename_mantice_to_mantis_fixed	\N	\N	2025-11-10 20:41:20.127976+00	1
b0ebba8f-b9e8-4e86-aab3-0168e63616b5	58dd20427c51b72cec1e49ae6be1bdb37022c978b3ddcdde2710cdb98ac45ff8	2025-11-10 20:41:19.846538+00	20251013094752_fix_depart_responsable_relation	\N	\N	2025-11-10 20:41:19.785392+00	1
c06a98fe-4124-4a4b-b021-5baf14db1ebd	bd6a89a4afc788259eed5b45154b16accd812d0d2c1d5db11e1419be7046619d	2025-11-10 20:41:19.882329+00	20251019194145_add_user_hierarchy_indexes	\N	\N	2025-11-10 20:41:19.848321+00	1
33099e8f-99d5-4d3e-a236-3891eee3b929	e31cd3df06f5272ed930b7ffcfc6c19b6d16cff4204e635154a7840418a6581e	2025-11-10 20:41:19.90546+00	20251019201047_hierarchie_recursive_departements	\N	\N	2025-11-10 20:41:19.883783+00	1
95a93334-0854-4f87-9ba1-857b26b344c9	4314ed09a44c79b20653988dfde2f19c03dbd80ecbb112cde59edfe593bf7d22	2025-11-10 20:41:41.170634+00	20251110204141_rename_mantice_to_mantis_fixed_bis	\N	\N	2025-11-10 20:41:41.15645+00	1
83284940-cd14-463a-911c-0bf86658ee56	d482c946a3844865988e813bab5724ae054b856965ff200e31f572822b5a6c17	20251020083042_ajout_cloisonnement_hierachique	\N	\N	2025-11-10 20:41:19.907372+00	1
2d6630cb-439c-4264-919b-63e3c4686883	8c31e0168b244c0092e0957ceb40060bb6ff03e689adc408b39c699733967ba9	20251020092434_retour_a_ux_amelioree	\N	\N	2025-11-10 20:41:19.979213+00	1
817d9146-806b-41c8-bec4-c519df84a474	eb8924feefd885422dd2b85b5d751c769fbeef626d870d8ef5259b8f7b7eef52	20251020134834_hierarchie_recursive_avec_code	\N	\N	2025-11-10 20:41:20.013323+00	1
e02c2381-9290-486e-8afd-ead6a37090c5	0d95257c4308acb65e4b9ebd32e5d832bdcc18920b6ef8b54da7eae66fe5ffdc	20251020135007_retour	\N	\N	2025-11-10 20:41:20.04079+00	1
024ae411-7e24-4b54-a8c2-6de0039d2c0f	4b994b48c14b2ef18cd066cb7c36504421022beed938db40a60aaa90b36385fe	20251021101012_hierarchie_recursive_avec_code2	\N	\N	2025-11-10 20:41:20.057522+00	1
21d667ee-0f1e-4362-bd7c-5690d5de6052	b432990e23fc26356ed38fc56e95d14db961d4ccfd93822b464d2f82831d12d5	20251021131250_retour	\N	\N	2025-11-10 20:41:20.09483+00	1
\.

--
-- SEQUENCES SET (cohérent avec les données minimales)
--

SELECT pg_catalog.setval('public."Application_id_seq"', 7, true);
SELECT pg_catalog.setval('public."Departement_id_seq"', 4, true);
SELECT pg_catalog.setval('public."Materiel_id_seq"', 6, true);
SELECT pg_catalog.setval('public."Utilisateur_id_seq"', 3, true);

-- Tables sans données -> séquences reset
SELECT pg_catalog.setval('public."Ticket_id_seq"', 1, false);
SELECT pg_catalog.setval('public."Commentaire_id_seq"', 1, false);
SELECT pg_catalog.setval('public."Notification_id_seq"', 1, false);
SELECT pg_catalog.setval('public."PieceJointe_id_seq"', 1, false);

--
-- CONSTRAINTS + INDEXES
--

ALTER TABLE ONLY public."Application"
    ADD CONSTRAINT "Application_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY public."Commentaire"
    ADD CONSTRAINT "Commentaire_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY public."Departement"
    ADD CONSTRAINT "Departement_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY public."Materiel"
    ADD CONSTRAINT "Materiel_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY public."PieceJointe"
    ADD CONSTRAINT "PieceJointe_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY public."Utilisateur"
    ADD CONSTRAINT "Utilisateur_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);

CREATE UNIQUE INDEX "Application_nom_key" ON public."Application" USING btree (nom);
CREATE INDEX "Commentaire_ticketId_createdAt_idx" ON public."Commentaire" USING btree ("ticketId", "createdAt");
CREATE UNIQUE INDEX "Departement_nom_key" ON public."Departement" USING btree (nom);
CREATE UNIQUE INDEX "Materiel_nom_key" ON public."Materiel" USING btree (nom);
CREATE INDEX "Utilisateur_departementId_codeHierarchique_idx" ON public."Utilisateur" USING btree ("departementId", "codeHierarchique");
CREATE UNIQUE INDEX "Utilisateur_email_key" ON public."Utilisateur" USING btree (email);
CREATE UNIQUE INDEX "Utilisateur_matricule_key" ON public."Utilisateur" USING btree (matricule);

--
-- FOREIGN KEYS
--

ALTER TABLE ONLY public."Commentaire"
    ADD CONSTRAINT "Commentaire_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES public."Utilisateur"(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY public."Commentaire"
    ADD CONSTRAINT "Commentaire_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."Ticket"(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY public."Departement"
    ADD CONSTRAINT "Departement_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES public."Utilisateur"(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."Ticket"(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Utilisateur"(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY public."PieceJointe"
    ADD CONSTRAINT "PieceJointe_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."Ticket"(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES public."Application"(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public."Utilisateur"(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."Utilisateur"(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_departementId_fkey" FOREIGN KEY ("departementId") REFERENCES public."Departement"(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_materielId_fkey" FOREIGN KEY ("materielId") REFERENCES public."Materiel"(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public."Utilisateur"
    ADD CONSTRAINT "Utilisateur_departementId_fkey" FOREIGN KEY ("departementId") REFERENCES public."Departement"(id) ON UPDATE CASCADE ON DELETE SET NULL;

--
-- ACL
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;

--
-- END
--
