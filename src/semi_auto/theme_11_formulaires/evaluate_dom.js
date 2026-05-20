export default function extraireFormulairesDOM() {
    const donnees = {
        champs11_2: [],
        champs11_5: [],
        champs11_7: [],
        champs11_10: [], 
        champsPersos: [] 
    };

    try {
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
                donnees.champs11_5.push({
                    html: champ.outerHTML,
                    type: type || role || champ.tagName.toLowerCase(),
                    name: champ.name || champ.id || 'sans-nom',
                    estBienGroupe: estDansGroupe
                });
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
                donnees.champs11_10.push({
                    html: input.outerHTML,
                    label: texteLabel,
                    estRequisTechnique: estRequisTechnique,
                    estRequisVisuel: estRequisVisuel
                });
            }
        });

        // --- 3. POUR LE 11.13 (Autocomplete) ---
        const inputsPersos = document.querySelectorAll('input:not([type="button"]):not([type="submit"]):not([type="hidden"]):not([type="radio"]):not([type="checkbox"]), select, textarea');
        
        inputsPersos.forEach(input => {
            const id = input.id;
            const label = id ? document.querySelector(`label[for="${id}"]`) : input.closest('label');
            const texteLabel = label ? label.textContent.trim() : "Pas de label trouvé";
            
            donnees.champsPersos.push(`Label visible: "${texteLabel}"\nCode HTML: ${input.outerHTML.substring(0, 200)}`);
        });

        // --- 4. POUR LE 11.2 (Pertinence des étiquettes pour l'IA) ---
        const tousLesChampsPour11_2 = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
        tousLesChampsPour11_2.forEach(champ => {
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

            
            // 🛑 Test 11.2.6 - Recherche du bouton adjacent
            let texteBoutonAdjacent = "";
            const elementSuivant = champ.nextElementSibling;
            if (elementSuivant && (elementSuivant.tagName === 'BUTTON' || (elementSuivant.tagName === 'INPUT' && ['submit', 'button'].includes(elementSuivant.type)))) {
                texteBoutonAdjacent = elementSuivant.innerText || elementSuivant.value || "";
            }

            // 🛑 NOUVEAU : Récupération du contexte de groupe (Fieldset/Legend)
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

            // On construit le prompt (avec le contexte ajouté)
            if (texteVisuel || ariaLabel || ariaLabelledbyText || title || placeholder || texteBoutonAdjacent) {
                const donneesChamp = `
                    Type de champ : ${champ.tagName.toLowerCase()} (type: ${champ.getAttribute('type') || 'text'})
                    HTML brut : ${champ.outerHTML.substring(0, 150)}
                    --
                    Contexte du groupe (Fieldset/Legend) : "${contexteGroupe}"
                    Étiquette visible (<label>) : "${texteVisuel}"
                    Bouton adjacent (Test 11.2.6) : "${texteBoutonAdjacent.trim()}"
                    Attribut aria-label : "${ariaLabel}"
                    Attribut aria-labelledby (texte ciblé) : "${ariaLabelledbyText}"
                    Attribut title : "${title}"
                    Attribut placeholder : "${placeholder}"
                `.trim();

                donnees.champs11_2.push({
                    html: champ.outerHTML.substring(0, 80) + '...',
                    promptData: donneesChamp
                });
            }
        });

        // --- 5. POUR LE 11.7 (Pertinence des légendes de groupes) ---
        const tousLesGroupes = document.querySelectorAll('fieldset, [role="group"], [role="radiogroup"]');
        tousLesGroupes.forEach(groupe => {
            let texteLegende = "";
            
            // Extraction de la légende selon le type de groupe
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

            // On n'évalue le 11.7 QUE s'il y a une légende (l'absence relève du critère 11.6)
            if (texteLegende) {
                // On récupère les labels des champs internes pour que l'IA comprenne les choix proposés
                const champsInternes = groupe.querySelectorAll('input, select, textarea');
                let apercuChamps = [];
                champsInternes.forEach(champ => {
                    const id = champ.id;
                    const labelVisuel = id ? document.querySelector(`label[for="${id}"]`) : champ.closest('label');
                    if (labelVisuel) apercuChamps.push(labelVisuel.innerText.trim());
                });

                const donneesGroupe = `
                    Type de groupe : ${groupe.tagName.toLowerCase()} (role: ${groupe.getAttribute('role') || 'aucun'})
                    HTML brut (extrait) : ${groupe.outerHTML.substring(0, 150)}
                    --
                    Légende à évaluer : "${texteLegende}"
                    Choix proposés dans ce groupe : [${apercuChamps.join(', ')}]
                `.trim();

                donnees.champs11_7.push({
                    html: groupe.outerHTML.substring(0, 80) + '...',
                    promptData: donneesGroupe
                });
            }
        });
    } catch (e) {
        console.error("Erreur dans extraireFormulairesDOM:", e);
    }

    return donnees;
}