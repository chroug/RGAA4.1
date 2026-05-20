export default function extraireContenusConsultation() {
    const resultats = {
        contenus13_5: []
    };

    // --- CRITÈRE 13.5 : Contenus cryptiques (Émoticônes & ASCII Art) ---
    // On extrait le texte des paragraphes et des balises préformatées
    const elementsTextuels = document.querySelectorAll('p, span, div, pre, code');
    
    // Regex pour détecter les émoticônes classiques (:-) ;-( ¯\_(ツ)_/¯ etc.)
    // et les suites de ponctuation anormales (art ASCII)
    const regexEmoticone = /[:;=8][\-o\*\']?[\)\]\(\[dDpP/\:\}\{@\|\\]|[\(\[]?[:;=8][\-o\*\']?[\)\]\(\[dDpP/\:\}\{@\|\\][\)\]]?|[¯\(][\_/\\ツ]+[\_/\\ツ][\)]?/g;
    
    elementsTextuels.forEach(el => {
        const texteBrut = el.innerText;
        const htmlBrut = el.outerHTML;

        // Si on détecte un émoticône OU si c'est une balise <pre> (souvent utilisée pour l'ASCII art)
        if ((texteBrut && texteBrut.match(regexEmoticone)) || el.tagName === 'PRE') {
            // On vérifie si l'élément ou un de ses enfants a un attribut 'title'
            const aUnTitle = el.hasAttribute('title') || el.querySelector('[title]') !== null;
            
            // On évite de tout envoyer à l'IA si c'est un texte gigantesque
            if (texteBrut.length < 500 || el.tagName === 'PRE') {
                resultats.contenus13_5.push({
                    texte: texteBrut.substring(0, 300), // Contexte pour l'IA
                    html: htmlBrut.substring(0, 150) + '...', // Pour le rapport
                    possede_title: aUnTitle
                });
            }
        }
    });

    return resultats;
}