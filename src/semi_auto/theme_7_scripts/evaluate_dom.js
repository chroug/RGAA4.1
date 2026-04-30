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
        // 🔥 CORRECTION : On ne coupe plus le HTML !
        .map(el => el.outerHTML);

    // 3. On enlève les doublons
    const messagesStatut = [...new Set(elementsBruts)];

    return { messagesStatut };
}