export default function extraireTableauxDOM() {
    // 1. CIBLAGE EXHAUSTIF
    const tableauxBruts = Array.from(document.querySelectorAll('table:not([role="presentation"]):not([role="none"]):not([aria-hidden="true"]), [role="table"]:not([aria-hidden="true"]), [role="grid"]:not([aria-hidden="true"])'))
    .filter(table => {
        const style = window.getComputedStyle(table);
        if (style.display === 'none' || style.visibility === 'hidden') return false;

        const hasDataIndicators = table.querySelector('th, caption') || table.hasAttribute('summary');
        
        if (!hasDataIndicators && table.tagName === 'TABLE') return false;

        return true;
    });

    const tableaux = tableauxBruts.map(table => {
        
        // A. Fusions HTML classiques ou ARIA
        const aDesFusions = table.querySelectorAll('th[colspan], th[rowspan], td[colspan], td[rowspan], [aria-colspan], [aria-rowspan]').length > 0;
        // B. En-têtes sur plusieurs lignes
        const plusieursLignesHeader = table.querySelectorAll('thead tr, [role="rowgroup"]:first-child [role="row"]').length > 1;
        // C. Utilisation de la technique id/headers
        const utiliseHeadersID = table.querySelectorAll('[headers]').length > 0;
        // D. En-têtes situés à l'intérieur du tableau
        const enTetesInternes = Array.from(table.querySelectorAll('tbody tr th:not(:first-child), [role="rowgroup"]:not(:first-child) [role="rowheader"]:not(:first-child)')).length > 0;

        const estComplexe = aDesFusions || plusieursLignesHeader || utiliseHeadersID || enTetesInternes;

        // 🔎 RECHERCHE DU RÉSUMÉ
        let texteResume = "";
        
        if (table.tagName === 'TABLE') {
            const details = table.querySelector('caption details');
            if (details) texteResume += details.textContent.trim() + " ";
        }
        
        const summary = table.getAttribute('summary');
        if (summary && summary.trim()) texteResume += summary.trim() + " ";
        
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

        // 🔗 ANALYSE DES EN-TÊTES
        const headers = Array.from(table.querySelectorAll('th, [role="rowheader"], [role="columnheader"]')).map(th => {
            const headerData = window.RGAA_UTILS.extraireDonneesSaaS(th);
            headerData.aUnScope = th.hasAttribute('scope');
            headerData.aUnId = th.hasAttribute('id');
            headerData.valeurScope = th.getAttribute('scope') || null;
            return headerData;
        });

        // 🏷️ RECHERCHE DU TITRE
        let aUnTitreTechnique = false;
        let texteTitre = "";
        
        if (table.hasAttribute('aria-labelledby')) {
            const validIds = table.getAttribute('aria-labelledby').split(' ').filter(id => document.getElementById(id.trim()));
            if (validIds.length > 0) {
                aUnTitreTechnique = true;
                texteTitre = validIds.map(id => document.getElementById(id.trim()).textContent.trim()).join(' ');
            }
        }
        else if (table.hasAttribute('aria-label') && table.getAttribute('aria-label').trim() !== '') {
            aUnTitreTechnique = true;
            texteTitre = table.getAttribute('aria-label').trim();
        }
        else if (table.tagName === 'TABLE' && table.querySelector('caption')) {
            aUnTitreTechnique = true;
            texteTitre = table.querySelector('caption').textContent.trim();
        }
        else if (table.hasAttribute('title') && table.getAttribute('title').trim() !== '') {
            aUnTitreTechnique = true;
            texteTitre = table.getAttribute('title').trim();
        }

        let texteAvant = "";
        if (table.previousElementSibling) {
            texteAvant = table.previousElementSibling.innerText || table.previousElementSibling.textContent || "";
            texteAvant = texteAvant.trim().substring(0, 150);
        }

        // 🚀 AJOUT SAAS : Injection des données
        const donneesSaaS = window.RGAA_UTILS.extraireDonneesSaaS(table);
        donneesSaaS.htmlComplet = table.outerHTML;
        donneesSaaS.estComplexe = estComplexe;
        donneesSaaS.aUnResume = texteResume.trim().length > 0;
        donneesSaaS.texteResume = texteResume.trim().replace(/\s+/g, ' ');
        donneesSaaS.headers = headers;
        donneesSaaS.aUnTitreTechnique = aUnTitreTechnique;
        donneesSaaS.texteAvant = texteAvant;
        donneesSaaS.texteTitre = texteTitre;
        
        return donneesSaaS;
    });

    // 🎨 EXTRACTION DES TABLEAUX DE MISE EN FORME
    const tableauxLayoutBruts = Array.from(document.querySelectorAll('table')).filter(table => {
        const style = window.getComputedStyle(table);
        if (style.display === 'none' || style.visibility === 'hidden') return false;

        const role = table.getAttribute('role');
        const isExplicitLayout = role === 'presentation' || role === 'none';
        const hasDataIndicators = table.querySelector('th, caption') || table.hasAttribute('summary');
        
        return isExplicitLayout || !hasDataIndicators;
    });

    const tableauxMiseEnForme = tableauxLayoutBruts.map(table => {
        const role = table.getAttribute('role');
        const aRolePresentation = role === 'presentation' || role === 'none';

        const cellules = Array.from(table.querySelectorAll('td'));
        let texteLinearise = cellules.map(td => {
            let cloneTd = td.cloneNode(true);
            cloneTd.querySelectorAll('[aria-hidden="true"]').forEach(el => el.remove());
            let contenu = cloneTd.innerText || cloneTd.textContent || "";
            if (cloneTd.querySelector('input, select, textarea')) {
                contenu += " [champ de saisie]";
            }
            return contenu.trim();
        }).join(' ');
        
        texteLinearise = texteLinearise.replace(/\s+/g, ' ').trim();

        let erreurs58 = [];
        
        if (table.hasAttribute('summary') && table.getAttribute('summary').trim() !== '') erreurs58.push('attribut summary rempli');
        const elementsInterdits = table.querySelectorAll('caption, th, thead, tfoot');
        if (elementsInterdits.length > 0) {
            const tags = Array.from(new Set(Array.from(elementsInterdits).map(el => '<' + el.tagName.toLowerCase() + '>')));
            erreurs58.push('balises interdites (' + tags.join(', ') + ')');
        }
        if (table.querySelectorAll('[role="rowheader"], [role="columnheader"]').length > 0) erreurs58.push('rôles ARIA (rowheader/columnheader)');
        if (table.querySelectorAll('td[scope], td[headers], td[axis]').length > 0) erreurs58.push('attributs de cellules (scope/headers/axis)');

        // 🚀 AJOUT SAAS : Injection des données
        const donneesSaaS = window.RGAA_UTILS.extraireDonneesSaaS(table);
        donneesSaaS.htmlComplet = table.outerHTML;
        donneesSaaS.aRolePresentation = aRolePresentation;
        donneesSaaS.texteLinearise = texteLinearise;
        donneesSaaS.erreurs58 = erreurs58;

        return donneesSaaS;
    });

    return { tableaux, tableauxMiseEnForme };
}