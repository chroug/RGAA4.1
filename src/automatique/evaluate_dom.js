// src/automatique/evaluate_dom.js

export default function extraireDonneesAutomatiques(axeTargets) {
    const map = {};

    // 1. On traduit les cibles Axe-core en objets SaaS parfaits !
    axeTargets.forEach(sel => {
        try {
            const el = document.querySelector(sel);
            if (el) {
                // 🔥 C'est ici qu'on utilise ton utilitaire !
                map[sel] = window.RGAA_UTILS.extraireDonneesSaaS(el);
            } else {
                map[sel] = { xpath: "N/A", selecteur_css: sel, bounding_box: null, html: "N/A" };
            }
        } catch (e) {
            map[sel] = { xpath: "Erreur", selecteur_css: sel, bounding_box: null, html: "N/A" };
        }
    });

    // 2. On utilise aussi l'utilitaire pour les Custom Errors !
    const getCustomElementData = (el) => {
        if (!el) return null;
        // On récupère le super objet SaaS
        const donneesSaaS = window.RGAA_UTILS.extraireDonneesSaaS(el);
        // On tronque le HTML pour rester cohérent avec ton ancien format custom
        donneesSaaS.html = el.outerHTML.substring(0, 100).replace(/\n/g, '') + '...';
        return donneesSaaS;
    };

    return {
        axeMap: map,
        customErrors: {
            hasValidDoctype: document.doctype !== null && document.doctype.name.toLowerCase() === 'html',
            balisesPresentation: Array.from(document.querySelectorAll('b, i, u, s')).map(getCustomElementData),
            balisesObsoletes: Array.from(document.querySelectorAll('font, center, marquee, blink, strike, tt, big')).map(getCustomElementData),
            fieldsetsInvalides: Array.from(document.querySelectorAll('fieldset')).filter(f => !f.querySelector('legend')).map(getCustomElementData),
            thSansScope: Array.from(document.querySelectorAll('th:not([scope]):not([id])')).map(getCustomElementData),
            citationsInvalides: Array.from(document.querySelectorAll('q[cite=""], blockquote[cite=""]')).map(getCustomElementData),
            selectsNonGroupes: Array.from(document.querySelectorAll('select')).filter(s => {
                const hasFakeCategory = Array.from(s.options).some(o => o.disabled && o.value === "");
                return !s.querySelector('optgroup') && (s.options.length >= 4 || hasFakeCategory);
            }).map(getCustomElementData)
        }
    };
}