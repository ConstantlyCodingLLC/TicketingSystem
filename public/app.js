// Supabase keys
const SUPABASE_URL = "https://jorkdpleywwwmksnirwn.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY_HERE"; // replace with your anon key

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.26.0/dist/supabase.min.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elements
const loginSection = document.getElementById("loginSection");
const dashboard = document.getElementById("dashboard");
const roleTitle = document.getElementById("roleTitle");

// Login
document.getElementById("loginBtn").addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    alert("Login failed: " + error.message);
  } else {
    loadDashboard();
  }
});

// Signup
document.getElementById("signupBtn").addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    alert("Signup failed: " + error.message);
  } else {
    alert("Signup success! Check your email and login.");
  }
});

// Load dashboard
async function loadDashboard() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (!user) {
    alert("No user session found. Please login.");
    loginSection.style.display = "block";
    dashboard.style.display = "none";
    return;
  }

  // Get user profile from Supabase 'profiles' table
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) {
    alert("Profile not found: " + profileError.message);
    return;
  }

  const role = profile.role || "customer";
  roleTitle.innerText = `Logged in as: ${role}`;

  // Hide login, show dashboard
  loginSection.style.display = "none";
  dashboard.style.display = "block";

  // Show sections by role
  document.querySelectorAll("[data-role]").forEach(el => el.style.display = "none");
  if (role === "customer") {
    document.getElementById("customerSection").style.display = "block";
    loadCustomerTickets(user.id);
  } else if (role === "owner") {
    document.getElementById("ownerSection").style.display = "block");
    loadCompanyTickets(profile.company_id);
  } else if (role === "admin") {
    document.getElementById("adminSection").style.display = "block";
    loadAllTickets();
    loadUsers();
  }
}

// Optional: maintain session on page reload
supabase.auth.onAuthStateChange((event, session) => {
  if (session) loadDashboard();
});
