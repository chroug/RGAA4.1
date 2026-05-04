import { askVision } from '../../utils/ai_helper.js';
import { promptVisionContraste } from '../prompts.js';
import fs from 'fs';
import path from 'path';

export default async function analyserContrastesAvecVision(page, elementsGraphiques) {
    let resultat = { statut: "✅ Conforme (C)", violations: [], elements_valides: [] };
    let nbErreurs = 0;

    if (!elementsGraphiques || elementsGraphiques.length === 0) {
        console.log(`   ➖ IA Vision [3.3] Analyse... Non Applicable`);
        return { statut: "➖ Non Applicable (NA)", violations: [] };
    }

// 📁 PRÉPARATION DU DOSSIER DE CAPTURES
    const dossierCaptures = path.join(process.cwd(), 'captures_3.3');
    
    if (fs.existsSync(dossierCaptures)) {
        // 🧹 NETTOYAGE : Supprime tout le contenu du dossier avant de commencer
        // recursive: true et force: true permettent de tout vider proprement
        fs.rmSync(dossierCaptures, { recursive: true, force: true });
    }
    
    // On recrée le dossier tout beau tout neuf
    fs.mkdirSync(dossierCaptures, { recursive: true });

    for (let i = 0; i < elementsGraphiques.length; i++) {
        const item = elementsGraphiques[i];

        // 🛑 NOUVEAUTÉ : Si l'élément est exempté, on valide immédiatement sans API !
        if (item.exemption) {
            console.log(`   ⏭️  Filtre [3.3] Analyse ${i + 1}/${elementsGraphiques.length}... ✅ Ok (${item.exemption})`);
            resultat.elements_valides.push({
                description: item.exemption,
                html: item.html,
                capture_locale: null
            });
            continue; // On passe directement au prochain élément de la boucle !
        }

        process.stdout.write(`   📸 IA Vision [3.3] Capture et Analyse ${i + 1}/${elementsGraphiques.length}... `);

        try {
            const locator = page.locator(`[data-audit-id="${item.auditId}"]`);
            await locator.scrollIntoViewIfNeeded();

            // 📐 1. On récupère les coordonnées exactes de l'élément à l'écran
            const box = await locator.boundingBox();
            let imageBuffer;

            if (box) {
                // 🖼️ 2. On ajoute une marge (padding) pour capturer le contexte autour
                const padding = 30; // 30 pixels de "fond" autour du composant
                
                imageBuffer = await page.screenshot({ 
                    type: 'jpeg', 
                    quality: 80, 
                    clip: {
                        x: Math.max(0, box.x - padding), // Ne sort pas de l'écran à gauche
                        y: Math.max(0, box.y - padding), // Ne sort pas de l'écran en haut
                        width: box.width + (padding * 2),
                        height: box.height + (padding * 2)
                    } 
                });
            } else {
                // Fallback de sécurité : si la boîte est introuvable, on prend l'élément seul
                imageBuffer = await locator.screenshot({ type: 'jpeg', quality: 80 });
            }

            const base64Image = imageBuffer.toString('base64');

            const prompt = promptVisionContraste(item.html);
            const resIA = await askVision(prompt, base64Image);

            // 💾 SAUVEGARDE DE L'IMAGE SUR LE DISQUE
            const statutFichier = resIA.statut === "CONFORME" ? "valide" : "invalide";
            const nomFichier = `element_${i + 1}_${statutFichier}.jpg`;
            const cheminFichier = path.join(dossierCaptures, nomFichier);
            fs.writeFileSync(cheminFichier, imageBuffer);

            // LOGIQUE D'AFFICHAGE ET D'ENREGISTREMENT
            if (resIA.statut === "NON_CONFORME") {
                console.log(`❌ Non Conforme (${resIA.explication})`);
                nbErreurs++;
                resultat.violations.push({
                    description: resIA.explication,
                    html: item.html,
                    capture_locale: cheminFichier 
                });
            } else {
                console.log(`✅ Ok (${resIA.explication})`);
                resultat.elements_valides.push({
                    description: resIA.explication,
                    html: item.html,
                    capture_locale: cheminFichier
                });
            }

        } catch (erreur) {
            console.log(`⚠️ Impossible de capturer l'élément (probablement caché). Ignoré.`);
        }
    }

    if (nbErreurs > 0) resultat.statut = "❌ Non Conforme (NC)";
    
    return resultat;
}