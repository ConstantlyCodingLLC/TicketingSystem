import { v4 as uuidv4 } from 'uuid';

let users = [
  { id: uuidv4(), name: "Owner", role: "owner", email: "owner@shop.com" },
  { id: uuidv4(), name: "Employee", role: "employee", email: "employee@shop.com" }
];

export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json(users);
  } else if (req.method === 'POST') {
    const { name, role, email } = req.body;
    if (!name || !role || !email) return res.status(400).json({ error: "Missing fields" });
    const newUser = { id: uuidv4(), name, role, email };
    users.push(newUser);
    res.status(201).json(newUser);
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
