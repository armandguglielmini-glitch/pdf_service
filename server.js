import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";

const app = express();

app.use(cors());
app.use(express.text({ limit: "20mb", type: "*/*" }));

const defaultPdfOptions = {
  format: "A4",
  printBackground: true,
  margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" }
};

let browserPromise = puppeteer.launch({
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
});

async function generatePdfFromHtml(html, pdfOptions = {}) {
  const browser = await browserPromise;
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const buffer = await page.pdf({ ...defaultPdfOptions, ...pdfOptions });
  await page.close();
  return buffer;
}

app.post("/generate-pdf", async (req, res) => {
  try {
    const html = req.body || "";
    const pdfBuffer = await generatePdfFromHtml(html);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=document.pdf");
    res.send(pdfBuffer);
  } catch (e) {
    console.error(e);
    res.status(500).send("Erreur génération PDF");
  }
});

app.post("/generate-pdf-base64", async (req, res) => {
  try {
    const html = req.body || "";
    const pdfBuffer = await generatePdfFromHtml(html);
    const b64 = pdfBuffer.toString("base64");
    res.json({ base64: b64, filename: "document.pdf" });
  } catch (e) {
    console.error(e);
    res.status(500).send("Erreur génération PDF (base64)");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Service PDF lancé sur le port ${PORT}`);
});
