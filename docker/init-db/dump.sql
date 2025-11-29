--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

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

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'EMPLOYE',
    'TECHNICIEN',
    'CHEF_DSI'
);


ALTER TYPE public."Role" OWNER TO postgres;

--
-- Name: Statut; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Statut" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'CLOSED',
    'A_CLOTURER',
    'REJETE',
    'TRANSFERE_MANTIS'
);


ALTER TYPE public."Statut" OWNER TO postgres;

--
-- Name: TypeTicket; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TypeTicket" AS ENUM (
    'ASSISTANCE',
    'INTERVENTION'
);


ALTER TYPE public."TypeTicket" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Application; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Application" (
    id integer NOT NULL,
    nom text NOT NULL
);


ALTER TABLE public."Application" OWNER TO postgres;

--
-- Name: Application_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Application_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Application_id_seq" OWNER TO postgres;

--
-- Name: Application_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Application_id_seq" OWNED BY public."Application".id;


--
-- Name: Commentaire; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Commentaire" (
    id integer NOT NULL,
    contenu text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "ticketId" integer NOT NULL,
    "auteurId" integer NOT NULL
);


ALTER TABLE public."Commentaire" OWNER TO postgres;

--
-- Name: Commentaire_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Commentaire_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Commentaire_id_seq" OWNER TO postgres;

--
-- Name: Commentaire_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Commentaire_id_seq" OWNED BY public."Commentaire".id;


--
-- Name: Departement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Departement" (
    id integer NOT NULL,
    nom text NOT NULL,
    "responsableId" integer
);


ALTER TABLE public."Departement" OWNER TO postgres;

--
-- Name: Departement_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Departement_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Departement_id_seq" OWNER TO postgres;

--
-- Name: Departement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Departement_id_seq" OWNED BY public."Departement".id;


--
-- Name: Materiel; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Materiel" (
    id integer NOT NULL,
    nom text NOT NULL
);


ALTER TABLE public."Materiel" OWNER TO postgres;

--
-- Name: Materiel_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Materiel_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Materiel_id_seq" OWNER TO postgres;

--
-- Name: Materiel_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Materiel_id_seq" OWNED BY public."Materiel".id;


--
-- Name: Notification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Notification" (
    id integer NOT NULL,
    message text NOT NULL,
    "dateEnvoi" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "ticketId" integer NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "userId" integer NOT NULL
);


ALTER TABLE public."Notification" OWNER TO postgres;

--
-- Name: Notification_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Notification_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Notification_id_seq" OWNER TO postgres;

--
-- Name: Notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Notification_id_seq" OWNED BY public."Notification".id;


--
-- Name: PieceJointe; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PieceJointe" (
    id integer NOT NULL,
    "nomFichier" text NOT NULL,
    chemin text NOT NULL,
    "dateAjout" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "ticketId" integer NOT NULL
);


ALTER TABLE public."PieceJointe" OWNER TO postgres;

--
-- Name: PieceJointe_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PieceJointe_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PieceJointe_id_seq" OWNER TO postgres;

--
-- Name: PieceJointe_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PieceJointe_id_seq" OWNED BY public."PieceJointe".id;


--
-- Name: Ticket; Type: TABLE; Schema: public; Owner: postgres
--

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

--
-- Name: Ticket_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Ticket_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Ticket_id_seq" OWNER TO postgres;

--
-- Name: Ticket_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Ticket_id_seq" OWNED BY public."Ticket".id;


--
-- Name: Utilisateur; Type: TABLE; Schema: public; Owner: postgres
--

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

--
-- Name: Utilisateur_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Utilisateur_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Utilisateur_id_seq" OWNER TO postgres;

--
-- Name: Utilisateur_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Utilisateur_id_seq" OWNED BY public."Utilisateur".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

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
-- Name: Application id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Application" ALTER COLUMN id SET DEFAULT nextval('public."Application_id_seq"'::regclass);


--
-- Name: Commentaire id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Commentaire" ALTER COLUMN id SET DEFAULT nextval('public."Commentaire_id_seq"'::regclass);


--
-- Name: Departement id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Departement" ALTER COLUMN id SET DEFAULT nextval('public."Departement_id_seq"'::regclass);


--
-- Name: Materiel id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Materiel" ALTER COLUMN id SET DEFAULT nextval('public."Materiel_id_seq"'::regclass);


--
-- Name: Notification id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification" ALTER COLUMN id SET DEFAULT nextval('public."Notification_id_seq"'::regclass);


--
-- Name: PieceJointe id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PieceJointe" ALTER COLUMN id SET DEFAULT nextval('public."PieceJointe_id_seq"'::regclass);


--
-- Name: Ticket id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket" ALTER COLUMN id SET DEFAULT nextval('public."Ticket_id_seq"'::regclass);


--
-- Name: Utilisateur id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Utilisateur" ALTER COLUMN id SET DEFAULT nextval('public."Utilisateur_id_seq"'::regclass);


--
-- Data for Name: Application; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Application" (id, nom) FROM stdin;
1	Word
2	Delta
3	Lotus
5	Outlook
6	Navigateur
7	Autre ( à précisez dans la description )
\.


--
-- Data for Name: Commentaire; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Commentaire" (id, contenu, "createdAt", "updatedAt", "ticketId", "auteurId") FROM stdin;
1	Hey	2025-11-10 21:13:52.826	2025-11-10 21:13:52.826	1	4
2	Amen	2025-11-10 21:14:37.059	2025-11-10 21:14:37.059	2	4
3	Please.	2025-11-11 09:58:08.253	2025-11-11 09:58:08.253	3	4
4	Aidez moi.	2025-11-11 10:10:26.569	2025-11-11 10:10:26.569	5	7
5	Pris en charge.	2025-11-11 10:16:27.218	2025-11-11 10:16:27.218	6	5
6	Problème général on va devoir le rejeté.	2025-11-11 10:27:25.008	2025-11-11 10:27:25.008	11	6
7	OK.	2025-11-11 16:28:11.945	2025-11-11 16:28:11.945	19	3
8	Busy.	2025-11-12 08:24:22.372	2025-11-12 08:24:22.372	20	4
9	Contactez yacime.	2025-11-12 08:27:24.978	2025-11-12 08:27:24.978	20	3
10	Ok je dois cloturé?	2025-11-12 08:31:39.56	2025-11-12 08:31:39.56	21	7
11	J'attend.	2025-11-13 16:06:36.835	2025-11-13 16:06:36.835	25	10
12	D'accord mendy	2025-11-13 16:10:00.684	2025-11-13 16:10:00.684	25	3
13	Identifiant please?	2025-11-14 08:54:36.027	2025-11-14 08:54:36.027	28	3
14	Veuillez clôturez	2025-11-14 08:59:35.784	2025-11-14 08:59:35.784	1	5
15	Ndour s'en charge.	2025-11-17 08:16:36.486	2025-11-17 08:16:36.486	29	3
16	Parfait.	2025-11-17 09:35:22.981	2025-11-17 09:35:22.981	26	12
17	Help.	2025-11-18 08:24:07.128	2025-11-18 08:24:07.128	30	8
18	Help YT.	2025-11-18 08:26:15.54	2025-11-18 08:26:15.54	32	10
19	Ok	2025-11-25 20:49:56.379	2025-11-25 20:49:56.379	44	5
\.


