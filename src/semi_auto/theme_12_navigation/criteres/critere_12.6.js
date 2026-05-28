export default async function testerCritere12_6(data12_6) {
    console.log(`\n ℹ️  [critere_12.6] Vérification algorithmique des zones de contenu (Landmarks)...`);

    let resultat = { 
        statut: "✅ CONFORME", 
        violations: [],
        conformites: [] // 👈 NOUVEAU : On stocke les réussites et leurs raisons
    };

    // 1. Enregistrement des éléments CONFORMES
    if (data12_6.zones_trouvees && data12_6.zones_trouvees.length > 0) {
        data12_6.zones_trouvees.forEach(zone => {
            const raisonConformite = `La zone '${zone.nom}' est correctement structurée grâce à une balise sémantique HTML5 (ex: <header>) ou un rôle ARIA valide.`;
            
            resultat.conformites.push({
                ...zone, // 👈 INJECTION DES DONNÉES SAAS (Sélecteur CSS, XPath, etc.)
                raison: `[12.6] ${raisonConformite}`
            });
            
            console.log(`       ✅ CONFORME : ${zone.nom} (${raisonConformite})`);
        });
    }

    // 2. Enregistrement des éléments MANQUANTS / NON CONFORMES
    if (data12_6.zones_manquantes && data12_6.zones_manquantes.length > 0) {
        resultat.statut = "❌ NON CONFORME"; 
        
        data12_6.zones_manquantes.forEach(nomZone => {
            let msgErreur = `La zone '${nomZone}' n'a pas pu être identifiée sémantiquement.`;
            let explication = `Aucune balise HTML5 (ex: <nav>) ni rôle ARIA détecté. (⚠️ Note: Si cette zone n'existe pas visuellement sur la page, vous pouvez ignorer cette erreur).`;
            
            // L'exception du <main> qui est obligatoire sur 99.9% des pages
            if (nomZone === "Contenu principal (Main)") {
                explication = `ERREUR CRITIQUE : Le marqueur de contenu principal (<main> ou role="main") est manquant. C'est obligatoire pour permettre aux lecteurs d'écran d'éviter les en-têtes.`;
            }

            resultat.violations.push({
                html: "N/A",
                selecteur_css: "N/A",
                xpath: "N/A",
                bounding_box: null,
                zone: nomZone, // On précise quelle zone pose problème
                raison: `[12.6] ${msgErreur} ${explication}`
            });
            
            console.log(`       ❌ NON CONFORME : ${nomZone} (${explication})`);
        });
    }

    // 3. Bilan final
    if (resultat.violations.length === 0) {
        console.log(`       🏆 BILAN 12.6 : 100% des zones majeures sont correctement structurées dans le code.`);
    }

    return resultat;
}