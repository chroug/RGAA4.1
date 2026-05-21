export default function extraireContenusConsultation() {
    // 1. Initialisation SÉCURISÉE de l'objet de retour
    const resultats = {
        contenus13_5: [], // On utilisera ce même tableau pour le 13.5 et le 13.6 !
        contenus13_7: []
    };

    // --- LOGIQUE POUR 13.5 ET 13.6 ---
// On retire 'div' pour éviter d'aspirer toute la page, on ajoute 'td' et 'th' pour les tableaux
const elementsTextuels = document.querySelectorAll('p, span, pre, code, li, a, label, button, abbr, tr');
// Regex enrichie pour attraper beaucoup plus d'Art ASCII (Lenny face, ours, visages en colère...)
const regexCryptique = /([:;=8xX][\-o\*\']?[)\](\[dDpP/:\}\{@|\\])|(<3)|([¯╯ツ_°□︵┻━ʕᴥʔಠ益༼༽ຈل͜ʖ▀̿Ĺ̯◕ヮ╭∩╮ง͟͠><]{2,})|([/\\|_\-\.\^]{3,})/gi;

elementsTextuels.forEach(el => {
    const texteBrut = el.innerText || "";
    // On vérifie que le texte n'est pas vide pour éviter les faux positifs
    if (texteBrut.trim().length > 0 && (texteBrut.match(regexCryptique) || el.tagName === 'PRE' || el.tagName === 'CODE')) {
        const aUnTitle = el.hasAttribute('title') || el.closest('[title]') !== null;
        
        if (resultats.contenus13_5) {
            resultats.contenus13_5.push({
                texte: texteBrut.substring(0, 400),
                // On passe de 150 à 300 caractères pour ne pas couper le HTML trop tôt
                html: (el.outerHTML || "").substring(0, 300) + '...', 
                possede_title: aUnTitle
            });
        }
    }
});

    // --- LOGIQUE POUR 13.7 ---
    const elementsMultimedias = document.querySelectorAll('video, canvas, embed, object, img[src*=".gif"]');
    const tousLesElements = document.querySelectorAll('*');
    
    tousLesElements.forEach(el => {
        const style = window.getComputedStyle(el);
        // On vérifie si l'élément est multimédia OU animé
        const isAnimated = style.animationName && style.animationName !== 'none';
        const isMedia = Array.from(elementsMultimedias).includes(el);

        if (isAnimated || isMedia) {
            const rect = el.getBoundingClientRect();
            const surface = Math.round(rect.width * rect.height);
            
            if (surface > 0) {
                // Sécurité : Vérifie que le tableau existe avant de pusher
                if (resultats.contenus13_7) {
                    resultats.contenus13_7.push({
                        tag: el.tagName.toLowerCase(),
                        html: (el.outerHTML || "").substring(0, 150) + '...',
                        surface_pixels: surface,
                        type_animation: isMedia ? 'Multimédia' : 'CSS'
                    });
                }
            }
        }
    });

    return resultats;
}