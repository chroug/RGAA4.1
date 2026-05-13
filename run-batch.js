import { chromium } from 'playwright';
import { runAutomatique } from './src/automatique/index.js';
import { runSemiAuto } from './src/semi_auto/index.js';
import { getManuelle } from './src/manuelle/index.js';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process'; 
import http from 'http';

// --- GESTION DES ARGUMENTS DE LA LIGNE DE COMMANDE ---
const args = process.argv.slice(2); // Récupère ce qu'on tape après "node run-batch.js"
let dossiersRacines = [];

if (args.length === 0) {
    // 1️⃣ Aucun argument : on lance TOUT le dossier site_test
    console.log("👉 Aucun critère spécifié. Test de l'ensemble de 'site_test/'.");
    dossiersRacines = [
        './site_test/test_automatique',
        './site_test/test_semi_automatique'
    ];
} else {
    // 2️⃣ Arguments fournis : on cible les chemins ou critères demandés
    args.forEach(arg => {
        // Si l'utilisateur tape un chemin exact (ex: ./site_test/...)
        if (arg.startsWith('./') || arg.startsWith('/')) {
            dossiersRacines.push(arg);
        } 
        // Si l'utilisateur tape juste un numéro de critère (ex: "12.7")
        else {
            console.log(`👉 Filtrage activé pour le critère : ${arg}`);
            // On ajoute les chemins potentiels pour ce critère
            dossiersRacines.push(`./site_test/test_semi_automatique/invalide/${arg}`);
            dossiersRacines.push(`./site_test/test_semi_automatique/valide/${arg}`);
            // dossiersRacines.push(`./site_test/test_automatique/invalide/${arg}`);
            // dossiersRacines.push(`./site_test/test_automatique/valide/${arg}`);
        }
    });
}

// 🔍 Fonction récursive pour trouver tous les fichiers .html dans une arborescence
function trouverFichiersHtml(dossier, listeFichiers = []) {
    if (!fs.existsSync(dossier)) return listeFichiers;

    const fichiers = fs.readdirSync(dossier);
    for (const fichier of fichiers) {
        const cheminComplet = path.join(dossier, fichier);
        const stat = fs.statSync(cheminComplet);

        if (stat.isDirectory()) {
            trouverFichiersHtml(cheminComplet, listeFichiers); // On creuse dans le sous-dossier (ex: /12.7)
        } else if (fichier.endsWith('.html')) {
            listeFichiers.push(cheminComplet);
        }
    }
    return listeFichiers;
}

