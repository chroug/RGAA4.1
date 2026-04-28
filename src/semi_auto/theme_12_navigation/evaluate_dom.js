export default function extraireNavigationDOM() {
    // On récupère les premiers liens d'ancre (souvent les liens d'évitement)
    const liens = Array.from(document.querySelectorAll('a[href^="#"]:not([href="#"])')).slice(0, 2);

    if (liens.length === 0) {
        return { liensTrouves: false, donneesLiens: [] };
    }

    const donneesLiens = liens.map(a => {
        const href = a.getAttribute('href');
        let targetExists = false;
        
        // Vérifie si l'ID ciblé par le lien existe vraiment dans le DOM
        try { targetExists = document.querySelector(href) !== null; } catch(e) {}
        
        // Vérifie si le lien est masqué de façon permanente (display: none)
        const isDisplayNone = window.getComputedStyle(a).display === 'none';

        return {
            html: a.outerHTML.substring(0, 150),
            cible_existe: targetExists,
            est_masque_display_none: isDisplayNone
        };
    });
        
    return { liensTrouves: true, donneesLiens };
}