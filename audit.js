import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { franc } from 'franc';

const AXE_TO_RGAA_MAP = {
    'frame-title': '2.1',
    'color-contrast': '3.2',
    'td-headers-attr': '5.6',
    'th-has-data-cells': '5.6',
    'html-has-lang': '8.3',
    'html-lang-valid': '8.3',
    'document-title': '8.5',
    'empty-heading': '8.9',
    'presentation-role-conflict': '8.9',
    'list': '9.3',
    'listitem': '9.3',
    'dlitem': '9.3',
    'aria-hidden-focus': '10.8',
    'aria-hidden-body': '10.8',
    'label': '11.1',
    'label-title-only': '11.1',
    'button-name': '11.9',
    'input-button-name': '11.9'
};

const CRITERES_PARTIE_1 =['2.1', '3.2', '5.6', '8.1', '8.3', '8.5', '8.9', '9.3', '9.4', '10.1', '10.8', '11.1', '11.6', '11.8', '11.9'];

function isLanguageMatching(htmlLang, francLangCode) {
    const langMap = { 'fr': 'fra', 'en': 'eng', 'es': 'spa', 'de': 'deu', 'it': 'ita' };
    const baseHtmlLang = htmlLang.split('-')[0].toLowerCase();
    return langMap[baseHtmlLang] === francLangCode;
}

