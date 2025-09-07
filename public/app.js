import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/supabase.min.js';

// Replace with your own Supabase URL & Anon Key
const SUPABASE_URL = 'https://jorkdpleywwwmksnirwn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcmtkcGxleXd3d21rc25pcnduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NjI3MzAsImV4cCI6MjA3MjUzODczMH0.4zYlYinxnJrrDggnX4qS6fwp6_EuAGwXPHYP1hQzuAU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elements
const loginSection = document.getElementById('loginSection');
const dashboard = document.getElementById('dashboard');
const roleTitle = document.getElementById('roleTitle');

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');

const customerSection = document.getElementById('customerSection');
const ownerSection = document.getElementById('ownerSection');
const adminSection = document.getElementById('adminSection');

const ticketForm = document.getElementById('ticketForm');
const customerTicketsDiv = document.getElementById('customerTickets');
const ownerTicketsDiv = document.getElementById('ownerTickets');
const adminTicketsDiv = document.getElementById('adminTickets');
const usersListDiv = document.getElementById('usersList');

let currentUser = null;
let currentRole = null;

// -------------------- Sign Up --------------------
signupBtn.addEventListener('click', async () => {
  const email = emailInput.value;
  const password = passwordInput.value;

  if (!email || !password) return alert('Enter email & password');

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) return alert('Sign Up Error: ' + error.message);

  // Insert user into users table
  const { error: dbError } = await supabase.from('users').insert({
    id: data.user.id,
    email,
    role: 'customer'
  });

  if (dbError) return alert('DB Error: ' + dbError.message);

  alert('Sign up complete! You can now log in.');
});

// -------------------- Login --------------------
loginBtn.addEventListener('click', async () => {
  const email = emailInput.value;
  const password = passwordInput.value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return alert('Login Error: ' + error.message);

  currentUser = data.user;

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', currentUser.id)
    .single();

  if (userError) return alert('User fetch error: ' + userError.message);

  currentRole = userData.role;
  showDashboard();
});

// -------------------- Show Dashboard --------------------
function showDashboard() {
  loginSection.style.display = 'none';
  dashboard.style.display = 'block';
  roleTitle.innerText = `Logged in as: ${currentRole}`;

  customerSection.style.display = currentRole === 'customer' ? 'block' : 'none';
  ownerSection.style.display = currentRole === 'owner' ? 'block' : 'none';
  adminSection.style.display = currentRole === 'admin' ? 'block' : 'none';

  if (currentRole === 'customer') loadCustomerTickets();
  if (currentRole === 'owner') loadOwnerTickets();
  if (currentRole === 'admin') loadAdminTickets();
}

// -------------------- Customer Ticket Submission --------------------
ticketForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('title').value;
  const description = document.getElementById('description').value;

  await supabase.from('tickets').insert({
    title,
    description,
    created_by: currentUser.id
  });

  ticketForm.reset();
  loadCustomerTickets();
});

// -------------------- Load Tickets --------------------
async function loadCustomerTickets() {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('created_by', currentUser.id)
    .order('created_at', { ascending: false });

  customerTicketsDiv.innerHTML = '';
  if (error) return customerTicketsDiv.innerHTML = 'Error loading tickets';

  data.forEach(ticket => {
    customerTicketsDiv.innerHTML += `<div>
      <strong>${ticket.title}</strong> - ${ticket.status}<br>
      Submitted: ${new Date(ticket.created_at).toLocaleString()}<br>
      Description: ${ticket.description}
    </div><hr>`;
  });
}

async function loadOwnerTickets() {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false });

  ownerTicketsDiv.innerHTML = '';
  if (error) return ownerTicketsDiv.innerHTML = 'Error loading tickets';

  data.forEach(ticket => {
    ownerTicketsDiv.innerHTML += `<div>
      <strong>${ticket.title}</strong> - ${ticket.status}<br>
      Priority: <input type="text" id="priority-${ticket.id}" value="${ticket.priority || 'normal'}">
      <button onclick="updateTicket('${ticket.id}')">Update</button><br>
      Submitted: ${new Date(ticket.created_at).toLocaleString()}<br>
      Description: ${ticket.description}
    </div><hr>`;
  });
}

window.updateTicket = async (ticketId) => {
  const priorityInput = document.getElementById(`priority-${ticketId}`).value;
  await supabase.from('tickets').update({ priority: priorityInput }).eq('id', ticketId);
  loadOwnerTickets();
};

async function loadAdminTickets() {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false });

  adminTicketsDiv.innerHTML = '';
  if (error) return adminTicketsDiv.innerHTML = 'Error loading tickets';

  data.forEach(ticket => {
    adminTicketsDiv.innerHTML += `<div>
      <strong>${ticket.title}</strong> - ${ticket.status}<br>
      Priority: ${ticket.priority}<br>
      Submitted: ${new Date(ticket.created_at).toLocaleString()}<br>
      Description: ${ticket.description}
    </div><hr>`;
  });

  // Load users
  const { data: users, error: usersError } = await supabase.from('users').select('*');
  usersListDiv.innerHTML = '';
  if (usersError) return usersListDiv.innerHTML = 'Error loading users';

  users.forEach(user => {
    usersListDiv.innerHTML += `<div>
      ${user.email} - ${user.role} 
      <select onchange="changeRole('${user.id}', this.value)">
        <option value="customer" ${user.role==='customer'?'selected':''}>Customer</option>
        <option value="owner" ${user.role==='owner'?'selected':''}>Owner</option>
        <option value="admin" ${user.role==='admin'?'selected':''}>Admin</option>
      </select>
    </div>`;
  });
}

window.changeRole = async (userId, newRole) => {
  await supabase.from('users').update({ role: newRole }).eq('id', userId);
  loadAdminTickets();
};
