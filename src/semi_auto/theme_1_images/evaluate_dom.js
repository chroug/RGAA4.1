// src/semi_auto/theme_1_images/evaluate_dom.js

/**
 * Script injecté dans le navigateur pour extraire tous les éléments graphiques.
 * Applique les règles de calcul du Nom Accessible et détecte les contextes RGAA.
 */
export default async function extractImagesForAI(page) {
    return await page.evaluate(() => {
        const elements = [];
        // On ratisse très large pour n'oublier aucun élément graphique HTML5
        const selectors = 'img, svg, canvas, object, embed, area, input[type="image"], [role="img"]';
        const nodes = document.querySelectorAll(selectors);

        /**
         * RÈGLE 3 & 4 : Calcule le Nom Accessible (Priorité ARIA)
         */
        const computeAccessibleName = (el, tagName) => {
            // 1. aria-labelledby (Plus forte priorité, gère les IDs multiples)
            if (el.hasAttribute('aria-labelledby')) {
                const ids = el.getAttribute('aria-labelledby').split(' ');
                let text = '';
                ids.forEach(id => {
                    const target = document.getElementById(id);
                    if (target) text += target.innerText.trim() + ' ';
                });
                if (text.trim()) return text.trim();
            }

            // 2. aria-label
            const ariaLabel = el.getAttribute('aria-label');
            if (ariaLabel && ariaLabel.trim() !== '') return ariaLabel.trim();

            // 3. Spécificité des balises pour alt, title et <title>
            if (['IMG', 'AREA', 'INPUT'].includes(tagName)) {
                if (el.hasAttribute('alt')) return el.getAttribute('alt'); // Même vide, on retourne ""
            }

            if (tagName === 'SVG') {
                const titleNode = el.querySelector('title');
                if (titleNode) return titleNode.textContent.trim();
            }

            if (['IMG', 'INPUT'].includes(tagName)) {
                if (el.hasAttribute('title')) return el.getAttribute('title').trim();
            }

            return null; // Pas de nom accessible trouvé
        };

        /**
         * RÈGLE 7 : Vérifie si l'image possède une légende (figcaption)
         */
        const hasFigcaption = (el) => {
            const figure = el.closest('figure');
            if (figure && figure.querySelector('figcaption')) {
                return figure.querySelector('figcaption').innerText.trim();
            }
            return null;
        };

        /**
         * RÈGLE 8 : Vérifie si l'image est le seul contenu d'un lien/bouton
         */
        const isUniqueLinkContent = (el) => {
            const parentLink = el.closest('a, button');
            if (!parentLink) return false;
            // On clone pour retirer l'image et voir s'il reste du texte
            const clone = parentLink.cloneNode(true);
            const imgInClone = clone.querySelector(el.tagName);
            if (imgInClone) imgInClone.remove();
            return clone.innerText.trim() === ''; 
        };

        /**
         * RÈGLE 2 & 5 : Gestion des SVG <use> et des liens adjacents
         */
        nodes.forEach(el => {
            const rgaaId = 'img-' + Math.random().toString(36).substring(2, 10);
            el.setAttribute('data-rgaa-id', rgaaId);

            const tagName = el.tagName.toUpperCase();
            
            // Propriétés de base
            let src = el.src || el.href || el.getAttribute('data') || '';
            const isDataURI = src.startsWith('data:image/');
            const accName = computeAccessibleName(el, tagName);
            const figcaptionText = hasFigcaption(el);
            const isUniqueLink = isUniqueLinkContent(el);
            
            // Propriétés spécifiques
            let innerText = '';
            let adjacentText = '';
            let isMap = el.hasAttribute('ismap');
            let hasHref = el.hasAttribute('href');

            // Extraction SVG <use>
            if (tagName === 'SVG') {
                const useTag = el.querySelector('use');
                if (useTag && useTag.getAttribute('href')) {
                    const targetId = useTag.getAttribute('href').replace('#', '');
                    const targetNode = document.getElementById(targetId);
                    if (targetNode) {
                        const targetTitle = targetNode.querySelector('title');
                        if (targetTitle) innerText = targetTitle.textContent.trim();
                    }
                }
            }

            // Aspiration pour Canvas, Object, Embed (Contenu interne et Adjacent)
            if (['CANVAS', 'OBJECT', 'EMBED'].includes(tagName)) {
                innerText = el.textContent ? el.textContent.trim() : '';
                
                // Cherche un lien/bouton juste après pour le test 1.1.6 / 1.1.8
                let next = el.nextElementSibling;
                if (next && ['A', 'BUTTON'].includes(next.tagName)) {
                    adjacentText = next.innerText.trim();
                }
            }

            // On compile toutes les infos nécessaires pour l'IA et l'Algo
            elements.push({
                rgaa_id: rgaaId,
                tagName: tagName,
                src: src,
                outerHTML: el.outerHTML.length > 150 ? el.outerHTML.substring(0, 150) + '...' : el.outerHTML,
                isDataURI: isDataURI,
                
                // Attributs bruts (pour le Juge Algo)
                alt: el.hasAttribute('alt') ? el.getAttribute('alt') : null,
                role: el.getAttribute('role'),
                ariaHidden: el.getAttribute('aria-hidden'),
                
                // Contexte sémantique (pour le Cerveau IA)
                accessibleName: accName,
                innerText: innerText,
                adjacentText: adjacentText,
                
                // Règles de court-circuit RGAA
                hasFigcaption: figcaptionText !== null,
                figcaptionText: figcaptionText,
                isUniqueLink: isUniqueLink,
                isMap: isMap,
                hasHref: hasHref,

                // Données géométriques
                largeur: el.clientWidth || 0,
                hauteur: el.clientHeight || 0
            });
        });

        return elements;
    });
}