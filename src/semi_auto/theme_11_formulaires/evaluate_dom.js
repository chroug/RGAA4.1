export default function extraireFormulairesDOM() {
    const donnees = { 
        champs11_5: [], 
        champs11_10: [], 
        champsPersos: [] 
    };

    try {
        // --- 1. POUR LE 11.5 (Boutons radio, Checkboxes ET Groupes ARIA/Fieldset) ---
        // On récupère tous les éléments de formulaire ainsi que les éléments simulés par ARIA
        const tousLesChamps = document.querySelectorAll('input, select, textarea, [role="radio"], [role="checkbox"]');
        
        tousLesChamps.forEach(champ => {
            const type = champ.getAttribute('type');
            const role = champ.getAttribute('role');
            
            // 1. Est-ce un radio ou une checkbox ? (Ceux-là sont toujours évalués par le 11.5)
            const estRadioOuCheckbox = type === 'radio' || type === 'checkbox' || role === 'radio' || role === 'checkbox';
            
            // 2. Est-ce que le champ est physiquement dans un groupe ?
            const aUnFieldsetParent = champ.closest('fieldset') !== null;
            const aUnRoleGroupParent = champ.closest('[role="group"], [role="radiogroup"]') !== null;
            const estDansGroupe = aUnFieldsetParent || aUnRoleGroupParent;

            // On remonte le champ S'IL EST de type radio/checkbox OU S'IL EST groupé volontairement par le dev
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
            
            // On ne remonte le champ que s'il est techniquement requis OU visuellement requis
            if (estRequisTechnique || estRequisVisuel) {
                donnees.champs11_10.push({
                    html: input.outerHTML,
                    label: texteLabel,
                    estRequisTechnique: estRequisTechnique,
                    estRequisVisuel: estRequisVisuel
                });
            }
        });

        // --- 3. POUR LE 11.13 (Autocomplete - Capture totale pour le Test de Stress) ---
        // On capture TOUS les champs interactifs de texte/choix pour ne rater aucune donnée personnelle
        const inputsPersos = document.querySelectorAll('input:not([type="button"]):not([type="submit"]):not([type="hidden"]):not([type="radio"]):not([type="checkbox"]), select, textarea');
        
        inputsPersos.forEach(input => {
            const id = input.id;
            const label = id ? document.querySelector(`label[for="${id}"]`) : input.closest('label');
            const texteLabel = label ? label.textContent.trim() : "Pas de label trouvé";
            
            // On envoie le label ET le code html du champ pour que l'IA comprenne le contexte
            donnees.champsPersos.push(`Label visible: "${texteLabel}"\nCode HTML: ${input.outerHTML.substring(0, 200)}`);
        });

    } catch (e) {
        console.error("Erreur dans extraireFormulairesDOM:", e);
    }

    return donnees;
}