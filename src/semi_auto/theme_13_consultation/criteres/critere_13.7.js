// PROCEDURE POUR LA PARTIE MANUELLE (CRITÈRE 13.7) :
// Si l'élément...,Décision
// Clignote 3 fois ou moins par seconde,✅ CONFORME
// Clignote plus de 3 fois par seconde,❌ NON CONFORME
// Est une animation très lente (ex: fondu enchaîné),✅ CONFORME
// Ne clignote pas mais se déplace rapidement,✅ CONFORME (Le 13.7 ne traite que les flashs/luminosité)

export default async function testerCritere13_7(contenus13_7) {
    console.log(`\n ℹ️  [critere_13.7] Vérification algorithmique des flashs et animations...`);

    let resultat = { 
        statut: "✅ CONFORME", 
        violations: [],
        conformites: [],
        a_verifier: [] // Pour envoyer au Dashboard humain
    };

    if (!contenus13_7 || contenus13_7.length === 0) {
        console.log(`       ✅ CONFORME : Aucun élément animé ou multimédia (vidéo, gif, canvas, animation CSS) détecté.`);
        return resultat;
    }

    const LIMITE_PIXELS = 21824;
    let depassementDetecte = false;

    contenus13_7.forEach(item => {
        if (item.surface_pixels <= LIMITE_PIXELS) {
            // Condition de surface validée
            const msg = `L'élément <${item.tag}> (${item.type_animation}) mesure ${item.surface_pixels} px² (<= ${LIMITE_PIXELS} px²). Sécurisé quelle que soit la fréquence.`;
            resultat.conformites.push({ html: item.html, raison: `[13.7] ${msg}` });
            console.log(`       ✅ CONFORME : ${msg}`);
        } else {
            // Condition de surface non respectée -> On doit vérifier la fréquence (Humain)
            depassementDetecte = true;
            const msg = `L'élément <${item.tag}> (${item.type_animation}) dépasse la surface limite (${item.surface_pixels} px² > ${LIMITE_PIXELS} px²).`;
            const actionRequise = `Vérification humaine requise : Assurez-vous que cet élément clignote ou s'anime à une fréquence INFÉRIEURE à 3 fois par seconde (< 3 Hz).`;
            
            resultat.a_verifier.push({
                html: item.html,
                raison: `[13.7] ${msg} ${actionRequise}`
            });
            console.log(`       ⚠️ À VÉRIFIER : ${msg} -> Fréquence à vérifier manuellement.`);
        }
    });

    // Si on a des éléments qui nécessitent une vérification humaine
    if (depassementDetecte) {
        resultat.statut = "⚠️ À VÉRIFIER (MANUEL)";
    }

    return resultat;
}