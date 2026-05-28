import { chromium } from 'playwright';
import { runAutomatique } from './src/automatique/index.js';
import { runSemiAuto } from './src/semi_auto/index.js';
import { getManuelle } from './src/manuelle/index.js';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process'; 
import http from 'http';

// 👇 NOUVEAUX IMPORTS POUR LA BASE DE DONNÉES 👇
import { saveAuditToDb } from './database/auditService.js';
import { getAvantApresByUrl } from './database/dashboardService.js';

async function runAudit(url) {
    if (!url) {
        console.error("❌ Erreur : Veuillez fournir une URL.");
        process.exit(1);
    }

    console.log(`\n🚀 Lancement de l'audit RGAA sur : ${url}...`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 800 },
        extraHTTPHeaders: {
            'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
        }
    });
    const page = await context.newPage();

    // 🛠️ INJECTION DES UTILITAIRES POUR LE SAAS
    const helperPath = path.join(process.cwd(), 'src', 'utils', 'dom_helpers.js');
    if (fs.existsSync(helperPath)) {
        await page.addInitScript({ path: helperPath });
    } else {
        console.warn(`⚠️ Attention: dom_helpers.js introuvable au chemin ${helperPath}`);
    }
    
    try {
        // ====================================================================
        // 🛡️ NAVIGATION ROBUSTE (Évite les Timeouts infinis)
        // ====================================================================
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }); 
            await page.waitForTimeout(3000); 
        } catch (navError) {
            if (navError.name === 'TimeoutError') {
                console.log(`\n⚠️ Avertissement : Le chargement a expiré (Timeout). L'audit se poursuit sur ce qui a chargé.\n`);
            } else {
                throw navError; 
            }
        }

        // ====================================================================
        // 🍪 GESTION DES BANDEAUX DE COOKIES
        // ====================================================================
        console.log("🍪 Tentative d'acceptation forcée des cookies (API & Clics)...");
        await page.evaluate(() => {
            if (typeof tarteaucitron !== 'undefined' && tarteaucitron.userInterface) {
                try { tarteaucitron.userInterface.respondAll(true); } catch(e) {}
            }
            if (typeof window._axcb !== 'undefined') {
                try { window.axeptioSDK.requestConsent('all'); } catch(e) {}
            }
            const buttons = Array.from(document.querySelectorAll('button, a, [role="button"], div[class*="cookie"]'));
            const regexAccept = /tout accepter|accepter tout|j'accepte|autoriser|ok|compris|agree|accept/i;
            const acceptBtn = buttons.find(b => {
                const text = (b.textContent || b.value || "").trim();
                return regexAccept.test(text);
            });
            if (acceptBtn) {
                try { 
                    acceptBtn.click(); 
                    acceptBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
                } catch(e) {}
            }
        });
        await page.waitForTimeout(2500);

        // ====================================================================
        // 🔥 FORCER LE CHARGEMENT DES IMAGES LAZY
        // ====================================================================
        console.log(`⏬ Défilement de la page pour charger les images cachées...`);
        await page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 300;
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
        await page.waitForTimeout(1000);

        // ====================================================================
        // 🚀 EXÉCUTION DES MODULES D'AUDIT
        // ====================================================================
        const blocAutomatique = await runAutomatique(page);
        const blocSemiAuto = await runSemiAuto(page);

        // ====================================================================
        // 📊 FUSION INTELLIGENTE DES RÉSULTATS (AXE-CORE + TES SCRIPTS)
        // ====================================================================
        const tousLesCriteres = { ...blocAutomatique };
        
        // On fusionne blocSemiAuto par-dessus, mais de manière intelligente !
        for (const [key, value] of Object.entries(blocSemiAuto)) {
            if (key === 'validation_manuelle' || key === 'resultats_semi_automatiques' || key.includes('theme_1')) continue;

            if (tousLesCriteres[key]) {
                // Si le critère existe DÉJÀ dans Axe-core (ex: 6.2, 11.1), on CONSERVE tout !
                // Si l'un des deux a trouvé une croix rouge, le statut final est ❌
                const statutFinalFusion = (tousLesCriteres[key].statut.includes('❌') || value.statut.includes('❌')) 
                    ? "❌ NON CONFORME" 
                    : value.statut;

                tousLesCriteres[key] = {
                    statut: statutFinalFusion,
                    methode_detection: "Hybride (Axe-Core + IA/DOM)",
                    // On additionne les violations des deux outils !
                    violations: [...(tousLesCriteres[key].violations || []), ...(value.violations || [])],
                    // On additionne les conformités des deux outils !
                    conformites: [...(tousLesCriteres[key].conformites || []), ...(value.conformites || [])]
                };
            } else {
                // Si c'est un critère exclusif à ton script IA (ex: 13.6), on l'ajoute simplement
                tousLesCriteres[key] = value;
            }
        }
        
        let points_obtenus = 0;
        let criteres_applicables_evalues = 0;
        let total_c = 0, total_nc = 0, total_na = 0;
        let total_erreurs_ponctuelles = 0;

        const resultats_par_theme = {};

        for (const [key, critere] of Object.entries(tousLesCriteres)) {
            // On ignore le bloc de validation manuelle des images
            if (key === 'validation_manuelle' || key === 'resultats_semi_automatiques' || key.includes('theme_1')) continue;

            const themeMatch = key.match(/critere_(\d+)/);
            const themeNum = themeMatch ? themeMatch[1] : "inconnu";
            const nomTheme = `theme_${themeNum}`;

            if (!resultats_par_theme[nomTheme]) {
                resultats_par_theme[nomTheme] = { score_theme: { points: 0, total: 0 }, criteres: {} };
            }

            let statutFinal = "NA";

            // RÈGLE RGAA : 0 point s'il y a la moindre erreur
            if (critere.statut.includes("❌") || critere.statut.includes("NC")) {
                statutFinal = "NC"; 
                total_nc++;
                criteres_applicables_evalues++;
                resultats_par_theme[nomTheme].score_theme.total++;
                
                if (critere.violations) {
                    critere.violations.forEach(v => {
                        total_erreurs_ponctuelles += (v.elements_fautifs ? v.elements_fautifs.length : 1);
                    });
                }
            } 
            // RÈGLE RGAA : 1 point si TOUT est conforme
            else if (critere.statut.includes("✅") || critere.statut.includes(" C ")) {
                statutFinal = "C"; 
                total_c++;
                criteres_applicables_evalues++;
                points_obtenus++; 
                resultats_par_theme[nomTheme].score_theme.total++;
                resultats_par_theme[nomTheme].score_theme.points++;
            } 
            else {
                statutFinal = "NA";
                total_na++;
            }

            resultats_par_theme[nomTheme].criteres[key] = {
                statut: statutFinal,
                methode_detection: critere.methode_detection || (blocSemiAuto[key] ? "Semi-Automatique (Gemini 3.1 Flash)" : "Automatique (Axe-Core)"),
                violations: critere.violations || [],
                conformites: critere.conformites || []
            };
        }

        const taux_conformite = criteres_applicables_evalues > 0 
            ? Math.round((points_obtenus / criteres_applicables_evalues) * 100) 
            : 0;

        const rapportFinal = {
            metadata: { 
                audit_id: `audit_${new Date().getTime()}`,
                url_auditee: url, 
                date_audit: new Date().toISOString(),
                environnement: { moteur: "Playwright", viewport: "1280x800" }
            },
            statistiques: {
                score_rgaa_partiel: {
                    points_obtenus: points_obtenus,
                    criteres_evalues: criteres_applicables_evalues,
                    note_sur_106: `${points_obtenus} / 106`, 
                    taux_de_conformite: `${taux_conformite}%`
                },
                repartition_par_statut: { "C": total_c, "NC": total_nc, "NA": total_na },
                total_elements_en_erreur: total_erreurs_ponctuelles
            },
            resultats: resultats_par_theme
        };

        const reportsDir = './rapports';
        if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

        const fileName = `${rapportFinal.metadata.audit_id}.json`;
        fs.writeFileSync(path.join(reportsDir, fileName), JSON.stringify(rapportFinal, null, 2));
        fs.writeFileSync('./last_results.json', JSON.stringify(rapportFinal, null, 2));

        console.log(`\n✅ Audit terminé. Score RGAA (Partiel) : ${points_obtenus}/${criteres_applicables_evalues} (${taux_conformite}%)`);
        console.log(`📄 Rapport archivé : ${fileName}`);

        // ====================================================================
        // 🗄️ AJOUT : SAUVEGARDE EN BASE DE DONNÉES & CALCUL AVANT/APRÈS
        // ====================================================================
        console.log("💾 Enregistrement des résultats en base de données PostgreSQL...");
        let statsAvantApres = null;
        try {
            await saveAuditToDb(rapportFinal, "Audit RGAA CLI");
            statsAvantApres = await getAvantApresByUrl(url);

            console.log("\n=============================================");
            console.log("📊 DASHBOARD EVOLUTION (AVANT / APRÈS)");
            console.log("=============================================");
            if (statsAvantApres && statsAvantApres.comparaison) {
                console.log(`URL : ${statsAvantApres.url}`);
                console.log(`Taux actuel : ${statsAvantApres.comparaison.actuel.taux} (Évolution: ${statsAvantApres.comparaison.evolutions.taux})`);
                console.log(`Erreurs actuelles : ${statsAvantApres.comparaison.actuel.erreurs} (Évolution: ${statsAvantApres.comparaison.evolutions.erreurs})`);
            } else if (statsAvantApres) {
                console.log(`URL : ${statsAvantApres.url}`);
                console.log(`ℹ️  ${statsAvantApres.message}`);
                if(statsAvantApres.actuel) {
                    console.log(`Score initial : ${statsAvantApres.actuel.taux} (${statsAvantApres.actuel.erreurs} erreurs)`);
                }
            }
            console.log("=============================================\n");
        } catch (dbError) {
            console.error("❌ Avertissement : Impossible d'enregistrer en BDD (vérifiez votre connexion PostgreSQL).", dbError.message);
        }

        // ====================================================================
        // 🖥️ LANCEMENT DU SERVEUR DASHBOARD
        // ====================================================================
        console.log(`🖥️  Création du serveur local et ouverture du Dashboard...`);

        const server = http.createServer((req, res) => {
            if (req.url === '/' || req.url === '/dashboard.html') {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(fs.readFileSync('./dashboard.html'));
            } else if (req.url === '/last_results.json') {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(fs.readFileSync('./last_results.json'));
            } else if (req.url === '/avant_apres.json') {
                // 👇 NOUVELLE ROUTE POUR LE DASHBOARD FRONTEND 👇
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(statsAvantApres || { error: "Données non disponibles" }));
            } else {
                res.writeHead(404);
                res.end('Fichier introuvable');
            }
        });

        server.listen(0, () => {
            const port = server.address().port;
            const dashboardUrl = `http://localhost:${port}/dashboard.html`;
            console.log(`✅ Dashboard prêt et accessible sur : ${dashboardUrl}`);
            console.log(`⚠️  Laissez ce terminal ouvert. Faites "Ctrl+C" pour quitter.\n`);
            
            const startCmd = (process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open');
            exec(`${startCmd} ${dashboardUrl}`);
        });

    } catch (error) {
        console.error("❌ Erreur fatale d'audit :", error);
    } finally {
        await browser.close();
    }
}

const targetUrl = process.argv[2] || 'https://www.service-public.fr';
runAudit(targetUrl);