--
-- Data for Name: Departement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Departement" (id, nom, "responsableId") FROM stdin;
1	DSI	\N
2	RH	\N
3	Audit	\N
4	RG	\N
\.


--
-- Data for Name: Materiel; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Materiel" (id, nom) FROM stdin;
1	Imprimante
2	Écran
3	UC
4	Scanner
5	Téléphone
6	Autre ( à précisez dans la description )
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Notification" (id, message, "dateEnvoi", "ticketId", "isRead", "userId") FROM stdin;
1	Nouveau ticket #1 (ASSISTANCE) • App: Word — Babacar Mbaye	2025-11-10 21:13:35.96	1	t	3
2	Nouveau ticket #2 (INTERVENTION) • Matériel: Excel — Babacar Mbaye	2025-11-10 21:14:22.618	2	t	3
24	Votre ticket #8 a été assigné à Fassar Ndour.	2025-11-11 10:14:53.128	8	f	8
26	Votre ticket #7 a été assigné à Djo Gss.	2025-11-11 10:14:59.897	7	f	8
9	Nouveau ticket #3 (ASSISTANCE) • App: Navigateur — Babacar Mbaye	2025-11-11 09:57:45.757	3	t	3
10	Nouveau ticket #4 (INTERVENTION) • Matériel: Écran — Babacar Mbaye	2025-11-11 10:00:13.2	4	t	3
11	Nouveau ticket #5 (ASSISTANCE) • App: Lotus — Modienne Guissé	2025-11-11 10:10:12.934	5	t	3
12	Nouveau ticket #6 (INTERVENTION) • Matériel: Imprimante — Modienne Guissé	2025-11-11 10:10:49.755	6	t	3
13	Nouveau ticket #7 (ASSISTANCE) • App: Outlook — Maya Ndiaye	2025-11-11 10:13:14.786	7	t	3
14	Nouveau ticket #8 (INTERVENTION) • Matériel: UC — Maya Ndiaye	2025-11-11 10:13:56.235	8	t	3
3	Ticket #2 vous a été assigné.	2025-11-10 21:15:12.702	2	t	5
5	Ticket #1 vous a été assigné.	2025-11-10 21:15:20.65	1	t	5
21	Ticket #6 vous a été assigné.	2025-11-11 10:14:47.245	6	t	5
23	Ticket #8 vous a été assigné.	2025-11-11 10:14:53.128	8	t	5
28	Le statut de votre ticket #8 est passé à "En cours".	2025-11-11 10:16:03.235	8	f	8
30	Le statut de votre ticket #7 est passé à "En cours".	2025-11-11 10:17:33.77	7	f	8
32	Votre ticket #7 a été transféré à mantis (N° MNT-11-11-2025).	2025-11-11 10:18:15.264	7	f	8
4	Votre ticket #2 a été assigné à Fassar Ndour.	2025-11-10 21:15:12.702	2	t	4
6	Votre ticket #1 a été assigné à Fassar Ndour.	2025-11-10 21:15:20.65	1	t	4
7	Le statut de votre ticket #1 est passé à "En cours".	2025-11-10 21:15:26.205	1	t	4
8	Votre ticket #2 a été transféré à mantis (N° MNT-001).	2025-11-10 21:16:11.495	2	t	4
16	Votre ticket #3 a été assigné à Yacine Fall.	2025-11-11 10:14:27.697	3	t	4
18	Votre ticket #4 a été assigné à Yacine Fall.	2025-11-11 10:14:34.429	4	t	4
27	Le statut de votre ticket #2 est passé à "À clôturer".	2025-11-11 10:15:52.733	2	t	4
15	Ticket #3 vous a été assigné.	2025-11-11 10:14:27.697	3	t	12
17	Ticket #4 vous a été assigné.	2025-11-11 10:14:34.429	4	t	12
19	Ticket #5 vous a été assigné.	2025-11-11 10:14:41.71	5	t	6
25	Ticket #7 vous a été assigné.	2025-11-11 10:14:59.897	7	t	6
35	Nouveau ticket #9 (INTERVENTION) • Matériel: Scanner — Cheikh Ndiaye	2025-11-11 10:23:40.15	9	t	3
36	Nouveau ticket #10 (INTERVENTION) • Matériel: Écran — Piwe Mendy	2025-11-11 10:24:31.094	10	t	3
37	Nouveau ticket #11 (INTERVENTION) • Matériel: Imprimante — Weuthie Ly	2025-11-11 10:25:13.497	11	t	3
39	Votre ticket #11 a été assigné à Djo Gss.	2025-11-11 10:25:40.547	11	t	11
44	Le statut de votre ticket #11 est passé à "Rejeté".	2025-11-11 10:27:21.081	11	t	11
47	Votre ticket #8 a été clôturé.	2025-11-11 10:34:23.683	8	f	8
52	Nouveau ticket #12 (ASSISTANCE) • App: Word — Piwe Mendy	2025-11-11 11:41:37.128	12	t	3
53	Nouveau ticket #13 (INTERVENTION) • Matériel: Écran — Piwe Mendy	2025-11-11 11:41:57.585	13	t	3
60	Nouveau ticket #14 (ASSISTANCE) — Weuthie Ly	2025-11-11 11:48:03.645	14	t	3
63	Nouveau ticket #15 (INTERVENTION) • Matériel: Imprimante — Maya Ndiaye	2025-11-11 11:51:28.77	15	t	3
65	Votre ticket #15 a été assigné à Fassar Ndour.	2025-11-11 11:51:52.136	15	f	8
66	Le statut de votre ticket #15 est passé à "En cours".	2025-11-11 11:52:11.005	15	f	8
68	Votre ticket #15 a été transféré à MANTIS (N° 11-11-2025-11-52).	2025-11-11 11:52:46.894	15	f	8
61	Ticket #14 vous a été assigné.	2025-11-11 11:51:04.848	14	t	5
64	Ticket #15 vous a été assigné.	2025-11-11 11:51:52.136	15	t	5
20	Votre ticket #5 a été assigné à Djo Gss.	2025-11-11 10:14:41.71	5	t	7
22	Votre ticket #6 a été assigné à Fassar Ndour.	2025-11-11 10:14:47.245	6	t	7
29	Le statut de votre ticket #6 est passé à "En cours".	2025-11-11 10:16:08.377	6	t	7
48	Votre ticket #6 a été clôturé.	2025-11-11 10:34:37.024	6	t	7
41	Votre ticket #10 a été assigné à Djo Gss.	2025-11-11 10:25:47.829	10	t	10
45	Le statut de votre ticket #10 est passé à "Rejeté".	2025-11-11 10:28:16.363	10	t	10
55	Votre ticket #13 a été assigné à Yacine Fall.	2025-11-11 11:42:58.912	13	t	10
57	Votre ticket #12 a été assigné à Yacine Fall.	2025-11-11 11:43:05.305	12	t	10
58	Votre ticket #13 a été transféré à MANTIS (N° MNT-11-11-2025-11-45).	2025-11-11 11:45:50.727	13	t	10
38	Ticket #11 vous a été assigné.	2025-11-11 10:25:40.547	11	t	6
40	Ticket #10 vous a été assigné.	2025-11-11 10:25:47.829	10	t	6
42	Ticket #9 vous a été assigné.	2025-11-11 10:26:20.834	9	t	6
54	Ticket #13 vous a été assigné.	2025-11-11 11:42:58.912	13	t	12
56	Ticket #12 vous a été assigné.	2025-11-11 11:43:05.305	12	t	12
33	Le statut de votre ticket #4 est passé à "En cours".	2025-11-11 10:20:40.855	4	t	4
34	Le statut de votre ticket #3 est passé à "En cours".	2025-11-11 10:20:46.874	3	t	4
49	Votre ticket #3 a été clôturé.	2025-11-11 10:34:43.283	3	t	4
50	Votre ticket #4 a été clôturé.	2025-11-11 10:34:51.161	4	t	4
62	Votre ticket #14 a été assigné à Fassar Ndour.	2025-11-11 11:51:04.848	14	t	11
67	Le statut de votre ticket #14 est passé à "En cours".	2025-11-11 11:52:18.446	14	t	11
69	Votre ticket #14 a été rejeté.	2025-11-11 11:52:57.655	14	t	11
43	Votre ticket #9 a été assigné à Djo Gss.	2025-11-11 10:26:20.834	9	t	9
46	Le statut de votre ticket #9 est passé à "Rejeté".	2025-11-11 10:28:23.463	9	t	9
140	Votre ticket #30 a été assigné à Djo Gss.	2025-11-18 08:27:19.43	30	f	8
141	Ticket #31 vous a été assigné.	2025-11-18 08:27:27.305	31	f	5
142	Votre ticket #31 a été assigné à Fassar Ndour.	2025-11-18 08:27:27.305	31	f	11
143	Ticket #32 vous a été assigné.	2025-11-18 08:27:33.495	32	f	5
144	Votre ticket #32 a été assigné à Fassar Ndour.	2025-11-18 08:27:33.495	32	t	10
31	Le statut de votre ticket #5 est passé à "En cours".	2025-11-11 10:17:40.27	5	t	7
51	Votre ticket #5 a été clôturé.	2025-11-11 10:34:57.09	5	t	7
72	Votre ticket #16 a été assigné à Djo Gss.	2025-11-11 12:38:35.27	16	f	8
59	Votre ticket #12 a été rejeté.	2025-11-11 11:46:01.004	12	t	10
78	Votre ticket #18 a été assigné à Djo Gss.	2025-11-11 12:54:06.902	18	t	7
79	Votre ticket #18 a été rejeté.	2025-11-11 12:54:39.591	18	t	7
71	Ticket #16 vous a été assigné.	2025-11-11 12:38:35.27	16	t	6
77	Ticket #18 vous a été assigné.	2025-11-11 12:54:06.902	18	t	6
81	Ticket #19 vous a été assigné.	2025-11-11 12:58:01.982	19	t	6
82	Votre ticket #19 a été assigné à Djo Gss.	2025-11-11 12:58:01.982	19	t	7
83	Votre ticket #19 a été transféré à MANTIS (N° MNT-11-11-2025-12-58).	2025-11-11 12:58:50.047	19	t	7
84	Le numéro mantis de votre ticket #19 est : MNT-11-11-2025-13-00.	2025-11-11 13:00:15.706	19	t	7
74	Ticket #17 vous a été assigné.	2025-11-11 12:41:41.815	17	t	12
70	Nouveau ticket #16 (ASSISTANCE) • App: Lotus — Maya Ndiaye	2025-11-11 12:38:03.726	16	t	3
73	Nouveau ticket #17 (INTERVENTION) • Matériel: UC — Piwe Mendy	2025-11-11 12:41:22.165	17	t	3
76	Nouveau ticket #18 (ASSISTANCE) — Modienne Guissé	2025-11-11 12:50:12.695	18	t	3
80	Nouveau ticket #19 (INTERVENTION) • Matériel: Imprimante — Modienne Guissé	2025-11-11 12:57:35.365	19	t	3
85	Nouveau ticket #20 (INTERVENTION) • Matériel: Écran — Babacar Mbaye	2025-11-12 08:24:02.049	20	t	3
86	Nouveau ticket #21 (ASSISTANCE) • App: Lotus — Modienne Guissé	2025-11-12 08:26:03.949	21	t	3
87	Ticket #21 vous a été assigné.	2025-11-12 08:26:48.667	21	t	6
88	Votre ticket #21 a été assigné à Djo Gss.	2025-11-12 08:26:48.667	21	t	7
92	Le statut de votre ticket #21 est passé à "En cours".	2025-11-12 08:29:11.973	21	t	7
93	Votre ticket #21 a été transféré à MANTIS (N° MNT-12-11-2025).	2025-11-12 08:29:36.296	21	t	7
94	Le statut de votre ticket #21 est passé à "À clôturer".	2025-11-12 08:32:24.636	21	t	7
75	Votre ticket #17 a été assigné à Yacine Fall.	2025-11-11 12:41:41.815	17	t	10
95	Le statut de votre ticket #17 est passé à "À clôturer".	2025-11-13 09:44:46.564	17	t	10
96	Nouveau ticket #22 (ASSISTANCE) • App: Outlook — Babacar Mbaye	2025-11-13 10:19:05.497	22	t	3
99	Nouveau ticket #23 (ASSISTANCE) • App: Delta — Modienne Guissé	2025-11-13 12:48:27.876	23	t	3
100	Nouveau ticket #24 (ASSISTANCE) — Modienne Guissé	2025-11-13 12:49:21.121	24	t	3
101	Nouveau ticket #25 (INTERVENTION) • Matériel: Scanner — Piwe Mendy	2025-11-13 16:03:53.851	25	t	3
105	Votre ticket #25 a été assigné à Djo Gss.	2025-11-13 16:09:23.916	25	t	10
108	Le statut de votre ticket #25 est passé à "En cours".	2025-11-13 16:10:06.732	25	t	10
117	Votre ticket #26 a été assigné à Yacine Fall.	2025-11-14 08:53:26.25	26	f	11
97	Ticket #22 vous a été assigné.	2025-11-13 10:20:00.741	22	t	5
114	Ticket #27 vous a été assigné.	2025-11-14 08:53:17.722	27	t	5
121	Votre ticket #15 a été clôturé.	2025-11-14 09:00:10.026	15	f	8
89	Ticket #20 vous a été assigné.	2025-11-12 08:26:57.951	20	t	12
112	Ticket #28 vous a été assigné.	2025-11-14 08:53:09.668	28	t	12
116	Ticket #26 vous a été assigné.	2025-11-14 08:53:26.25	26	t	12
123	Le statut de votre ticket #26 est passé à "En cours".	2025-11-14 09:01:13.696	26	f	11
90	Votre ticket #20 a été assigné à Yacine Fall.	2025-11-12 08:26:57.951	20	t	4
91	Le statut de votre ticket #20 est passé à "En cours".	2025-11-12 08:27:51.201	20	t	4
98	Votre ticket #22 a été assigné à Fassar Ndour.	2025-11-13 10:20:00.741	22	t	4
119	Le statut de votre ticket #1 est passé à "À clôturer".	2025-11-14 08:59:32.169	1	t	4
109	Nouveau ticket #26 (INTERVENTION) • Matériel: UC — Weuthie Ly	2025-11-14 08:35:52.189	26	t	3
110	Nouveau ticket #27 (ASSISTANCE) • App: Delta — Piwe Mendy	2025-11-14 08:46:28.21	27	t	3
111	Nouveau ticket #28 (ASSISTANCE) • App: Outlook — Cheikh Ndiaye	2025-11-14 08:48:13.276	28	t	3
103	Votre ticket #23 a été assigné à Djo Gss.	2025-11-13 16:09:15.954	23	t	7
107	Votre ticket #24 a été assigné à Djo Gss.	2025-11-13 16:09:31.64	24	t	7
115	Votre ticket #27 a été assigné à Fassar Ndour.	2025-11-14 08:53:17.722	27	t	10
120	Le statut de votre ticket #27 est passé à "En cours".	2025-11-14 08:59:51.77	27	t	10
122	Votre ticket #17 a été clôturé.	2025-11-14 09:00:45.592	17	t	10
124	Nouveau ticket #29 (ASSISTANCE) • App: Word — Piwe Mendy	2025-11-17 08:14:28.006	29	t	3
125	Ticket #29 vous a été assigné.	2025-11-17 08:15:42.291	29	t	5
126	Votre ticket #29 a été assigné à Fassar Ndour.	2025-11-17 08:15:42.291	29	t	10
127	Le statut de votre ticket #29 est passé à "En cours".	2025-11-17 08:19:59.374	29	t	10
129	Le statut de votre ticket #27 est passé à "À clôturer".	2025-11-17 08:20:26.52	27	t	10
102	Ticket #23 vous a été assigné.	2025-11-13 16:09:15.954	23	t	6
104	Ticket #25 vous a été assigné.	2025-11-13 16:09:23.916	25	t	6
106	Ticket #24 vous a été assigné.	2025-11-13 16:09:31.64	24	t	6
132	Votre ticket #26 a été clôturé.	2025-11-17 08:22:47.403	26	f	11
113	Votre ticket #28 a été assigné à Yacine Fall.	2025-11-14 08:53:09.668	28	t	9
118	Le statut de votre ticket #28 est passé à "En cours".	2025-11-14 08:54:41.497	28	t	9
131	Votre ticket #28 a été clôturé.	2025-11-17 08:22:41.272	28	t	9
134	Nouveau ticket #30 (INTERVENTION) • Matériel: UC — Maya Ndiaye	2025-11-18 08:23:57.239	30	t	3
135	Nouveau ticket #31 (INTERVENTION) • Matériel: Écran — Weuthie Ly	2025-11-18 08:25:21.472	31	t	3
130	Votre ticket #25 a été clôturé.	2025-11-17 08:22:08.471	25	t	10
138	Votre ticket #29 a été clôturé.	2025-11-18 08:27:07.176	29	t	10
145	Ticket #33 vous a été assigné.	2025-11-18 08:27:39.492	33	f	5
128	Votre ticket #22 a été clôturé.	2025-11-17 08:20:13.273	22	t	4
133	Votre ticket #20 a été clôturé.	2025-11-17 08:22:54.695	20	t	4
146	Votre ticket #33 a été assigné à Fassar Ndour.	2025-11-18 08:27:39.492	33	t	4
149	Ticket #35 vous a été assigné.	2025-11-18 08:50:58.002	35	f	12
150	Votre ticket #35 a été assigné à Yacine Fall.	2025-11-18 08:50:58.002	35	f	4
151	Le statut de votre ticket #16 est passé à "En cours".	2025-11-18 09:34:19.95	16	f	8
139	Ticket #30 vous a été assigné.	2025-11-18 08:27:19.43	30	t	6
136	Nouveau ticket #32 (ASSISTANCE) • App: Navigateur — Piwe Mendy	2025-11-18 08:26:04.048	32	t	3
137	Nouveau ticket #33 (INTERVENTION) • Matériel: Scanner — Babacar Mbaye	2025-11-18 08:26:39.121	33	t	3
147	Nouveau ticket #34 (ASSISTANCE) • App: Lotus — Modienne Guissé	2025-11-18 08:42:25.053	34	t	3
148	Nouveau ticket #35 (INTERVENTION) • Matériel: Imprimante — Babacar Mbaye	2025-11-18 08:49:49.46	35	t	3
153	Ticket #36 vous a été assigné.	2025-11-18 10:25:56.645	36	f	5
154	Votre ticket #36 a été assigné à Fassar Ndour.	2025-11-18 10:25:56.645	36	f	10
155	Ticket #36 vous a été assigné.	2025-11-18 10:25:59.145	36	f	12
156	Votre ticket #36 a été assigné à Yacine Fall.	2025-11-18 10:25:59.145	36	f	10
157	Ticket #34 vous a été assigné.	2025-11-18 10:26:10.333	34	f	12
158	Votre ticket #34 a été assigné à Yacine Fall.	2025-11-18 10:26:10.333	34	f	7
159	Votre ticket #36 a été clôturé.	2025-11-18 10:29:25.382	36	f	10
160	Votre ticket #23 a été clôturé.	2025-11-18 10:29:33.336	23	f	7
161	Votre ticket #32 a été clôturé.	2025-11-18 10:29:47.865	32	f	10
162	Votre ticket #30 a été clôturé.	2025-11-18 10:29:54.42	30	f	8
163	Votre ticket #24 a été clôturé.	2025-11-18 10:30:09.173	24	f	7
164	Votre ticket #31 a été clôturé.	2025-11-18 10:30:38.87	31	f	11
166	Ticket #37 vous a été assigné.	2025-11-18 10:33:31.471	37	f	12
167	Votre ticket #37 a été assigné à Yacine Fall.	2025-11-18 10:33:31.471	37	f	9
169	Ticket #38 vous a été assigné.	2025-11-18 10:35:32.257	38	f	12
170	Votre ticket #38 a été assigné à Yacine Fall.	2025-11-18 10:35:32.257	38	f	4
174	Ticket #41 vous a été assigné.	2025-11-18 10:48:02.393	41	f	6
175	Votre ticket #41 a été assigné à Djo Gss.	2025-11-18 10:48:02.393	41	f	11
176	Ticket #40 vous a été assigné.	2025-11-18 10:48:11.763	40	f	6
177	Votre ticket #40 a été assigné à Djo Gss.	2025-11-18 10:48:11.763	40	f	9
178	Ticket #39 vous a été assigné.	2025-11-18 10:48:21.805	39	f	5
179	Votre ticket #39 a été assigné à Fassar Ndour.	2025-11-18 10:48:21.805	39	f	4
152	Nouveau ticket #36 (INTERVENTION) • Matériel: UC — Piwe Mendy	2025-11-18 10:25:00.606	36	t	3
165	Nouveau ticket #37 (INTERVENTION) • Matériel: Écran — Cheikh Ndiaye	2025-11-18 10:32:16.228	37	t	3
168	Nouveau ticket #38 (ASSISTANCE) • App: Outlook — Babacar Mbaye	2025-11-18 10:34:11.774	38	t	3
171	Nouveau ticket #39 (INTERVENTION) • Matériel: Scanner — Babacar Mbaye	2025-11-18 10:46:23.334	39	t	3
172	Nouveau ticket #40 (INTERVENTION) • Matériel: UC — Cheikh Ndiaye	2025-11-18 10:46:54.695	40	t	3
173	Nouveau ticket #41 (INTERVENTION) • Matériel: Écran — Weuthie Ly	2025-11-18 10:47:21.153	41	t	3
180	Votre ticket #16 a été clôturé.	2025-11-18 10:48:53.942	16	f	8
182	Ticket #42 vous a été assigné.	2025-11-18 10:58:43.492	42	f	6
183	Votre ticket #42 a été assigné à Djo Gss.	2025-11-18 10:58:43.492	42	f	14
181	Nouveau ticket #42 (INTERVENTION) • Matériel: Téléphone — Mame Kayounga	2025-11-18 10:58:11.659	42	t	3
184	Nouveau ticket #43 (INTERVENTION) • Matériel: Écran — Al Jamila	2025-11-21 08:54:13.351	43	f	3
185	Nouveau ticket #44 (ASSISTANCE) • App: Navigateur — Piwe Mendy	2025-11-25 20:48:30.286	44	f	3
186	Ticket #44 vous a été assigné.	2025-11-25 20:48:54.718	44	f	5
187	Votre ticket #44 a été assigné à Fassar Ndour.	2025-11-25 20:48:54.718	44	f	10
188	Le statut de votre ticket #44 est passé à "En cours".	2025-11-25 20:49:29.183	44	f	10
189	Votre ticket #44 a été clôturé.	2025-11-25 20:50:09.33	44	f	10
190	Nouveau ticket #45 (INTERVENTION) • Matériel: Imprimante — Babacar Mbaye	2025-11-25 20:51:37.648	45	f	3
191	Nouveau ticket #46 (INTERVENTION) • Matériel: Écran — Cheikh Ndiaye	2025-11-25 20:58:44.863	46	f	3
\.


