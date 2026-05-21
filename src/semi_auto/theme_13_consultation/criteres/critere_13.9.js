import { askGemma } from '../../utils/ai_helper.js'; 
import { promptAvertissementOrientation } from '../prompts.js';

async function redimensionnerEcran(page, width, height) {
    if (typeof page.setViewport === 'function') {
        await page.setViewport({ width: width, height: height, isMobile: true });
    } else if (typeof page.setViewportSize === 'function') {
        await page.setViewportSize({ width: width, height: height });
    } else {
        throw new Error("Impossible de redimensionner l'écran.");
    }
}

// Fonction injectée dans la page pour détecter le Cas n°3 (Scroll bloqué)
const verifierScrollBloque = () => {
    const styleBody = window.getComputedStyle(document.body);
    const styleHtml = window.getComputedStyle(document.documentElement);
    
    // Y a-t-il plus de contenu que la taille de l'écran ?
    const aBesoinDeScroll = document.documentElement.scrollHeight > window.innerHeight;
    
    // Le défilement est-il interdit en CSS ?
    const scrollInterdit = (styleBody.overflow === 'hidden' || styleBody.overflowY === 'hidden') ||
                           (styleHtml.overflow === 'hidden' || styleHtml.overflowY === 'hidden');

    return aBesoinDeScroll && scrollInterdit;
};

export default async function testerCritere13_9(page) {
    console.log(`\n ℹ️  [critere_13.9] Vérification de l'orientation de l'écran (Portrait vs Paysage)...`);
    
    let resultat = { statut: "✅ CONFORME", violations: [], conformites: [] };

    try {
        // --- 1. TEST EN MODE PORTRAIT ---
        await redimensionnerEcran(page, 375, 812);
        await new Promise(r => setTimeout(r, 600)); 
        
        const textePortrait = await page.evaluate(() => document.body.innerText || "");
        const scrollBloquePortrait = await page.evaluate(verifierScrollBloque);

        // --- 2. TEST EN MODE PAYSAGE ---
        await redimensionnerEcran(page, 812, 375);
        await new Promise(r => setTimeout(r, 600));
        
        const textePaysage = await page.evaluate(() => document.body.innerText || "");
        const scrollBloquePaysage = await page.evaluate(verifierScrollBloque);

        // RESTAURATION 
        await redimensionnerEcran(page, 1280, 800);

        // --- 3. ANALYSE DU CAS N°3 (SCROLL BLOQUÉ) ---
        if (scrollBloquePortrait) {
            console.log(`❌ Non Conforme (Le contenu dépasse de l'écran en mode Portrait mais le défilement (scroll) est désactivé via CSS)`);
            resultat.statut = "❌ NON CONFORME";
            resultat.violations.push({
                mode: "Portrait",
                raison: "[13.9] Cas n°3 : Le défilement de la page est bloqué (overflow: hidden), rendant le contenu inaccessible."
            });
        }
        if (scrollBloquePaysage) {
            console.log(`❌ Non Conforme (Le contenu dépasse de l'écran en mode Paysage mais le défilement (scroll) est désactivé via CSS)`);
            resultat.statut = "❌ NON CONFORME";
            resultat.violations.push({
                mode: "Paysage",
                raison: "[13.9] Cas n°3 : Le défilement de la page est bloqué (overflow: hidden), rendant le contenu inaccessible."
            });
        }

        // --- 4. ANALYSE DU CAS N°1 (MESSAGE DE BLOCAGE VIA IA) ---
        const regexBlocage = /(tourne|pivot|rotat|paysage|portrait|orient|horizont|vertical|device)/i;
        const extrairePhraseSuspecte = (texte) => {
            const phrases = texte.split('\n');
            for (let phrase of phrases) {
                if (regexBlocage.test(phrase) && phrase.length < 200) { return phrase.trim(); }
            }
            return null;
        };

        const suspectPortrait = extrairePhraseSuspecte(textePortrait);
        const suspectPaysage = extrairePhraseSuspecte(textePaysage);

        const analyserSuspect = async (texteSuspect, mode) => {
            process.stdout.write(`       🧠 [critere_13.9] Message suspect détecté en mode ${mode} : IA... `);
            const resIA = await askGemma(promptAvertissementOrientation(texteSuspect));
            if (resIA.statut === "NON_CONFORME") {
                console.log(`❌ Non Conforme (${resIA.explication})`);
                resultat.statut = "❌ NON CONFORME";
                resultat.violations.push({
                    mode: mode,
                    raison: `[13.9] Cas n°1 : Message de blocage détecté : ${resIA.explication}`
                });
            } else {
                console.log(`✅ Faux positif ignoré (${resIA.explication})`);
            }
        };

        if (suspectPortrait) await analyserSuspect(suspectPortrait, "Portrait");
        if (suspectPaysage) await analyserSuspect(suspectPaysage, "Paysage");

        // --- BILAN FINAL ---
        if (resultat.statut === "✅ CONFORME") {
            console.log(`       ✅ CONFORME : Aucun blocage d'orientation (Message) ni de scroll bloqué détecté.`);
            resultat.conformites.push({ raison: "[13.9] Navigation fluide en Portrait et Paysage (Pas de message bloquant, pas de scroll caché)." });
        }

    } catch (error) {
        console.log(`       ⚠️ Erreur lors du test d'orientation : ${error.message}`);
    }

    return resultat;
}