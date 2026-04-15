import AxeBuilder from '@axe-core/playwright';

const AXE_TO_RGAA_MAP = {
    'frame-title': '2.1', 'color-contrast': '3.2', 'td-headers-attr': '5.6', 'th-has-data-cells': '5.6',
    'html-has-lang': '8.3', 'html-lang-valid': '8.3', 'document-title': '8.5', 'empty-heading': '8.9',
    'presentation-role-conflict': '8.9', 'list': '9.3', 'listitem': '9.3', 'dlitem': '9.3',
    'aria-hidden-focus': '10.8', 'aria-hidden-body': '10.8', 'label': '11.1', 'label-title-only': '11.1',
    'button-name': '11.9', 'input-button-name': '11.9'
};

const CRITERES_AUTO =['2.1', '3.2', '5.6', '8.1', '8.3', '8.5', '8.9', '9.3', '9.4', '10.1', '10.8', '11.1', '11.6', '11.8', '11.9'];

export async function runAutomatique(page) {
    const axeResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

    const resultats = {};
    CRITERES_AUTO.forEach(c => { resultats[`critere_${c}`] = { statut: "✅ Conforme", violations: [] }; });

    const axeTargets =[];
    axeResults.violations.forEach(v => v.nodes.forEach(n => axeTargets.push(n.target[0])));

    const locatorsMap = await page.evaluate((targets) => {
        function getAbsoluteXPath(el) { /* Logique XPath... */
            let path =[]; let current = el;
            while (current && current.nodeType === Node.ELEMENT_NODE) {
                let tag = current.tagName.toLowerCase();
                if (tag === 'html') { path.unshift('html'); break; }
                let index = 1; let sibling = current.previousElementSibling;
                while (sibling) { if (sibling.tagName.toLowerCase() === tag) index++; sibling = sibling.previousElementSibling; }
                path.unshift(`${tag}[${index}]`); current = current.parentNode;
            }
            return '/' + path.join('/');
        }
        function getAbsoluteCSS(el) { /* Logique CSS... */
            let path =[]; let current = el;
            while (current && current.nodeType === Node.ELEMENT_NODE) {
                let tag = current.tagName.toLowerCase();
                if (current.id && !/^[0-9]/.test(current.id)) { path.unshift(`#${current.id}`); break; }
                if (tag === 'html') { path.unshift('html'); break; }
                let index = 1; let sibling = current.previousElementSibling;
                while (sibling) { if (sibling.tagName.toLowerCase() === tag) index++; sibling = sibling.previousElementSibling; }
                path.unshift(`${tag}:nth-of-type(${index})`); current = current.parentNode;
            }
            return path.join(' > ');
        }

        const map = {};
        targets.forEach(sel => {
            try {
                const el = document.querySelector(sel);
                if (el) map[sel] = { xpath: getAbsoluteXPath(el), css: getAbsoluteCSS(el) };
                else map[sel] = { xpath: "N/A", css: sel };
            } catch (e) { map[sel] = { xpath: "Erreur", css: sel }; }
        });

        const getCustomElementData = (el) => ({
            html: el.outerHTML.substring(0, 100).replace(/\n/g, '') + '...',
            locators: { xpath: getAbsoluteXPath(el), css: getAbsoluteCSS(el) }
        });

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
    }, axeTargets);

    axeResults.violations.forEach(violation => {
        const critereRGAA = AXE_TO_RGAA_MAP[violation.id];
        if (critereRGAA && resultats[`critere_${critereRGAA}`]) {
            resultats[`critere_${critereRGAA}`].statut = "❌ Non conforme (Axe-core)";
            resultats[`critere_${critereRGAA}`].violations.push({
                regle: violation.id, description: violation.help,
                elements_fautifs: violation.nodes.map(node => ({
                    code_html: node.html.replace(/\n/g, ''),
                    copier_coller_inspecteur: locatorsMap.axeMap[node.target[0]]
                }))
            });
        }
    });

    const addCustom = (critere, regle, desc, elements) => {
        if (elements.length > 0) {
            resultats[`critere_${critere}`].statut = "❌ Non conforme (Custom Playwright)";
            resultats[`critere_${critere}`].violations.push({
                regle, description: desc,
                elements_fautifs: elements.map(e => ({ code_html: e.html, copier_coller_inspecteur: e.locators }))
            });
        }
    };

    const custom = locatorsMap.customErrors;
    if (!custom.hasValidDoctype) {
        resultats['critere_8.1'].statut = "❌ Non conforme (Custom Playwright)";
        resultats['critere_8.1'].violations.push({ regle: "custom-doctype", description: "Le DOCTYPE est absent ou invalide", elements_fautifs:[] });
    }
    addCustom('5.6', "custom-th-scope", "Balise <th> sans 'scope' ou 'id'.", custom.thSansScope);
    addCustom('8.9', "custom-presentation", "Utilisation de balises de présentation (b, i, u, s).", custom.balisesPresentation);
    addCustom('9.4', "custom-citation", "Attribut 'cite' présent mais vide.", custom.citationsInvalides);
    addCustom('10.1', "custom-obsolete", "Balises obsolètes (font, center...).", custom.balisesObsoletes);
    addCustom('11.6', "custom-fieldset", "Balise <fieldset> sans <legend>.", custom.fieldsetsInvalides);
    addCustom('11.8', "custom-select", "Balise <select> longue sans <optgroup>.", custom.selectsNonGroupes);

    return resultats;
}