--
-- Data for Name: PieceJointe; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PieceJointe" (id, "nomFichier", chemin, "dateAjout", "ticketId") FROM stdin;
1	c5e93ba29d6dfb63cdcaa01ff39dcc93.png	/uploads/tickets/1/1762809215936_c5e93ba29d6dfb63cdcaa01ff39dcc93.png	2025-11-10 21:13:35.947	1
2	rapport_odoo.pdf	/uploads/tickets/2/1762809262590_rapport_odoo.pdf	2025-11-10 21:14:22.605	2
3	c5e93ba29d6dfb63cdcaa01ff39dcc93.png	/uploads/tickets/3/1762855065738_c5e93ba29d6dfb63cdcaa01ff39dcc93.png	2025-11-11 09:57:45.747	3
4	WhatsApp Image 2025-11-10 à 10.13.18_a1946434.jpg	/uploads/tickets/4/1762855213173_whatsapp-image-2025-11-10-10.13.18_a1946434.jpg	2025-11-11 10:00:13.185	4
5	Présentation React js.pdf	/uploads/tickets/5/1762855812856_pr-sentation-react-js.pdf	2025-11-11 10:10:12.919	5
6	react-hooks-cheatsheet.pdf	/uploads/tickets/7/1762855994759_react-hooks-cheatsheet.pdf	2025-11-11 10:13:14.772	7
7	background.jpg	/uploads/tickets/9/1762856620130_background.jpg	2025-11-11 10:23:40.14	9
8	cds.png	/uploads/tickets/10/1762856671065_cds.png	2025-11-11 10:24:31.074	10
9	background.jpg	/uploads/tickets/16/1762864683695_background.jpg	2025-11-11 12:38:03.713	16
10	Inventaire.docx	/uploads/tickets/18/1762865412675_inventaire.docx	2025-11-11 12:50:12.683	18
11	rapport_architecture_initiale_microservices.docx	/uploads/tickets/19/1762865855349_rapport_architecture_initiale_microservices.docx	2025-11-11 12:57:35.355	19
12	GUIDE_ETUDIANT_2024_2025.pdf	/uploads/tickets/20/1762935841949_guide_etudiant_2024_2025.pdf	2025-11-12 08:24:02.029	20
13	Capture d'écran 2025-11-13 095826.png	/uploads/tickets/25/1763049833834_capture-d-cran-2025-11-13-095826.png	2025-11-13 16:03:53.84	25
14	Capture d'écran 2025-11-13 085301.png	/uploads/tickets/26/1763109352168_capture-d-cran-2025-11-13-085301.png	2025-11-14 08:35:52.175	26
15	requirements.txt	/uploads/tickets/29/1763367267986_requirements.txt	2025-11-17 08:14:27.994	29
16	requirements.txt	/uploads/tickets/32/1763454364031_requirements.txt	2025-11-18 08:26:04.038	32
17	image.jpg	/uploads/tickets/44/1764103710249_image.jpg	2025-11-25 20:48:30.26	44
18	ucad.jpg	/uploads/tickets/45/1764103897631_ucad.jpg	2025-11-25 20:51:37.637	45
19	image.jpg	/uploads/tickets/46/1764104324842_image.jpg	2025-11-25 20:58:44.848	46
\.