async function runBatchAudit() {
    console.log(`\n🚀 Lancement de l'audit par lots sur l'arborescence site_test...`);

    // ====================================================================
    // 🧹 NOUVEAU : VIDAGE DU DOSSIER DE DEBUG 1.1 AVANT LE BATCH
    // ====================================================================
    const debugDir = path.join(process.cwd(), 'captures_1.1');
    if (fs.existsSync(debugDir)) {
        fs.rmSync(debugDir, { recursive: true, force: true });
    }
    fs.mkdirSync(debugDir, { recursive: true });
    console.log("📁 Dossier de debug 'critere_1.1' vidé et prêt pour les captures.");
    // ====================================================================

    // 1. Lister tous les fichiers HTML à analyser
    let fichiersATester = [];
    for (const racine of dossiersRacines) {
        fichiersATester = fichiersATester.concat(trouverFichiersHtml(racine));
    }

    if (fichiersATester.length === 0) {
        console.error("❌ Erreur : Aucun fichier HTML trouvé dans les dossiers spécifiés.");
        process.exit(1);
    }

    console.log(`📋 ${fichiersATester.length} pages trouvées pour le test.`);

    // 2. Lancer le navigateur UNE SEULE FOIS
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const rapportsGlobaux = [];

    try {
        // 3. Boucler sur chaque fichier trouvé
        for (const cheminRelatif of fichiersATester) {
            const cheminAbsolu = path.resolve(cheminRelatif);
            const urlLocale = `file://${cheminAbsolu}`;
            
            console.log(`\n▶️ Test en cours sur : ${cheminRelatif}`);
            
            const page = await context.newPage();
            await page.setViewportSize({ width: 1280, height: 800 });
            
            await page.goto(urlLocale, { waitUntil: 'load', timeout: 60000 });

            // 🔥 FORCER LE CHARGEMENT DES IMAGES LAZY (Optionnel si tu n'en as pas dans tes tests locaux, mais sécurisant)
            await page.evaluate(async () => {
                await new Promise((resolve) => {
                    let totalHeight = 0;
                    const distance = 250;
                    const timer = setInterval(() => {
                        const scrollHeight = document.body.scrollHeight;
                        window.scrollBy(0, distance);
                        totalHeight += distance;
                        if (totalHeight >= scrollHeight) {
                            clearInterval(timer);
                            window.scrollTo(0, 0);
                            resolve();
                        }
                    }, 50); 
                });
            });

            // ⚙️ Lancement des différents moteurs d'analyse
            const blocAutomatique = await runAutomatique(page);
            const blocSemiAuto = await runSemiAuto(page);
            const blocManuel = getManuelle();

            // ====================================================================
            // 📸 PRISE DES CAPTURES D'ÉCRAN (DOUBLE MODE)
            // ====================================================================
            let imagesATrier = [];
            if (blocSemiAuto?.validation_manuelle?.theme_1_images) {
                imagesATrier = blocSemiAuto.validation_manuelle.theme_1_images;
            } else if (blocSemiAuto?.resultats_semi_automatiques?.validation_manuelle?.theme_1_images) {
                imagesATrier = blocSemiAuto.resultats_semi_automatiques.validation_manuelle.theme_1_images;
            }

            if (imagesATrier.length > 0) {
                console.log(`   📸 Analyse et double-capture en cours...`);
                for (let i = 0; i < imagesATrier.length; i++) {
                    let item = imagesATrier[i];
                    if (item.auditId && item.needsScreenshot) {
                        try {
                            const imgLocator = page.locator(`[data-audit-id="${item.auditId}"]`);
                            await imgLocator.scrollIntoViewIfNeeded();
                            
                            const box = await imgLocator.boundingBox();
                            let clipDef = undefined;
                            
                            if (box && box.width > 0 && box.height > 0) {
                                const padding = 80;
                                const pageDims = await page.evaluate(() => ({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight }));
                                clipDef = { 
                                    x: Math.max(0, box.x - padding), 
                                    y: Math.max(0, box.y - padding), 
                                    width: Math.min(box.width + (padding * 2), pageDims.w - Math.max(0, box.x - padding)), 
                                    height: Math.min(box.height + (padding * 2), pageDims.h - Math.max(0, box.y - padding)) 
                                };
                            }

                            await page.emulateMedia({ colorScheme: 'light' });
                            await page.waitForTimeout(300);
                            const bufferLight = await (clipDef ? page.screenshot({ type: 'jpeg', quality: 60, clip: clipDef }) : imgLocator.locator('..').screenshot({ type: 'jpeg', quality: 60 }));
                            item.screenshot_light = bufferLight.toString('base64');

                            await page.emulateMedia({ colorScheme: 'dark' });
                            await page.evaluate(() => document.documentElement.classList.add('dark', 'dark-mode'));
                            await page.waitForTimeout(400);
                            
                            const bufferDark = await (clipDef ? page.screenshot({ type: 'jpeg', quality: 60, clip: clipDef }) : imgLocator.locator('..').screenshot({ type: 'jpeg', quality: 60 }));
                            item.screenshot_dark = bufferDark.toString('base64');

                            await page.emulateMedia({ colorScheme: 'light' });
                            await page.evaluate(() => document.documentElement.classList.remove('dark', 'dark-mode'));

                        } catch (e) {
                            item.screenshot_light = null; 
                            item.screenshot_dark = null;
                        }
                    }
                    delete item.auditId;
                    delete item.needsScreenshot;
                }
            }

            // --- SAUVEGARDE DU RESULTAT DU FICHIER ---
            rapportsGlobaux.push({
                fichier: path.basename(cheminRelatif),
                dossier: path.dirname(cheminRelatif),
                cheminComplet: cheminRelatif,
                resultats: {
                    automatique: blocAutomatique,
                    semi_automatique: blocSemiAuto,
                    manuel: blocManuel
                }
            });

            await page.close(); // Fermeture de l'onglet pour économiser la RAM
        }

        // 4. SAUVEGARDE GLOBALE
        const reportsDir = './rapports';
        if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

        const fileName = `audit_batch_${new Date().getTime()}.json`;
        fs.writeFileSync(path.join(reportsDir, fileName), JSON.stringify(rapportsGlobaux, null, 2));
        fs.writeFileSync('./last_results.json', JSON.stringify(rapportsGlobaux, null, 2));

        console.log(`\n✅ Audit par lots terminé ! (${rapportsGlobaux.length} pages testées)`);
        
        // 5. Lancement du Dashboard
        lancerDashboard();

    } catch (error) {
        console.error("❌ Erreur lors du batch :", error);
    } finally {
        await browser.close();
    }
}

function lancerDashboard() {
    const server = http.createServer((req, res) => {
        if (req.url === '/' || req.url === '/dashboard.html') {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(fs.readFileSync('./dashboard.html'));
        } else if (req.url === '/last_results.json') {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(fs.readFileSync('./last_results.json'));
        } else {
            res.writeHead(404);
            res.end('Fichier introuvable');
        }
    });

    server.listen(0, () => {
        const port = server.address().port;
        const dashboardUrl = `http://localhost:${port}/dashboard.html`;
        console.log(`\n✅ Dashboard prêt : ${dashboardUrl}`);
        const startCmd = (process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open');
        exec(`${startCmd} ${dashboardUrl}`);
    });
}

runBatchAudit();