async function runAudit(url) {
    if (!url) {
        console.error("❌ Erreur : Veuillez fournir une URL.");
        process.exit(1);
    }

    console.error(`\n🚀 Lancement de l'audit RGAA sur : ${url}\n`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        await page.goto(url, { waitUntil: 'networkidle' });

        // ====================================================================
        // ÉTAPE 1 : Exécution d'Axe-core
        // ====================================================================
        const axeResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze();

        const resultats_automatiques = {};
        CRITERES_PARTIE_1.forEach(critere => {
            resultats_automatiques[`critere_${critere}`] = {
                statut: "✅ Conforme / Aucune erreur détectée",
                violations:[]
            };
        });

        // ====================================================================
        // ÉTAPE 2 : Générateurs Locators Absolus (XPath Positionnel & CSS)
        // ====================================================================
        
        const axeTargets =[];
        axeResults.violations.forEach(v => v.nodes.forEach(n => axeTargets.push(n.target[0])));

        const locatorsMap = await page.evaluate((targets) => {
            
            function getAbsoluteXPath(el) {
                let path =[];
                let current = el;
                while (current && current.nodeType === Node.ELEMENT_NODE) {
                    let tag = current.tagName.toLowerCase();
                    if (tag === 'html') { path.unshift('html'); break; }
                    let index = 1;
                    let sibling = current.previousElementSibling;
                    while (sibling) {
                        if (sibling.tagName.toLowerCase() === tag) index++;
                        sibling = sibling.previousElementSibling;
                    }
                    path.unshift(`${tag}[${index}]`);
                    current = current.parentNode;
                }
                return '/' + path.join('/');
            }

            function getAbsoluteCSS(el) {
                let path =[];
                let current = el;
                while (current && current.nodeType === Node.ELEMENT_NODE) {
                    let tag = current.tagName.toLowerCase();
                    if (current.id && !/^[0-9]/.test(current.id)) { path.unshift(`#${current.id}`); break; }
                    if (tag === 'html') { path.unshift('html'); break; }
                    let index = 1;
                    let sibling = current.previousElementSibling;
                    while (sibling) {
                        if (sibling.tagName.toLowerCase() === tag) index++;
                        sibling = sibling.previousElementSibling;
                    }
                    path.unshift(`${tag}:nth-of-type(${index})`);
                    current = current.parentNode;
                }
                return path.join(' > ');
            }

            const map = {};
            targets.forEach(sel => {
                try {
                    const el = document.querySelector(sel);
                    if (el) map[sel] = { xpath: getAbsoluteXPath(el), css: getAbsoluteCSS(el) };
                    else map[sel] = { xpath: "N/A", css: sel };
                } catch(e) { map[sel] = { xpath: "Erreur", css: sel }; }
            });

            const getCustomElementData = (el) => ({
                html: el.outerHTML.substring(0, 100).replace(/\n/g, '') + '...',
                locators: { xpath: getAbsoluteXPath(el), css: getAbsoluteCSS(el) }
            });

            // --- NOUVELLES VÉRIFICATIONS CUSTOM POUR 5.6, 9.4 et 11.8 --- //
            const hasValidDoctype = document.doctype !== null && document.doctype.name.toLowerCase() === 'html';
            const balisesPresentation = Array.from(document.querySelectorAll('b, i, u, s')).map(getCustomElementData);
            const balisesObsoletes = Array.from(document.querySelectorAll('font, center, marquee, blink, strike, tt, big')).map(getCustomElementData);
            const fieldsetsInvalides = Array.from(document.querySelectorAll('fieldset')).filter(f => !f.querySelector('legend')).map(getCustomElementData);
            
            // 5.6 : Tableaux sans attribut Scope sur les <th>
            const thSansScope = Array.from(document.querySelectorAll('th:not([scope]):not([id])')).map(getCustomElementData);

            // 9.4 : Citations avec attribut "cite" vide
            const citationsInvalides = Array.from(document.querySelectorAll('q[cite=""], blockquote[cite=""]')).map(getCustomElementData);

            // 11.8 : Select sans Optgroup (On détecte si on utilise des fausses catégories avec "disabled" ou >= 4 options)
            const selectsNonGroupes = Array.from(document.querySelectorAll('select')).filter(s => {
                const hasFakeCategory = Array.from(s.options).some(o => o.disabled && o.value === "");
                return !s.querySelector('optgroup') && (s.options.length >= 4 || hasFakeCategory);
            }).map(getCustomElementData);

            return {
                axeMap: map,
                customErrors: { 
                    hasValidDoctype, balisesPresentation, balisesObsoletes, 
                    fieldsetsInvalides, thSansScope, citationsInvalides, selectsNonGroupes 
                }
            };

        }, axeTargets);

        // ====================================================================
        // ÉTAPE 3 & 4 : Injection des erreurs dans le JSON
        // ====================================================================
        
        axeResults.violations.forEach(violation => {
            const critereRGAA = AXE_TO_RGAA_MAP[violation.id];
            if (critereRGAA && resultats_automatiques[`critere_${critereRGAA}`]) {
                resultats_automatiques[`critere_${critereRGAA}`].statut = "❌ Non conforme (Violations Axe-core)";
                resultats_automatiques[`critere_${critereRGAA}`].violations.push({
                    regle: violation.id,
                    description: violation.help,
                    elements_fautifs: violation.nodes.map(node => {
                        const axeTarget = node.target[0];
                        return { code_html: node.html.replace(/\n/g, ''), copier_coller_inspecteur: locatorsMap.axeMap[axeTarget] };
                    })
                });
            }
        });

        const custom = locatorsMap.customErrors;

        if (!custom.hasValidDoctype) {
            resultats_automatiques['critere_8.1'].statut = "❌ Non conforme (Vérification Custom)";
            resultats_automatiques['critere_8.1'].violations.push({ regle: "custom-doctype", description: "Le DOCTYPE est absent ou invalide", elements_fautifs:[] });
        }

        const addCustomErrors = (critere, regle, desc, elements) => {
            if (elements.length > 0) {
                resultats_automatiques[`critere_${critere}`].statut = "❌ Non conforme (Vérification Custom)";
                resultats_automatiques[`critere_${critere}`].violations.push({
                    regle: regle, description: desc,
                    elements_fautifs: elements.map(e => ({ code_html: e.html, copier_coller_inspecteur: e.locators }))
                });
            }
        };

        // On injecte nos règles Custom !
        addCustomErrors('5.6', "custom-th-scope", "Balise <th> utilisée sans attribut 'scope' (col/row) ou id.", custom.thSansScope);
        addCustomErrors('8.9', "custom-presentation", "Utilisation de balises de présentation pure (b, i, u, s).", custom.balisesPresentation);
        addCustomErrors('9.4', "custom-citation", "Attribut 'cite' présent mais vide sur une balise de citation (q, blockquote).", custom.citationsInvalides);
        addCustomErrors('10.1', "custom-obsolete", "Utilisation de balises HTML obsolètes (font, center, marquee...).", custom.balisesObsoletes);
        addCustomErrors('11.6', "custom-fieldset", "Balise <fieldset> utilisée sans balise <legend>.", custom.fieldsetsInvalides);
        addCustomErrors('11.8', "custom-select", "Balise <select> longue ou contenant de fausses catégories sans <optgroup>.", custom.selectsNonGroupes);

        const rapportFinal = {
            url_auditee: url,
            date_audit: new Date().toISOString(),
            resultats_automatiques: resultats_automatiques
        };

        console.log(JSON.stringify(rapportFinal, null, 2));

    } catch (error) {
        console.error("❌ Une erreur est survenue :", error);
    } finally {
        await browser.close();
    }
}

const targetUrl = process.argv[2];
runAudit(targetUrl);