--
-- Data for Name: Ticket; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Ticket" (id, description, "dateCreation", statut, type, "createdById", "assignedToId", "departementId", "mailSentAt", "applicationId", "clotureAt", "dureeTraitementMinutes", "materielId", "prisEnChargeAt", "mantisAt", "mantisNumero") FROM stdin;
14	Test durée de traitement.	2025-11-11 11:48:03.376	REJETE	ASSISTANCE	11	5	\N	2025-11-11 11:48:04.954	\N	2025-11-11 11:52:57.629	1	\N	2025-11-11 11:52:18.429	\N	\N
38	Mdp oublié.	2025-11-18 10:34:11.762	OPEN	ASSISTANCE	4	12	\N	2025-11-18 10:34:13.873	5	\N	\N	\N	\N	\N	\N
22	HS.	2025-11-13 10:19:05.454	CLOSED	ASSISTANCE	4	5	\N	\N	5	2025-11-17 08:20:13.253	5641	\N	\N	\N	\N
27	Pas de connexion.	2025-11-14 08:46:28.182	CLOSED	ASSISTANCE	10	5	\N	2025-11-14 08:46:30.735	2	2025-11-17 08:21:07.736	4281	\N	2025-11-14 08:59:51.734	\N	\N
25	En panne.	2025-11-13 16:03:53.82	CLOSED	INTERVENTION	10	6	\N	2025-11-13 16:03:57.611	\N	2025-11-17 08:22:08.447	5292	4	2025-11-13 16:10:06.716	\N	\N
18	Test mail au changement de statut.	2025-11-11 12:50:12.413	REJETE	ASSISTANCE	7	6	\N	2025-11-11 12:50:14.494	\N	2025-11-11 12:54:39.574	\N	\N	\N	\N	\N
28	Mot de passe oublié í aint gon lie.	2025-11-14 08:48:13.251	CLOSED	ASSISTANCE	9	12	\N	2025-11-14 08:48:15.176	5	2025-11-17 08:22:41.257	4288	\N	2025-11-14 08:54:41.483	\N	\N
26	Poussiéreux.	2025-11-14 08:35:52.136	CLOSED	INTERVENTION	11	12	\N	2025-11-14 08:35:55.242	\N	2025-11-17 08:22:47.373	4282	3	2025-11-14 09:01:13.676	\N	\N
20	Ajustement incorrect.	2025-11-12 08:24:01.854	CLOSED	INTERVENTION	4	12	\N	\N	\N	2025-11-17 08:22:54.675	7195	2	2025-11-12 08:27:51.178	\N	\N
19	Cartouche...	2025-11-11 12:57:35.33	TRANSFERE_MANTIS	INTERVENTION	7	6	\N	2025-11-11 12:57:37.104	\N	2025-11-11 12:58:50.028	\N	1	\N	2025-11-11 12:58:50.028	MNT-11-11-2025-13-00
7	Mot de passe?	2025-11-11 10:13:14.736	TRANSFERE_MANTIS	ASSISTANCE	8	6	\N	2025-11-11 10:13:17.471	5	\N	\N	\N	2025-11-11 10:17:33.744	2025-11-11 10:18:15.226	MNT-11-11-2025
2	Test 1 bis	2025-11-10 21:14:22.569	CLOSED	INTERVENTION	4	5	\N	2025-11-10 21:14:28.63	\N	2025-11-11 10:19:51.286	785	1	\N	2025-11-10 21:16:11.476	MNT-001
29	Impossible d’ouvrir le document.	2025-11-17 08:14:27.934	CLOSED	ASSISTANCE	10	5	\N	\N	1	2025-11-18 08:27:07.151	1447	\N	2025-11-17 08:19:59.336	\N	\N
21	Idk what it is.	2025-11-12 08:26:03.922	CLOSED	ASSISTANCE	7	6	\N	\N	3	2025-11-12 08:33:06.027	4	\N	2025-11-12 08:29:11.953	2025-11-12 08:29:36.277	MNT-12-11-2025
11	K.	2025-11-11 10:25:13.46	REJETE	INTERVENTION	11	6	\N	2025-11-11 10:25:15.073	\N	\N	\N	1	\N	\N	\N
10	Écran bleu.	2025-11-11 10:24:31.015	REJETE	INTERVENTION	10	6	\N	2025-11-11 10:24:32.991	\N	\N	\N	2	\N	\N	\N
9	Ne marche pas.	2025-11-11 10:23:40.114	REJETE	INTERVENTION	9	6	\N	2025-11-11 10:23:43.534	\N	\N	\N	4	\N	\N	\N
8	Bip.	2025-11-11 10:13:56.21	CLOSED	INTERVENTION	8	5	\N	2025-11-11 10:13:57.589	\N	2025-11-11 10:34:23.651	18	3	2025-11-11 10:16:03.2	\N	\N
6	Pas de cartouche.	2025-11-11 10:10:49.733	CLOSED	INTERVENTION	7	5	\N	2025-11-11 10:10:51.157	\N	2025-11-11 10:34:37.004	18	1	2025-11-11 10:16:08.356	\N	\N
3	Impossible d'accéder à YT.	2025-11-11 09:57:45.713	CLOSED	ASSISTANCE	4	12	\N	2025-11-11 09:57:48.764	6	2025-11-11 10:34:43.247	14	\N	2025-11-11 10:20:46.855	\N	\N
4	Écran noir.	2025-11-11 10:00:13.144	CLOSED	INTERVENTION	4	12	\N	2025-11-11 10:00:15.296	\N	2025-11-11 10:34:51.13	14	2	2025-11-11 10:20:40.835	\N	\N
5	Pas d'archive.	2025-11-11 10:10:12.815	CLOSED	ASSISTANCE	7	6	\N	2025-11-11 10:10:23.246	3	2025-11-11 10:34:57.072	17	\N	2025-11-11 10:17:40.249	\N	\N
41	Écran noire.	2025-11-18 10:47:21.145	OPEN	INTERVENTION	11	6	\N	2025-11-18 10:47:22.877	\N	\N	\N	2	\N	\N	\N
33	Ancien.	2025-11-18 08:26:39.086	OPEN	INTERVENTION	4	5	\N	\N	\N	\N	\N	4	\N	\N	\N
13	Blank.	2025-11-11 11:41:57.558	TRANSFERE_MANTIS	INTERVENTION	10	12	\N	2025-11-11 11:41:58.968	\N	2025-11-11 11:45:50.695	\N	2	\N	2025-11-11 11:45:50.695	MNT-11-11-2025-11-45
12	Blank	2025-11-11 11:41:37.102	REJETE	ASSISTANCE	10	12	\N	2025-11-11 11:41:38.691	1	2025-11-11 11:46:00.983	\N	\N	\N	\N	\N
40	Bip RAM.	2025-11-18 10:46:54.682	OPEN	INTERVENTION	9	6	\N	2025-11-18 10:46:56.52	\N	\N	\N	3	\N	\N	\N
39	Panne.	2025-11-18 10:46:23.315	OPEN	INTERVENTION	4	5	\N	2025-11-18 10:46:25.218	\N	\N	\N	4	\N	\N	\N
16	Id archive	2025-11-11 12:38:03.67	CLOSED	ASSISTANCE	8	6	\N	2025-11-11 12:38:07.026	3	2025-11-18 10:48:53.926	75	\N	2025-11-18 09:34:19.911	\N	\N
42	Marche pas.	2025-11-18 10:58:11.635	OPEN	INTERVENTION	14	6	\N	\N	\N	\N	\N	5	\N	\N	\N
35	Problème de cartouche.	2025-11-18 08:49:49.429	OPEN	INTERVENTION	4	12	\N	2025-11-18 08:49:51.827	\N	\N	\N	1	\N	\N	\N
43	Écran noire.	2025-11-21 08:54:13.206	OPEN	INTERVENTION	15	\N	\N	2025-11-21 08:54:15.022	\N	\N	\N	2	\N	\N	\N
15	Pilote.	2025-11-11 11:51:28.746	CLOSED	INTERVENTION	8	5	\N	2025-11-11 11:51:30.062	\N	2025-11-14 09:00:09.984	4148	1	2025-11-11 11:52:10.976	2025-11-11 11:52:46.866	11-11-2025-11-52
17	Bip sonore.	2025-11-11 12:41:22.138	CLOSED	INTERVENTION	10	12	\N	2025-11-11 12:41:23.474	\N	2025-11-14 09:00:45.542	4099	3	\N	\N	\N
1	Test 1	2025-11-10 21:13:35.906	CLOSED	ASSISTANCE	4	5	\N	2025-11-10 21:13:42.031	1	2025-11-14 09:02:14.242	5027	\N	2025-11-10 21:15:26.182	\N	\N
34	Aucune archive.	2025-11-18 08:42:25.009	OPEN	ASSISTANCE	7	12	\N	2025-11-18 08:42:27.177	3	\N	\N	\N	\N	\N	\N
36	Moins performant qu’avant.	2025-11-18 10:25:00.589	CLOSED	INTERVENTION	10	12	\N	2025-11-18 10:25:02.517	\N	2025-11-18 10:29:25.357	4	3	\N	\N	\N
23	Test pagination	2025-11-13 12:48:27.833	CLOSED	ASSISTANCE	7	6	\N	2025-11-13 12:48:30.995	2	2025-11-18 10:29:33.318	7061	\N	\N	\N	\N
32	Impossible d'accéder à YT.	2025-11-18 08:26:04.015	CLOSED	ASSISTANCE	10	5	\N	\N	6	2025-11-18 10:29:47.851	124	\N	\N	\N	\N
30	Ne s’allume pas.	2025-11-18 08:23:57.191	CLOSED	INTERVENTION	8	6	\N	\N	\N	2025-11-18 10:29:54.392	126	3	\N	\N	\N
24	Test pagination 2	2025-11-13 12:49:21.084	CLOSED	ASSISTANCE	7	6	\N	2025-11-13 12:49:23.171	\N	2025-11-18 10:30:09.159	7061	\N	\N	\N	\N
31	Ecran noire.	2025-11-18 08:25:21.439	CLOSED	INTERVENTION	11	5	\N	\N	\N	2025-11-18 10:30:38.851	125	2	\N	\N	\N
44	C’est quoi l’ip?	2025-11-25 20:48:30.187	CLOSED	ASSISTANCE	10	5	\N	2025-11-25 20:48:39.719	6	2025-11-25 20:50:09.306	1	\N	2025-11-25 20:49:29.15	\N	\N
37	Écran bleu	2025-11-18 10:32:16.21	OPEN	INTERVENTION	9	12	\N	2025-11-18 10:32:18.425	\N	\N	\N	2	\N	\N	\N
45	En panne.	2025-11-25 20:51:37.602	OPEN	INTERVENTION	4	\N	\N	2025-11-25 20:51:41.676	\N	\N	\N	1	\N	\N	\N
46	Explique ce code.	2025-11-25 20:58:44.767	OPEN	INTERVENTION	9	\N	\N	2025-11-25 20:58:52.981	\N	\N	\N	2	\N	\N	\N
\.


