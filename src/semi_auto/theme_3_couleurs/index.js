import extraireComposantsUI from './evaluate_dom.js';
import analyserContrastesAvecVision from './criteres/critere_3.3.js';

export default async function runTheme3(page, resultats_globaux) {
    console.log("\n🎨 [Thème 3] Analyse des Couleurs et Contrastes UI (Vision AI)...");
    
    // 1. On injecte les traceurs sur la page
    const elementsGraphiques = await page.evaluate(extraireComposantsUI);
    
    // 2. On lance l'analyse en lui donnant le navigateur (page) et les traceurs
    resultats_globaux["critere_3.3"] = await analyserContrastesAvecVision(page, elementsGraphiques);
}