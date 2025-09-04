// app.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.26.0/dist/supabase.min.js";

// --- REPLACE WITH YOUR SUPABASE INFO ---
const SUPABASE_URL = "https://jorkdpleywwwmksnirwn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcmtkcGxleXd3d21rc25pcnduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NjI3MzAsImV4cCI6MjA3MjUzODczMH0.4zYlYinxnJrrDggnX4qS6fwp6_EuAGwXPHYP1hQzuAU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Elements ---
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
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const ticketForm = document.getElementById("ticketForm");

let currentUser = null;
let currentRole = null;

// --- Sign Up ---
signupBtn.addEventListener("click", async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  if (!email || !password) return alert("Enter email & password");

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return alert("Sign Up Error: " + error.message);

  // Insert user into `users` table with default role 'customer'
  const { error: insertError } = await supabase
    .from("users")
    .insert([{ id: data.user.id, email, role: "customer" }]);
  if (insertError) return alert("Error creating user record: " + insertError.message);

  emailInput.value = passwordInput.value = "";
  alert("Sign up complete! Please log in.");
});

// --- Login ---
loginBtn.addEventListener("click", async () => {
  const email = emailInput.value;
  const password = passwordInput.value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return alert("Login Error: " + error.message);

  currentUser = data.user;

  // Fetch role from `users` table
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("role")
    .eq("id", currentUser.id)
    .single();
  if (userError) return alert("Error fetching user role: " + userError.message);

  currentRole = userData.role || "customer";
  showDashboard();
});

// --- Show Dashboard ---
function showDashboard() {
  loginSection.style.display = "none";
  dashboard.style.display = "block";
  roleTitle.innerText = `Logged in as: ${currentRole}`;

  customerSection.style.display = currentRole === "customer" ? "block" : "none";
  ownerSection.style.display = currentRole === "business_owner" ? "block" : "none";
  adminSection.style.display = currentRole === "admin" ? "block" : "none";

  loadTickets();
  if (currentRole === "admin") loadUsers();
}

// --- Submit Ticket ---
ticketForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;

  const { error } = await supabase.from("tickets").insert([{
    title,
    description,
    created_by: currentUser.id,
    status: "open",
    assigned_to: null,
  }]);

  if (error) return alert("Error submitting ticket: " + error.message);

  ticketForm.reset();
  loadTickets();
});

// --- Load Tickets ---
async function loadTickets() {
  ticketsDiv.innerHTML = "";
  ownerTicketsDiv.innerHTML = "";
  adminTicketsDiv.innerHTML = "";

  let query = supabase.from("tickets").select("*").order("created_at", { ascending: false });

  if (currentRole === "customer") query = query.eq("created_by", currentUser.id);

  const { data: tickets, error } = await query;
  if (error) return alert("Error loading tickets: " + error.message);

  tickets.forEach((t) => {
    const ticketHTML = `
      <div class="ticket">
        <strong>${t.title}</strong><br>
        Status: ${t.status}<br>
        Assigned: ${t.assigned_to || "None"}<br>
        Description: ${t.description}
      </div>
    `;
    if (currentRole === "customer") ticketsDiv.innerHTML += ticketHTML;
    if (currentRole === "business_owner") ownerTicketsDiv.innerHTML += ticketHTML;
    if (currentRole === "admin") adminTicketsDiv.innerHTML += ticketHTML;
  });
}

// --- Load Users (Admin only) ---
async function loadUsers() {
  const { data: users, error } = await supabase.from("users").select("*");
  if (error) return alert("Error loading users: " + error.message);

  usersListDiv.innerHTML = "";
  users.forEach((user) => {
    const userHTML = `
      <div>
        ${user.email} - ${user.role}
        <select data-user-id="${user.id}" class="roleSelect">
          <option value="customer" ${user.role==="customer"?"selected":""}>Customer</option>
          <option value="business_owner" ${user.role==="business_owner"?"selected":""}>Business Owner</option>
          <option value="admin" ${user.role==="admin"?"selected":""}>Admin</option>
        </select>
      </div>
    `;
    usersListDiv.innerHTML += userHTML;
  });

  // Add change event for role select
  document.querySelectorAll(".roleSelect").forEach(select => {
    select.addEventListener("change", async (e) => {
      const newRole = e.target.value;
      const userId = e.target.getAttribute("data-user-id");
      const { error } = await supabase.from("users").update({ role: newRole }).eq("id", userId);
      if (error) return alert("Error updating role: " + error.message);
      alert("Role updated successfully!");
      loadUsers();
    });
  });
}
