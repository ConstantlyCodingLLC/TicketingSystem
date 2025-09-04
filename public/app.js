// ----- Firebase Config -----
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

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
  const userCred = await auth.createUserWithEmailAndPassword(email, password);
  const uid = userCred.user.uid;
  await db.collection('users').doc(uid).set({ role: 'customer', email });
  emailInput.value = passwordInput.value = '';
  alert("Sign up complete! Log in.");
});

// ----- Login -----
loginBtn.addEventListener('click', async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  const userCred = await auth.signInWithEmailAndPassword(email, password);
  currentUser = userCred.user;
  const doc = await db.collection('users').doc(currentUser.uid).get();
  const role = doc.data().role || 'customer';
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

  // Auto-generate ticket number
  const ticketNumber = `TCK-${Date.now()}`;

  await db.collection('tickets').add({
    title, 
    description, 
    ticketNumber, 
    status: 'open', 
    createdBy: currentUser.uid, 
    assignedTo: null,
    comments: [],
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  ticketForm.reset();
  renderTickets('customer');
});

// ----- Render Tickets -----
async function renderTickets(role) {
  ticketsDiv.innerHTML = '';
  let query = db.collection('tickets').orderBy('createdAt', 'desc');
  if(role === 'customer') query = query.where('createdBy', '==', currentUser.uid);
  const snapshot = await query.get();
  snapshot.forEach(doc => {
    const t = doc.data();
    ticketsDiv.innerHTML += `
      <div class="ticket">
        <strong>${t.ticketNumber}: ${t.title}</strong><br>
        Status: ${t.status}<br>
        Assigned: ${t.assignedTo || 'None'}<br>
        Description: ${t.description}<br>
        Comments: ${t.comments.join(", ")}
      </div>
    `;
  });
}
