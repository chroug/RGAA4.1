export default function extraireLiensDOM() {
    // 1. On cible les vrais liens (avec href) et les éléments avec role="link"
    const liensBruts = Array.from(document.querySelectorAll('a[href], [role="link"]'));

    const liensAnalyse = liensBruts.map(lien => {
        
        // Est-ce qu'il y a une image à l'intérieur avec un attribut 'alt' non vide ?
        const images = Array.from(lien.querySelectorAll('img, [role="img"]'));
        const hasValidImgAlt = images.some(img => {
            const alt = img.getAttribute('alt');
            return alt !== null && alt.trim() !== '';
        });

        // ⚠️ CORRECTION CRITIQUE ICI : On utilise textContent au lieu de innerText 
        // pour récupérer le texte même si le lien est caché dans un menu déroulant ou mobile.
        const texteInterne = lien.textContent ? lien.textContent.trim() : '';
        
        const ariaLabel = lien.getAttribute('aria-label') ? lien.getAttribute('aria-label').trim() : '';
        const ariaLabelledby = lien.getAttribute('aria-labelledby');
        const title = lien.getAttribute('title') ? lien.getAttribute('title').trim() : '';

        // Un lien est valide s'il possède au moins l'une de ces caractéristiques
        const aUnIntitule = texteInterne !== '' || ariaLabel !== '' || ariaLabelledby !== null || hasValidImgAlt || title !== '';

        // 🚀 AJOUT SAAS : Injection des données
        const donneesSaaS = window.RGAA_UTILS.extraireDonneesSaaS(lien);
        donneesSaaS.aUnIntitule = aUnIntitule;
        
        return donneesSaaS;
    });

    return { liens: liensAnalyse };
}