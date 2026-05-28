import { COLORS } from '../../../utils/terminalColors.js';
import { askGemma } from '../../utils/ai_helper.js';
import { promptCritere9_2 } from '../prompts.js';

export default async function testerCritere9_2(erreursAlgo, navsAAnalyser, suspicions) {
    console.log(`\n ℹ️  [critere_9.2] Structure globale du document (header, main, footer, nav)...`);
    let violations = [];
    let conformites = [];

    // 1️⃣ Erreurs Algorithmiques (Absence ou doublons de structure)
    if (erreursAlgo && erreursAlgo.length > 0) {
        console.log(`    ⚡ Algo Analyse (Bases structurelles)...`);
        erreursAlgo.forEach((err, idx) => {
            violations.push({ ...err, raison: `[Erreur Algo - 9.2.1] ${err.raison}` });
            console.log(`       ${COLORS.RED}❌ NON CONFORME${COLORS.RESET} (${err.element}) : ${err.raison}`);
        });
    } else {
        console.log(`    ⚡ Algo Analyse : Structure de base (<header>, <main>, <footer>) présente et valide.`);
    }

    // 2️⃣ Pertinence IA (Usage abusif de <nav>)
    if (navsAAnalyser && navsAAnalyser.length > 0) {
        console.log(`    🧠 IA : Vérification sémantique pour ${navsAAnalyser.length} balise(s) <nav>...`);
        const spinnerFrames = ['[ ● ○ ○ ○ ]', '[ ○ ● ○ ○ ]', '[ ○ ○ ● ○ ]', '[ ○ ○ ○ ● ]', '[ ○ ○ ● ○ ]', '[ ○ ● ○ ○ ]'];
        let currentIndex = 1;

        for (const nav of navsAAnalyser) {
            const prompt = promptCritere9_2(nav.labelAria, nav.liens, nav.texte);
            
            const texteOriginal = `Analyse de la navigation ${currentIndex} (Aria: ${nav.labelAria})...`;
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
                    violations.push({ ...nav, raison: `[Erreur IA - 9.2.1] ${resultat.explication}` });
                    console.log(`       ${COLORS.RED}❌ NON CONFORME${COLORS.RESET} (<nav> n°${currentIndex}) : ${resultat.explication}`);
                } else {
                    conformites.push({
                        ...nav,
                        raison: `[9.2.1] ${resultat.explication || "Usage légitime de la balise nav."}`
                    });
                    console.log(`       ${COLORS.GREEN}✅ CONFORME${COLORS.RESET} (<nav> n°${currentIndex}) : ${resultat.explication || "Usage légitime de la balise nav."}`);
                }
            } catch (e) {
                clearInterval(loaderInterval);
                process.stdout.write('\r\x1b[K');
                console.log(`  ${COLORS.YELLOW}⚠️ Erreur de l'IA (<nav> n°${currentIndex})${COLORS.RESET} : ${e.message}`);
            }
            currentIndex++;
        }
    } else {
        console.log(`    🧠 IA : Aucune balise <nav> trouvée à vérifier.`);
    }

    // 3️⃣ NOUVEAU : Suspicion de Fausses Structures (div au lieu de header/main)
    if (suspicions && suspicions.length > 0) {
        console.log(`    👁️  Analyse Heuristique : Vérification des fausses zones structurelles...`);
        suspicions.forEach((susp) => {
            console.log(`       ${COLORS.YELLOW}⚠️ SUSPICION${COLORS.RESET} (${susp.zone}) : ${susp.raison}`);
        });
        console.log(`       ${COLORS.CYAN}💡 Action requise : Un humain doit corriger ces conteneurs en utilisant les balises HTML5 appropriées.${COLORS.RESET}`);
    }

    // BILAN FINAL
    if (violations.length > 0) {
        return { statut: "❌ NON CONFORME", violations, conformites };
    } else {
        console.log(`       ${COLORS.CYAN}👀 VALIDATION MANUELLE REQUISE : Un humain doit s'assurer que la balise <main> englobe bien le VRAI contenu de la page.${COLORS.RESET}`);
        return { statut: "✅ CONFORME", violations: [], conformites };
    }
}