--
-- Data for Name: Utilisateur; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Utilisateur" (id, nom, prenom, email, "motDePasse", role, matricule, "departementId", "createdAt", "codeHierarchique") FROM stdin;
3	Admin	System	lmagicien526@gmail.com	$2b$10$2YlgQ/lDcoMxnBLsGjtp7u0Cedx73WCPyH.Ke9HSjz91vZ3VGVndm	CHEF_DSI	ADMIN-001	\N	2025-11-10 21:07:56.794	10
4	Mbaye	Babacar	babacar@cds.com	$2b$10$vbHesnW7XDBEJAOjvqxamOtaEtT48AOHO9Bit5FfrOxwDrmufWz22	EMPLOYE	EMP-001	1	2025-11-10 21:10:09.404	0
6	Gss	Djo	djogss10@gmail.com	$2b$10$x4Q1MsVFu4b.O72aW3LIz.ADhSgWFi70xL2DTF52ZUu0u9wricnlG	TECHNICIEN	EMP-003	\N	2025-11-11 08:25:02.066	0
7	Guissé	Modienne	modienneg@gmail.com	$2b$10$HfBcS6rvGpiL4VWU2Fk7eeGxChnjCmdwSnX/E.J7FXkGtKCV1iqAy	EMPLOYE	EMP-004	1	2025-11-11 08:25:56.147	1
8	Ndiaye	Maya	maya@cds.com	$2b$10$svkD1m0sDwFk2Cu8x1BKqOUcHlaILWbwKmtd5ufAbPojWPuMWumvi	EMPLOYE	EMP-005	1	2025-11-11 08:26:43.214	2
9	Ndiaye	Cheikh	cheikh@cds.com	$2b$10$y48AebTRmFbzD702wTT8lOjZ5RgE0JNFMp2jCULACPbc50d/.ERym	EMPLOYE	EMP-006	2	2025-11-11 08:27:22.021	2
10	Mendy	Piwe	piwe@cds.com	$2b$10$JIowGkXm9foRMj7RreKtJ.E.qDxfnrU/z85Aqkig6nbd55caWW4pm	EMPLOYE	EMP-007	2	2025-11-11 08:27:56.369	1
11	Ly	Weuthie	weuthie@cds.com	$2b$10$XyX3AiMh3Oqk0CaaZggJOO2NBIEIL7yJHz1waaxIHtxdtTDdquBSK	EMPLOYE	EMP-009	2	2025-11-11 08:28:42.075	0
12	Fall	Yacine	yacine@cds.com	$2b$10$y4OpbpoMr/li9AmdveuqTe7ga.m4/h2mjPwjnkt/n0ycbJADetcnq	TECHNICIEN	EMP-010	\N	2025-11-11 09:30:54.285	0
13	Messi	Lionnel	messi@cds.com	$2b$10$jwxVsO.PfZTL/rKOAT97We/jDWknWwcjBF4LJ4ydVEN4S7W1gxIX2	EMPLOYE	EMP-099	\N	2025-11-13 11:14:47.446	99
5	Ndour	Fassar	fassar@cds.com	$2b$10$PhDvViJ45ZBHjzZw3hMUBOnY.qY9U/jXgx7GLyUtHExaqR1dPHuH2	TECHNICIEN	EMP-002	\N	2025-11-10 21:12:07.858	0
14	Kayounga	Mame	kayounga@cds.com	$2b$10$bkrGiJ6XgKs1oigQs8UF.urY0QewAEbCJThrAaw7ZLpm9yQakigXG	EMPLOYE	EMP-012	3	2025-11-18 10:56:20.277	2
15	Jamila	Al	jamila@cds.com	$2b$10$zAP3LqRwZzReYAbJVdt/GuJEpPLZk.lbIpOUtRyZ3Xeoszg2/nMGS	EMPLOYE	EMP-013	3	2025-11-18 10:57:17.848	1
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

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
83284940-cd14-463a-911c-0bf86658ee56	d482c946a3844865988e813bab5724ae054b856965ff200e31f572822b5a6c17	2025-11-10 20:41:19.977353+00	20251020083042_ajout_cloisonnement_hierachique	\N	\N	2025-11-10 20:41:19.907372+00	1
2d6630cb-439c-4264-919b-63e3c4686883	8c31e0168b244c0092e0957ceb40060bb6ff03e689adc408b39c699733967ba9	2025-11-10 20:41:20.011629+00	20251020092434_retour_a_ux_amelioree	\N	\N	2025-11-10 20:41:19.979213+00	1
817d9146-806b-41c8-bec4-c519df84a474	eb8924feefd885422dd2b85b5d751c769fbeef626d870d8ef5259b8f7b7eef52	2025-11-10 20:41:20.03878+00	20251020134834_hierarchie_recursive_avec_code	\N	\N	2025-11-10 20:41:20.013323+00	1
e02c2381-9290-486e-8afd-ead6a37090c5	0d95257c4308acb65e4b9ebd32e5d832bdcc18920b6ef8b54da7eae66fe5ffdc	2025-11-10 20:41:20.055391+00	20251020135007_retour	\N	\N	2025-11-10 20:41:20.04079+00	1
024ae411-7e24-4b54-a8c2-6de0039d2c0f	4b994b48c14b2ef18cd066cb7c36504421022beed938db40a60aaa90b36385fe	2025-11-10 20:41:20.092777+00	20251021101012_hierarchie_recursive_avec_code2	\N	\N	2025-11-10 20:41:20.057522+00	1
21d667ee-0f1e-4362-bd7c-5690d5de6052	b432990e23fc26356ed38fc56e95d14db961d4ccfd93822b464d2f82831d12d5	2025-11-10 20:41:20.113029+00	20251021131250_retour	\N	\N	2025-11-10 20:41:20.09483+00	1
\.


