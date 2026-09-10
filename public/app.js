// Por ahora, un student_id fijo para pruebas. Se reemplaza cuando se agregue el login.
const STUDENT_ID = 1;

const STATUS_LABEL = {
  bloqueado: 'Bloqueado',
  desbloqueado: 'En curso',
  completado: 'Completado',
  dominado: 'Dominado',
};

async function loadPath() {
  const container = document.getElementById('path');
  try {
    const res = await fetch(`/api/progress?student_id=${STUDENT_ID}`);
    const nodes = await res.json();
    renderPath(nodes, container);
  } catch (err) {
    container.innerHTML = `<p class="loading">No se pudo cargar el camino todavía (¿la base de datos ya está conectada?)</p>`;
    console.error(err);
  }
}

function renderPath(nodes, container) {
  container.innerHTML = '';
  let currentTopic = null;
  let rowIndex = 0;

  nodes.forEach((n) => {
    if (n.topic_name !== currentTopic) {
      currentTopic = n.topic_name;
      rowIndex = 0;
      const h = document.createElement('h2');
      h.className = 'topic-header';
      h.textContent = `Tema ${n.topic_order} · ${n.topic_name}`;
      container.appendChild(h);
    }

    if (n.is_bridge_prereq) {
      const bridge = document.createElement('div');
      bridge.className = 'bridge';
      bridge.innerHTML = `
        <div class="bridge-circle">🔗</div>
        <div class="node-label">
          <p class="node-name">${n.node_name}</p>
          <p class="node-status">Requiere el tema anterior completo</p>
        </div>`;
      const connector = document.createElement('div');
      connector.className = 'bridge-connector';
      container.appendChild(connector);
      container.appendChild(bridge);
      rowIndex++;
      return;
    }

    const row = document.createElement('div');
    row.className = `node-row ${n.status}` + (rowIndex % 2 === 1 ? ' offset' : '');
    row.innerHTML = `
      <div class="node-circle ${n.status}">${iconFor(n.status)}</div>
      <div class="node-label">
        <p class="node-name">${n.node_name}</p>
        <p class="node-status">${STATUS_LABEL[n.status]}</p>
      </div>`;
    container.appendChild(row);

    const connector = document.createElement('div');
    connector.className = 'connector';
    container.appendChild(connector);

    rowIndex++;
  });

  document.getElementById('xp').textContent = '0';
  document.getElementById('streak').textContent = '0';
}

function iconFor(status) {
  return { bloqueado: '🔒', desbloqueado: '▶', completado: '✓', dominado: '★' }[status] || '';
}

loadPath();
