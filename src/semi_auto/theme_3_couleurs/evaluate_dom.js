export default function extraireComposantsUI() {
    const elements = document.querySelectorAll('button, input, select, textarea, svg, [role="button"], [role="checkbox"], [role="switch"]');
    
    let elementsAEnvoyer = [];
    let index = 0;

    elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        
        // 1. Ignorer l'invisible et les Honeypots
        if (rect.width === 0 || rect.height === 0) return; 
        if (rect.left < -1000 || rect.top < -1000) return;
        
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;

        // 🛡️ 2. LE BOUCLIER DES EXCEPTIONS RGAA
        let motifExemption = null;

        // Exception A : Composant désactivé
        if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') {
            motifExemption = "Composant désactivé (Exclusion RGAA)";
        }
        // Exception B : Élément purement décoratif
        else if (el.getAttribute('aria-hidden') === 'true') {
            motifExemption = "Élément décoratif caché aux lecteurs d'écran (Exclusion RGAA)";
        }
        // Exception C : Logo ou Marque (on cherche dans les attributs, classes ou id)
        // Exception C : Logo ou Marque (on cherche dans les attributs, classes ou id)
        else {
            // Sécurité absolue : on force tout en texte (String) et on gère les null
            const ariaLabel = el.getAttribute('aria-label') || '';
            const alt = el.getAttribute('alt') || '';
            const cssClass = el.getAttribute('class') || ''; // getAttribute('class') gère très bien les SVG
            const id = el.id || '';
            
            // On concatène tout et on passe en minuscules
            const texteDescriptif = `${ariaLabel} ${alt} ${cssClass} ${id}`.toLowerCase();
            
            if (texteDescriptif.includes('logo') || texteDescriptif.includes('marque')) {
                motifExemption = "Logo ou logotype (Exclusion RGAA)";
            }
        }
        const uniqueId = `audit-33-${index++}`;
        el.setAttribute('data-audit-id', uniqueId);

        elementsAEnvoyer.push({
            auditId: uniqueId,  
            html: el.outerHTML,
            exemption: motifExemption // On envoie l'info au script Node !
        });
    });

    return elementsAEnvoyer;
}