--
-- Name: Application_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Application_id_seq"', 7, true);


--
-- Name: Commentaire_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Commentaire_id_seq"', 19, true);


--
-- Name: Departement_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Departement_id_seq"', 4, true);


--
-- Name: Materiel_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Materiel_id_seq"', 6, true);


--
-- Name: Notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Notification_id_seq"', 191, true);


--
-- Name: PieceJointe_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PieceJointe_id_seq"', 19, true);


--
-- Name: Ticket_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Ticket_id_seq"', 46, true);


--
-- Name: Utilisateur_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Utilisateur_id_seq"', 15, true);


--
-- Name: Application Application_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Application"
    ADD CONSTRAINT "Application_pkey" PRIMARY KEY (id);


--
-- Name: Commentaire Commentaire_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Commentaire"
    ADD CONSTRAINT "Commentaire_pkey" PRIMARY KEY (id);


--
-- Name: Departement Departement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Departement"
    ADD CONSTRAINT "Departement_pkey" PRIMARY KEY (id);


--
-- Name: Materiel Materiel_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Materiel"
    ADD CONSTRAINT "Materiel_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: PieceJointe PieceJointe_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PieceJointe"
    ADD CONSTRAINT "PieceJointe_pkey" PRIMARY KEY (id);


--
-- Name: Ticket Ticket_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_pkey" PRIMARY KEY (id);


