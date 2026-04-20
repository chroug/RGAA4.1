import { chromium } from 'playwright';
import { runAutomatique } from './src/automatique/index.js';
import { runSemiAuto } from './src/semi_auto/index.js';
import { getManuelle } from './src/manuelle/index.js';

// 🔥 NOUVEAUX IMPORTS POUR GÉRER LES FICHIERS 🔥
import fs from 'fs';
import path from 'path';


async function runAudit(url) {
    if (!url) {
        console.error("❌ Erreur : Veuillez fournir une URL.");
        process.exit(1);
    }

    console.error(`\n🚀 Lancement de l'audit RGAA structuré sur : ${url}\n`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        await page.goto(url, { waitUntil: 'networkidle' });

        // Appel des 3 modules métier
        const blocAutomatique = await runAutomatique(page);
        const blocSemiAuto = await runSemiAuto(page);
        const blocManuel = getManuelle();


        // ====================================================================
        // CALCUL DES STATISTIQUES ET DU SCORE RGAA
        // ====================================================================
        
        let total_c = 0;   // Conforme
        let total_nc = 0;  // Non Conforme
        let total_na = 0;  // Non Applicable
        let total_erreurs_ponctuelles = 0;
        
        // 1. On analyse les statuts (C, NC, NA) du bloc automatique
        for (const key in blocAutomatique) {
            const critere = blocAutomatique[key];
            
            if (critere.statut.includes("❌")) {
                total_nc++;
                critere.violations.forEach(violation => {
                    total_erreurs_ponctuelles += violation.elements_fautifs.length > 0 ? violation.elements_fautifs.length : 1;
                });
            } 
            else if (critere.statut.includes("✅")) {
                total_c++;
            } 
            else if (critere.statut.includes("➖")) {
                total_na++;
            }
        }

        // 2. Application de la formule officielle RGAA : C / (C + NC) * 100
        // (Les NA sont totalement exclus du calcul)
        let taux_conformite = 0;
        const total_applicables = total_c + total_nc;
        
        if (total_applicables > 0) {
            taux_conformite = Math.round((total_c / total_applicables) * 100);
        }

        const criteres_manuels_restants = Array.isArray(blocManuel) ? blocManuel.length : 0;

        // ====================================================================
        // FUSION DANS LE JSON FINAL
        // ====================================================================
        const rapportFinal = {
            metadata: {
                url_auditee: url,
                date_audit: new Date().toISOString()
            },
            statistiques: {
                taux_de_conformite_automatique: `${taux_conformite}%`,
                repartition_des_criteres_auto: {
                    "✅_Conforme_C": total_c,
                    "❌_Non_Conforme_NC": total_nc,
                    "➖_Non_Applicable_NA": total_na
                },
                total_elements_en_erreur: total_erreurs_ponctuelles,
                criteres_a_verifier_ia: 0,
                criteres_100_pourcent_manuels: criteres_manuels_restants
            },
            resultats: {
                automatique: blocAutomatique,
                semi_automatique: blocSemiAuto,
                //manuelle: blocManuel
            }
        };

        // ====================================================================
        // 🔥 SAUVEGARDE DU FICHIER JSON 🔥
        // ====================================================================
        const dir = './rapports';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        // Affichage standard du JSON
        console.log(JSON.stringify(rapportFinal, null, 2));

    } catch (error) {
        console.error("❌ Une erreur est survenue lors de l'audit :", error);
    } finally {
        await browser.close();
    }
}

// Lancement
const targetUrl = process.argv[2] || 'http://localhost:3001';
runAudit(targetUrl);