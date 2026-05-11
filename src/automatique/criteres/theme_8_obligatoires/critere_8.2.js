import fs from 'fs';
import { fileURLToPath } from 'url';
import { COLORS } from '../../../utils/terminalColors.js'; // Ajuste le chemin si besoin

export default async function testerCritere8_2(page) {
    console.log(`\n  --- (Critère 8.2) Validation W3C ---`);
    console.log(`  ⚡ ANALYSE ALGO [Critère 8.2] : Validation de la syntaxe du code source...`);
    
    let violations = [];
    let rawHtml = "";

    try {
        const url = page.url();
        
        // 1️⃣ RÉCUPÉRATION DU CODE SOURCE BRUT (Sans l'intervention du navigateur)
        if (url.startsWith('file:')) {
            // C'est un fichier local (batch test) : on le lit directement depuis le disque dur
            const filePath = fileURLToPath(url);
            rawHtml = fs.readFileSync(filePath, 'utf-8');
        } else {
            // C'est un site web en ligne : on télécharge le code source pur
            const response = await fetch(url);
            rawHtml = await response.text();
        }

        // 2️⃣ ENVOI À L'API OFFICIELLE DU W3C (Nu Html Checker)
        console.log(`  ⏳ Envoi du code source au validateur W3C...`);
        const w3cResponse = await fetch('https://validator.w3.org/nu/?out=json', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'User-Agent': 'RGAA-Audit-CLI/1.0'
            },
            body: rawHtml
        });

        if (!w3cResponse.ok) {
            throw new Error(`Erreur API W3C : ${w3cResponse.status}`);
        }

        const data = await w3cResponse.json();
        
        // 3️⃣ FILTRAGE ULTRA-PRÉCIS (Méthodologie stricte RGAA 4.1)
        const erreursFatales = data.messages.filter(msg => {
            // On s'assure d'abord que ce n'est pas un simple "warning"
            if (msg.type !== 'error') return false;

            // --- 🎯 ÉTAPE 1 : LISTE BLANCHE RGAA STRICTE ---
            // On ne conserve QUE les erreurs définies par la loi pour le critère 8.2
            const isErreurRGAA = [
                // 1. Attributs dupliqués
                /Duplicate attribute/i,                  
                
                // 2. IDs dupliqués
                /Duplicate ID/i,                         
                
                // 3. Mauvaise imbrication (Nesting)
                /violates nesting rules/i,               
                /not allowed as child/i,
                /No .* element in scope but a .* end tag seen/i,
                
                // 4. Ouverture et fermeture des balises
                /Unclosed element/i,                     
                /Stray end tag/i,                        
                /Stray start tag/i,
                /seen, but there were open elements/i,   
                /Self-closing syntax .* used on a non-void HTML element/i,
                
                // 5. Règles d'écriture (Guillemets et espaces manquants)
                /unquoted attribute value/i,             
                /Attributes running together/i,          
                /End of file seen and there were open elements/i
            ].some(regex => regex.test(msg.message));

            // Si le message du W3C ne concerne pas ces règles strictes, on l'ignore (Faux positif)
            if (!isErreurRGAA) {
                return false; 
            }

            // --- 🛡️ ÉTAPE 2 : TOLÉRANCES HUMAINES (Nos exceptions) ---
            // Même si c'est une "vraie" erreur, on applique la tolérance des auditeurs
            // pour les éléments inoffensifs (comme les IDs décoratifs)
            const isExceptionToleree = [
                /Duplicate ID .*icon-.*/i,
                /Duplicate ID .*svg-.*/i,
                /Duplicate ID .*illu-.*/i
            ].some(regex => regex.test(msg.message));

            if (isExceptionToleree) {
                return false;
            }

            // Si on arrive ici, c'est une VRAIE erreur fatale pour le RGAA 8.2 !
            return true;
        });

        // 4️⃣ FORMATAGE DES VIOLATIONS POUR LE DASHBOARD (Affichage TOTAL)
        if (erreursFatales.length > 0) {
            
            // On boucle sur TOUTES les erreurs sans aucune limite
            erreursFatales.forEach(err => {
                
                // 🛠️ CORRECTIF ANTI-CRASH : On fournit TOUTES les propriétés attendues par audit.js
                violations.push({
                    html: `[Code source ligne ${err.lastLine}, col ${err.lastColumn}]`,
                    xpath: "Non applicable (Erreur W3C globale)",
                    css: "Non applicable",
                    raison: err.message
                });
                
                console.log(`  ${COLORS.RED}❌ ERREUR (Ligne ${err.lastLine})${COLORS.RESET} : ${err.message}`);
            });

            console.log(`  ⚠️ Total : ${erreursFatales.length} erreur(s) syntaxique(s) trouvée(s).`);

            return { statut: "❌ Non Conforme", violations };
        } else {
            console.log(`  ${COLORS.GREEN}✅ CONFORME${COLORS.RESET} [Critère 8.2] : Code source HTML parfaitement valide !`);
            return { statut: "✅ Conforme", violations: [] };
        }

    } catch (error) {
        console.log(`  ${COLORS.YELLOW}⚠️ ATTENTION${COLORS.RESET} [Critère 8.2] : Impossible d'analyser le code brut (${error.message}).`);
        return { statut: "⚠️ À vérifier", violations: [] };
    }
}