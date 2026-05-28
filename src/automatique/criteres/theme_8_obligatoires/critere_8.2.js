import fs from 'fs';
import { fileURLToPath } from 'url';
import { COLORS } from '../../../utils/terminalColors.js';

export default async function testerCritere8_2(page) {
    console.log(`\n  --- (Critère 8.2) Validation W3C ---`);
    console.log(`  ⚡ ANALYSE ALGO [Critère 8.2] : Validation de la syntaxe du code source...`);
    
    let violations = [];
    let rawHtml = "";

    try {
        const url = page.url();
        
        if (url.startsWith('file:')) {
            const filePath = fileURLToPath(url);
            rawHtml = fs.readFileSync(filePath, 'utf-8');
        } else {
            const response = await fetch(url);
            rawHtml = await response.text();
        }

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
        
        const erreursFatales = data.messages.filter(msg => {
            if (msg.type !== 'error') return false;

            const isErreurRGAA = [
                /Duplicate attribute/i,                  
                /Duplicate ID/i,                         
                /violates nesting rules/i,               
                /not allowed as child/i,
                /No .* element in scope but a .* end tag seen/i,
                /Unclosed element/i,                     
                /Stray end tag/i,                        
                /Stray start tag/i,
                /seen, but there were open elements/i,   
                /Self-closing syntax .* used on a non-void HTML element/i,
                /unquoted attribute value/i,             
                /Attributes running together/i,          
                /End of file seen and there were open elements/i
            ].some(regex => regex.test(msg.message));

            if (!isErreurRGAA) return false; 

            const isExceptionToleree = [
                /Duplicate ID .*icon-.*/i,
                /Duplicate ID .*svg-.*/i,
                /Duplicate ID .*illu-.*/i
            ].some(regex => regex.test(msg.message));

            if (isExceptionToleree) return false;

            return true;
        });

        if (erreursFatales.length > 0) {
            erreursFatales.forEach(err => {
                violations.push({
                    html: `[Code source ligne ${err.lastLine}, col ${err.lastColumn}]`,
                    selecteur_css: "N/A",
                    xpath: "N/A",
                    bounding_box: null,
                    raison: err.message
                });
                console.log(`  ${COLORS.RED}❌ ERREUR (Ligne ${err.lastLine})${COLORS.RESET} : ${err.message}`);
            });
            console.log(`  ⚠️ Total : ${erreursFatales.length} erreur(s) syntaxique(s) trouvée(s).`);

            return { statut: "❌ NON CONFORME", violations: violations, conformites: [] };
        } else {
            console.log(`  ${COLORS.GREEN}✅ CONFORME${COLORS.RESET} [Critère 8.2] : Code source HTML parfaitement valide !`);
            return { 
                statut: "✅ CONFORME", 
                violations: [], 
                conformites: [{
                    raison: "Le code source de la page est valide selon les règles du W3C pour le critère 8.2.",
                    html: "N/A", selecteur_css: "N/A", xpath: "N/A", bounding_box: null
                }] 
            };
        }

    } catch (error) {
        console.log(`  ${COLORS.YELLOW}⚠️ ATTENTION${COLORS.RESET} [Critère 8.2] : Impossible d'analyser le code brut (${error.message}).`);
        return { statut: "⚠️ À VÉRIFIER MANUELLEMENT", violations: [], conformites: [] };
    }
}