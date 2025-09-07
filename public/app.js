import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://jorkdpleywwwmksnirwn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcmtkcGxleXd3d21rc25pcnduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NjI3MzAsImV4cCI6MjA3MjUzODczMH0.4zYlYinxnJrrDggnX4qS6fwp6_EuAGwXPHYP1hQzuAU'; // your anon key
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elements
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');

const roleTitle = document.getElementById('roleTitle');
const customerSection = document.getElementById('customerSection');
const ownerSection = document.getElementById('ownerSection');
const adminSection = document.getElementById('adminSection');

const ticketForm = document.getElementById('ticketForm');
const customerTickets = document.getElementById('customerTickets');
const ownerTickets = document.getElementById('ownerTickets');
const adminTickets = document.getElementById('adminTickets');
const usersList = document.getElementById('usersList');

let currentUser = null;

// ----- Signup -----
signupBtn?.addEventListener('click', async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  if(!email || !password) return alert('Enter email & password');

  const { user, error } = await supabase.auth.signUp({ email, password });
  if(error) return alert(error.message);

  // Set default role = customer
  await supabase.from('users').insert([{ id: user.id, email, role: 'customer' }]);
  alert('Sign up successful! Please log in.');
});

// ----- Login -----
loginBtn?.addEventListener('click', async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  if(!email || !password) return alert('Enter email & password');

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if(error) return alert(error.message);

  currentUser = data.user;
  loadDashboard();
});

// ----- Load Dashboard -----
async function loadDashboard() {
  // Fetch user role
  const { data: userData, error } = await supabase.from('users').select().eq('id', currentUser.id).single();
  if(error) return alert(error.message);

  const role = userData.role;
  roleTitle.innerText = `Logged in as: ${role}`;

  // Show sections based on role
  customerSection.style.display = role === 'customer' ? 'block' : 'none';
  ownerSection.style.display = role === 'owner' ? 'block' : 'none';
  adminSection.style.display = role === 'admin' ? 'block' : 'none';

  // Load tickets
  if(role === 'customer') loadCustomerTickets();
  if(role === 'owner') loadOwnerTickets();
  if(role === 'admin') loadAdminTickets();
}

// ----- Ticket Submission -----
ticketForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const title = document.getElementById('title').value;
  const description = document.getElementById('description').value;

  const { error } = await supabase.from('tickets').insert([{
    title, description, created_by: currentUser.id, status: 'open', priority: 'normal', created_at: new Date()
  }]);

  if(error) return alert(error.message);

  ticketForm.reset();
  loadCustomerTickets();
});

// ----- Load Tickets -----
async function loadCustomerTickets() {
  const { data: tickets, error } = await supabase.from('tickets').select('*').eq('created_by', currentUser.id).order('created_at', { ascending: false });
  if(error) return alert(error.message);

  customerTickets.innerHTML = tickets.map(t => `<div>${t.title} | Status: ${t.status} | Submitted: ${t.created_at}</div>`).join('');
}

async function loadOwnerTickets() {
  const { data: tickets, error } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
  if(error) return alert(error.message);

  ownerTickets.innerHTML = tickets.map(t => `<div>${t.title} | Status: ${t.status} | Submitted: ${t.created_at}</div>`).join('');
}

async function loadAdminTickets() {
  const { data: tickets, error } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
  if(error) return alert(error.message);

  adminTickets.innerHTML = tickets.map(t => `<div>${t.title} | Status: ${t.status} | Submitted: ${t.created_at}</div>`).join('');

  // Load Users
  const { data: users, error: userError } = await supabase.from('users').select('*');
  if(userError) return alert(userError.message);

  usersList.innerHTML = users.map(u => `
    <div>
      ${u.email} | Role: ${u.role} 
      <button onclick="changeRole('${u.id}', 'customer')">Customer</button>
      <button onclick="changeRole('${u.id}', 'owner')">Owner</button>
      <button onclick="changeRole('${u.id}', 'admin')">Admin</button>
    </div>
  `).join('');
}

// ----- Change Role -----
window.changeRole = async (userId, role) => {
  const { error } = await supabase.from('users').update({ role }).eq('id', userId);
  if(error) return alert(error.message);
  loadDashboard();
}

