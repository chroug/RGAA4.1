export default function extraireCadresDOM() {
    // Le test 2.2.1 cible les cadres ayant un attribut title
    const frames = document.querySelectorAll('iframe[title], frame[title]');
    
    const cadresData = Array.from(frames).map(frame => {
        // On récupère un peu de contexte texte parent pour aider l'IA
        const parentContext = frame.parentElement ? frame.parentElement.innerText.substring(0, 100) : '';
        
        return {
            tag: frame.tagName.toLowerCase(),
            title: frame.getAttribute('title').trim(),
            src: frame.getAttribute('src') || '',
            parentContext: parentContext.trim(),
            html: frame.outerHTML
        };
    });

    return cadresData;
}