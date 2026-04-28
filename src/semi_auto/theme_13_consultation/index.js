import testerCritere13_2 from './criteres/critere_13.2.js';

export default async function runTheme13(page, resultats_globaux) {
    console.log(`   👁️ [Thème 13] Analyse de la Consultation...`);

    // On va vérifier si une popup s'est ouverte automatiquement
    let popupAutomatiqueDetectee = false;

    // Playwright écoute les nouvelles fenêtres
    page.on('popup', async (popup) => {
        popupAutomatiqueDetectee = true;
        await popup.close(); // On ferme la popup pour ne pas polluer
    });

    // On attend un tout petit peu pour laisser le temps aux scripts comme "setTimeout" de s'exécuter
    await page.waitForTimeout(1500); 

    // Lancement du test 13.2
    const res13_2 = await testerCritere13_2(popupAutomatiqueDetectee);
    resultats_globaux["critere_13.2"] = res13_2;
}