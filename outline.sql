--
-- PostgreSQL database dump
--

-- Dumped from database version 16.1 (Ubuntu 16.1-1.pgdg22.04+1)
-- Dumped by pg_dump version 16.1 (Ubuntu 16.1-1.pgdg22.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: available_seats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.available_seats (
    id bigint NOT NULL,
    restaurant_id bigint NOT NULL,
    table_id bigint NOT NULL,
    table_name character varying(10) NOT NULL,
    seat_qty smallint NOT NULL,
    available_date date NOT NULL,
    available_time time without time zone NOT NULL,
    availability boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.available_seats OWNER TO postgres;

--
-- Name: available_seats_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.available_seats_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.available_seats_id_seq OWNER TO postgres;

--
-- Name: available_seats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.available_seats_id_seq OWNED BY public.available_seats.id;


--
-- Name: available_seats_restaurant_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.available_seats_restaurant_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.available_seats_restaurant_id_seq OWNER TO postgres;

--
-- Name: available_seats_restaurant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.available_seats_restaurant_id_seq OWNED BY public.available_seats.restaurant_id;


--
-- Name: available_seats_seat_qty_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.available_seats_seat_qty_seq
    AS smallint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.available_seats_seat_qty_seq OWNER TO postgres;

--
-- Name: available_seats_seat_qty_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.available_seats_seat_qty_seq OWNED BY public.available_seats.seat_qty;


--
-- Name: available_seats_table_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.available_seats_table_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.available_seats_table_id_seq OWNER TO postgres;

--
-- Name: available_seats_table_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.available_seats_table_id_seq OWNED BY public.available_seats.table_id;


--
-- Name: reservations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reservations (
    id bigint NOT NULL,
    restaurant_id bigint NOT NULL,
    adult smallint NOT NULL,
    child bigint NOT NULL,
    dining_date date NOT NULL,
    dining_time time without time zone NOT NULL,
    table_id bigint NOT NULL,
    table_name character varying(10) NOT NULL,
    name character varying(255) NOT NULL,
    gender character varying(2) NOT NULL,
    phone character varying(20) NOT NULL,
    email character varying(320) NOT NULL,
    purpose character varying(10) NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(15) DEFAULT 'not_seated'::character varying,
    status_updated_at timestamp without time zone,
    upn text,
    CONSTRAINT reservations_child_check CHECK ((child >= 0))
);


ALTER TABLE public.reservations OWNER TO postgres;

--
-- Name: reservations_adult_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reservations_adult_seq
    AS smallint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reservations_adult_seq OWNER TO postgres;

--
-- Name: reservations_adult_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reservations_adult_seq OWNED BY public.reservations.adult;


--
-- Name: reservations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reservations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reservations_id_seq OWNER TO postgres;

--
-- Name: reservations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reservations_id_seq OWNED BY public.reservations.id;


--
-- Name: reservations_restaurant_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reservations_restaurant_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reservations_restaurant_id_seq OWNER TO postgres;

--
-- Name: reservations_restaurant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reservations_restaurant_id_seq OWNED BY public.reservations.restaurant_id;


--
-- Name: reservations_table_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reservations_table_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reservations_table_id_seq OWNER TO postgres;

--
-- Name: reservations_table_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reservations_table_id_seq OWNED BY public.reservations.table_id;


--
-- Name: restaurants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.restaurants (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    address text NOT NULL,
    phone character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.restaurants OWNER TO postgres;

--
-- Name: restaurants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.restaurants_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.restaurants_id_seq OWNER TO postgres;

--
-- Name: restaurants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.restaurants_id_seq OWNED BY public.restaurants.id;


--
-- Name: rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rules (
    id bigint NOT NULL,
    restaurant_id bigint NOT NULL,
    max_person_per_group smallint NOT NULL,
    max_booking_day smallint NOT NULL,
    min_booking_day smallint NOT NULL,
    update_booking_time time without time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.rules OWNER TO postgres;

--
-- Name: rules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rules_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rules_id_seq OWNER TO postgres;

--
-- Name: rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rules_id_seq OWNED BY public.rules.id;


--
-- Name: rules_max_person_per_group_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rules_max_person_per_group_seq
    AS smallint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rules_max_person_per_group_seq OWNER TO postgres;

--
-- Name: rules_max_person_per_group_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rules_max_person_per_group_seq OWNED BY public.rules.max_person_per_group;


--
-- Name: rules_reservation_end_day_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rules_reservation_end_day_seq
    AS smallint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rules_reservation_end_day_seq OWNER TO postgres;

--
-- Name: rules_reservation_end_day_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rules_reservation_end_day_seq OWNED BY public.rules.min_booking_day;


--
-- Name: rules_reservation_start_day_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rules_reservation_start_day_seq
    AS smallint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rules_reservation_start_day_seq OWNER TO postgres;

--
-- Name: rules_reservation_start_day_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rules_reservation_start_day_seq OWNED BY public.rules.max_booking_day;


--
-- Name: rules_restaurant_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rules_restaurant_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rules_restaurant_id_seq OWNER TO postgres;

--
-- Name: rules_restaurant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rules_restaurant_id_seq OWNED BY public.rules.restaurant_id;


--
-- Name: table_available_time; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.table_available_time (
    id bigint NOT NULL,
    table_id bigint NOT NULL,
    available_time time(0) without time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.table_available_time OWNER TO postgres;

--
-- Name: table_available_time_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.table_available_time_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.table_available_time_id_seq OWNER TO postgres;

--
-- Name: table_available_time_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.table_available_time_id_seq OWNED BY public.table_available_time.id;


--
-- Name: table_available_time_table_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.table_available_time_table_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.table_available_time_table_id_seq OWNER TO postgres;

--
-- Name: table_available_time_table_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.table_available_time_table_id_seq OWNED BY public.table_available_time.table_id;


--
-- Name: tables; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tables (
    id bigint NOT NULL,
    restaurant_id bigint NOT NULL,
    name character varying(10) NOT NULL,
    seat_qty smallint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tables OWNER TO postgres;

--
-- Name: tables_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tables_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tables_id_seq OWNER TO postgres;

--
-- Name: tables_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tables_id_seq OWNED BY public.tables.id;


--
-- Name: tables_restaurant_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tables_restaurant_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tables_restaurant_id_seq OWNER TO postgres;

--
-- Name: tables_restaurant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tables_restaurant_id_seq OWNED BY public.tables.restaurant_id;


--
-- Name: tables_seat_qty_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tables_seat_qty_seq
    AS smallint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tables_seat_qty_seq OWNER TO postgres;

--
-- Name: tables_seat_qty_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tables_seat_qty_seq OWNED BY public.tables.seat_qty;


--
-- Name: user_restaurant; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_restaurant (
    user_id bigint NOT NULL,
    restaurant_id bigint NOT NULL
);


ALTER TABLE public.user_restaurant OWNER TO postgres;

--
-- Name: user_restaurant_restaurant_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_restaurant_restaurant_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_restaurant_restaurant_id_seq OWNER TO postgres;

--
-- Name: user_restaurant_restaurant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_restaurant_restaurant_id_seq OWNED BY public.user_restaurant.restaurant_id;


--
-- Name: user_restaurant_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_restaurant_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_restaurant_user_id_seq OWNER TO postgres;

--
-- Name: user_restaurant_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_restaurant_user_id_seq OWNED BY public.user_restaurant.user_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(320) NOT NULL,
    password text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'pending'::character varying
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: waitlist; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.waitlist (
    id bigint NOT NULL,
    restaurant_id bigint NOT NULL,
    adult bigint NOT NULL,
    child bigint NOT NULL,
    name character varying(255) NOT NULL,
    gender character varying(2) NOT NULL,
    phone character varying(20) NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    number bigint NOT NULL,
    status character varying(20) DEFAULT 'waiting'::character varying,
    CONSTRAINT waitlist_adult_check CHECK ((adult >= 0)),
    CONSTRAINT waitlist_child_check CHECK ((child >= 0)),
    CONSTRAINT waitlist_number_check CHECK ((number > 0))
);


ALTER TABLE public.waitlist OWNER TO postgres;

--
-- Name: waitlist_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.waitlist_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.waitlist_id_seq OWNER TO postgres;

--
-- Name: waitlist_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.waitlist_id_seq OWNED BY public.waitlist.id;


--
-- Name: waitlist_number; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.waitlist_number (
    id bigint NOT NULL,
    restaurant_id bigint NOT NULL,
    current_number bigint DEFAULT 0,
    total_waiting_number bigint DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone,
    status boolean DEFAULT true,
    CONSTRAINT waitlist_number_current_number_check CHECK ((current_number >= 0)),
    CONSTRAINT waitlist_number_total_waiting_number_check CHECK ((total_waiting_number >= 0))
);


ALTER TABLE public.waitlist_number OWNER TO postgres;

--
-- Name: waitlist_number_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.waitlist_number_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.waitlist_number_id_seq OWNER TO postgres;

--
-- Name: waitlist_number_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.waitlist_number_id_seq OWNED BY public.waitlist_number.id;


--
-- Name: waitlist_number_restaurant_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.waitlist_number_restaurant_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.waitlist_number_restaurant_id_seq OWNER TO postgres;

--
-- Name: waitlist_number_restaurant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.waitlist_number_restaurant_id_seq OWNED BY public.waitlist_number.restaurant_id;


--
-- Name: waitlist_restaurant_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.waitlist_restaurant_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.waitlist_restaurant_id_seq OWNER TO postgres;

--
-- Name: waitlist_restaurant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.waitlist_restaurant_id_seq OWNED BY public.waitlist.restaurant_id;


--
-- Name: available_seats id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.available_seats ALTER COLUMN id SET DEFAULT nextval('public.available_seats_id_seq'::regclass);


--
-- Name: available_seats restaurant_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.available_seats ALTER COLUMN restaurant_id SET DEFAULT nextval('public.available_seats_restaurant_id_seq'::regclass);


--
-- Name: available_seats table_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.available_seats ALTER COLUMN table_id SET DEFAULT nextval('public.available_seats_table_id_seq'::regclass);


--
-- Name: available_seats seat_qty; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.available_seats ALTER COLUMN seat_qty SET DEFAULT nextval('public.available_seats_seat_qty_seq'::regclass);


--
-- Name: reservations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservations ALTER COLUMN id SET DEFAULT nextval('public.reservations_id_seq'::regclass);


--
-- Name: reservations restaurant_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservations ALTER COLUMN restaurant_id SET DEFAULT nextval('public.reservations_restaurant_id_seq'::regclass);


--
-- Name: reservations adult; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservations ALTER COLUMN adult SET DEFAULT nextval('public.reservations_adult_seq'::regclass);


--
-- Name: reservations table_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservations ALTER COLUMN table_id SET DEFAULT nextval('public.reservations_table_id_seq'::regclass);


--
-- Name: restaurants id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurants ALTER COLUMN id SET DEFAULT nextval('public.restaurants_id_seq'::regclass);


--
-- Name: rules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rules ALTER COLUMN id SET DEFAULT nextval('public.rules_id_seq'::regclass);


--
-- Name: rules restaurant_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rules ALTER COLUMN restaurant_id SET DEFAULT nextval('public.rules_restaurant_id_seq'::regclass);


--
-- Name: rules max_person_per_group; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rules ALTER COLUMN max_person_per_group SET DEFAULT nextval('public.rules_max_person_per_group_seq'::regclass);


--
-- Name: rules max_booking_day; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rules ALTER COLUMN max_booking_day SET DEFAULT nextval('public.rules_reservation_start_day_seq'::regclass);


--
-- Name: rules min_booking_day; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rules ALTER COLUMN min_booking_day SET DEFAULT nextval('public.rules_reservation_end_day_seq'::regclass);


--
-- Name: table_available_time id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.table_available_time ALTER COLUMN id SET DEFAULT nextval('public.table_available_time_id_seq'::regclass);


--
-- Name: table_available_time table_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.table_available_time ALTER COLUMN table_id SET DEFAULT nextval('public.table_available_time_table_id_seq'::regclass);


--
-- Name: tables id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tables ALTER COLUMN id SET DEFAULT nextval('public.tables_id_seq'::regclass);


--
-- Name: tables restaurant_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tables ALTER COLUMN restaurant_id SET DEFAULT nextval('public.tables_restaurant_id_seq'::regclass);


--
-- Name: tables seat_qty; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tables ALTER COLUMN seat_qty SET DEFAULT nextval('public.tables_seat_qty_seq'::regclass);


--
-- Name: user_restaurant user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_restaurant ALTER COLUMN user_id SET DEFAULT nextval('public.user_restaurant_user_id_seq'::regclass);


--
-- Name: user_restaurant restaurant_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_restaurant ALTER COLUMN restaurant_id SET DEFAULT nextval('public.user_restaurant_restaurant_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: waitlist id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.waitlist ALTER COLUMN id SET DEFAULT nextval('public.waitlist_id_seq'::regclass);


--
-- Name: waitlist restaurant_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.waitlist ALTER COLUMN restaurant_id SET DEFAULT nextval('public.waitlist_restaurant_id_seq'::regclass);


--
-- Name: waitlist_number id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.waitlist_number ALTER COLUMN id SET DEFAULT nextval('public.waitlist_number_id_seq'::regclass);


--
-- Name: waitlist_number restaurant_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.waitlist_number ALTER COLUMN restaurant_id SET DEFAULT nextval('public.waitlist_number_restaurant_id_seq'::regclass);


--
-- Name: available_seats available_seats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.available_seats
    ADD CONSTRAINT available_seats_pkey PRIMARY KEY (id);


--
-- Name: tables name_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tables
    ADD CONSTRAINT name_unique UNIQUE (name);


--
-- Name: reservations reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_pkey PRIMARY KEY (id);


--
-- Name: restaurants restaurants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurants
    ADD CONSTRAINT restaurants_pkey PRIMARY KEY (id);


--
-- Name: rules rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rules
    ADD CONSTRAINT rules_pkey PRIMARY KEY (id);


--
-- Name: table_available_time table_available_time_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.table_available_time
    ADD CONSTRAINT table_available_time_pkey PRIMARY KEY (id);


--
-- Name: tables tables_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tables
    ADD CONSTRAINT tables_pkey PRIMARY KEY (id);


--
-- Name: users unique_email; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT unique_email UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: waitlist_number waitlist_number_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.waitlist_number
    ADD CONSTRAINT waitlist_number_pkey PRIMARY KEY (id);


--
-- Name: waitlist waitlist_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.waitlist
    ADD CONSTRAINT waitlist_pkey PRIMARY KEY (id);


--
-- Name: available_seats available_seats_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.available_seats
    ADD CONSTRAINT available_seats_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id);


--
-- Name: available_seats available_seats_table_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.available_seats
    ADD CONSTRAINT available_seats_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.tables(id);


--
-- Name: reservations reservations_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id);


--
-- Name: reservations reservations_table_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.tables(id);


--
-- Name: rules rules_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rules
    ADD CONSTRAINT rules_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id);


--
-- Name: table_available_time table_available_time_table_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.table_available_time
    ADD CONSTRAINT table_available_time_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.tables(id);


--
-- Name: tables tables_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tables
    ADD CONSTRAINT tables_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id);


--
-- Name: user_restaurant user_restaurant_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_restaurant
    ADD CONSTRAINT user_restaurant_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id);


--
-- Name: user_restaurant user_restaurant_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_restaurant
    ADD CONSTRAINT user_restaurant_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: waitlist_number waitlist_number_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.waitlist_number
    ADD CONSTRAINT waitlist_number_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id);


--
-- Name: waitlist waitlist_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.waitlist
    ADD CONSTRAINT waitlist_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id);


--
-- PostgreSQL database dump complete
--

