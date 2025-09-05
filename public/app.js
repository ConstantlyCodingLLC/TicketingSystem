// Replace with your Supabase project keys
const SUPABASE_URL = "https://jorkdpleywwmksnirwn.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcmtkcGxleXd3d21rc25pcnduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NjI3MzAsImV4cCI6MjA3MjUzODczMH0.4zYlYinxnJrrDggnX4qS6fwp6_EuAGwXPHYP1hQzuAU";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const loginSection = document.getElementById("loginSection");
const dashboard = document.getElementById("dashboard");
const roleTitle = document.getElementById("roleTitle");

// Auth: Login
document.getElementById("loginBtn").addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    alert("Login failed: " + error.message);
  } else {
    loadDashboard();
  }
});

// Auth: Sign Up
document.getElementById("signupBtn").addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    alert("Signup failed: " + error.message);
  } else {
    alert("Signup successful, please log in!");
  }
});

// Ticket Submission
const ticketForm = document.getElementById("ticketForm");
if (ticketForm) {
  ticketForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = (await supabase.auth.getUser()).data.user;

    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;

    const { error } = await supabase.from("tickets").insert([
      { title, description, created_by: user.id, company_id: 1 }
    ]);

    if (error) {
      alert("Failed to submit ticket: " + error.message);
    } else {
      ticketForm.reset();
      loadDashboard();
    }
  });
}

// Load Dashboard with Redirect by Role
async function loadDashboard() {
  loginSection.style.display = "none";
  dashboard.style.display = "block";

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const role = profile?.role || "customer";
  roleTitle.innerText = `Logged in as: ${role}`;

  // Hide all sections
  document.querySelectorAll("[data-role]").forEach(el => el.style.display = "none");

  // Redirect to role dashboard
  if (role === "customer") {
    document.getElementById("customerSection").style.display = "block";
    loadCustomerTickets(user.id);
  } else if (role === "owner") {
    document.getElementById("ownerSection").style.display = "block";
    loadCompanyTickets(profile.company_id);
  } else if (role === "admin") {
    document.getElementById("adminSection").style.display = "block";
    loadAllTickets();
    loadUsers();
  }
}

// Customer: Load Tickets
async function loadCustomerTickets(userId) {
  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, title, description, created_at")
    .eq("created_by", userId);

  const ticketsDiv = document.getElementById("tickets");
  ticketsDiv.innerHTML = tickets.map(t => `
    <div class="ticket">
      <h4>${t.title}</h4>
      <p>${t.description}</p>
      <small>Submitted: ${new Date(t.created_at).toLocaleString()}</small>
    </div>
  `).join("");
}

// Owner: Load Company Tickets
async function loadCompanyTickets(companyId) {
  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, title, description, created_at, profiles(name, email)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  const ownerTickets = document.getElementById("ownerTickets");
  ownerTickets.innerHTML = tickets.map(t => `
    <div class="ticket">
      <h4>${t.title}</h4>
      <p>${t.description}</p>
      <small>By: ${t.profiles?.name || t.profiles?.email} | ${new Date(t.created_at).toLocaleString()}</small>
    </div>
  `).join("");
}

// Admin: Load All Tickets
async function loadAllTickets() {
  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, title, description, created_at, company_id, profiles(name, email)")
    .order("created_at", { ascending: false });

  const adminTickets = document.getElementById("adminTickets");
  adminTickets.innerHTML = tickets.map(t => `
    <div class="ticket">
      <h4>${t.title}</h4>
      <p>${t.description}</p>
      <small>
        By: ${t.profiles?.name || t.profiles?.email} | 
        Company: ${t.company_id || "N/A"} | 
        ${new Date(t.created_at).toLocaleString()}
      </small>
    </div>
  `).join("");
}

// Admin: Manage Users
async function loadUsers() {
  const { data: users } = await supabase.from("profiles").select("id, email, role");
  const usersDiv = document.getElementById("usersList");

  usersDiv.innerHTML = users.map(u => `
    <div>
      ${u.email} — ${u.role}
      <button onclick="setRole('${u.id}','customer')">Customer</button>
      <button onclick="setRole('${u.id}','owner')">Owner</button>
      <button onclick="setRole('${u.id}','admin')">Admin</button>
    </div>
  `).join("");
}

// Admin: Set Role
window.setRole = async function(userId, role) {
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) {
    alert("Failed to update role: " + error.message);
  } else {
    loadUsers();
  }
};
