// src/semi_auto/theme_1_images/index.js

import fs from 'node:fs';
import path from 'node:path';
import extractImagesForAI from './evaluate_dom.js';
import { PROMPT_CLASSIFICATION, PROMPT_CRITERE_1_3 } from './prompts.js';
import { askVision, askVisionWithContext } from '../utils/ai_helper.js';

// 🛑 IMPORT DES JUGES SYNTAXES
import { evaluerCritere1_1 } from  './criteres/critere_1.1.js';
import { evaluerCritere1_2 } from  './criteres/critere_1.2.js';

export default async function runTheme1(page) {
    console.log(`\n\x1b[35m 🤖 \x1b[0m DÉMARRAGE DU MOTEUR HYBRIDE - THÈME 1 (IMAGES)`);
    
    // 1. Extraction du DOM
   const images = await extractImagesForAI(page);
    const resultatsComplets = [];

    if (images.length === 0) {
        console.log("  👉 Aucune balise graphique trouvée sur la page.");
        return { theme: "1", resultats: [] };
    }

    // 📸 NOUVEAU : CAPTURE DU CONTEXTE GLOBAL
    // 📸 CAPTURE DU CONTEXTE GLOBAL
    console.log("  📸 Capture du contexte global de la page...");
    const globalBuffer = await page.screenshot({ fullPage: true, type: 'jpeg', quality: 50 });
    const base64Global = globalBuffer.toString('base64');

    // 💾 SAUVEGARDE DE LA CAPTURE GLOBALE SUR LE DISQUE
    try {
        const debugDir = path.join(process.cwd(), 'captures_1.1');
        // On crée un nom de fichier propre basé sur l'URL
        const safePageName = page.url().replace(/[^a-z0-9]/gi, '_').substring(0, 50) || "page_locale";
        const globalFilename = path.join(debugDir, `global_context_${safePageName}.jpg`);
        
        fs.writeFileSync(globalFilename, globalBuffer);
        console.log(`  💾 Contexte global sauvegardé !`);
    } catch (e) {
        console.log(`  ⚠️ Erreur lors de la sauvegarde du contexte global : ${e.message}`);
    }
    // 2. Boucle de Traitement Sémantique
    for (const img of images) {
        if (img.largeur < 5 || img.hauteur < 5) continue; // Ignorer les pixels de tracking

        let statutSemantique = "INCONNU";
        let raisonStatut = "";

        console.log(`\n🔍 Traitement de : \x1b[36m${img.src.split('/').pop() || 'Image intégrée'}\x1b[0m`);

        // ==========================================
        // PHASE 3 : PRÉ-FILTRAGE (Court-circuit IA)
        // ==========================================
        if (img.hasFigcaption) {
            statutSemantique = "INFORMATIF";
            raisonStatut = "Forcé (Règle 7) : Présence d'une balise <figcaption>.";
        } else if (img.isUniqueLink) {
            statutSemantique = "INFORMATIF";
            raisonStatut = "Forcé (Règle 8) : Image constituant le seul contenu d'un lien/bouton.";
        } else if (img.hasHref && img.tagName === 'AREA') {
            statutSemantique = "INFORMATIF";
            raisonStatut = "Forcé (Règle 9) : Zone d'image réactive avec attribut href.";
        } else if (img.isMap) {
            statutSemantique = "INFORMATIF";
            raisonStatut = "Forcé (Règle 10) : Image réactive côté serveur (ismap).";
        }

      // ==========================================
        // GESTION BASE64 (Le Paparazzi 📸)
        // ==========================================
        let base64Image = "";
        try {
            const elementHandle = await page.$(`[data-rgaa-id="${img.rgaa_id}"]`);
            
            if (elementHandle) {
                // On prend l'élément en photo
                const buffer = await elementHandle.screenshot({ type: 'jpeg', quality: 80 });
                base64Image = buffer.toString('base64');
                console.log("  📸 Capture d'écran de l'élément réussie !");
                
                // 💾 SAUVEGARDE DE L'ÉLÉMENT SUR LE DISQUE
                const debugDir = path.join(process.cwd(), 'captures_1.1');
                const safeId = img.rgaa_id || Math.random().toString(36).substring(2, 8); // Sécurité si rgaa_id est vide
                const elemFilename = path.join(debugDir, `elem_${img.tagName.toLowerCase()}_${safeId}.jpg`);
                
                fs.writeFileSync(elemFilename, buffer);
                
            } else {
                throw new Error("Élément introuvable dans le DOM.");
            }
        } catch (e) {
            // On affiche enfin le VRAI message d'erreur pour comprendre !
            console.log(`  ⚠️ Erreur lors de la capture/sauvegarde : ${e.message}`);
        }

        // ==========================================
        // CLASSIFICATION IA (Vision)
        // ==========================================
        if (statutSemantique === "INCONNU" && base64Image) {
            console.log("  ⏳ Interrogation de l'IA (Contexte global + Élément cible)...");
            const contexte = img.adjacentText ? `Texte adjacent: ${img.adjacentText}` : "Aucun";
            const promptClassif = PROMPT_CLASSIFICATION.replace('{CONTEXTE_HTML}', contexte);
            
            // 🛑 ON UTILISE LA NOUVELLE FONCTION ICI
            const reponseClassif = await askVisionWithContext(promptClassif, base64Global, base64Image);
            
            statutSemantique = reponseClassif.statut || "DECORATIF"; 
            raisonStatut = reponseClassif.raison || "Analyse IA.";
        }

        // ==========================================
        // PHASE 5 & 6 : AIGUILLAGE VERS LES JUGES SYNTAXES (1.1 et 1.2)
        // ==========================================
        let verdictFinal = {};

        if (statutSemantique === "DECORATIF") {
            console.log("  ⚖️  Analyse par le Juge Syntaxe 1.2...");
            const verdict1_2 = evaluerCritere1_2(img); // 🛑 APPEL DU JUGE 1.2
            
            if (verdict1_2.statut === "VALIDE") {
                console.log(`  \x1b[32m✔\x1b[0m ${verdict1_2.raison}`);
            } else {
                console.log(`  \x1b[31m✘\x1b[0m ${verdict1_2.raison}`);
            }
            verdictFinal = verdict1_2;
        } 
        else if (statutSemantique === "CAPTCHA") {
            console.log("  👉 Routage vers validation 1.1 (Alternative CAPTCHA).");
            const verdict1_1 = evaluerCritere1_1(img);
            if (verdict1_1.statut !== "VALIDE") {
                 console.log(`  \x1b[31m✘\x1b[0m ${verdict1_1.raison}`);
            } else {
                 console.log(`  \x1b[32m✔\x1b[0m Succès 1.1 : ${verdict1_1.raison}`);
                 console.log(`  ⚠️ VÉRIFICATION MANUELLE : S'assurer que l'alternative indique bien la nature du CAPTCHA ou du test visuel.`);
            }
            verdictFinal = verdict1_1;
        }
        else if (statutSemantique === "INFORMATIF") {
            console.log("  ⚖️  Analyse par le Juge Syntaxe 1.1...");
            const verdict1_1 = evaluerCritere1_1(img); // 🛑 APPEL DU JUGE 1.1

            if (verdict1_1.statut !== "VALIDE") {
                console.log(`  \x1b[31m✘\x1b[0m ${verdict1_1.raison}`);
                verdictFinal = verdict1_1;
            } else {
                console.log(`  \x1b[32m✔\x1b[0m Succès 1.1 : ${verdict1_1.raison}`);
                
                // Si le 1.1 est valide, on passe au Juge Sémantique (Critère 1.3)
                // UNIQUEMENT si on a du texte direct à évaluer (Annulé pour les liens adjacents ou ismap)
                if (verdict1_1.texte_a_evaluer_par_ia && base64Image) {
                    console.log(`  ⏳ Interrogation IA (Critère 1.3) sur : "${verdict1_1.texte_a_evaluer_par_ia}"...`);
                    const promptPertinence = PROMPT_CRITERE_1_3.replace('{ALT_TEXT}', verdict1_1.texte_a_evaluer_par_ia);
                    const reponsePertinence = await askVision(promptPertinence, base64Image);
                    
                    const isOK = reponsePertinence.statut === "VALIDE";
                    console.log(`  ${isOK ? '\x1b[32m✅\x1b[0m' : '\x1b[31m❌\x1b[0m'} Verdict 1.3 : [${reponsePertinence.statut}] ${reponsePertinence.raison}`);
                    
                    if (verdict1_1.alerte) console.log(`  ⚠️ ${verdict1_1.alerte}`); // Ex: Alerte Canvas 1.3.8

                    verdictFinal = { 
                        critere: "1.3", 
                        statut: reponsePertinence.statut, 
                        raison: reponsePertinence.raison,
                        suggestion: reponsePertinence.suggestion,
                        alerte_humaine: verdict1_1.alerte
                    };
                } else {
                    // Cas où 1.1 est valide, mais l'IA ne peut/doit pas évaluer la pertinence
                    if (verdict1_1.alerte) console.log(`  ⚠️ ${verdict1_1.alerte}`);
                    verdictFinal = verdict1_1;
                }
            }
        }

        // Compilation du rapport global
        resultatsComplets.push({
            image_src: img.src,
            tag: img.tagName,
            statut_semantique: statutSemantique,
            raison_classification: raisonStatut,
            verdict: verdictFinal
        });
    }

    return {
        theme: "1",
        resultats: resultatsComplets
    };
}