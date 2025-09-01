const API_BASE = '/api/tickets';
const USERS_API = '/api/users';

// Customer Portal
if (document.getElementById('ticketForm')) {
  const form = document.getElementById('ticketForm');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;

    await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description })
    });

    form.reset();
    renderTicketsCustomer();
  });

  async function fetchTickets() {
    const res = await fetch(API_BASE);
    return await res.json();
  }

  async function renderTicketsCustomer() {
    const ticketsDiv = document.getElementById('tickets');
    const tickets = await fetchTickets();
    ticketsDiv.innerHTML = tickets.map(t => `
      <div class="ticket">
        <strong>${t.title}</strong><br>
        ${t.description}<br>
        Status: ${t.status}<br>
        Comments: ${t.comments.join(", ")}
      </div>
    `).join('');
  }

  renderTicketsCustomer();
}

// Staff Dashboard
if (document.getElementById('tickets') && !document.getElementById('ticketForm')) {

  async function fetchTickets() {
    const res = await fetch(API_BASE);
    return await res.json();
  }

  async function fetchUsers() {
    const res = await fetch(USERS_API);
    return await res.json();
  }

  async function renderTicketsStaff() {
    const ticketsDiv = document.getElementById('tickets');
    const tickets = await fetchTickets();
    const users = await fetchUsers();

    ticketsDiv.innerHTML = tickets.map(t => {
      const userOptions = users.map(u => `<option value="${u.name}" ${t.assignedTo === u.name ? "selected" : ""}>${u.name}</option>`).join('');
      return `
        <div class="ticket">
          <strong>${t.title}</strong><br>
          Description: ${t.description}<br>
          Status: 
          <select data-id="${t.id}" class="status">
            <option value="open" ${t.status==='open'?'selected':''}>Open</option>
            <option value="in-progress" ${t.status==='in-progress'?'selected':''}>In Progress</option>
            <option value="closed" ${t.status==='closed'?'selected':''}>Closed</option>
          </select><br>
          Assigned to: 
          <select data-id="${t.id}" class="assign">
            <option value="">None</option>
            ${userOptions}
          </select><br>
          Add Comment: <input type="text" class="comment" data-id="${t.id}">
          <button class="add-comment" data-id="${t.id}">Add</button>
          <div>Comments: ${t.comments.join(", ")}</div>
        </div>
      `;
    }).join('');

    // Event listeners
    document.querySelectorAll('.status').forEach(sel => {
      sel.addEventListener('change', async e => {
        const id = e.target.dataset.id;
        await fetch(API_BASE, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: e.target.value })
        });
        renderTicketsStaff();
      });
    });

    document.querySelectorAll('.assign').forEach(sel => {
      sel.addEventListener('change', async e => {
        const id = e.target.dataset.id;
        await fetch(API_BASE, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, assignedTo: e.target.value })
        });
        renderTicketsStaff();
      });
    });

    document.querySelectorAll('.add-comment').forEach(btn => {
      btn.addEventListener('click', async e => {
        const id = e.target.dataset.id;
        const input = document.querySelector(`.comment[data-id="${id}"]`);
        const comment = input.value;
        if (!comment) return;
        await fetch(API_BASE, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, comments: [comment] })
        });
        input.value = '';
        renderTicketsStaff();
      });
    });
  }

  renderTicketsStaff();
}
