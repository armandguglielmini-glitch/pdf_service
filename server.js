import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";
import { execSync } from "child_process";

const app = express();

app.use(cors());
app.use(express.text({ limit: "20mb", type: "*/*" }));

// Télécharge Chrome si absent et récupère le chemin automatiquement
async function getChromePath() {
  try {
    execSync("npx puppeteer browsers install chrome", { stdio: "inherit" });
  } catch (e) {
    console.log("⚠️ Installation Chrome ignorée ou déjà faite");
  }
  const { executablePath } = puppeteer;
  return executablePath();
}

const defaultPdfOptions = {
  format: "A4",
  printBackground: true,
  margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
};

// Lance Chrome proprement avec le bon chemin
let browserPromise = (async () => {
  const path = await getChromePath();
  console.log("✅ Chrome trouvé à :", path);
  return puppeteer.launch({
    executablePath: path,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
})();

async function generatePdfFromHtml(html, pdfOptions = {}) {
  const browser = await browserPromise;
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const buffer = await page.pdf({ ...defaultPdfOptions, ...pdfOptions });
  await page.close();
  return buffer;
}

// === ROUTES =======================================================

// Route PDF principale
app.post("/generate-pdf", async (req, res) => {
  try {
    const html = req.body || "";
    const pdfBuffer = await generatePdfFromHtml(html);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=document.pdf");
    res.send(pdfBuffer);
  } catch (e) {
    console.error("Erreur génération PDF :", e);
    res.status(500).send("Erreur génération PDF");
  }
});

// Route alternative base64
app.post("/generate-pdf-base64", async (req, res) => {
  try {
    const html = req.body || "";
    const pdfBuffer = await generatePdfFromHtml(html);
    const b64 = pdfBuffer.toString("base64");
    res.json({ base64: b64, filename: "document.pdf" });
  } catch (e) {
    console.error("Erreur génération PDF (base64) :", e);
    res.status(500).send("Erreur génération PDF (base64)");
  }
});

// Route de test santé
app.get("/health", (req, res) => {
  res.send("OK");
});

// === DÉMARRAGE DU SERVEUR ========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Service PDF lancé et accessible sur le port ${PORT}`);
});
