import fs from 'fs';
import path from 'path';

// IMPORTS
import runTheme1 from './theme_1_images/index.js';
import runTheme3 from './theme_3_couleurs/index.js';
import runTheme5 from './theme_5_tableaux/index.js';
import runTheme6 from './theme_6_liens/index.js';
import runTheme7 from './theme_7_scripts/index.js';
import runTheme8 from './theme_8_langue/index.js';
import runTheme11 from './theme_11_formulaires/index.js';
import runTheme12 from './theme_12_navigation/index.js';
import runTheme13 from './theme_13_consultation/index.js';

export async function runSemiAuto(page) {
    console.log("\n🤖 Démarrage du module d'Analyse RGAA...");
    
    // Le "carnet de notes" vide
    const resultats_globaux = { 
        validation_manuelle: {} 
    };

    // ==========================================
    // 📸 THÈME 1 : IMAGES
    // ==========================================
    // console.log("\n📸 [Thème 1] Analyse des Images...");
    // On passe la page ET le carnet de notes. Le thème se débrouille !
    // await runTheme1(page, resultats_globaux);

    console.log("\n📊 [Thème 3] Analyse contrastes...");
    await runTheme3(page, resultats_globaux);

    // console.log("\n📊 [Thème 5] Analyse des Tableaux...");
    // await runTheme5(page, resultats_globaux);

    // console.log("\n🔗 [Thème 6] Analyse des Liens...");
    // await runTheme6(page, resultats_globaux);
    
    // console.log("\n⚙️ [Thème 7] Analyse des Scripts (Statuts)...");
    // await runTheme7(page, resultats_globaux);

    // console.log("\n🌍 [Thème 8] Analyse de la Langue...");
    // await runTheme8(page, resultats_globaux);

    // console.log("\n🧭 [Thème 11] Analyse des formulaires...");
    // await runTheme11(page, resultats_globaux);

    // console.log("\n🧭 [Thème 12] Analyse de la Navigation...");
    // await runTheme12(page, resultats_globaux);

    // console.log("\n👁️ [Thème 13] Analyse de la Consultation...");
    // await runTheme13(page, resultats_globaux);


    // ==========================================
    // SAUVEGARDE DU RAPPORT
    // ==========================================
    const nomFichier = `audit_rgaa_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(path.resolve(process.cwd(), nomFichier), JSON.stringify({
        metadata: { url_auditee: await page.url(), date_audit: new Date() },
        resultats_semi_automatiques: resultats_globaux
    }, null, 2), 'utf-8');

    console.log(`\n💾 Rapport sauvegardé : ${nomFichier}`);
    return resultats_globaux;
}