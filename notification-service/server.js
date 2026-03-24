const express = require("express");
const app = express();

app.use(express.json());
app.post("/notify", (req, res) => res.json({ success: true, message: "Notification processed" }));
app.listen(5006, () => console.log("🔔 Notification Service running on port 5006"));