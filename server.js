const express = require('express');
const { default: PQueue } = require('p-queue');
const { runHybridAudit } = require('./engine');
const { runCustomRgaaScripts } = require('./customScripts');
const { generateVisualReport } = require('./visual');
const { generateScoringReport } = require('./scoring');

const app = express();
app.use(express.json());

// Max 2 audits en parallèle pour éviter le crash mémoire du serveur
const queue = new PQueue({ concurrency: 2 });

app.post('/api/audit', async (req, res) => {
  const { url } = req.body;

  if (!url) return res.status(400).json({ error: "L'URL est requise." });

  // On envoie le job dans la file d'attente
  queue.add(async () => {
    let browserContext;
    try {
      console.log(`[Audit Started] ${url}`);
      
      // 1. Lancement Playwright + Axe
      const { page, browser, results, screenshotBuffer } = await runHybridAudit(url);
      browserContext = browser;

      // 2. Vérifications RGAA Custom
      const customResults = await runCustomRgaaScripts(page);

      // 3. Highlight Canvas
      const { annotatedScreenshotBase64 } = await generateVisualReport(page, screenshotBuffer, results.violations);

      // 4. Synthèse et Scoring
      const finalReport = generateScoringReport(results, customResults);

      await browser.close();
      console.log(`[Audit Success] ${url} - Score: ${finalReport.scoreTechnique}%`);

      return res.status(200).json({
        url,
        timestamp: new Date().toISOString(),
        synthese: finalReport,
        screenshot: annotatedScreenshotBase64
      });

    } catch (error) {
      if (browserContext) await browserContext.close();
      console.error(`[Audit Failed] ${url}`, error);
      return res.status(500).json({ error: "Échec de l'audit", details: error.message });
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur d'audit RGAA lancé sur le port ${PORT}`);
});