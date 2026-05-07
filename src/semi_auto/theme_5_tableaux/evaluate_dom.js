// theme_5_tableaux/evaluate_dom.js

export default function extraireTableauxDOM() {
    // 1. CIBLAGE EXHAUSTIF : Balises <table> ET rôles ARIA table/grid (RGAA 5.1.1)
    // On exclut strictement les tableaux de présentation
    // On exclut les tableaux de présentation ET les tableaux cachés !
const tableauxBruts = Array.from(document.querySelectorAll('table:not([role="presentation"]):not([aria-hidden="true"]), [role="table"]:not([aria-hidden="true"]), [role="grid"]:not([aria-hidden="true"])'))
    .filter(table => {
        // On filtre aussi ceux qui sont cachés en CSS
        const style = window.getComputedStyle(table);
        return style.display !== 'none' && style.visibility !== 'hidden';
    });

    const tableaux = tableauxBruts.map(table => {
        
        // ==========================================
        // 🧠 DÉTECTION DE COMPLEXITÉ (Blindée)
        // ==========================================
        
        // A. Fusions HTML classiques ou ARIA
        const aDesFusions = table.querySelectorAll('th[colspan], th[rowspan], td[colspan], td[rowspan], [aria-colspan], [aria-rowspan]').length > 0;
        
        // B. En-têtes sur plusieurs lignes (HTML ou ARIA)
        const plusieursLignesHeader = table.querySelectorAll('thead tr, [role="rowgroup"]:first-child [role="row"]').length > 1;
        
        // C. Utilisation de la technique id/headers (implique souvent une complexité)
        const utiliseHeadersID = table.querySelectorAll('[headers]').length > 0;

        // D. En-têtes (th ou role="columnheader"/"rowheader") situés en dehors de la première ligne ou première colonne
        const enTetesInternes = Array.from(table.querySelectorAll('tbody tr:not(:first-child) th, [role="rowgroup"]:not(:first-child) [role="rowheader"]')).length > 0;

        const estComplexe = aDesFusions || plusieursLignesHeader || utiliseHeadersID || enTetesInternes;


        // ==========================================
        // 🔎 RECHERCHE DU RÉSUMÉ (100% des méthodes)
        // ==========================================
        let texteResume = "";
        
        // Méthode 1 : Balise <caption> classique (seulement pour les <table>)
        if (table.tagName === 'TABLE') {
            const caption = table.querySelector('caption');
            // On gère le cas où le résumé est caché dans un <details> dans le caption (Note technique RGAA)
            if (caption) {
                texteResume += caption.textContent.trim() + " ";
            }
        }
        
        // Méthode 2 : Attribut summary (anciennes versions HTML)
        const summary = table.getAttribute('summary');
        if (summary && summary.trim()) texteResume += summary.trim() + " ";
        
        // Méthode 3 : aria-describedby (Peut contenir PLUSIEURS IDs séparés par des espaces)
        const ariaDescribedby = table.getAttribute('aria-describedby');
        if (ariaDescribedby) {
            const ids = ariaDescribedby.split(' ');
            ids.forEach(id => {
                const descElement = document.getElementById(id.trim());
                if (descElement && descElement.textContent.trim()) {
                    texteResume += descElement.textContent.trim() + " ";
                }
            });
        }

        // ==========================================
        // 🔗 ANALYSE DES EN-TÊTES (Pour le critère 5.7)
        // ==========================================
        const headers = Array.from(table.querySelectorAll('th, [role="rowheader"], [role="columnheader"]')).map(th => ({
            html: th.outerHTML,
            aUnScope: th.hasAttribute('scope'),
            aUnId: th.hasAttribute('id'),
            valeurScope: th.getAttribute('scope') || null
        }));

       // ==========================================
        // 🏷️ RECHERCHE DU TITRE (Pour les critères 5.4 et 5.5)
        // ==========================================
        let aUnTitreTechnique = false;
        let texteTitre = "";
        
        // Ordre de priorité sémantique : 1. aria-labelledby, 2. aria-label, 3. caption, 4. title
        
        // Méthode 1 : aria-labelledby
        if (table.hasAttribute('aria-labelledby')) {
            const validIds = table.getAttribute('aria-labelledby').split(' ').filter(id => document.getElementById(id.trim()));
            if (validIds.length > 0) {
                aUnTitreTechnique = true;
                texteTitre = validIds.map(id => document.getElementById(id.trim()).textContent.trim()).join(' ');
            }
        }
        // Méthode 2 : aria-label
        else if (table.hasAttribute('aria-label') && table.getAttribute('aria-label').trim() !== '') {
            aUnTitreTechnique = true;
            texteTitre = table.getAttribute('aria-label').trim();
        }
        // Méthode 3 : caption
        else if (table.tagName === 'TABLE' && table.querySelector('caption')) {
            aUnTitreTechnique = true;
            texteTitre = table.querySelector('caption').textContent.trim();
        }
        // Méthode 4 : title
        else if (table.hasAttribute('title') && table.getAttribute('title').trim() !== '') {
            aUnTitreTechnique = true;
            texteTitre = table.getAttribute('title').trim();
        }

        // On capture le texte juste avant le tableau (au cas où ce serait un "faux" titre visuel pour l'IA)
        let texteAvant = "";
        if (table.previousElementSibling) {
            texteAvant = table.previousElementSibling.innerText || table.previousElementSibling.textContent || "";
            texteAvant = texteAvant.trim().substring(0, 150);
        }

        return {
            htmlComplet: table.outerHTML,
            estComplexe: estComplexe,
            aUnResume: texteResume.trim().length > 0,
            texteResume: texteResume.trim().replace(/\s+/g, ' '),
            headers: headers,
            aUnTitreTechnique: aUnTitreTechnique,
            texteAvant: texteAvant,
            texteTitre: texteTitre // 👈 AJOUT POUR LE 5.5
        };
    });

    return { tableaux };
}