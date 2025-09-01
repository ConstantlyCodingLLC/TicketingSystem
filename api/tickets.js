import { v4 as uuidv4 } from 'uuid';

let tickets = [];

export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json(tickets);
  } else if (req.method === 'POST') {
    const { title, description, status = "open", assignedTo = null } = req.body;
    if (!title || !description) return res.status(400).json({ error: "Missing fields" });
    const newTicket = { id: uuidv4(), title, description, status, assignedTo, comments: [] };
    tickets.push(newTicket);
    res.status(201).json(newTicket);
  } else if (req.method === 'PUT') {
    const { id, status, assignedTo, comments } = req.body;
    const ticket = tickets.find(t => t.id === id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    if (status) ticket.status = status;
    if (assignedTo) ticket.assignedTo = assignedTo;
    if (comments) ticket.comments.push(...comments);
    res.status(200).json(ticket);
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
