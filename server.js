import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";

const app = express();

app.use(cors());
app.use(express.text({ limit: "20mb", type: "*/*" }));

// Télécharge Chrome si absent et récupère le chemin automatiquement
import { execSync } from "child_process";

async function getChromePath() {
  try {
    // télécharge Chrome au démarrage si nécessaire
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
