import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.26.0/dist/supabase.min.js";

// --- Supabase client ---
const supabase = createClient(
  "https://jorkdpleywwwmksnirwn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcmtkcGxleXd3d21rc25pcnduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NjI3MzAsImV4cCI6MjA3MjUzODczMH0.4zYlYinxnJrrDggnX4qS6fwp6_EuAGwXPHYP1hQzuAU"
);

// --- Elements ---
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const dashboard = document.getElementById('dashboard');
const roleTitle = document.getElementById('roleTitle');
const customerSection = document.getElementById('customerSection');
const ticketForm = document.getElementById('ticketForm');
const ticketsDiv = document.getElementById('tickets');
const ownerSection = document.getElementById('ownerSection');
const ownerTicketsDiv = document.getElementById('ownerTickets');
const adminSection = document.getElementById('adminSection');
const adminTicketsDiv = document.getElementById('adminTickets');
const usersListDiv = document.getElementById('usersList');

// --- Auth ---
signupBtn.addEventListener('click', async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  if(!email || !password) return alert("Enter email & password");

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
  if(signUpError) return alert(signUpError.message);

  await supabase.from('users').insert([{ id: signUpData.user.id, email, role: 'customer' }]);
  alert("Sign up complete! Log in.");
});

loginBtn.addEventListener('click', async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if(error) return alert(error.message);

  loadDashboard();
});

// --- Load Dashboard ---
async function loadDashboard() {
  dashboard.style.display = 'block';
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user.id;

  const { data: userRow } = await supabase.from('users').select().eq('id', userId).single();
  const role = userRow.role;
  roleTitle.innerText = `Logged in as: ${role}`;

  customerSection.style.display = role === 'customer' ? 'block' : 'none';
  ownerSection.style.display = role === 'business_owner' ? 'block' : 'none';
  adminSection.style.display = role === 'admin' ? 'block' : 'none';

  renderTickets(role);
  if(role === 'admin') renderUsers();
}

// --- Render Tickets ---
async function renderTickets(role) {
  const userId = (await supabase.auth.getUser()).data.user.id;

  let query = supabase.from('tickets').select('*').order('created_at', { ascending: false });
  if(role === 'customer') query = query.eq('created_by', userId);

  const { data: tickets } = await query;
  ticketsDiv.innerHTML = '';
  tickets.forEach(t => {
    ticketsDiv.innerHTML += `<div class="ticket"><strong>${t.title}</strong> (${t.status})<br>${t.description}</div>`;
  });

  if(role === 'business_owner') renderOwnerTickets();
  if(role === 'admin') renderAdminTickets();
}

async function renderOwnerTickets() {
  const { data: tickets } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
  ownerTicketsDiv.innerHTML = '';
  tickets.forEach(t => {
    ownerTicketsDiv.innerHTML += `<div>${t.title} - ${t.status}</div>`;
  });
}

async function renderAdminTickets() {
  const { data: tickets } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
  adminTicketsDiv.innerHTML = '';
  tickets.forEach(t => {
    adminTicketsDiv.innerHTML += `<div>${t.title} - ${t.status}</div>`;
  });
}

// --- Render Users for Admin ---
async function renderUsers() {
  const { data: users } = await supabase.from('users').select('*');
  usersListDiv.innerHTML = '';
  users.forEach(u => {
    usersListDiv.innerHTML += `
      <div>
        ${u.email} - Role: ${u.role} 
        <button onclick="changeRole('${u.id}', 'customer')">Customer</button>
        <button onclick="changeRole('${u.id}', 'business_owner')">Business Owner</button>
        <button onclick="changeRole('${u.id}', 'admin')">Admin</button>
      </div>
    `;
  });
}

// --- Change User Role ---
window.changeRole = async (userId, role) => {
  await supabase.from('users').update({ role }).eq('id', userId);
  renderUsers();
};

// --- Submit Ticket ---
ticketForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const { data: { user } } = await supabase.auth.getUser();
  const title = document.getElementById('title').value;
  const description = document.getElementById('description').value;

  await supabase.from('tickets').insert([{ title, description, created_by: user.id }]);
  ticketForm.reset();
  renderTickets('customer');
});
