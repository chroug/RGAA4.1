// src/semi_auto/index.js
import fs from 'fs';
import path from 'path';

/**
 * 🛠 Le "Nettoyeur" de réponse IA (Regex) pour Gemma
 */
function extraireJsonDeLIA(texteBrut) {
    try {
        let texteNettoye = texteBrut.replace(/```json/g, '').replace(/```/g, '').trim();
        const match = texteNettoye.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (!match) throw new Error("Aucun format JSON détecté.");
        return JSON.parse(match[0]);
    } catch (error) {
        console.error("❌ Erreur de parsing IA :", error.message, "\nRéponse brute :", texteBrut);
        return { statut: "⚠️ À VERIFIER MANUELLEMENT", explication: "Format illisible par la machine." };
    }
}

/**
 * 🧠 Le connecteur avec l'IA Locale (Ollama) orienté TEXTE
 */
async function analyserTexteAvecIA(contexteHtml, typeTest) {
    let consigne = "";

    if (typeTest === "5.1_tableaux") {
        consigne = `Règle RGAA 5.1 : Un tableau de présentation ne doit contenir AUCUNE balise sémantique. 
TA MISSION : Je te fournis un tableau. Si tu vois les balises "<th>" ou "<caption>" à l'intérieur, c'est une grave erreur. Tu DOIS répondre "❌ Non Conforme" car on ne mélange pas mise en page et sémantique.`;
    } 
else if (typeTest === "11.10_formulaires") {
        consigne = `Règle RGAA 11.10 : Indication visuelle des champs obligatoires.
Je te fournis UNIQUEMENT le code HTML d'une balise <label>.
MISSION : Le texte de ce <label> DOIT avertir visuellement l'utilisateur.
Cherche OBLIGATOIREMENT la présence de l'un de ces éléments :
- Le symbole astérisque "*"
- Le mot "obligatoire" ou "requis"
- Le mot-clé exact "[OBLIGATOIRE_CSS_DETECTE]"
- Le mot-clé exact "[EXCEPTION_RGAA_LOGIN]"

Si tu vois au moins l'un de ces éléments, réponds "✅ Conforme".
Si tu n'en vois AUCUN, réponds "❌ Non Conforme".`;
    }
    else if (typeTest === "13.2_liens") {
        consigne = `Règle RGAA 13.2 : Un lien qui s'ouvre dans une nouvelle fenêtre (target="_blank") doit avertir l'utilisateur.
Vérifie ce lien : l'utilisateur est-il prévenu explicitement en texte (ex: "nouvelle fenêtre") ? Si le texte du lien ne mentionne pas l'ouverture d'un onglet, tu DOIS répondre "❌ Non Conforme".`;
    }
    else if (typeTest === "7.5_statut") {
        consigne = `Règle RGAA 7.5 : Les messages de statut doivent être vocalisés.
Je te fournis un extrait HTML contenant un message. Cherche les mots exacts : role="alert", role="status", role="log", ou aria-live.
Si AUCUN de ces mots n'est écrit dans le code, tu DOIS répondre "❌ Non Conforme".`;
    } 
    else if (typeTest === "11.5_regroupement") {
        consigne = `Règle RGAA 11.5 : Les champs de même nature (boutons radio) DOIVENT être dans un <fieldset>.
Je te fournis un extrait HTML. Cherche le mot EXACT "<fieldset>" ou "role='group'". 
Si tu ne vois PAS ces mots écrits noir sur blanc dans le code fourni, tu DOIS répondre "❌ Non Conforme" (même s'ils sont dans un <form>).`;
    }
    else if (typeTest === "11.13_autocomplete") {
        consigne = `Règle RGAA 11.13 : Autocomplétion.
Je te fournis un champ <input>. Cherche le mot EXACT "autocomplete=".
Si le mot "autocomplete" n'est pas présent dans la balise, tu DOIS répondre "❌ Non Conforme".`;
    }
    else if (typeTest === "12.7_evitement") {
        consigne = `Règle RGAA 12.7 : Lien d'évitement.
Je te fournis un lien d'évitement. Vérifie 2 choses : 1) Son href pointe-t-il vers une ancre de contenu (ex: #main) ? 2) Son texte dit-il "Aller au contenu" ?
Si le href pointe vers une erreur (ex: #erreur) ou s'il n'est pas valide, tu DOIS répondre "❌ Non Conforme".`;
    }

    const prompt = `Tu es un robot auditeur intransigeant expert en RGAA 4.1.
${consigne}

Code HTML à analyser :
${contexteHtml}

Tu dois REPONDRE UNIQUEMENT avec un objet JSON strict au format exact suivant :
{
  "statut": "✅ Conforme" ou "❌ Non Conforme",
  "explication": "Ton explication stricte et directe en 1 phrase maximum."
}`;

    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'gemma', 
                prompt: prompt,
                format: 'json',
                stream: false,
                options: { temperature: 0.0 }
            })
        });

        if (!response.ok) throw new Error(`Erreur réseau Ollama : ${response.status}`);
        const data = await response.json();
        return extraireJsonDeLIA(data.response);

    } catch (error) {
        return { statut: "⚠️ Échec IA", explication: error.message };
    }
}

