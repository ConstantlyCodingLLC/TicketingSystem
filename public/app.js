import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.26.0/dist/supabase.min.js';

const supabaseUrl = "https://jorkdpleywwwmksnirwn.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcmtkcGxleXd3d21rc25pcnduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NjI3MzAsImV4cCI6MjA3MjUzODczMH0.4zYlYinxnJrrDggnX4qS6fwp6_EuAGwXPHYP1hQzuAU";
const supabase = createClient(supabaseUrl, supabaseKey);

// Elements
const loginSection = document.getElementById('loginSection');
const dashboard = document.getElementById('dashboard');
const roleTitle = document.getElementById('roleTitle');
const customerSection = document.getElementById('customerSection');
const ownerSection = document.getElementById('ownerSection');
const adminSection = document.getElementById('adminSection');
const ticketForm = document.getElementById('ticketForm');
const ticketsDiv = document.getElementById('tickets');
const ownerTicketsDiv = document.getElementById('ownerTickets');
const adminTicketsDiv = document.getElementById('adminTickets');
const usersListDiv = document.getElementById('usersList');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

let currentUser = null;
let currentRole = null;

// ---- Sign Up ----
signupBtn.addEventListener('click', async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  if(!email || !password) return alert("Enter email & password");

  const { user, error } = await supabase.auth.signUp({ email, password });
  if(error) return alert(error.message);

  currentUser = user;

  // Add default role: customer
  await supabase.from('users').insert([{ id: user.id, email, role: 'customer' }]);
  alert("Sign up complete! Log in.");
});

// ---- Login ----
loginBtn.addEventListener('click', async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
  if(error) return alert(error.message);

  currentUser = user;

  const { data, error: roleError } = await supabase
    .from('users')
    .select('*')
    .eq('id', currentUser.id)
    .single();

  if(roleError) return alert(roleError.message);

  currentRole = data.role;
  showDashboard(currentRole);
});

// ---- Show Dashboard Based on Role ----
function showDashboard(role) {
  loginSection.style.display = 'none';
  dashboard.style.display = 'block';
  roleTitle.innerText = `Logged in as: ${role}`;

  customerSection.style.display = role === 'customer' ? 'block' : 'none';
  ownerSection.style.display = role === 'owner' ? 'block' : 'none';
  adminSection.style.display = role === 'admin' ? 'block' : 'none';

  renderTickets(role);
  if(role === 'admin') renderUsers();
}

// ---- Submit Ticket ----
ticketForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const title = document.getElementById('title').value;
  const description = document.getElementById('description').value;

  await supabase.from('tickets').insert([{
    title,
    description,
    created_by: currentUser.id,
    status: 'open',
    assigned_to: null,
    created_at: new Date()
  }]);

  ticketForm.reset();
  renderTickets('customer');
});

// ---- Render Tickets ----
async function renderTickets(role) {
  ticketsDiv.innerHTML = '';
  ownerTicketsDiv.innerHTML = '';
  adminTicketsDiv.innerHTML = '';

  let { data: tickets, error } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
  if(error) return console.error(error);

  tickets.forEach(ticket => {
    const ticketHTML = `
      <div class="ticket">
        <strong>${ticket.title}</strong><br>
        Status: ${ticket.status}<br>
        Assigned To: ${ticket.assigned_to || 'None'}<br>
        Created By: ${ticket.created_by}<br>
        Description: ${ticket.description}
      </div>
    `;

    if(role === 'customer' && ticket.created_by === currentUser.id) ticketsDiv.innerHTML += ticketHTML;
    if(role === 'owner') ownerTicketsDiv.innerHTML += ticketHTML;
    if(role === 'admin') adminTicketsDiv.innerHTML += ticketHTML;
  });
}

// ---- Render Users for Admin Role ----
async function renderUsers() {
  const { data: users, error } = await supabase.from('users').select('*');
  if(error) return console.error(error);

  usersListDiv.innerHTML = '';
  users.forEach(user => {
    usersListDiv.innerHTML += `
      <div>
        ${user.email} - ${user.role}
        <button onclick="changeRole('${user.id}', 'customer')">Customer</button>
        <button onclick="changeRole('${user.id}', 'owner')">Owner</button>
        <button onclick="changeRole('${user.id}', 'admin')">Admin</button>
      </div>
    `;
  });
}

// ---- Change User Role (Admin Only) ----
window.changeRole = async (userId, newRole) => {
  const { data, error } = await supabase.from('users').update({ role: newRole }).eq('id', userId);
  if(error) return alert(error.message);
  renderUsers();
  alert("Role updated!");
}
