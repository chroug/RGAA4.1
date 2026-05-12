import { COLORS } from '../../../utils/terminalColors.js';
import { askGemma } from '../../utils/ai_helper.js';
import { promptCritere8_8 } from '../prompts.js';

export default async function testerCritere8_8(passagesHTML, erreursAlgo8_8) {
    console.log(`\n ℹ️  [critere_8.8] Validité et Pertinence des codes langue...`);
    let violations = [];

    // 1️⃣ Erreurs algorithmiques
    if (erreursAlgo8_8 && erreursAlgo8_8.length > 0) {
        console.log(`    ⚡ Algo Analyse...`);
        erreursAlgo8_8.forEach(err => {
            violations.push({ 
                html: err.html, 
                xpath: "Non disponible", 
                css: "Non applicable", 
                raison: `[Erreur Algo] ${err.raison}` 
            });
            console.log(`       ${COLORS.RED}❌ NON CONFORME${COLORS.RESET} : ${err.raison}`);
        });
    }

    // 2️⃣ Pertinence IA
    if (passagesHTML && passagesHTML.length > 0) {
        // On isole uniquement les blocs qui possèdent un attribut lang pour le comptage
        const blocsAVerifier = passagesHTML.filter(p => (p.html || p).includes('lang='));
        
        console.log(`    🧠 IA : Vérification de la pertinence pour ${blocsAVerifier.length} bloc(s) avec attribut lang...`);
        const spinnerFrames = ['[ ● ○ ○ ○ ]', '[ ○ ● ○ ○ ]', '[ ○ ○ ● ○ ]', '[ ○ ○ ○ ● ]', '[ ○ ○ ● ○ ]', '[ ○ ● ○ ○ ]'];
        let currentIndex = 1;
        let uwu = 1;

        for (const passage of passagesHTML) {
            const extraitHTML = passage.html || passage;
            
            if (!extraitHTML.includes('lang=')) {
                currentIndex++;
                continue; 
            }

            const prompt = promptCritere8_8(extraitHTML);

// 1️⃣ On crée une variable dynamique pour le texte du Loader
            let texteLoader = `IA en pleine réflexion (${uwu}/${blocsAVerifier.length})...`;
            uwu++;
            let i = 0;
            const loaderInterval = setInterval(() => {
                // 2️⃣ Le loader affiche la variable dynamique (qui peut changer à tout moment)
                process.stdout.write(`\r       ${COLORS.BLUE}${spinnerFrames[i]}${COLORS.RESET} ${texteLoader} \x1b[K`);
                i = (i + 1) % spinnerFrames.length;
            }, 150);

            try {
                // 3️⃣ On appelle l'IA en lui passant une fonction fléchée !
                // Si l'IA est surchargée, elle exécutera cette fonction et modifiera "texteLoader"
                const reponseIA = await askGemma(prompt, (nouveauMessage) => {
                    texteLoader = `${COLORS.YELLOW}${nouveauMessage}${COLORS.RESET}`;
                });
                
                clearInterval(loaderInterval);
                process.stdout.write('\r\x1b[K'); 
                
                let textePropre = typeof reponseIA === 'string' ? reponseIA.replace(/\x60\x60\x60json/gi, '').replace(/\x60\x60\x60/g, '').trim() : reponseIA;
                const resultat = typeof textePropre === 'string' ? JSON.parse(textePropre) : textePropre;

                if (resultat && resultat.statut === "NON_CONFORME") {
                    const explication = resultat.explication || "La langue déclarée est inappropriée.";
                    violations.push({ 
                        html: extraitHTML, 
                        xpath: "Non disponible", 
                        css: "Non applicable", 
                        raison: `[Erreur IA] ${explication}` 
                    });
                    console.log(`       ${COLORS.RED}❌ NON CONFORME${COLORS.RESET} (Bloc ${currentIndex}) : ${explication}`);
                }
                else {
                    const justification = resultat.explication || "Code langue pertinent et valide.";
                    console.log(`       ${COLORS.GREEN}✅ CONFORME${COLORS.RESET} (Bloc ${currentIndex}) : ${justification}`);
                }
            } catch (e) {
                clearInterval(loaderInterval);
                process.stdout.write('\r\x1b[K');
                console.log(`  ${COLORS.YELLOW}⚠️ Erreur de l'IA (Bloc ${currentIndex})${COLORS.RESET} : ${e.message}`);
            }
            currentIndex++;
        }
    }

// BILAN FINAL
    const nbBlocsTestes = passagesHTML ? passagesHTML.filter(p => (p.html || p).includes('lang=')).length : 0;
    const nbErreursAlgo = erreursAlgo8_8 ? erreursAlgo8_8.length : 0;

    if (violations.length > 0) {
        return { statut: "❌ NON CONFORME", violations };
    } 
    // 💡 NOUVEAU : Si 0 erreur algo ET 0 bloc pertinent à tester pour l'IA
    else if (nbBlocsTestes === 0 && nbErreursAlgo === 0) {
        console.log(`       ➖ NON APPLICABLE : Aucun attribut 'lang' n'est présent sur cette page.`);
        return { statut: "➖ NON APPLICABLE", violations: [] };
    } 
    else {
        console.log(`       ${COLORS.GREEN}✅ CONFORME${COLORS.RESET} : Les codes langues sont valides et pertinents.`);
        return { statut: "✅ CONFORME", violations: [] };
    }

}