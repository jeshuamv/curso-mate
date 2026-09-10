import { neon } from '@netlify/neon';

const sql = neon(); // usa NETLIFY_DATABASE_URL, inyectada automáticamente

export default async (req) => {
  const url = new URL(req.url);
  const studentId = url.searchParams.get('student_id');

  if (!studentId) {
    return new Response(JSON.stringify({ error: 'student_id requerido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (req.method === 'GET') {
    const rows = await sql`
      select
        t.id as topic_id, t.name as topic_name, t.order_index as topic_order,
        n.id as node_id, n.name as node_name, n.order_index as node_order,
        n.video_url, n.video_duration_sec, n.is_bridge_prereq,
        coalesce(p.status, 'bloqueado') as status,
        coalesce(p.crowns, 0) as crowns
      from nodes n
      join topics t on t.id = n.topic_id
      left join student_node_progress p
        on p.node_id = n.id and p.student_id = ${studentId}
      order by t.order_index, n.order_index
    `;
    return new Response(JSON.stringify(rows), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (req.method === 'POST') {
    const body = await req.json();
    const { node_id, exercise_id, is_correct, error_type, steps_submitted } = body;

    await sql`
      insert into exercise_attempts (student_id, exercise_id, node_id, is_correct, error_type, steps_submitted)
      values (${studentId}, ${exercise_id}, ${node_id}, ${is_correct}, ${error_type}, ${steps_submitted ? JSON.stringify(steps_submitted) : null})
    `;

    if (!is_correct && error_type) {
      await sql`
        insert into error_patterns (student_id, node_id, error_type, count)
        values (${studentId}, ${node_id}, ${error_type}, 1)
        on conflict (student_id, node_id, error_type)
        do update set count = error_patterns.count + 1
      `;
    }

    await sql`
      insert into student_node_progress (student_id, node_id, status, attempts_count, last_practiced_at)
      values (${studentId}, ${node_id}, 'desbloqueado', 1, now())
      on conflict (student_id, node_id)
      do update set
        attempts_count = student_node_progress.attempts_count + 1,
        last_practiced_at = now()
    `;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response('Método no soportado', { status: 405 });
};

export const config = { path: '/api/progress' };