/**
 * 🚀 La fonction principale exportée
 */
export async function runSemiAuto(page) {
    console.log("\n🤖 Démarrage du module d'Analyse (IA + Algo Algorithmique)...");

    const resultats_semi_auto = {
        "critere_5.1": { statut: "➖ Non Applicable (NA)", violations:[] },
        "critere_11.10": { statut: "➖ Non Applicable (NA)", violations:[] },
        "critere_13.2": { statut: "➖ Non Applicable (NA)", violations:[] },
        "critere_7.5": { statut: "➖ Non Applicable (NA)", violations:[] },
        "critere_11.5": { statut: "➖ Non Applicable (NA)", violations:[] },
        "critere_11.13": { statut: "➖ Non Applicable (NA)", violations:[] },
        "critere_5.7": { statut: "➖ Non Applicable (NA)", violations:[] },
        "critere_12.7": { statut: "➖ Non Applicable (NA)", violations:[] }
    };

    const elementsExtraits = await page.evaluate(() => {
        const tables = Array.from(document.querySelectorAll('table')).map(t => t.outerHTML.substring(0, 300));
        
// 🔥 CORRECTION 11.10 : On empêche l'IA de tricher en masquant la balise input !
        const tousLesChampsRequis = Array.from(document.querySelectorAll(`
            input[required]:not([type="search"]):not([type="hidden"]), 
            input[aria-required="true"]:not([type="search"]):not([type="hidden"]),
            textarea[required], textarea[aria-required="true"],
            select[required], select[aria-required="true"]
        `));

        const champsRequis = [];

        for (const champ of tousLesChampsRequis) {
            const label = document.querySelector(`label[for="${champ.id}"]`);
            let labelHtml = label ? label.outerHTML : 'Aucun label trouvé';

            if (label) {
                // 1. Vérification du CSS
                const styleAfter = window.getComputedStyle(label, '::after').content;
                const styleBefore = window.getComputedStyle(label, '::before').content;
                const parentStyleAfter = label.parentElement ? window.getComputedStyle(label.parentElement, '::after').content : '';

                if ((styleAfter && styleAfter.includes('*')) || (styleBefore && styleBefore.includes('*')) || (parentStyleAfter && parentStyleAfter.includes('*'))) {
                    labelHtml = labelHtml.replace('</label>', ' [OBLIGATOIRE_CSS_DETECTE]</label>');
                }

                // 2. Vérification Exception RGAA (Formulaire de Login)
                const form = champ.closest('form');
                if (form) {
                    const isLoginForm = form.querySelector('input[type="password"]') !== null;
                    if (isLoginForm) {
                        labelHtml = labelHtml.replace('</label>', ' [EXCEPTION_RGAA_LOGIN]</label>');
                    }
                }
            }
            
            // 🔥 LA CORRECTION EST ICI : On n'envoie QUE le label. Pas de champ, pas de mot "required" pour tricher.
            champsRequis.push(labelHtml);
        }

        const liensBlank = Array.from(document.querySelectorAll('a[target="_blank"]')).map(a => a.outerHTML.substring(0, 600));

        const messagesStatut = Array.from(document.querySelectorAll('[id*="error"],[id*="msg"], [class*="alert"], [class*="error"]'))
            .map(el => el.outerHTML.substring(0, 150));

        const groupesRadio = Array.from(document.querySelectorAll('input[type="radio"]')).map(radio => {
            const conteneurParent = radio.closest('fieldset, [role="group"], [role="radiogroup"], form, div');
            return conteneurParent ? conteneurParent.outerHTML.substring(0, 300) : radio.outerHTML;
        });

        // 🔥 CORRECTION 11.13 : Super sélecteur ULTIME RGAA (Identité, Adresse, CB, Sécurité)
        const champsPersos = Array.from(document.querySelectorAll(`
            input[type="email"], input[type="tel"], input[type="password"], input[type="url"],
            input[name*="nom" i], input[name*="name" i], input[name*="prenom" i],
            input[name*="mail" i], input[name*="tel" i], input[name*="phone" i],
            input[name*="adresse" i], input[name*="address" i], input[name*="rue" i], input[name*="street" i],
            input[name*="ville" i], input[name*="city" i], 
            input[name*="postal" i], input[name*="zip" i],
            input[name*="pays" i], input[name*="country" i], 
            input[name*="societe" i], input[name*="company" i], input[name*="org" i],
            input[name*="bday" i], input[name*="naissance" i], input[name*="birth" i],
            input[name*="sexe" i], input[name*="gender" i],
            input[name*="cc-" i], input[name*="card" i], input[name*="carte" i], input[name*="cb" i],
            input[name*="lang" i], input[name*="password" i], input[name*="mdp" i]
        `)).map(input => input.outerHTML.substring(0, 150));

        const entetesTableaux = Array.from(document.querySelectorAll('th:not([scope]):not([id]):not([role])'))
            .map(th => th.outerHTML.substring(0, 150));

        const liensEvitement = Array.from(document.querySelectorAll('a[href^="#"]:not([href="#"])'))
            .slice(0, 1)
            .map(a => a.outerHTML.substring(0, 150));

        return { 
            tables, champsRequis, liensBlank, 
            messagesStatut, groupesRadio, champsPersos, 
            entetesTableaux, liensEvitement 
        };
    });

    async function traiterCategorie(critere, listeHtml, typeTest, maxItems = 5) {
        if (listeHtml && listeHtml.length > 0) {
            resultats_semi_auto[critere].statut = "✅ Conforme (C)";
            
            const itemsATester = listeHtml.slice(0, maxItems);
            
            for (let i = 0; i < itemsATester.length; i++) {
                process.stdout.write(`🧠 [${critere}] Analyse IA ${i+1}/${itemsATester.length}... `);
                
                const iaDecision = await analyserTexteAvecIA(itemsATester[i], typeTest);
                console.log(iaDecision.statut);

                if (iaDecision.statut.includes("❌")) {
                    resultats_semi_auto[critere].statut = "❌ Non Conforme (NC)";
                    resultats_semi_auto[critere].violations.push({
                        regle: `ia-analyse-${typeTest}`,
                        description: iaDecision.explication,
                        elements_fautifs:[{ code_html: itemsATester[i].replace(/\n/g, '') }]
                    });
                }
            }
        }
    }

    // 🧠 TRAITEMENT IA
    await traiterCategorie("critere_5.1", elementsExtraits.tables, "5.1_tableaux");
    await traiterCategorie("critere_11.10", elementsExtraits.champsRequis, "11.10_formulaires");
    await traiterCategorie("critere_13.2", elementsExtraits.liensBlank, "13.2_liens");
    await traiterCategorie("critere_7.5", elementsExtraits.messagesStatut, "7.5_statut");
    await traiterCategorie("critere_11.5", elementsExtraits.groupesRadio, "11.5_regroupement");
    await traiterCategorie("critere_11.13", elementsExtraits.champsPersos, "11.13_autocomplete");
    await traiterCategorie("critere_12.7", elementsExtraits.liensEvitement, "12.7_evitement");

    // ⚡ TRAITEMENT 100% ALGORITHMIQUE (Sans IA)
    if (elementsExtraits.entetesTableaux && elementsExtraits.entetesTableaux.length > 0) {
        console.log(`⚡ [critere_5.7] Analyse Algorithmique... ❌ Non Conforme`);
        resultats_semi_auto["critere_5.7"].statut = "❌ Non Conforme (NC)";
        
        elementsExtraits.entetesTableaux.slice(0, 5).forEach(thHtml => {
            resultats_semi_auto["critere_5.7"].violations.push({
                regle: "algo-analyse-5.7_table_headers",
                description: "La balise <th> ne possède aucun attribut pour la relier aux données (scope, id ou role manquant).",
                elements_fautifs: [{ code_html: thHtml }]
            });
        });
    } else if (elementsExtraits.tables && elementsExtraits.tables.length > 0) {
        console.log(`⚡ [critere_5.7] Analyse Algorithmique... ✅ Conforme`);
        resultats_semi_auto["critere_5.7"].statut = "✅ Conforme (C)";
    }

    // 💾 SAUVEGARDE DU FICHIER JSON
    const nomFichier = `audit_rgaa_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const cheminFichier = path.resolve(process.cwd(), nomFichier);
    
    fs.writeFileSync(cheminFichier, JSON.stringify({
        metadata: { 
            url_auditee: await page.url(), 
            date_audit: new Date() 
        },
        resultats_semi_automatiques: resultats_semi_auto
    }, null, 2), 'utf-8');

    console.log(`\n💾 Rapport sauvegardé avec succès : ${nomFichier}`);
    console.log("✅ Audit terminé.");
    
    return resultats_semi_auto;
}