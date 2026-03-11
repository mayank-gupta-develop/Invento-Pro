--
-- PostgreSQL database dump
--

\restrict lS2H7DpOMJn7dLhYpgp5qZhMXol9VyfYUlVid7RYXVjVFwSyWE2lPhYPmcSCbQL

-- Dumped from database version 18.1 (Debian 18.1-1.pgdg12+2)
-- Dumped by pg_dump version 18.2

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: invento_q0tt_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO invento_q0tt_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bill_items; Type: TABLE; Schema: public; Owner: invento_q0tt_user
--

CREATE TABLE public.bill_items (
    id text NOT NULL,
    bill_id text,
    item_id text,
    qty integer,
    mrp numeric,
    gst numeric,
    purchase_price numeric,
    discount numeric DEFAULT 0
);


ALTER TABLE public.bill_items OWNER TO invento_q0tt_user;

--
-- Name: bills; Type: TABLE; Schema: public; Owner: invento_q0tt_user
--

CREATE TABLE public.bills (
    id text NOT NULL,
    user_id text,
    invoice_no text NOT NULL,
    customer_name text,
    customer_phone text,
    customer_gst text,
    customer_address text,
    subtotal numeric DEFAULT 0,
    gst numeric DEFAULT 0,
    total numeric DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.bills OWNER TO invento_q0tt_user;

--
-- Name: invoice_seq; Type: TABLE; Schema: public; Owner: invento_q0tt_user
--

CREATE TABLE public.invoice_seq (
    year integer NOT NULL,
    last_number integer NOT NULL
);


ALTER TABLE public.invoice_seq OWNER TO invento_q0tt_user;

--
-- Name: items; Type: TABLE; Schema: public; Owner: invento_q0tt_user
--

CREATE TABLE public.items (
    id text NOT NULL,
    user_id text,
    name text NOT NULL,
    sku text NOT NULL,
    category text,
    mrp numeric DEFAULT 0,
    gst numeric DEFAULT 0,
    image_url text,
    show_in_catalog boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.items OWNER TO invento_q0tt_user;

--
-- Name: session; Type: TABLE; Schema: public; Owner: invento_q0tt_user
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO invento_q0tt_user;

--
-- Name: stock_batches; Type: TABLE; Schema: public; Owner: invento_q0tt_user
--

CREATE TABLE public.stock_batches (
    id text NOT NULL,
    item_id text,
    qty integer NOT NULL,
    purchase_price numeric DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.stock_batches OWNER TO invento_q0tt_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: invento_q0tt_user
--

CREATE TABLE public.users (
    id text NOT NULL,
    username text NOT NULL,
    email text,
    phone text,
    password text NOT NULL,
    role text DEFAULT 'user'::text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO invento_q0tt_user;

--
-- Data for Name: bill_items; Type: TABLE DATA; Schema: public; Owner: invento_q0tt_user
--

COPY public.bill_items (id, bill_id, item_id, qty, mrp, gst, purchase_price, discount) FROM stdin;
968d713e-793f-47c3-8843-b29b5ebed7f4	4fb5052d-9cab-49f7-b9e1-e4a457f203b2	c0b30e4c-7a78-4052-bc9f-99e037b9842a	51	80	5	\N	0
052887fc-6576-4150-a7de-00ec2ca7715f	2d207554-ec66-4db2-ad18-0a4921da05a3	17233f0d-a6b1-40b1-bc7b-b558236e5e4d	10	599	18	\N	0
d3e5f4e7-4245-4899-bf38-db114e13e88a	8c09d228-17b0-486e-8041-dbcd50e8092f	57cae995-264e-4ebf-9ec1-12552010c7de	40	6000	18	\N	10
f995287d-a16d-4818-b2e4-6aafc6f578b0	2e572715-9d85-4ac2-ac6c-ffc5eaa85a9b	47ab7a65-075d-4301-b2c2-81181961b985	300	80	5	\N	20
b3e57e5a-f072-4eff-916b-b5356c4612f7	35302a2e-ff43-41db-aa21-4eb9611424a9	17233f0d-a6b1-40b1-bc7b-b558236e5e4d	1	599	18	\N	0
10e6253a-395d-4347-b299-dfb66527e3fc	35302a2e-ff43-41db-aa21-4eb9611424a9	c126a8d9-c6c0-4c7c-b53b-137a393575ce	1	1999	18	\N	0
a2a8bf1a-d7df-42b6-96b1-885f6f7a4319	35302a2e-ff43-41db-aa21-4eb9611424a9	c38f24f2-7d54-464f-8a38-69148b14b427	1	1299	18	\N	0
afc1f734-b7e6-4e3a-9fa7-15122587774f	35302a2e-ff43-41db-aa21-4eb9611424a9	2f7acecc-b1b5-480d-9358-02680730b6db	1	89	12	\N	0
fcd785aa-935f-46de-a961-4b8b5393043c	35302a2e-ff43-41db-aa21-4eb9611424a9	727e7b1e-5f1b-4dd6-bbd0-ee4d474d29f2	1	300	18	\N	0
595e0966-dda2-4dd5-a1d1-0f801319ee11	35302a2e-ff43-41db-aa21-4eb9611424a9	64cdcfd9-aad2-406c-b11d-d3f7e614e485	1	4999	18	\N	0
59c8a61e-b1ab-4811-884a-c985b04b87a4	35302a2e-ff43-41db-aa21-4eb9611424a9	909b52e1-29b9-4211-b4d3-f7758b64e451	5	550	5	\N	0
9332067a-ac29-4a10-8892-187b06fda59b	35302a2e-ff43-41db-aa21-4eb9611424a9	947abdf4-1b2f-47ee-901e-000de320d17d	1	199	12	\N	0
c737db35-e613-4ec0-8123-95b471c5d7c3	f42ccd4e-40e6-4c0f-b3dd-f62b97b85107	d53984fe-9686-4629-a3aa-924164e63bc6	5	65000	3	\N	5
\.


--
-- Data for Name: bills; Type: TABLE DATA; Schema: public; Owner: invento_q0tt_user
--

COPY public.bills (id, user_id, invoice_no, customer_name, customer_phone, customer_gst, customer_address, subtotal, gst, total, created_at) FROM stdin;
4fb5052d-9cab-49f7-b9e1-e4a457f203b2	f1befc21-b806-435f-b146-c0f96e02c6a1	INV-2026-0002	siri	\N	\N	\N	4080	0	4080	2026-02-26 06:30:44.204121
2d207554-ec66-4db2-ad18-0a4921da05a3	1074a20f-e50d-475e-a568-882d8f051e32	INV-2026-0003	Bobby	\N	\N	\N	6020	0	6020	2026-02-26 09:03:51.615921
8c09d228-17b0-486e-8041-dbcd50e8092f	b30c7767-49d3-4584-a6ba-8ca635ab5633	INV-2026-0004	yuktha	\N	\N	\N	240000	0	216000	2026-02-26 17:23:31.00575
2e572715-9d85-4ac2-ac6c-ffc5eaa85a9b	b30c7767-49d3-4584-a6ba-8ca635ab5633	INV-2026-0005	jatish	\N	\N	\N	24000	0	19200	2026-02-26 17:53:42.497158
35302a2e-ff43-41db-aa21-4eb9611424a9	1074a20f-e50d-475e-a568-882d8f051e32	INV-2026-0006	Invento Pro Retail Solutions	+91 98765 43210	27ABCDE1234F1Z5	Shop No. 12, Ground Floor Shiv Plaza Commercial Complex SV Road, Khar West Mumbai, Maharashtra – 400052 India	12234	0	12234	2026-02-26 18:52:04.353412
f42ccd4e-40e6-4c0f-b3dd-f62b97b85107	b30c7767-49d3-4584-a6ba-8ca635ab5633	INV-2026-0009	hansa	\N	\N	\N	325000	0	308750	2026-02-28 17:55:06.971028
\.


--
-- Data for Name: invoice_seq; Type: TABLE DATA; Schema: public; Owner: invento_q0tt_user
--

COPY public.invoice_seq (year, last_number) FROM stdin;
2026	10
\.


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: invento_q0tt_user
--

COPY public.items (id, user_id, name, sku, category, mrp, gst, image_url, show_in_catalog, created_at) FROM stdin;
2f7acecc-b1b5-480d-9358-02680730b6db	1074a20f-e50d-475e-a568-882d8f051e32	LED Bulb 9W	LB-009	Electrical	89	12	\N	t	2026-02-25 19:58:36.48862
c126a8d9-c6c0-4c7c-b53b-137a393575ce	1074a20f-e50d-475e-a568-882d8f051e32	Bluetooth Speaker	BS-210	Electronics	1999	18	\N	t	2026-02-25 19:57:55.426565
727e7b1e-5f1b-4dd6-bbd0-ee4d474d29f2	1074a20f-e50d-475e-a568-882d8f051e32	Extension Board 4-Socket	EB-004	Electrical	300	18	\N	t	2026-02-25 19:59:25.229302
909b52e1-29b9-4211-b4d3-f7758b64e451	1074a20f-e50d-475e-a568-882d8f051e32	Basmati Rice 5kg	BR-5KG	Grocery	550	5	\N	t	2026-02-25 20:00:18.399892
aacb2857-4ec8-4f03-a96b-593baf88115f	1074a20f-e50d-475e-a568-882d8f051e32	Refined Sunflower Oil 1L	SO-1L	Grocery	140	5	\N	t	2026-02-25 20:01:05.862841
947abdf4-1b2f-47ee-901e-000de320d17d	1074a20f-e50d-475e-a568-882d8f051e32	Notebook A5 (Pack of 5)	NB-A5-5	Stationery	199	12	\N	t	2026-02-25 20:01:55.821171
f1abdd8b-9b7e-4c4a-9132-ac4912d3f3bc	1074a20f-e50d-475e-a568-882d8f051e32	Ball Pen (Pack of 10)	BP-10	Stationery	99	12	\N	t	2026-02-25 20:02:38.128782
c37fc130-7160-4c56-88ea-5c270a63ede6	b30c7767-49d3-4584-a6ba-8ca635ab5633	watch	wm-123	accessories	8999	12	https://res.cloudinary.com/dbpavyrsh/image/upload/v1772076208/inventopro/catalog/c37fc130-7160-4c56-88ea-5c270a63ede6.png	t	2026-02-26 03:22:49.586563
c38f24f2-7d54-464f-8a38-69148b14b427	1074a20f-e50d-475e-a568-882d8f051e32	USB-C Charger 65W	UC-065	Electronics	1299	18	\N	t	2026-02-25 19:57:01.125619
c0b30e4c-7a78-4052-bc9f-99e037b9842a	f1befc21-b806-435f-b146-c0f96e02c6a1	Dolo 650	dw-123	medicine	80	5	\N	t	2026-02-26 06:29:01.810711
64cdcfd9-aad2-406c-b11d-d3f7e614e485	1074a20f-e50d-475e-a568-882d8f051e32	Office Chair Basic	OC-101	Furniture	4999	18	\N	t	2026-02-25 20:03:32.806538
57cae995-264e-4ebf-9ec1-12552010c7de	b30c7767-49d3-4584-a6ba-8ca635ab5633	headphones	hm-456	wearables	6000	18	\N	t	2026-02-26 17:21:53.207957
47ab7a65-075d-4301-b2c2-81181961b985	b30c7767-49d3-4584-a6ba-8ca635ab5633	ganesh card	1245	wedding card	80	5	\N	t	2026-02-26 17:51:46.668508
d53984fe-9686-4629-a3aa-924164e63bc6	b30c7767-49d3-4584-a6ba-8ca635ab5633	snake gold chain	sm-789	jewellery	65000	3	\N	t	2026-02-28 17:54:16.388048
17233f0d-a6b1-40b1-bc7b-b558236e5e4d	1074a20f-e50d-475e-a568-882d8f051e32	Wireless Mouse	WM-001	Electronics	599	18	\N	f	2026-02-25 19:55:47.266688
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: invento_q0tt_user
--

COPY public.session (sid, sess, expire) FROM stdin;
ewsHIZ69zrTDuyqvUYqikvJYsBaha-kM	{"cookie":{"originalMaxAge":86400000,"expires":"2026-03-09T07:23:29.803Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":"2ffbdbba-e889-4c62-aa42-5b07dd207bb3","username":"admin","role":"admin"}}	2026-03-09 07:23:30
\.


--
-- Data for Name: stock_batches; Type: TABLE DATA; Schema: public; Owner: invento_q0tt_user
--

COPY public.stock_batches (id, item_id, qty, purchase_price, created_at) FROM stdin;
e3c76dc5-23bc-48d3-8172-ff7d238dbd54	17233f0d-a6b1-40b1-bc7b-b558236e5e4d	25	350	2026-02-25 19:55:47.305736
ba3c6621-e349-445b-9a93-cdb11f023e44	c38f24f2-7d54-464f-8a38-69148b14b427	15	850	2026-02-25 19:57:01.157434
2551dbc7-0a2e-4997-8ba4-1fd578277be9	c126a8d9-c6c0-4c7c-b53b-137a393575ce	10	1200	2026-02-25 19:57:55.458112
15af649b-f531-42eb-a422-945c02943b9d	2f7acecc-b1b5-480d-9358-02680730b6db	50	45	2026-02-25 19:58:36.523134
0f276a32-a318-4a60-ac5c-5ecba27b7003	727e7b1e-5f1b-4dd6-bbd0-ee4d474d29f2	20	180	2026-02-25 19:59:25.264069
f4aa31f9-1adc-4e28-9fb8-d1284562099e	909b52e1-29b9-4211-b4d3-f7758b64e451	30	420	2026-02-25 20:00:18.431387
969e620f-da88-46da-8cad-83aec513208d	aacb2857-4ec8-4f03-a96b-593baf88115f	40	95	2026-02-25 20:01:05.891759
e3e39d1d-87ff-4146-9712-6c1d35ad74b0	947abdf4-1b2f-47ee-901e-000de320d17d	35	120	2026-02-25 20:01:55.854058
1d4e37bf-3d7c-4316-823f-e35b117c7b95	f1abdd8b-9b7e-4c4a-9132-ac4912d3f3bc	60	40	2026-02-25 20:02:38.160245
078a0ba2-1ba5-4ac2-a720-90014c0ec51b	64cdcfd9-aad2-406c-b11d-d3f7e614e485	8	3200	2026-02-25 20:03:32.839776
6a511133-2838-427b-9b38-f9e49de6f6c4	c37fc130-7160-4c56-88ea-5c270a63ede6	10	5000	2026-02-26 03:22:49.61425
1b3a0d2b-10fa-441d-baa0-948e3a3dcb73	c0b30e4c-7a78-4052-bc9f-99e037b9842a	100	25	2026-02-26 06:29:01.842645
85a312fb-e51c-47d4-9d16-e13a73175709	c0b30e4c-7a78-4052-bc9f-99e037b9842a	-51	\N	2026-02-26 06:30:44.25874
3aee3fae-5d0f-428a-b87a-015b66c556eb	17233f0d-a6b1-40b1-bc7b-b558236e5e4d	-10	\N	2026-02-26 09:03:51.676045
09033526-f03f-4dae-a6e5-673164351229	17233f0d-a6b1-40b1-bc7b-b558236e5e4d	-10	\N	2026-02-26 09:06:18.149468
5da5b59d-2360-4fdc-a9f7-ed3a95f44c46	57cae995-264e-4ebf-9ec1-12552010c7de	100	2500	2026-02-26 17:21:53.246581
df03e405-a63c-437c-a43f-3a6d7944476d	57cae995-264e-4ebf-9ec1-12552010c7de	-40	\N	2026-02-26 17:23:31.066151
7b4948cf-4fac-4a70-a97d-001e46d88035	47ab7a65-075d-4301-b2c2-81181961b985	1000	25	2026-02-26 17:51:46.712824
e49403a1-8c40-4a2e-bbcb-03f25181deb0	47ab7a65-075d-4301-b2c2-81181961b985	-300	\N	2026-02-26 17:53:42.608051
bae6e57f-5a4b-4a20-bb81-cd61f7c9e75c	17233f0d-a6b1-40b1-bc7b-b558236e5e4d	-1	\N	2026-02-26 18:52:04.416979
f2591037-9c85-4851-b38f-3cceee42ef34	c126a8d9-c6c0-4c7c-b53b-137a393575ce	-1	\N	2026-02-26 18:52:04.471657
5f3bb61e-7f9c-4477-bac5-fa9719259209	c38f24f2-7d54-464f-8a38-69148b14b427	-1	\N	2026-02-26 18:52:04.531063
46183753-da79-4761-afe8-f234b2f7f59f	2f7acecc-b1b5-480d-9358-02680730b6db	-1	\N	2026-02-26 18:52:04.586525
d907b17b-6e67-4c02-974a-64d7df3bcfe4	727e7b1e-5f1b-4dd6-bbd0-ee4d474d29f2	-1	\N	2026-02-26 18:52:04.642987
106c989e-bca2-4467-8e3e-9dc31df7d0e9	64cdcfd9-aad2-406c-b11d-d3f7e614e485	-1	\N	2026-02-26 18:52:04.697162
c6359cdf-e27f-407f-aa94-676f4297c5e9	909b52e1-29b9-4211-b4d3-f7758b64e451	-5	\N	2026-02-26 18:52:04.754827
c4b2a90b-f5b8-41dc-8a2e-8853e4b1c224	947abdf4-1b2f-47ee-901e-000de320d17d	-1	\N	2026-02-26 18:52:04.809124
fa366167-a69d-4b31-9602-5e87a0d7da50	64cdcfd9-aad2-406c-b11d-d3f7e614e485	-5	\N	2026-02-27 05:46:26.931356
33b4bfbc-e8e8-4819-ac48-39f82a03a16f	f1abdd8b-9b7e-4c4a-9132-ac4912d3f3bc	-1	40.00	2026-02-27 05:46:26.987054
eff48603-0afa-454a-a557-e7349ed9b473	64cdcfd9-aad2-406c-b11d-d3f7e614e485	-5	\N	2026-02-27 05:49:00.695772
540bd9c3-b587-4890-88dd-b454e33e5e63	f1abdd8b-9b7e-4c4a-9132-ac4912d3f3bc	-5	40.00	2026-02-28 09:44:10.086215
e688587c-dae3-41c9-b4b3-3c7d06413c2b	947abdf4-1b2f-47ee-901e-000de320d17d	-3	123.53	2026-02-28 09:44:10.145693
37ad5844-221f-4dd9-9596-3f0a049c9c05	c38f24f2-7d54-464f-8a38-69148b14b427	-2	910.71	2026-02-28 09:44:10.202349
99ea3e49-10fc-4956-b617-61be5454f100	17233f0d-a6b1-40b1-bc7b-b558236e5e4d	-1	2187.50	2026-02-28 09:44:10.268666
d7e44c49-3575-4e42-a868-bb0e820fe438	d53984fe-9686-4629-a3aa-924164e63bc6	25	25000	2026-02-28 17:54:16.420769
76895828-d978-4d05-a1a0-c1430db6e7f1	d53984fe-9686-4629-a3aa-924164e63bc6	-5	\N	2026-02-28 17:55:07.035112
85a359b6-90fc-46c2-a641-f30946319403	64cdcfd9-aad2-406c-b11d-d3f7e614e485	100	3200	2026-03-08 07:16:09.541334
bf484d9f-088c-40ea-8458-c83f38870c2f	2f7acecc-b1b5-480d-9358-02680730b6db	-10	\N	2026-03-08 07:18:05.465156
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: invento_q0tt_user
--

COPY public.users (id, username, email, phone, password, role, created_at) FROM stdin;
2ffbdbba-e889-4c62-aa42-5b07dd207bb3	admin	\N	1234567890	$2b$10$HfeUl0R.Mwfogqxm7y2JTe2bRi9TP3gXXWYQ/HRAfor/niXoaguvS	admin	2026-02-25 19:29:21.197275
1074a20f-e50d-475e-a568-882d8f051e32	Mayank Gupta	mayank78789@gmail.com	\N	$2b$10$2blU3citrARioz32U9zGqebIzAZuePXvU56VH9GvCTFQvk0U0M3m6	user	2026-02-25 19:54:23.231253
23459a82-9b93-4863-854d-5a3db790ac4f	Rahim_Dosani	rahimdosani21@gmail.com	7386854054	$2b$10$Pg7W3kcAGsvx/P6qNsArm.t/M9jOOhq9XygKtBHob1N4Awax0FaBW	user	2026-02-25 20:26:51.640699
b30c7767-49d3-4584-a6ba-8ca635ab5633	Kunal Jain	kunaljain0285@gmail.com	\N	$2b$10$zw8smVGc0xUxZM65GfKscOurMMxxTUO7f2BGNB0a8DOAKCSKaDgP6	user	2026-02-26 03:21:20.885032
f1befc21-b806-435f-b146-c0f96e02c6a1	Daksh Shankala	\N	9652698419	$2b$10$kxG4VZwYUPtMFMeCsb45b.4nO9VyO47r1vK45lRN9sfmlECEIfmHe	user	2026-02-26 06:26:42.280348
70abcf62-1982-4ff9-a9b0-e127f17da40c	sriram	sriramdaliya715@gmail.com	9032791260	$2b$10$DxJIFtmn/CMtbOgABYkNI.HOvrTz.PcFCWBDPK1nPoi39NqYyCc1m	user	2026-02-27 07:55:34.170115
\.


--
-- Name: bill_items bill_items_pkey; Type: CONSTRAINT; Schema: public; Owner: invento_q0tt_user
--

ALTER TABLE ONLY public.bill_items
    ADD CONSTRAINT bill_items_pkey PRIMARY KEY (id);


--
-- Name: bills bills_pkey; Type: CONSTRAINT; Schema: public; Owner: invento_q0tt_user
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT bills_pkey PRIMARY KEY (id);


--
-- Name: invoice_seq invoice_seq_pkey; Type: CONSTRAINT; Schema: public; Owner: invento_q0tt_user
--

ALTER TABLE ONLY public.invoice_seq
    ADD CONSTRAINT invoice_seq_pkey PRIMARY KEY (year);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: invento_q0tt_user
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: invento_q0tt_user
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: stock_batches stock_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: invento_q0tt_user
--

ALTER TABLE ONLY public.stock_batches
    ADD CONSTRAINT stock_batches_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: invento_q0tt_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: public; Owner: invento_q0tt_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: invento_q0tt_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: invento_q0tt_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_session_expire; Type: INDEX; Schema: public; Owner: invento_q0tt_user
--

CREATE INDEX idx_session_expire ON public.session USING btree (expire);


--
-- Name: bill_items bill_items_bill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: invento_q0tt_user
--

ALTER TABLE ONLY public.bill_items
    ADD CONSTRAINT bill_items_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.bills(id);


--
-- Name: bill_items bill_items_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: invento_q0tt_user
--

ALTER TABLE ONLY public.bill_items
    ADD CONSTRAINT bill_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id);


--
-- Name: bills bills_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: invento_q0tt_user
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT bills_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: items items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: invento_q0tt_user
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: stock_batches stock_batches_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: invento_q0tt_user
--

ALTER TABLE ONLY public.stock_batches
    ADD CONSTRAINT stock_batches_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON SEQUENCES TO invento_q0tt_user;


--
-- Name: DEFAULT PRIVILEGES FOR TYPES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TYPES TO invento_q0tt_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON FUNCTIONS TO invento_q0tt_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TABLES TO invento_q0tt_user;


--
-- PostgreSQL database dump complete
--

\unrestrict lS2H7DpOMJn7dLhYpgp5qZhMXol9VyfYUlVid7RYXVjVFwSyWE2lPhYPmcSCbQL

