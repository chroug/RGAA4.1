export default function extraireCadresDOM() {
    // Le test 2.2.1 cible les cadres ayant un attribut title
    const frames = document.querySelectorAll('iframe[title], frame[title]');
    
    const cadresData = Array.from(frames).map(frame => {
        // On récupère un peu de contexte texte parent pour aider l'IA
        const parentContext = frame.parentElement ? frame.parentElement.innerText.substring(0, 100) : '';
        
        // 🚀 AJOUT SAAS : Injection des données
        const donneesSaaS = window.RGAA_UTILS.extraireDonneesSaaS(frame);
        
        donneesSaaS.tag = frame.tagName.toLowerCase();
        donneesSaaS.title = frame.getAttribute('title').trim();
        donneesSaaS.src = frame.getAttribute('src') || '';
        donneesSaaS.parentContext = parentContext.trim();
        
        return donneesSaaS;
    });

    return cadresData;
}