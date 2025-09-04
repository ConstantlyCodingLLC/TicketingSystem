import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// ----- Supabase Config -----
const SUPABASE_URL = 'https://jorkdpleywwwmksnirwn.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcmtkcGxleXd3d21rc25pcnduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NjI3MzAsImV4cCI6MjA3MjUzODczMH0.4zYlYinxnJrrDggnX4qS6fwp6_EuAGwXPHYP1hQzuAU'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ----- Elements -----
const loginSection = document.getElementById('loginSection')
const dashboard = document.getElementById('dashboard')
const roleTitle = document.getElementById('roleTitle')
const customerSection = document.getElementById('customerSection')
const ticketForm = document.getElementById('ticketForm')
const ticketsDiv = document.getElementById('tickets')
const loginBtn = document.getElementById('loginBtn')
const signupBtn = document.getElementById('signupBtn')
const emailInput = document.getElementById('email')
const passwordInput = document.getElementById('password')

let currentUser = null
let currentRole = 'customer'

// ----- Signup -----
signupBtn.addEventListener('click', async () => {
  const email = emailInput.value
  const password = passwordInput.value
  if (!email || !password) return alert("Enter email & password")

  const { data: { user }, error } = await supabase.auth.signUp({ email, password })
  if (error) return alert(error.message)

  await supabase.from('users').insert([{ id: user.id, email, role:'customer' }])
  alert('Sign up successful! Log in.')
})

// ----- Login -----
loginBtn.addEventListener('click', async () => {
  const email = emailInput.value
  const password = passwordInput.value

  const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return alert(error.message)

  currentUser = user
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  currentRole = data?.role || 'customer'

  showDashboard(currentRole)
})

// ----- Show Dashboard -----
function showDashboard(role) {
  loginSection.style.display = 'none'
  dashboard.style.display = 'block'
  roleTitle.innerText = `Logged in as: ${role}`
  customerSection.style.display = (role === 'customer') ? 'block' : 'none'
  fetchTickets()
}

// ----- Submit Ticket -----
ticketForm?.addEventListener('submit', async e => {
  e.preventDefault()
  const title = document.getElementById('title').value
  const description = document.getElementById('description').value
  const ticketNumber = `TCK-${Date.now()}`

  await supabase.from('tickets').insert([{
    title,
    description,
    ticket_number: ticketNumber,
    status: 'open',
    created_by: currentUser.id
  }])

  ticketForm.reset()
  fetchTickets()
})

// ----- Fetch Tickets -----
async function fetchTickets() {
  ticketsDiv.innerHTML = ''
  let query = supabase.from('tickets').select('*').order('created_at', { ascending: false })
  if (currentRole === 'customer') query = query.eq('created_by', currentUser.id)

  const { data, error } = await query
  if (error) return console.error(error)

  data.forEach(t => {
    const ticketEl = document.createElement('div')
    ticketEl.className = 'ticket'
    ticketEl.innerHTML = `
      <strong>${t.ticket_number}: ${t.title}</strong><br>
      Status: ${t.status}<br>
      Description: ${t.description}<br>
    `
    ticketsDiv.appendChild(ticketEl)
  })
}
