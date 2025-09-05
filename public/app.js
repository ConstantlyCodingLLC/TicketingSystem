import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.26.0/dist/supabase.min.js";

// Supabase credentials
const SUPABASE_URL = "https://jorkdpleywwwmksnirwn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcmtkcGxleXd3d21rc25pcnduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NjI3MzAsImV4cCI6MjA3MjUzODczMH0.4zYlYinxnJrrDggnX4qS6fwp6_EuAGwXPHYP1hQzuAU"; // Replace with your key

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM elements
const loginSection = document.getElementById("loginSection");
const dashboard = document.getElementById("dashboard");
const roleTitle = document.getElementById("roleTitle");

const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

// Role Sections
const customerSection = document.getElementById("customerSection");
const ownerSection = document.getElementById("ownerSection");
const adminSection = document.getElementById("adminSection");

// Ticket Sections
const ticketForm = document.getElementById("ticketForm");
const customerTickets = document.getElementById("customerTickets");
const ownerTickets = document.getElementById("ownerTickets");
const adminTickets = document.getElementById("adminTickets");

// Admin Users
const usersList = document.getElementById("usersList");

let currentUser;

// ---------- AUTH ----------

// Sign up
signupBtn.addEventListener("click", async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  if (!email || !password) return alert("Enter email & password");

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return alert("Signup error: " + error.message);

  // Create profile with default role 'customer'
  await supabase.from("profiles").insert([{ id: data.user.id, email, role: "customer" }]);
  alert("Signup successful! Please login.");
});

// Login
loginBtn.addEventListener("click", async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  if (!email || !password) return alert("Enter email & password");

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return alert("Login failed: " + error.message);

  currentUser = data.user;
  loadDashboard();
});

// Maintain session on reload
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    currentUser = session.user;
    loadDashboard();
  }
});

// ---------- DASHBOARD ----------

async function loadDashboard() {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .single();

  const role = profile.role || "customer";
  roleTitle.innerText = `Logged in as: ${role}`;

  loginSection.style.display = "none";
  dashboard.style.display = "block";

  // Hide all role sections
  [customerSection, ownerSection, adminSection].forEach(sec => (sec.style.display = "none"));

  // Show relevant section
  if (role === "customer") {
    customerSection.style.display = "block";
    loadCustomerTickets();
  }
  if (role === "owner") {
    ownerSection.style.display = "block";
    loadOwnerTickets();
  }
  if (role === "admin") {
    adminSection.style.display = "block";
    loadAdminTickets();
    loadUsers();
  }
}

// ---------- TICKETS ----------

// Submit ticket (Customer)
ticketForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;

  await supabase.from("tickets").insert([{
    title,
    description,
    created_by: currentUser.id,
    status: "open",
    created_at: new Date()
  }]);

  ticketForm.reset();
  loadCustomerTickets();
});

// Load tickets
async function loadCustomerTickets() {
  const { data } = await supabase
    .from("tickets")
    .select("*")
    .eq("created_by", currentUser.id)
    .order("created_at", { ascending: false });

  customerTickets.innerHTML = data.map(t => `
    <div><strong>${t.title}</strong> - Submitted: ${new Date(t.created_at).toLocaleString()} - Status: ${t.status}</div>
  `).join("");
}

async function loadOwnerTickets() {
  const { data } = await supabase
    .from("tickets")
    .select("*")
    .eq("owner_id", currentUser.id)
    .order("created_at", { ascending: false });

  ownerTickets.innerHTML = data.map(t => `
    <div><strong>${t.title}</strong> - Submitted: ${new Date(t.created_at).toLocaleString()} - Status: ${t.status}</div>
  `).join("");
}

async function loadAdminTickets() {
  const { data } = await supabase
    .from("tickets")
    .select("*")
    .order("created_at", { ascending: false });

  adminTickets.innerHTML = data.map(t => `
    <div><strong>${t.title}</strong> - Submitted: ${new Date(t.created_at).toLocaleString()} - Status: ${t.status}</div>
  `).join("");
}

// ---------- ADMIN: MANAGE USERS ----------

async function loadUsers() {
  const { data } = await supabase.from("profiles").select("*");
  usersList.innerHTML = data.map(u => `
    <div>
      ${u.email} - Role: ${u.role}
      <select onchange="changeUserRole('${u.id}', this.value)">
        <option value="customer">Customer</option>
        <option value="owner">Owner</option>
        <option value="admin">Admin</option>
      </select>
    </div>
  `).join("");
}

// Change user role
window.changeUserRole = async (id, role) => {
  await supabase.from("profiles").update({ role }).eq("id", id);
  loadUsers();
};
