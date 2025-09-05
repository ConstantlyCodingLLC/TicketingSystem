import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.5/+esm";

// 🔹 Use your real Supabase project values
const SUPABASE_URL = "https://jorkdpleywwwmksnirwn.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcmtkcGxleXd3d21rc25pcnduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NjI3MzAsImV4cCI6MjA3MjUzODczMH0.4zYlYinxnJrrDggnX4qS6fwp6_EuAGwXPHYP1hQzuAU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elements
const loginSection = document.getElementById("loginSection");
const dashboard = document.getElementById("dashboard");
const roleTitle = document.getElementById("roleTitle");

const customerSection = document.getElementById("customerSection");
const ownerSection = document.getElementById("ownerSection");
const adminSection = document.getElementById("adminSection");

const ticketsDiv = document.getElementById("tickets");
const ownerTicketsDiv = document.getElementById("ownerTickets");
const adminTicketsDiv = document.getElementById("adminTickets");
const usersListDiv = document.getElementById("usersList");

// Buttons
document.getElementById("signupBtn").addEventListener("click", signUp);
document.getElementById("loginBtn").addEventListener("click", login);
document.getElementById("ticketForm").addEventListener("submit", submitTicket);

// 🔹 Sign Up
async function signUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return alert("Sign up failed: " + error.message);

  alert("Sign up success! Confirm your email before logging in.");
}

// 🔹 Login
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return alert("Login failed: " + error.message);

  alert("Login success!");
  showDashboard(data.user);
}

// 🔹 Show Dashboard with Role
async function showDashboard(user) {
  loginSection.style.display = "none";
  dashboard.style.display = "block";

  // Get role from profiles
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  let role = "customer"; // default
  if (data?.role) role = data.role;

  roleTitle.textContent = `Role: ${role}`;

  if (role === "customer") {
    customerSection.style.display = "block";
    loadCustomerTickets(user.id);
  } else if (role === "owner") {
    ownerSection.style.display = "block";
    loadOwnerTickets();
  } else if (role === "admin") {
    adminSection.style.display = "block";
    loadAdminTickets();
    loadUsers();
  }
}

// 🔹 Submit Ticket
async function submitTicket(e) {
  e.preventDefault();
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return alert("You must be logged in to submit a ticket.");

  const { error } = await supabase.from("tickets").insert([
    { user_id: user.id, title, description, status: "open" },
  ]);

  if (error) return alert("Error submitting ticket: " + error.message);

  alert("Ticket submitted!");
  e.target.reset();
  loadCustomerTickets(user.id);
}

// 🔹 Load Tickets (Customer)
async function loadCustomerTickets(userId) {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("user_id", userId)
    .order("id", { ascending: false });

  if (error) return console.error(error);

  ticketsDiv.innerHTML = data
    .map((t) => `<div><b>${t.title}</b>: ${t.description} [${t.status}]</div>`)
    .join("");
}

// 🔹 Load Tickets (Owner)
async function loadOwnerTickets() {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .order("id", { ascending: false });

  if (error) return console.error(error);

  ownerTicketsDiv.innerHTML = data
    .map((t) => `<div><b>${t.title}</b>: ${t.description} [${t.status}]</div>`)
    .join("");
}

// 🔹 Load Tickets (Admin)
async function loadAdminTickets() {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .order("id", { ascending: false });

  if (error) return console.error(error);

  adminTicketsDiv.innerHTML = data
    .map((t) => `<div><b>${t.title}</b>: ${t.description} [${t.status}]</div>`)
    .join("");
}

// 🔹 Load Users (Admin)
async function loadUsers() {
  const { data, error } = await supabase.from("profiles").select("id, role");

  if (error) return console.error(error);

  usersListDiv.innerHTML = data
    .map((u) => `<div>User: ${u.id} | Role: ${u.role}</div>`)
    .join("");
}

// 🔹 Keep session
(async () => {
  const { data } = await supabase.auth.getSession();
  if (data.session?.user) {
    showDashboard(data.session.user);
  }
})();
