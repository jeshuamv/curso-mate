import { getDatabase } from '@netlify/database';

const db = getDatabase();

const statements = [
  `create table if not exists students (
    id serial primary key,
    name text not null,
    email text unique not null,
    password_hash text not null,
    created_at timestamptz not null default now()
  )`,
  `create table if not exists topics (
    id serial primary key,
    name text not null,
    order_index int not null unique
  )`,
  `create table if not exists nodes (
    id serial primary key,
    topic_id int not null references topics(id),
    name text not null,
    order_index int not null,
    video_url text,
    video_duration_sec int,
    is_bridge_prereq boolean not null default false,
    unique (topic_id, order_index)
  )`,
  `create table if not exists node_prerequisites (
    node_id int not null references nodes(id),
    prerequisite_node_id int not null references nodes(id),
    primary key (node_id, prerequisite_node_id)
  )`,
  `create table if not exists student_node_progress (
    student_id int not null references students(id),
    node_id int not null references nodes(id),
    status text not null default 'bloqueado' check (status in ('bloqueado', 'desbloqueado', 'completado', 'dominado')),
    crowns int not null default 0,
    attempts_count int not null default 0,
    last_practiced_at timestamptz,
    needs_review boolean not null default false,
    primary key (student_id, node_id)
  )`,
  `create table if not exists exercises (
    id serial primary key,
    node_id int not null references nodes(id),
    type text not null check (type in ('opcion_multiple', 'pasos', 'numerico')),
    generator_params jsonb,
    requires_steps boolean not null default false
  )`,
  `create table if not exists exercise_attempts (
    id serial primary key,
    student_id int not null references students(id),
    exercise_id int not null references exercises(id),
    node_id int not null references nodes(id),
    is_correct boolean not null,
    steps_submitted jsonb,
    error_type text,
    attempted_at timestamptz not null default now()
  )`,
  `create table if not exists error_patterns (
    student_id int not null references students(id),
    node_id int not null references nodes(id),
    error_type text not null,
    count int not null default 0,
    primary key (student_id, node_id, error_type)
  )`,
  `create table if not exists student_stats (
    student_id int primary key references students(id),
    xp_total int not null default 0,
    gems int not null default 0,
    streak_current int not null default 0,
    streak_last_active_date date
  )`,
  `create table if not exists diagnostic_results (
    student_id int not null references students(id),
    node_id int not null references nodes(id),
    passed boolean not null,
    primary key (student_id, node_id)
  )`,
  `create table if not exists topic_exams (
    id serial primary key,
    student_id int not null references students(id),
    topic_id int not null references topics(id),
    score numeric not null,
    taken_at timestamptz not null default now()
  )`,
  `create table if not exists certificates (
    student_id int primary key references students(id),
    issued_at timestamptz not null default now(),
    summary_data jsonb
  )`,
  `insert into topics (name, order_index) values
    ('Aritmética', 1),
    ('Probabilidad y estadística', 2),
    ('Álgebra', 3),
    ('Geometría', 4),
    ('Pensamiento lógico', 5)
  on conflict (order_index) do nothing`,
  `insert into nodes (topic_id, name, order_index, video_url, video_duration_sec) values
    ((select id from topics where order_index = 1), 'Fracciones de figuras', 1, 'https://podium.um.edu.mx/course/rmatematico/lecciones/lesson-1/', 60),
    ((select id from topics where order_index = 1), 'Fracciones de cantidades 1', 2, 'https://podium.um.edu.mx/course/rmatematico/lecciones/lesson-2/', 60),
    ((select id from topics where order_index = 1), 'Fracciones de cantidades 2', 3, 'https://podium.um.edu.mx/course/rmatematico/lecciones/fracciones-de-cantidades-2/', 60),
    ((select id from topics where order_index = 1), 'Operaciones básicas', 4, 'https://podium.um.edu.mx/course/rmatematico/lecciones/lesson-3/', 120),
    ((select id from topics where order_index = 1), 'Porcentaje', 5, 'https://podium.um.edu.mx/course/rmatematico/lecciones/lesson-4/', 120),
    ((select id from topics where order_index = 1), 'Expresiones numéricas', 6, 'https://podium.um.edu.mx/course/rmatematico/lecciones/lesson-5/', 120)
  on conflict (topic_id, order_index) do nothing`,
  `insert into nodes (topic_id, name, order_index, video_url, video_duration_sec, is_bridge_prereq) values
    ((select id from topics where order_index = 3), 'Jerarquía de operaciones', 1, 'https://podium.um.edu.mx/course/rmatematico/lecciones/lesson-11/', 180, true)
  on conflict (topic_id, order_index) do nothing`,
  `insert into node_prerequisites (node_id, prerequisite_node_id)
  select
    (select id from nodes where topic_id = (select id from topics where order_index = 3) and order_index = 1),
    id
  from nodes
  where topic_id = (select id from topics where order_index = 1)
  on conflict do nothing`,
];

export default async () => {
  const results = [];
  for (const stmt of statements) {
    try {
      await db.pool.query(stmt);
      results.push('ok');
    } catch (err) {
      results.push(`error: ${err.message}`);
    }
  }
  return new Response(JSON.stringify({ done: true, results }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const config = { path: '/api/init-db' };
