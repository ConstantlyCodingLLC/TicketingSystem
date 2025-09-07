import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";

/**
 * Your Supabase project
 */
const SUPABASE_URL = "https://jorkdpleywwwmksnirwn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcmtkcGxleXd3d21rc25pcnduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NjI3MzAsImV4cCI6MjA3MjUzODczMH0.4zYlYinxnJrrDggnX4qS6fwp6_EuAGwXPHYP1hQzuAU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * DOM
 */
const loginSection = document.getElementById("loginSection");
const dashboard = document.getElementById("dashboard");
const authMessage = document.getElementById("authMessage");
const successMessage = document.getElementById("successMessage");
const loading = document.getElementById("loading");
const whoami = document.getElementById("whoami");
const roleBadge = document.getElementById("roleBadge");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const logoutBtn = document.getElementById("logoutBtn");

const customerSection = document.getElementById("customerSection");
const ownerSection = document.getElementById("ownerSection");
const adminSection = document.getElementById("adminSection");

const ticketForm = document.getElementById("ticketForm");
const customerTickets = document.getElementById("customerTickets");

/**
 * Helpers
 */
function setLoading(on) {
  loading.style.display = on ? "block" : "none";
}
function showError(msg) {
  authMessage.textContent = msg || "";
}
function showOK(msg) {
  successMessage.textContent = msg || "";
}
function hideAllRoleSections() {
  customerSection.classList.add("hidden");
  ownerSection.classList.add("hidden");
  adminSection.classList.add("hidden");
}
function showLogin() {
  dashboard.classList.add("hidden");
  loginSection.classList.remove("hidden");
}
function showDashboard() {
  loginSection.classList.add("hidden");
  dashboard.classList.remove("hidden");
}

/**
 * Ensure there's a row in profiles for the user (role defaults to 'customer')
 * Requires a table:
 *   create table if not exists profiles (
 *     id uuid primary key references auth.users(id) on delete cascade,
 *     email text,
 *     role text check (role in ('customer','owner','admin')) default 'customer',
 *     created_at timestamp with time zone default now()
 *   );
 * and RLS policy that allows user to insert/select/update own row.
 */
async function ensureProfile(user) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("profiles select error:", error);
    showError(error.message);
    return null;
  }
  if (data) return data;

  // insert if missing
  const { data: inserted, error: insErr } = await supabase
    .from("profiles")
    .insert({ id: user.id, email: user.email, role: "customer" })
    .select("id, email, role")
    .single();

  if (insErr) {
    console.error("profiles insert error:", insErr);
    showError(insErr.message);
    return null;
  }
  return inserted;
}

/**
 * Load role + toggle sections
 */
async function loadRoleAndRender(user) {
  const profile = await ensureProfile(user);
  if (!profile) return;

  const role = profile.role || "customer";

  whoami.textContent = `Logged in as: ${user.email}`;
  roleBadge.textContent = role;
  hideAllRoleSections();

  if (role === "customer") {
    customerSection.classList.remove("hidden");
    await loadCustomerTickets(user.id);
  } else if (role === "owner") {
    ownerSection.classList.remove("hidden");
    // owner tickets to be wired once you add company scoping
  } else if (role === "admin") {
    adminSection.classList.remove("hidden");
    // admin lists to be wired next (all tickets/users)
  }
}

/**
 * Tickets (basic: customer only)
 * Requires a table:
 *   create table if not exists tickets (
 *     id uuid primary key default gen_random_uuid(),
 *     title text not null,
 *     description text not null,
 *     status text default 'open',
 *     created_by uuid references auth.users(id),
 *     created_at timestamp with time zone default now()
 *   );
 * with RLS policies that allow:
 *  - insert: auth.uid() = created_by
 *  - select: created_by = auth.uid()  (and additional for owner/admin if needed)
 */
async function loadCustomerTickets(userId) {
  customerTickets.innerHTML = "Loading...";
  const { data, error } = await supabase
    .from("tickets")
    .select("id, title, description, status, created_at")
    .eq("created_by", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("loadCustomerTickets:", error);
    customerTickets.innerHTML = `<div class="error">${error.message}</div>`;
    return;
  }
  if (!data || data.length === 0) {
    customerTickets.innerHTML = `<div class="muted">No tickets yet.</div>`;
    return;
  }

  customerTickets.innerHTML = data.map(t => `
    <div class="ticket">
      <strong>${t.title}</strong><br/>
      <span class="muted">Submitted: ${new Date(t.created_at).toLocaleString()}</span><br/>
      Status: ${t.status}<br/>
      <div class="muted" style="margin-top:6px;">${t.description}</div>
    </div>
  `).join("");
}

/**
 * Event wiring
 */
loginBtn.addEventListener("click", async () => {
  showError(""); showOK("");
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    showError("Please enter email and password.");
    return;
  }

  setLoading(true);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  setLoading(false);

  if (error) {
    console.error("Login error:", error);
    showError(error.message);
    return;
  }

  showDashboard();
  await loadRoleAndRender(data.user);
});

signupBtn.addEventListener("click", async () => {
  showError(""); showOK("");
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    showError("Please enter email and password.");
    return;
  }

  setLoading(true);
  const { data, error } = await supabase.auth.signUp({ email, password });
  setLoading(false);

  if (error) {
    console.error("Signup error:", error);
    showError(error.message);
    return;
  }

  showOK("Signup successful. If email confirmation is enabled, check your inbox. Then log in.");
});

logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  showOK("Logged out.");
  showLogin();
});

/**
 * Auto-session restore + redirect
 */
async function init() {
  setLoading(true);
  const { data, error } = await supabase.auth.getSession();
  setLoading(false);

  if (error) {
    console.error("getSession error:", error);
    showError(error.message);
    showLogin();
    return;
  }

  if (data.session?.user) {
    showDashboard();
    await loadRoleAndRender(data.session.user);
  } else {
    showLogin();
  }

  // Keep UI in sync if session changes (e.g., expires)
  supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      showDashboard();
      await loadRoleAndRender(session.user);
    } else {
      showLogin();
    }
  });
}

init();
