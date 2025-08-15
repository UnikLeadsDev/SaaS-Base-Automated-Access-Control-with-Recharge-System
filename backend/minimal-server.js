import express from "express";
import cors from "cors";

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Wallet routes
app.get("/api/wallet/balance", (req, res) => {
    res.json({ balance: 0, status: 'active', validUntil: null });
});

app.get("/api/wallet/balance-check", (req, res) => {
    res.json({ 
        balance: 0, 
        status: 'active', 
        validUntil: null,
        accessType: 'prepaid',
        canSubmitBasic: false,
        canSubmitRealtime: false,
        rates: { basic: 5, realtime: 50 }
    });
});

app.get("/api/wallet/transactions", (req, res) => {
    res.json([]);
});

// Subscription routes
app.get("/api/subscription/current", (req, res) => {
    res.json(null);
});

// Support routes
app.get("/api/support/tickets", (req, res) => {
    res.json([]);
});

// Auth routes
app.post("/api/auth/login", (req, res) => {
    res.json({ message: "Login endpoint", token: "dummy-token", user: { id: 1, name: "Test User", role: "DSA" } });
});

app.post("/api/auth/register", (req, res) => {
    res.json({ message: "Registration successful" });
});

app.get("/api/auth/profile", (req, res) => {
    res.json({ id: 1, name: "Test User", role: "DSA" });
});

// Forms routes
app.get("/api/forms/applications", (req, res) => {
    res.json([]);
});

const PORT = 5001;
app.listen(PORT, () => {
    console.log(`🚀 Minimal server running on port ${PORT}`);
});