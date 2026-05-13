import { COLORS } from '../../../utils/terminalColors.js';
import { askGemma } from '../../utils/ai_helper.js';
import { promptCritere9_1 } from '../prompts.js';

export default async function testerCritere9_1(erreursAlgo, titresAAnalyser, fauxTitresPotentiels) {
    console.log(`\n ℹ️  [critere_9.1] Structuration de l'information par les titres...`);
    let violations = [];

    // 1️⃣ Erreurs Algorithmiques (Hiérarchie 9.1.1)
    if (erreursAlgo && erreursAlgo.length > 0) {
        console.log(`    ⚡ Algo Analyse...`);
        erreursAlgo.forEach(err => {
            violations.push({ 
                html: err.html, 
                xpath: "Non disponible", 
                css: "Non applicable", 
                raison: `[Erreur Algo - 9.1.1] ${err.raison}` 
            });
            const indicateurTitre = err.niveau === 'ARIA' ? 'Titre ARIA' : `Titre H${err.niveau}`;
            console.log(`       ${COLORS.RED}❌ NON CONFORME${COLORS.RESET} (Élément ${err.index} - ${indicateurTitre}) : ${err.raison}`);
        });
    }

    // 2️⃣ Pertinence IA (Contenu 9.1.2)
    if (titresAAnalyser && titresAAnalyser.length > 0) {
        console.log(`    🧠 IA : Vérification de la pertinence pour ${titresAAnalyser.length} titre(s)...`);
        const spinnerFrames = ['[ ● ○ ○ ○ ]', '[ ○ ● ○ ○ ]', '[ ○ ○ ● ○ ]', '[ ○ ○ ○ ● ]', '[ ○ ○ ● ○ ]', '[ ○ ● ○ ○ ]'];
        let currentIndex = 1;

        for (const element of titresAAnalyser) {
            const prompt = promptCritere9_1(element.titre, element.niveau, element.texteSuivant);
            
            const texteOriginal = `Analyse de l'Élément ${currentIndex} (Titre ${element.label})...`;
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
                
                let textePropre = typeof reponseIA === 'string' ? reponseIA.replace(/\x60\x60\x60json/gi, '').replace(/\x60\x60\x60/g, '').trim() : reponseIA;
                const resultat = typeof textePropre === 'string' ? JSON.parse(textePropre) : textePropre;

                if (resultat && resultat.statut === "NON_CONFORME") {
                    const explication = resultat.explication || "Le titre ne semble pas pertinent vis-à-vis de son contenu.";
                    violations.push({ html: element.html, xpath: "N/A", css: "N/A", raison: `[Erreur IA - 9.1.2] ${explication}` });
                    console.log(`       ${COLORS.RED}❌ NON CONFORME${COLORS.RESET} (Élément ${currentIndex} - Titre ${element.label}) : ${explication}`);
                } else {
                    const justification = resultat.explication || "Titre pertinent.";
                    console.log(`       ${COLORS.GREEN}✅ CONFORME${COLORS.RESET} (Élément ${currentIndex} - Titre ${element.label}) : ${justification}`);
                }
            } catch (e) {
                clearInterval(loaderInterval);
                process.stdout.write('\r\x1b[K');
                console.log(`  ${COLORS.YELLOW}⚠️ Erreur de l'IA (Élément ${currentIndex})${COLORS.RESET} : ${e.message}`);
            }
            currentIndex++;
        }
    }

    // 3️⃣ NOUVEAU : Suspicion de Faux Titres (Test 9.1.3)
    if (fauxTitresPotentiels && fauxTitresPotentiels.length > 0) {
        console.log(`    👁️  Analyse Heuristique : Vérification des faux titres (9.1.3)...`);
        fauxTitresPotentiels.forEach((faux, idx) => {
            // On signale ça comme un avertissement nécessitant une validation humaine
            console.log(`       ${COLORS.YELLOW}⚠️ SUSPICION${COLORS.RESET} (Faux titre potentiel ${idx + 1}) : "${faux.texte}" -> ${faux.raison}`);
        });
        console.log(`       ${COLORS.CYAN}💡 Action requise : Un humain doit vérifier si ces textes doivent être balisés en <hx>.${COLORS.RESET}`);
    }

    // BILAN FINAL
    const nbTitres = titresAAnalyser ? titresAAnalyser.length : 0;
    const nbErreursAlgo = erreursAlgo ? erreursAlgo.length : 0;

    if (violations.length > 0) {
        return { statut: "❌ NON CONFORME", violations };
    } else if (nbTitres === 0 && nbErreursAlgo === 0) {
        console.log(`       ${COLORS.CYAN}➖ NON APPLICABLE${COLORS.RESET} : Aucun titre n'a été détecté sur cette page.`);
        return { statut: "➖ NON APPLICABLE", violations: [] };
    } else {
        console.log(`       ${COLORS.GREEN}✅ CONFORME${COLORS.RESET} : La structure et la pertinence des titres semblent correctes.`);
        return { statut: "✅ CONFORME", violations: [] };
    }
}