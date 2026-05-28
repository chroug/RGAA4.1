export default async function testerCritere13_2(page) {
    console.log(`\n ℹ️  [critere_13.2] Vérification algorithmique des pop-ups automatiques...`);

    let popupAutomatiqueDetectee = false;

    // Définition de la fonction de rappel (callback) pour l'écouteur de pop-up
    const popupListener = async (popup) => {
        popupAutomatiqueDetectee = true;
        try {
            await popup.close(); // Fermeture immédiate de la pop-up pour laisser le champ libre à l'audit
        } catch (e) {
            // Silence si la pop-up est déjà fermée
        }
    };

    // On attache l'écouteur sur l'instance de page Playwright
    page.on('popup', popupListener);

    // On attend 1,5 seconde pour laisser le temps aux scripts malveillants/publicitaires de s'exécuter
    await page.waitForTimeout(1500); 

    // IMPORTANT : On retire l'écouteur pour nettoyer la mémoire du navigateur après usage
    page.off('popup', popupListener);

    let resultat = { 
        statut: "✅ CONFORME", 
        violations: [],
        conformites: []
    };

    if (popupAutomatiqueDetectee) {
        resultat.statut = "❌ NON CONFORME";
        const raisonEchec = "Une nouvelle fenêtre (pop-up ou pop-under) s'est ouverte automatiquement au chargement sans action explicite de l'utilisateur.";
        
        resultat.violations.push({
            html: "N/A",
            selecteur_css: "N/A",
            xpath: "N/A",
            bounding_box: null,
            raison: `[13.2] ${raisonEchec}`
        });
        console.log(`       ❌ NON CONFORME : ${raisonEchec}`);
    } else {
        const raisonSucces = "Aucune ouverture de nouvelle fenêtre intempestive (pop-up) n'a été détectée lors du chargement de la page.";
        
        resultat.conformites.push({
            html: "N/A",
            selecteur_css: "N/A",
            xpath: "N/A",
            bounding_box: null,
            raison: `[13.2] ${raisonSucces}`
        });
        console.log(`       ✅ CONFORME : ${raisonSucces}`);
    }

    return resultat;
}