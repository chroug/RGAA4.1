export default function extraireScriptsDOM() {
    // 1. Sélecteurs qui pourraient désigner un message de statut
    const statusSelectors = [
        '[role="alert"]', '[role="status"]', '[role="log"]', '[role="progressbar"]', '[aria-live]',
        '[id*="error" i]', '[id*="msg" i]', '[id*="toast" i]', '[id*="snackbar" i]', '[id*="success" i]',
        '[class*="alert" i]', '[class*="error" i]', '[class*="toast" i]', '[class*="msg" i]', '[class*="success" i]'
    ].join(', ');

    // 2. On extrait en évitant les champs de formulaire eux-mêmes
    const elementsBruts = Array.from(document.querySelectorAll(statusSelectors))
        .filter(el => !['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'FORM', 'BODY', 'MAIN'].includes(el.tagName))
        // 🔥 NOUVEAU FILTRE : On ignore les conteneurs vides ! On ne veut que les messages VISIBLES.
        .filter(el => el.innerText && el.innerText.trim().length > 2)
        // 🚀 AJOUT SAAS : Injection des données au lieu de ne renvoyer que le HTML
        .map(el => {
            const donneesSaaS = window.RGAA_UTILS.extraireDonneesSaaS(el);
            // On peut garder le outerHTML entier comme dans ton ancien code si besoin,
            // (L'utilitaire SaaS tronque le HTML à 300 caractères par défaut)
            donneesSaaS.html = el.outerHTML; 
            return donneesSaaS;
        });

    // 3. On enlève les doublons (Basé sur le HTML complet pour identifier les objets uniques)
    // On utilise un Map pour filtrer les objets identiques basés sur leur HTML
    const messagesUniques = Array.from(
        new Map(elementsBruts.map(item => [item.html, item])).values()
    );

    return { messagesStatut: messagesUniques };
}