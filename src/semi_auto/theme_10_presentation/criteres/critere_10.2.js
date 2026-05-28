import { COLORS } from '../../../utils/terminalColors.js';
import { askGemma } from '../../utils/ai_helper.js';
import { promptCritere10_2 } from '../prompts.js';

export default async function testerCritere10_2(textesCSS, imagesBg) {
    console.log(`\n ℹ️  [critere_10.2] Indépendance de l'information vis-à-vis du CSS...`);
    let violations = [];
    let conformites = [];

    // 1️⃣ Pertinence IA (Textes cachés dans le CSS)
    if (textesCSS && textesCSS.length > 0) {
        console.log(`    🧠 IA : Vérification sémantique de ${textesCSS.length} texte(s) injecté(s) via CSS...`);
        const spinnerFrames = ['[ ● ○ ○ ○ ]', '[ ○ ● ○ ○ ]', '[ ○ ○ ● ○ ]', '[ ○ ○ ○ ● ]', '[ ○ ○ ● ○ ]', '[ ○ ● ○ ○ ]'];
        let currentIndex = 1;

        for (const item of textesCSS) {
            const prompt = promptCritere10_2(item.texte, item.tagName);
            
            const texteOriginal = `Analyse du texte CSS "${item.texte}"...`;
            let texteLoader = texteOriginal;
            let enPause = false; 
            let i = 0;
            
            const colorAnim = COLORS.CYAN || ''; 
            const colorPause = COLORS.YELLOW || '';
            const colorReset = COLORS.RESET || '';
            
            const loaderInterval = setInterval(() => {
                if (enPause) {
                    process.stdout.write(`\r       ⏳ ${texteLoader} \x1b[K`);
                } else {
                    process.stdout.write(`\r       ${colorAnim}${spinnerFrames[i]}${colorReset} ${texteLoader} \x1b[K`);
                    i = (i + 1) % spinnerFrames.length;
                }
            }, 150);

            try {
                const reponseIA = await askGemma(prompt, (nouveauMessage, isPaused) => {
                    if (isPaused) {
                        enPause = true; 
                        texteLoader = `${colorPause}${nouveauMessage}${colorReset}`;
                    } else {
                        enPause = false; 
                        texteLoader = texteOriginal; 
                    }
                });
                
                clearInterval(loaderInterval);
                process.stdout.write('\r\x1b[K'); 
                
                let textePropre = typeof reponseIA === 'string' ? reponseIA.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim() : reponseIA;
                const resultat = typeof textePropre === 'string' ? JSON.parse(textePropre) : textePropre;

                if (resultat && resultat.statut === "NON_CONFORME") {
                    violations.push({ ...item, raison: `[Erreur IA - 10.2] ${resultat.explication}` });
                    console.log(`       ${COLORS.RED}❌ NON CONFORME${COLORS.RESET} (Texte CSS n°${currentIndex} : "${item.texte}") : ${resultat.explication}`);
                } else {
                    conformites.push({
                        ...item,
                        raison: `[10.2] Texte CSS jugé décoratif par l'IA : ${resultat.explication || "Élément purement décoratif."}`
                    });
                    console.log(`       ${COLORS.GREEN}✅ CONFORME${COLORS.RESET} (Texte CSS n°${currentIndex} : "${item.texte}") : ${resultat.explication || "Élément purement décoratif."}`);
                }
            } catch (e) {
                clearInterval(loaderInterval);
                process.stdout.write('\r\x1b[K');
                console.log(`  ${COLORS.YELLOW}⚠️ Erreur de l'IA (Texte CSS n°${currentIndex} : "${item.texte}")${COLORS.RESET} : ${e.message}`);
            }
            currentIndex++;
        }
    } else {
        console.log(`    🧠 IA : Aucun texte informatif injecté via CSS détecté.`);
    }

    // 2️⃣ Vérification Humaine (Background-images)
    if (imagesBg && imagesBg.length > 0) {
        console.log(`    👁️  Analyse Heuristique : ${imagesBg.length} image(s) de fond détectée(s) sur des balises vides.`);
        imagesBg.forEach((img, idx) => {
            console.log(`       ${COLORS.YELLOW}⚠️ SUSPICION${COLORS.RESET} (Image ${idx + 1}) : ${img.css}`);
        });
        console.log(`       ${COLORS.CYAN}👀 VALIDATION MANUELLE REQUISE : Un humain doit vérifier que ces images de fond ne contiennent pas de texte ou d'information essentielle (ex: icône d'état, badge promo).${COLORS.RESET}`);
    }

    // BILAN FINAL
    if (violations.length > 0) {
        return { statut: "❌ NON CONFORME", violations, conformites };
    } else if (imagesBg && imagesBg.length > 0) {
        return { statut: "⚠️ À VÉRIFIER MANUELLEMENT", violations: [], conformites };
    } else {
        // NOUVEAU : On affiche clairement la conformité dans le terminal !
        console.log(`       ${COLORS.GREEN}✅ CONFORME${COLORS.RESET} : Aucune information vitale n'est masquée dans le CSS ni dans les images de fond.`);
        if (conformites.length === 0) {
            conformites.push({
                html: "N/A",
                selecteur_css: "N/A",
                xpath: "N/A",
                bounding_box: null,
                raison: "Aucune information vitale n'est masquée dans le CSS ni dans les images de fond."
            });
        }
        return { statut: "✅ CONFORME", violations: [], conformites };
    }
}