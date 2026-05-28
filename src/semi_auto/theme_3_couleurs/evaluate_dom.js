export default function extraireComposantsUI() {
    const elements = document.querySelectorAll('button, input, select, textarea, svg, [role="button"], [role="checkbox"], [role="switch"]');
    
    let elementsAEnvoyer = [];
    let index = 0;

    elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        
        if (rect.width === 0 || rect.height === 0) return; 
        if (rect.left < -1000 || rect.top < -1000) return;
        
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;

        let motifExemption = null;

        if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') {
            motifExemption = "Composant désactivé (Exclusion RGAA)";
        }
        else if (el.getAttribute('aria-hidden') === 'true') {
            motifExemption = "Élément décoratif caché aux lecteurs d'écran (Exclusion RGAA)";
        }
        else {
            const ariaLabel = el.getAttribute('aria-label') || '';
            const alt = el.getAttribute('alt') || '';
            const cssClass = el.getAttribute('class') || ''; 
            const id = el.id || '';
            
            const texteDescriptif = `${ariaLabel} ${alt} ${cssClass} ${id}`.toLowerCase();
            
            if (texteDescriptif.includes('logo') || texteDescriptif.includes('marque')) {
                motifExemption = "Logo ou logotype (Exclusion RGAA)";
            }
        }
        
        const uniqueId = `audit-33-${index++}`;
        el.setAttribute('data-audit-id', uniqueId);

        // 🚀 AJOUT SAAS : Injection des données
        const donneesSaaS = window.RGAA_UTILS.extraireDonneesSaaS(el);
        donneesSaaS.auditId = uniqueId;
        donneesSaaS.exemption = motifExemption;

        elementsAEnvoyer.push(donneesSaaS);
    });

    return elementsAEnvoyer;
}