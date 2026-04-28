import { chromium } from 'playwright';
import { runAutomatique } from './src/automatique/index.js';
import { runSemiAuto } from './src/semi_auto/index.js';
import { getManuelle } from './src/manuelle/index.js';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process'; 
import http from 'http';

async function runAudit(url) {
    if (!url) {
        console.error("❌ Erreur : Veuillez fournir une URL.");
        process.exit(1);
    }

    console.log(`\n🚀 Lancement de l'audit RGAA sur : ${url}...`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.setViewportSize({ width: 1280, height: 800 });

    try {
        await page.goto(url, { waitUntil: 'load', timeout: 60000 }); 
// J'ai aussi passé le timeout à 60s pour laisser le temps aux fausses images de s'afficher

        // 🔥 FORCER LE CHARGEMENT DES IMAGES LAZY
        console.log(`⏬ Défilement de la page pour charger les images cachées...`);
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

        const blocAutomatique = await runAutomatique(page);
        const blocSemiAuto = await runSemiAuto(page);
        const blocManuel = getManuelle();

        // ====================================================================
        // 📸 PRISE DES CAPTURES D'ÉCRAN (DOUBLE MODE : CLAIR & SOMBRE)
        // ====================================================================
        let imagesATrier = [];
        if (blocSemiAuto?.validation_manuelle?.theme_1_images) {
            imagesATrier = blocSemiAuto.validation_manuelle.theme_1_images;
        } else if (blocSemiAuto?.resultats_semi_automatiques?.validation_manuelle?.theme_1_images) {
            imagesATrier = blocSemiAuto.resultats_semi_automatiques.validation_manuelle.theme_1_images;
        }

        if (imagesATrier.length > 0) {
            console.log(`📸 Analyse et double-capture (Light/Dark) en cours...`);
            
            for (let i = 0; i < imagesATrier.length; i++) {
                let item = imagesATrier[i];
                
                if (item.auditId && item.needsScreenshot) {
                    try {
                        const imgLocator = page.locator(`[data-audit-id="${item.auditId}"]`);
                        await imgLocator.scrollIntoViewIfNeeded();
                        
                        // 1. Calcul du cadre (Bounding Box avec padding)
                        const box = await imgLocator.boundingBox();
                        let clipDef = undefined;
                        
                        if (box && box.width > 0 && box.height > 0) {
                            const padding = 80;
                            const pageDims = await page.evaluate(() => ({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight }));
                            const clipX = Math.max(0, box.x - padding);
                            const clipY = Math.max(0, box.y - padding);
                            const clipWidth = Math.min(box.width + (padding * 2), pageDims.w - clipX);
                            const clipHeight = Math.min(box.height + (padding * 2), pageDims.h - clipY);
                            clipDef = { x: clipX, y: clipY, width: clipWidth, height: clipHeight };
                        }

                        // ☀️ PHOTO 1 : MODE CLAIR (Défaut)
                        await page.emulateMedia({ colorScheme: 'light' });
                        await page.waitForTimeout(300); // Attendre que le CSS s'applique
                        const bufferLight = await (clipDef ? page.screenshot({ type: 'jpeg', quality: 60, clip: clipDef }) : imgLocator.locator('..').screenshot({ type: 'jpeg', quality: 60 }));
                        item.screenshot_light = bufferLight.toString('base64');

                        // 🌙 PHOTO 2 : MODE SOMBRE (Forcé)
                        // On force le media query système
                        await page.emulateMedia({ colorScheme: 'dark' });
                        // On force aussi la classe HTML très utilisée (Tailwind/Bootstrap)
                        await page.evaluate(() => document.documentElement.classList.add('dark', 'dark-mode'));
                        await page.waitForTimeout(400); // Attendre la transition d'animation sombre
                        
                        const bufferDark = await (clipDef ? page.screenshot({ type: 'jpeg', quality: 60, clip: clipDef }) : imgLocator.locator('..').screenshot({ type: 'jpeg', quality: 60 }));
                        item.screenshot_dark = bufferDark.toString('base64');

                        // 🧹 NETTOYAGE : On remet le site en mode normal pour la suite
                        await page.emulateMedia({ colorScheme: 'light' });
                        await page.evaluate(() => document.documentElement.classList.remove('dark', 'dark-mode'));

                        process.stdout.write(`✅ `); 
                    } catch (e) {
                        item.screenshot_light = null; 
                        item.screenshot_dark = null;
                        process.stdout.write(`❌ `); 
                    }
                }
                
                delete item.auditId;
                delete item.needsScreenshot;
            }
            console.log("\n");
        }

        // --- CALCUL DES STATS ---
        let total_c = 0, total_nc = 0, total_na = 0, total_erreurs_ponctuelles = 0;
        
        for (const key in blocAutomatique) {
            const critere = blocAutomatique[key];
            if (critere.statut.includes("❌")) {
                total_nc++;
                critere.violations.forEach(v => total_erreurs_ponctuelles += v.elements_fautifs.length);
            } else if (critere.statut.includes("✅")) { total_c++; }
            else { total_na++; }
        }

        let taux_conformite = (total_c + total_nc > 0) ? Math.round((total_c / (total_c + total_nc)) * 100) : 0;

        const rapportFinal = {
            metadata: { url_auditee: url, date_audit: new Date().toISOString() },
            statistiques: {
                taux_de_conformite_automatique: `${taux_conformite}%`,
                repartition_des_criteres_auto: { "✅_C": total_c, "❌_NC": total_nc, "➖_NA": total_na },
                total_elements_en_erreur: total_erreurs_ponctuelles,
                criteres_manuels: Array.isArray(blocManuel) ? blocManuel.length : 0
            },
            resultats: {
                // automatique: blocAutomatique,
                semi_automatique: blocSemiAuto
            }
        };

        // --- SAUVEGARDE POUR LE DASHBOARD ---
        const reportsDir = './rapports';
        if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

        const fileName = `audit_${new Date().getTime()}.json`;
        fs.writeFileSync(path.join(reportsDir, fileName), JSON.stringify(rapportFinal, null, 2));
        fs.writeFileSync('./last_results.json', JSON.stringify(rapportFinal, null, 2));

        console.log(`✅ Audit terminé.`);
        console.log(`📄 Rapport archivé : ${fileName}`);
        console.log(`🖥️  Création du serveur local et ouverture du Dashboard...`);

        // --- SERVEUR WEB ET OUVERTURE DU DASHBOARD ---
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
            
            console.log(`\n✅ Dashboard prêt et accessible sur : ${dashboardUrl}`);
            console.log(`⚠️  Laissez ce terminal ouvert pendant votre triage. Faites "Ctrl+C" pour quitter.\n`);

            const startCmd = (process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open');
            exec(`${startCmd} ${dashboardUrl}`);
        });

    } catch (error) {
        console.error("❌ Erreur d'audit :", error);
    } finally {
        await browser.close();
    }
}

const targetUrl = process.argv[2] || 'https://auth.service-public.gouv.fr/realms/service-public/protocol/openid-connect/auth?response_type=code&client_id=spclient&scope=address%20phone%20openid%20profile%20email&state=chxvTRZS5H16NMX2-wAfGha-G5IaBVJbsz0AzsZNbXY%3D&redirect_uri=https://www.service-public.gouv.fr/openid_connect_login&nonce=YqPHnTTSgrZXdHaZZLgjYUuc7_HUvWeQ8bUJQN1nVfI';
runAudit(targetUrl);