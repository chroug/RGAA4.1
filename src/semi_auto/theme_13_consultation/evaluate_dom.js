export default function extraireContenusConsultation() {
    const resultats = {
        contenus13_5: [],
        contenus13_7: []
    };

    // --- LOGIQUE POUR 13.5 ET 13.6 ---
    const elementsTextuels = document.querySelectorAll('p, span, pre, code, li, a, label, button, abbr, tr');
    const regexCryptique = /([:;=8xX][\-o\*\']?[)\](\[dDpP/:\}\{@|\\])|(<3)|([¯╯ツ_°□︵┻━ʕᴥʔಠ益༼༽ຈل͜ʖ▀̿Ĺ̯◕ヮ╭∩╮ง͟͠><]{2,})|([/\\|_\-\.\^]{3,})/gi;

    elementsTextuels.forEach(el => {
        const texteBrut = el.innerText || "";
        if (texteBrut.trim().length > 0 && (texteBrut.match(regexCryptique) || el.tagName === 'PRE' || el.tagName === 'CODE')) {
            const aUnTitle = el.hasAttribute('title') || el.closest('[title]') !== null;
            
            if (resultats.contenus13_5) {
                // 🚀 APPEL À L'UTILITAIRE SAAS
                const donneesSaaS = window.RGAA_UTILS.extraireDonneesSaaS(el);
                
                donneesSaaS.texte = texteBrut.substring(0, 400);
                donneesSaaS.possede_title = aUnTitle;
                
                resultats.contenus13_5.push(donneesSaaS);
            }
        }
    });

    // --- LOGIQUE POUR 13.7 ---
    const elementsMultimedias = document.querySelectorAll('video, canvas, embed, object, img[src*=".gif"]');
    const tousLesElements = document.querySelectorAll('*');
    
    tousLesElements.forEach(el => {
        const style = window.getComputedStyle(el);
        const isAnimated = style.animationName && style.animationName !== 'none';
        const isMedia = Array.from(elementsMultimedias).includes(el);

        if (isAnimated || isMedia) {
            // 🚀 APPEL À L'UTILITAIRE SAAS
            const donneesSaaS = window.RGAA_UTILS.extraireDonneesSaaS(el);
            const surface = Math.round(donneesSaaS.bounding_box.width * donneesSaaS.bounding_box.height);
            
            if (surface > 0) {
                if (resultats.contenus13_7) {
                    donneesSaaS.tag = el.tagName.toLowerCase();
                    donneesSaaS.surface_pixels = surface;
                    donneesSaaS.type_animation = isMedia ? 'Multimédia' : 'CSS';
                    
                    resultats.contenus13_7.push(donneesSaaS);
                }
            }
        }
    });

    return resultats;
}