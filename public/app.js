import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.26.0/+esm";

// 🔑 Replace with your project values
const SUPABASE_URL = "https://https://jorkdpleywwwmksnirwn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcmtkcGxleXd3d21rc25pcnduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NjI3MzAsImV4cCI6MjA3MjUzODczMH0.4zYlYinxnJrrDggnX4qS6fwp6_EuAGwXPHYP1hQzuAU";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const authMessage = document.getElementById("authMessage");

const dashboard = document.getElementById("dashboard");
const loginSection = document.getElementById("loginSection");
const roleTitle = document.getElementById("roleTitle");
const customerSection = document.getElementById("customerSection");
const ownerSection = document.getElementById("ownerSection");
const adminSection = document.getElementById("adminSection");

// ✅ Ensure buttons are clickable
loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    authMessage.textContent = "Please enter email and password.";
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("Login error:", error);
    authMessage.textContent = error.message;
    return;
  }

  authMessage.textContent = "";
  console.log("Login success:", data);
  loadDashboard(data.user);
});

signupBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    authMessage.textContent = "Please enter email and password.";
    return;
  }

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    console.error("Signup error:", error);
    authMessage.textContent = error.message;
    return;
  }

  authMessage.textContent = "Signup successful. Please login.";
  console.log("Signup success:", data);
});

// Load role-specific dashboard
async function loadDashboard(user) {
  loginSection.style.display = "none";
  dashboard.style.display = "block";

  // Fetch role from "profiles" table
  let { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    roleTitle.textContent = "No role assigned";
    return;
  }

  const role = profile.role;
  roleTitle.textContent = `Role: ${role}`;

  // Show correct section
  if (role === "customer") {
    customerSection.style.display = "block";
  } else if (role === "owner") {
    ownerSection.style.display = "block";
  } else if (role === "admin") {
    adminSection.style.display = "block";
  }
}
