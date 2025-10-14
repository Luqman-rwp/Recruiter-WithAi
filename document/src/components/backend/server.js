// backend/server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { spawn } = require("child_process");

const app = express();
const PORT = 5000;

// ✅ Allow frontend requests
app.use(cors({ origin: "http://localhost:5173" }));
app.use(bodyParser.json());

// -------------------- Endpoints --------------------
app.post("/generate", async (req, res) => {
  try {
    const { doc_type, data } = req.body;

    console.log("📩 Request received:", { doc_type, data });

    // 🔥 Spawn Python process
    const py = spawn("python", ["server.py"]);
    let pdfBuffer = Buffer.alloc(0);
    let errorOutput = "";

    // Send data to Python via stdin
    py.stdin.write(JSON.stringify({ doc_type, data }));
    py.stdin.end();

    // Collect output (PDF bytes)
    py.stdout.on("data", (chunk) => {
      pdfBuffer = Buffer.concat([pdfBuffer, chunk]);
    });

    py.stderr.on("data", (err) => {
      errorOutput += err.toString();
      console.error("🐍 Python stderr:", err.toString());
    });

    py.on("close", (code) => {
      if (code !== 0) {
        console.error(`❌ Python exited with code ${code}`);
        return res.status(500).json({
          error: "Python script failed",
          details: errorOutput,
        });
      }

      console.log("✅ PDF generated successfully");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${data.full_name || "student"}_${doc_type}.pdf`
      );
      res.send(pdfBuffer);
    });
  } catch (err) {
    console.error("❌ Error in /generate:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Node server running at http://localhost:${PORT}`);
});
