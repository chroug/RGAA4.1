export default function extraireNavigationDOM() {
    const resultats = {
        data12_6: {
            zones_trouvees: [],
            zones_manquantes: []
        },
        data12_7: {
            liensTrouves: false,
            donneesLiens: []
        }
    };

    // ==========================================
    // 🧭 CRITÈRE 12.6 : Zones de regroupement
    // ==========================================
    const landmarks = [
        { nom: "En-tête (Header)", selecteurs: 'header:not(header header), [role="banner"]' },
        { nom: "Navigation (Nav)", selecteurs: 'nav:not(header nav), [role="navigation"]' },
        { nom: "Contenu principal (Main)", selecteurs: 'main, [role="main"]' },
        { nom: "Moteur de recherche (Search)", selecteurs: 'search, [role="search"]' },
        { nom: "Pied de page (Footer)", selecteurs: 'footer:not(footer footer), [role="contentinfo"]' }
    ];

    landmarks.forEach(lm => {
        const element = document.querySelector(lm.selecteurs);
        if (element) {
            // 🚀 AJOUT SAAS : Injection des données
            const donneesSaaS = window.RGAA_UTILS.extraireDonneesSaaS(element);
            donneesSaaS.nom = lm.nom;
            resultats.data12_6.zones_trouvees.push(donneesSaaS);
        } else {
            resultats.data12_6.zones_manquantes.push(lm.nom);
        }
    });

    // ==========================================
    // 🔗 CRITÈRE 12.7 : Liens d'évitement
    // ==========================================
    const liens = Array.from(document.querySelectorAll('a[href^="#"]:not([href="#"])')).slice(0, 2);
    
    if (liens.length > 0) {
        resultats.data12_7.liensTrouves = true;
        resultats.data12_7.donneesLiens = liens.map(a => {
            const href = a.getAttribute('href');
            let targetExists = false;
            try { targetExists = document.querySelector(href) !== null; } catch(e) {}
            
            const isDisplayNone = window.getComputedStyle(a).display === 'none';

            // 🚀 AJOUT SAAS : Injection des données
            const donneesSaaS = window.RGAA_UTILS.extraireDonneesSaaS(a);
            donneesSaaS.cible_existe = targetExists;
            donneesSaaS.est_masque_display_none = isDisplayNone;
            
            return donneesSaaS;
        });
    }

    return resultats;
}