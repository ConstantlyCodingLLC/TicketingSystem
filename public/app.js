// ----- Supabase Client -----
const SUPABASE_URL = "https://jorkdpleywwwmksnirwn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcmtkcGxleXd3d21rc25pcnduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NjI3MzAsImV4cCI6MjA3MjUzODczMH0.4zYlYinxnJrrDggnX4qS6fwp6_EuAGwXPHYP1hQzuAU";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ----- Elements -----
const loginSection = document.getElementById('loginSection');
const dashboard = document.getElementById('dashboard');
const roleTitle = document.getElementById('roleTitle');
const customerSection = document.getElementById('customerSection');
const ticketForm = document.getElementById('ticketForm');
const ticketsDiv = document.getElementById('tickets');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

let currentUser = null;

// ----- Sign Up -----
signupBtn.addEventListener('click', async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  if(!email || !password) return alert("Enter email & password");

  const { user, error } = await supabase.auth.signUp({ email, password });

  if(error) return alert(error.message);

  // Create user profile in Supabase table
  await supabase.from('users').insert([{ id: user.id, email: user.email, role: 'customer' }]);
  alert("Sign up complete! Log in.");
  emailInput.value = passwordInput.value = '';
});

// ----- Login -----
loginBtn.addEventListener('click', async () => {
  const email = emailInput.value;
  const password = passwordInput.value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if(error) return alert(error.message);

  currentUser = data.user;

  // Fetch role from users table
  const { data: userProfile } = await supabase.from('users').select('role').eq('id', currentUser.id).single();
  const role = userProfile?.role || 'customer';
  showDashboard(role);
});

// ----- Show Dashboard Based on Role -----
function showDashboard(role) {
  loginSection.style.display = 'none';
  dashboard.style.display = 'block';
  roleTitle.innerText = `Logged in as: ${role}`;
  if(role === 'customer') customerSection.style.display = 'block';
  renderTickets(role);
}

// ----- Submit Ticket -----
ticketForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const title = document.getElementById('title').value;
  const description = document.getElementById('description').value;
  const ticketNumber = `TCK-${Date.now()}`;

  await supabase.from('tickets').insert([{
    title,
    description,
    ticket_number: ticketNumber,
    status: 'open',
    created_by: currentUser.id,
    assigned_to: null,
    comments: []
  }]);

  ticketForm.reset();
  renderTickets('customer');
});

// ----- Render Tickets -----
async function renderTickets(role) {
  ticketsDiv.innerHTML = '';
  let query = supabase.from('tickets').select('*').order('created_at', { ascending: false });

  if(role === 'customer') {
    query = query.eq('created_by', currentUser.id);
  }

  const { data: tickets, error } = await query;
  if(error) return console.error(error);

  tickets.forEach(t => {
    ticketsDiv.innerHTML += `
      <div class="ticket">
        <strong>${t.ticket_number}: ${t.title}</strong><br>
        Status: ${t.status}<br>
        Assigned: ${t.assigned_to || 'None'}<br>
        Description: ${t.description}<br>
        Comments: ${(t.comments || []).join(", ")}
      </div>
    `;
  });
}