--
-- Name: Utilisateur Utilisateur_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Utilisateur"
    ADD CONSTRAINT "Utilisateur_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Application_nom_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Application_nom_key" ON public."Application" USING btree (nom);


--
-- Name: Commentaire_ticketId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Commentaire_ticketId_createdAt_idx" ON public."Commentaire" USING btree ("ticketId", "createdAt");


--
-- Name: Departement_nom_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Departement_nom_key" ON public."Departement" USING btree (nom);


--
-- Name: Materiel_nom_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Materiel_nom_key" ON public."Materiel" USING btree (nom);


--
-- Name: Utilisateur_departementId_codeHierarchique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Utilisateur_departementId_codeHierarchique_idx" ON public."Utilisateur" USING btree ("departementId", "codeHierarchique");


--
-- Name: Utilisateur_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Utilisateur_email_key" ON public."Utilisateur" USING btree (email);


--
-- Name: Utilisateur_matricule_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Utilisateur_matricule_key" ON public."Utilisateur" USING btree (matricule);


--
-- Name: Commentaire Commentaire_auteurId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Commentaire"
    ADD CONSTRAINT "Commentaire_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES public."Utilisateur"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Commentaire Commentaire_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Commentaire"
    ADD CONSTRAINT "Commentaire_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."Ticket"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Departement Departement_responsableId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Departement"
    ADD CONSTRAINT "Departement_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES public."Utilisateur"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Notification Notification_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."Ticket"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Utilisateur"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PieceJointe PieceJointe_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PieceJointe"
    ADD CONSTRAINT "PieceJointe_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."Ticket"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Ticket Ticket_applicationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES public."Application"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Ticket Ticket_assignedToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public."Utilisateur"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Ticket Ticket_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."Utilisateur"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Ticket Ticket_departementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_departementId_fkey" FOREIGN KEY ("departementId") REFERENCES public."Departement"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Ticket Ticket_materielId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_materielId_fkey" FOREIGN KEY ("materielId") REFERENCES public."Materiel"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Utilisateur Utilisateur_departementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Utilisateur"
    ADD CONSTRAINT "Utilisateur_departementId_fkey" FOREIGN KEY ("departementId") REFERENCES public."Departement"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

