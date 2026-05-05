import testerCritere2_2 from './criteres/critere_2.2.js';

export default async function runTheme2(page, resultats_globaux) {
    // On passe directement 'page' pour permettre à Puppeteer de prendre des captures
    const res2_2 = await testerCritere2_2(page);
    
    // Rangement global
    resultats_globaux["critere_2.2"] = res2_2;
}