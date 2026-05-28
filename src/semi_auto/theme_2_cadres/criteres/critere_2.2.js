import { prompt_2_2 } from '../prompts.js';
import { askVision } from '../../utils/ai_helper.js'; 
import fs from 'fs';
import path from 'path';

let isFirstRun = true;

export default async function testerCritere2_2(page) {
    const resultats = {
        critere: '2.2',
        titre: 'Pour chaque cadre ayant un titre de cadre, ce titre de cadre est-il pertinent ?',
        statut: 'C', 
        violations: [],
        conformites: []
    };

    console.log("   ⏳ Attente du chargement des cadres (iframes)...");
    
    // 🔥 DEBUG : On force une grosse pause de 5 secondes pour être sûr à 100% que tout a chargé
    await page.waitForTimeout(5000); 

    // 🔎 DEBUG TECHNIQUE : On compte absolument TOUS les cadres, avec ou sans titre
    const totalFrames = await page.locator('iframe, frame').count();
    console.log(`   🔎 DEBUG : J'ai trouvé ${totalFrames} cadre(s) AU TOTAL dans le code source de cette page.`);

    // --- Reprise de la logique normale ---
    const framesLocator = page.locator('iframe[title], frame[title]');
    const framesCount = await framesLocator.count();

    console.log(`   👉 Critère 2.2 : ${framesCount} cadre(s) détecté(s) avec un attribut title.`);

    const captureDir = path.join(process.cwd(), 'captures_2.2');

    if (isFirstRun) {
        if (fs.existsSync(captureDir)) {
            fs.rmSync(captureDir, { recursive: true, force: true });
        }
        fs.mkdirSync(captureDir, { recursive: true });
        isFirstRun = false;
    } else if (!fs.existsSync(captureDir)) {
        fs.mkdirSync(captureDir, { recursive: true });
    }

    if (framesCount === 0) {
        resultats.statut = 'NA';
        return resultats;
    }

    let hasError = false;

    for (let i = 0; i < framesCount; i++) {
        const frame = framesLocator.nth(i);

        const frameData = await frame.evaluate(el => ({
            tag: el.tagName.toLowerCase(),
            title: el.getAttribute('title').trim(),
            src: el.getAttribute('src') || 'Aucune source',
            html: el.outerHTML
        }));

        await frame.scrollIntoViewIfNeeded().catch(() => {});
        await page.waitForTimeout(2000); 

        const timestamp = Date.now();
        const safeTitle = frameData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30) || 'sans_titre';
        const fileName = `cadre_${i}_${safeTitle}_${timestamp}.jpeg`;
        const filePath = path.join(captureDir, fileName);

        let base64Image = null;
        try {
            const capture = await frame.screenshot({ 
                path: filePath,
                type: 'jpeg', 
                quality: 80 
            });
            
            if (Buffer.isBuffer(capture)) {
                base64Image = capture.toString('base64');
            } else if (typeof capture === 'string') {
                base64Image = capture; 
            } else {
                throw new Error("Format de capture non reconnu.");
            }
        } catch (e) {
            console.warn(`   ⚠️ Échec de la capture pour l'iframe (src: ${frameData.src}). Raison : ${e.message}`);
        }

        let estConforme = false;
        let raison = "Erreur d'analyse";

        if (base64Image) {
            const prompt = prompt_2_2
                .replace('{tag}', frameData.tag)
                .replace('{title}', frameData.title)
                .replace('{src}', frameData.src);

            const reponseIA = await askVision(prompt, base64Image);
            
            if (reponseIA && reponseIA.conforme !== undefined) {
                estConforme = reponseIA.conforme;
                raison = reponseIA.raison || "Analyse terminée";
            } else if (reponseIA && reponseIA.statut === "NON_CONFORME") {
                estConforme = false;
                raison = reponseIA.explication || "Erreur renvoyée par l'API Vision";
            }
            
            const icone = estConforme ? '✅' : '❌';
            console.log(`   ${icone} Résultat IA : [${estConforme ? 'CONFORME' : 'NON CONFORME'}] - ${raison}`);
            
        } else {
            estConforme = false;
            raison = "Impossible d'analyser l'iframe visuellement.";
            console.log(`   ❌ Résultat IA : [NON CONFORME] - ${raison}`);
        }

        if (!estConforme) {
            hasError = true;
        }

        if (!estConforme) {
            resultats.violations.push({
                ...frameData,
                capture_sauvegardee: base64Image ? filePath : null,
                raison: raison
            });
        } else {
            resultats.conformites.push({
                ...frameData,
                capture_sauvegardee: base64Image ? filePath : null,
                raison: raison
            });
        }
    }

    if (hasError) {
        resultats.statut = 'NC';
    }

    return resultats;
}