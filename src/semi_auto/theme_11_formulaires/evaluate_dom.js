export default function extraireFormulairesDOM() {
    const donnees = {
        champs11_2: [],
        champs11_5: [],
        champs11_7: [],
        champs11_10: [], 
        champsPersos: [] 
    };

    // 🛡️ MOTEUR D'EXTRACTION AUTONOME (Garantit que ça ne plante jamais)
    const obtenirDonneesSaaS = (element) => {
        if (window.RGAA_UTILS && typeof window.RGAA_UTILS.extraireDonneesSaaS === 'function') {
            return window.RGAA_UTILS.extraireDonneesSaaS(element);
        }
        
        const getXPath = (el) => {
            if (!el || el.nodeType !== 1) return '';
            if (el.id !== '') return `//*[@id="${el.id}"]`;
            if (el === document.body) return '/html/body';
            let ix = 0;
            let siblings = el.parentNode ? el.parentNode.childNodes : [];
            for (let i = 0; i < siblings.length; i++) {
                let sibling = siblings[i];
                if (sibling === el) return `${getXPath(el.parentNode)}/${el.tagName.toLowerCase()}[${ix + 1}]`;
                if (sibling.nodeType === 1 && sibling.tagName === el.tagName) ix++;
            }
            return '';
        };

        const getCssSelector = (el) => {
            if (!el) return '';
            if (el.id) return `#${el.id}`;
            if (el.className && typeof el.className === 'string') {
                const classes = el.className.trim().split(/\s+/).join('.');
                if (classes) return `${el.tagName.toLowerCase()}.${classes}`;
            }
            return el.tagName.toLowerCase();
        };

        return {
            xpath: getXPath(element),
            cssSelector: getCssSelector(element),
            html: element.outerHTML ? element.outerHTML.substring(0, 200) : ""
        };
    };

    // Plus de try/catch global ! S'il y a une erreur, on veut que Node.js la voie et nous prévienne.
    
    // --- 1. POUR LE 11.5 (Boutons radio, Checkboxes ET Groupes ARIA/Fieldset) ---
    const tousLesChamps = document.querySelectorAll('input, select, textarea, [role="radio"], [role="checkbox"]');
    
    tousLesChamps.forEach(champ => {
        const type = champ.getAttribute('type');
        const role = champ.getAttribute('role');
        
        const estRadioOuCheckbox = type === 'radio' || type === 'checkbox' || role === 'radio' || role === 'checkbox';
        const aUnFieldsetParent = champ.closest('fieldset') !== null;
        const aUnRoleGroupParent = champ.closest('[role="group"], [role="radiogroup"]') !== null;
        const estDansGroupe = aUnFieldsetParent || aUnRoleGroupParent;

        if (estRadioOuCheckbox || estDansGroupe) {
            const donneesSaaS = obtenirDonneesSaaS(champ);
            donneesSaaS.type = type || role || champ.tagName.toLowerCase();
            donneesSaaS.name = champ.name || champ.id || 'sans-nom';
            donneesSaaS.estBienGroupe = estDansGroupe;
            donnees.champs11_5.push(donneesSaaS);
        }
    });

    // --- 2. POUR LE 11.10 (Obligations et Formats) ---
    const tousLesInputs = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
    tousLesInputs.forEach(input => {
        const id = input.id;
        const label = id ? document.querySelector(`label[for="${id}"]`) : input.closest('label');
        const texteLabel = label ? label.textContent.toLowerCase() : "";
        
        const estRequisTechnique = input.hasAttribute('required') || input.getAttribute('aria-required') === "true";
        const estRequisVisuel = texteLabel.includes('*') || texteLabel.includes('obligatoire') || texteLabel.includes('requis');
        
        if (estRequisTechnique || estRequisVisuel) {
            const donneesSaaS = obtenirDonneesSaaS(input);
            donneesSaaS.label = texteLabel;
            donneesSaaS.estRequisTechnique = estRequisTechnique;
            donneesSaaS.estRequisVisuel = estRequisVisuel;
            donnees.champs11_10.push(donneesSaaS);
        }
    });

    // --- 3. POUR LE 11.13 (Autocomplete - Données Personnelles) ---
    const inputsPersos = document.querySelectorAll('input:not([type="button"]):not([type="submit"]):not([type="hidden"]):not([type="radio"]):not([type="checkbox"]), select, textarea');
    
    inputsPersos.forEach(input => {
        const id = input.id;
        const label = id ? document.querySelector(`label[for="${id}"]`) : input.closest('label');
        const texteLabel = label ? label.textContent.trim() : "Pas de label trouvé";
        
        const donneesSaaS = obtenirDonneesSaaS(input);
        // On injecte promptData pour que le critere_11.13.js puisse le lire
        donneesSaaS.promptData = `Label visible: "${texteLabel}"\nCode HTML: ${input.outerHTML.substring(0, 200)}`;
        donnees.champsPersos.push(donneesSaaS);
    });

    // --- 4. POUR LE 11.2 (Pertinence des étiquettes) ---
    tousLesInputs.forEach(champ => {
        const id = champ.id;
        const labelVisuel = id ? document.querySelector(`label[for="${id}"]`) : champ.closest('label');
        const texteVisuel = labelVisuel ? labelVisuel.innerText.trim() : "";
        
        const ariaLabel = champ.getAttribute('aria-label') || "";
        let ariaLabelledbyText = "";
        const ariaLabelledby = champ.getAttribute('aria-labelledby');
        if (ariaLabelledby) {
            const elementLie = document.getElementById(ariaLabelledby);
            if (elementLie) ariaLabelledbyText = elementLie.innerText.trim();
        }
        const title = champ.title || "";
        const placeholder = champ.placeholder || "";

        let texteBoutonAdjacent = "";
        const elementSuivant = champ.nextElementSibling;
        if (elementSuivant && (elementSuivant.tagName === 'BUTTON' || (elementSuivant.tagName === 'INPUT' && ['submit', 'button'].includes(elementSuivant.type)))) {
            texteBoutonAdjacent = elementSuivant.innerText || elementSuivant.value || "";
        }

        let contexteGroupe = "";
        const fieldset = champ.closest('fieldset');
        if (fieldset) {
            const legend = fieldset.querySelector('legend');
            if (legend) contexteGroupe = legend.innerText.trim();
        } else {
            const groupParent = champ.closest('[role="group"], [role="radiogroup"]');
            if (groupParent) {
                contexteGroupe = groupParent.getAttribute('aria-label') || "";
                if (!contexteGroupe && groupParent.getAttribute('aria-labelledby')) {
                    const elGroup = document.getElementById(groupParent.getAttribute('aria-labelledby'));
                    if (elGroup) contexteGroupe = elGroup.innerText.trim();
                }
            }
        }

        if (texteVisuel || ariaLabel || ariaLabelledbyText || title || placeholder || texteBoutonAdjacent) {
            const donneesChamp = `
                Type de champ : ${champ.tagName.toLowerCase()} (type: ${champ.getAttribute('type') || 'text'})
                HTML brut : ${champ.outerHTML.substring(0, 150)}
                --
                Contexte du groupe : "${contexteGroupe}"
                Étiquette visible : "${texteVisuel}"
                Bouton adjacent : "${texteBoutonAdjacent.trim()}"
                Aria-label : "${ariaLabel}"
                Aria-labelledby : "${ariaLabelledbyText}"
                Title : "${title}"
                Placeholder : "${placeholder}"
            `.trim();

            const donneesSaaS = obtenirDonneesSaaS(champ);
            donneesSaaS.promptData = donneesChamp;
            donnees.champs11_2.push(donneesSaaS);
        }
    });

    // --- 5. POUR LE 11.7 (Pertinence des légendes de groupes) ---
    const tousLesGroupes = document.querySelectorAll('fieldset, [role="group"], [role="radiogroup"]');
    tousLesGroupes.forEach(groupe => {
        let texteLegende = "";
        
        if (groupe.tagName === 'FIELDSET') {
            const legend = groupe.querySelector('legend');
            if (legend) texteLegende = legend.innerText.trim();
        } else {
            texteLegende = groupe.getAttribute('aria-label') || "";
            if (!texteLegende && groupe.getAttribute('aria-labelledby')) {
                const el = document.getElementById(groupe.getAttribute('aria-labelledby'));
                if (el) texteLegende = el.innerText.trim();
            }
        }

        if (texteLegende) {
            const champsInternes = groupe.querySelectorAll('input, select, textarea');
            let apercuChamps = [];
            champsInternes.forEach(champ => {
                const id = champ.id;
                const labelVisuel = id ? document.querySelector(`label[for="${id}"]`) : champ.closest('label');
                if (labelVisuel) apercuChamps.push(labelVisuel.innerText.trim());
            });

            const donneesGroupe = `
                Type de groupe : ${groupe.tagName.toLowerCase()} (role: ${groupe.getAttribute('role') || 'aucun'})
                Légende à évaluer : "${texteLegende}"
                Choix proposés : [${apercuChamps.join(', ')}]
            `.trim();

            const donneesSaaS = obtenirDonneesSaaS(groupe);
            donneesSaaS.promptData = donneesGroupe;
            donnees.champs11_7.push(donneesSaaS);
        }
    });

    return donnees;
}