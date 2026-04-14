import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { franc } from 'franc';

/**
 * Mapping étendu entre les règles Axe-core et les critères RGAA demandés (PARTIE 1)
 */
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

const CRITERES_PARTIE_1 = ['2.1', '3.2', '5.6', '8.1', '8.3', '8.5', '8.9', '9.3', '9.4', '10.1', '10.8', '11.1', '11.6', '11.8', '11.9'];

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
                violations: []
            };
        });

        // Mapping des erreurs Axe-core avec SÉLECTEUR CSS
        axeResults.violations.forEach(violation => {
            const critereRGAA = AXE_TO_RGAA_MAP[violation.id];
            if (critereRGAA && resultats_automatiques[`critere_${critereRGAA}`]) {
                resultats_automatiques[`critere_${critereRGAA}`].statut = "❌ Non conforme (Violations Axe-core)";
                resultats_automatiques[`critere_${critereRGAA}`].violations.push({
                    regle: violation.id,
                    description: violation.help,
                    elements_fautifs: violation.nodes.map(node => ({
                        code_html: node.html,
                        selecteur_css: node.target.join(', ')
                    }))
                });
            }
        });

        // ====================================================================
        // ÉTAPE 2 : Moteur Custom Playwright (pour pallier les manques d'Axe)
        // ====================================================================

        const domContext = await page.evaluate(() => {
            
            // Fonction utilitaire pour générer un sélecteur CSS basique
            const getCssSelector = (el) => {
                if (el.id) return `#${el.id}`;
                if (el.className) return `${el.tagName.toLowerCase()}.${el.className.split(' ').join('.')}`;
                return el.tagName.toLowerCase();
            };

            // --- VÉRIFICATIONS CUSTOM POUR FORCER LES ERREURS --- //

            // 5.6 : Tableaux sans attributs scope sur les th (Axe l'ignore sur les petits tableaux)
            const tableauxSansScope = Array.from(document.querySelectorAll('th:not([scope]):not([id])')).map(el => ({
                html: el.outerHTML.substring(0, 80) + '...',
                selector: getCssSelector(el)
            }));

            // 8.1 : DOCTYPE manquant ou invalide
            const hasValidDoctype = document.doctype !== null && document.doctype.name.toLowerCase() === 'html';
            
            // 8.9 : Balises de présentation utilisées dans le HTML (b, i, u, s)
            const balisesPresentation = Array.from(document.querySelectorAll('b, i, u, s')).map(el => ({
                html: el.outerHTML.substring(0, 80) + '...',
                selector: getCssSelector(el)
            }));

            // 9.4 : Citations suspectes (ex: blockquote utilisé pour indenter, ou <q> avec cite vide)
            const citationsInvalides = Array.from(document.querySelectorAll('q[cite=""], blockquote:not([cite])')).map(el => ({
                html: el.outerHTML.substring(0, 80) + '...',
                selector: getCssSelector(el)
            }));

            // 10.1 : Balises obsolètes (font, center, blink, marquee, etc.)
            const balisesObsoletes = Array.from(document.querySelectorAll('font, center, marquee, blink, strike, tt, big')).map(el => ({
                html: el.outerHTML.substring(0, 80) + '...',
                selector: getCssSelector(el)
            }));

            // 11.6 : Fieldset sans Legend
            const fieldsetsInvalides = Array.from(document.querySelectorAll('fieldset')).filter(f => !f.querySelector('legend')).map(el => ({
                html: el.outerHTML.substring(0, 80) + '...',
                selector: getCssSelector(el)
            }));

            // 11.8 : Select utilisant <option disabled> comme fausse catégorie au lieu de <optgroup>
            const selectsFauxOptgroup = Array.from(document.querySelectorAll('select')).filter(s => {
                const hasDisabledOptions = s.querySelector('option[disabled]');
                const hasOptgroup = s.querySelector('optgroup');
                return hasDisabledOptions && !hasOptgroup;
            }).map(el => ({
                html: el.outerHTML.substring(0, 80) + '...',
                selector: getCssSelector(el)
            }));

            // --- EXTRACTION DU CONTEXTE (FAUX AUTOMATIQUES) --- //
            
            const images = Array.from(document.querySelectorAll('img')).map(img => ({
                src: img.src,
                alt: img.hasAttribute('alt') ? img.getAttribute('alt') : null,
                ariaLabel: img.getAttribute('aria-label')
            }));

            const tableaux = Array.from(document.querySelectorAll('table')).map(table => ({
                hasTh: table.querySelectorAll('th').length > 0,
                hasCaption: table.querySelectorAll('caption').length > 0,
                textPreview: table.innerText.substring(0, 50).replace(/\s+/g, ' ').trim()
            }));

            const htmlLang = document.documentElement.getAttribute('lang') || 'none';
            const bodyText = document.body.innerText;

            return { 
                images, tableaux, htmlLang, bodyText,
                erreursCustom: {
                    tableauxScope: tableauxSansScope,
                    doctypeInvalide: !hasValidDoctype,
                    presentation: balisesPresentation,
                    citations: citationsInvalides,
                    obsoletes: balisesObsoletes,
                    fieldsets: fieldsetsInvalides,
                    selects: selectsFauxOptgroup
                }
            };
        });

        // ====================================================================
        // ÉTAPE 3 : Injection des erreurs Custom dans les résultats
        // ====================================================================

        const { erreursCustom } = domContext;

        // Injection 5.6 (Tableaux)
        if (erreursCustom.tableauxScope.length > 0) {
            resultats_automatiques['critere_5.6'].statut = "❌ Non conforme (Vérification Custom)";
            resultats_automatiques['critere_5.6'].violations.push({
                regle: "custom-th-scope", description: "Cellule d'en-tête <th> sans attribut scope (ni id)",
                elements_fautifs: erreursCustom.tableauxScope.map(e => ({ code_html: e.html, selecteur_css: e.selector }))
            });
        }

        // Injection 8.1 (DOCTYPE)
        if (erreursCustom.doctypeInvalide) {
            resultats_automatiques['critere_8.1'].statut = "❌ Non conforme (Vérification Custom)";
            resultats_automatiques['critere_8.1'].violations.push({
                regle: "custom-doctype", description: "Le DOCTYPE est absent ou invalide", elements_fautifs: []
            });
        }

        // Injection 8.9 (Présentation)
        if (erreursCustom.presentation.length > 0) {
            resultats_automatiques['critere_8.9'].statut = "❌ Non conforme (Vérification Custom)";
            resultats_automatiques['critere_8.9'].violations.push({
                regle: "custom-presentation-tags", description: "Utilisation de balises de présentation (b, i, u, s)",
                elements_fautifs: erreursCustom.presentation.map(e => ({ code_html: e.html, selecteur_css: e.selector }))
            });
        }

        // Injection 9.4 (Citations)
        if (erreursCustom.citations.length > 0) {
            resultats_automatiques['critere_9.4'].statut = "❌ Non conforme (Vérification Custom)";
            resultats_automatiques['critere_9.4'].violations.push({
                regle: "custom-invalid-citation", description: "Utilisation de <blockquote> sans source ou <q> avec cite vide",
                elements_fautifs: erreursCustom.citations.map(e => ({ code_html: e.html, selecteur_css: e.selector }))
            });
        }

        // Injection 10.1 (Obsolètes)
        if (erreursCustom.obsoletes.length > 0) {
            resultats_automatiques['critere_10.1'].statut = "❌ Non conforme (Vérification Custom)";
            resultats_automatiques['critere_10.1'].violations.push({
                regle: "custom-deprecated-tags", description: "Présence de balises obsolètes (font, center, marquee...)",
                elements_fautifs: erreursCustom.obsoletes.map(e => ({ code_html: e.html, selecteur_css: e.selector }))
            });
        }

        // Injection 11.6 (Fieldset)
        if (erreursCustom.fieldsets.length > 0) {
            resultats_automatiques['critere_11.6'].statut = "❌ Non conforme (Vérification Custom)";
            resultats_automatiques['critere_11.6'].violations.push({
                regle: "custom-fieldset-legend", description: "Balise <fieldset> utilisée sans <legend>",
                elements_fautifs: erreursCustom.fieldsets.map(e => ({ code_html: e.html, selecteur_css: e.selector }))
            });
        }

        // Injection 11.8 (Select)
        if (erreursCustom.selects.length > 0) {
            resultats_automatiques['critere_11.8'].statut = "❌ Non conforme (Vérification Custom)";
            resultats_automatiques['critere_11.8'].violations.push({
                regle: "custom-select-fake-optgroup", description: "Balise <select> utilisant <option disabled> pour simuler des catégories sans <optgroup>",
                elements_fautifs: erreursCustom.selects.map(e => ({ code_html: e.html, selecteur_css: e.selector }))
            });
        }

        // Traitement de la langue avec franc
        const detectLangText = domContext.bodyText.substring(0, 2000);
        const detectedFrancLang = franc(detectLangText);

        // ====================================================================
        // AFFICHAGE FINAL
        // ====================================================================
        
        const rapportFinal = {
            url_auditee: url,
            date_audit: new Date().toISOString(),
            resultats_automatiques: resultats_automatiques,
            contexte_a_valider_manuellement: {
                criteres_images_1_1_et_1_2: domContext.images,
                criteres_tableaux_5_4_et_5_7: domContext.tableaux,
                critere_langue_8_4: {
                    langueDeclareeHTML: domContext.htmlLang,
                    langueDetecteeFranc: detectedFrancLang,
                    isMatch: isLanguageMatching(domContext.htmlLang, detectedFrancLang)
                }
            }
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