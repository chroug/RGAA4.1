export default async function testerCritere13_2(popupAutomatiqueDetectee) {
    let resultat = { statut: "✅ Conforme (C)", violations: [] };

    process.stdout.write(`   🧠 [critere_13.2] Vérification des pop-ups automatiques... `);

    if (popupAutomatiqueDetectee) {
        console.log(`❌ Non Conforme`);
        resultat.statut = "❌ Non Conforme (NC)";
        resultat.violations.push({
            description: "Une nouvelle fenêtre (pop-up ou pop-under) s'est ouverte automatiquement au chargement de la page, sans action de l'utilisateur.",
            html: "N/A (Déclenché par JavaScript global)"
        });
    } else {
        console.log(`✅ Conforme`);
    }

    return resultat;
}