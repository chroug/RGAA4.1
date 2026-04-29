// export async function askGemma(promptText) {
//     try {
//         const response = await fetch('http://localhost:11434/api/generate', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({
//                 model: 'mistral-nemo',  // 👈 LE CHANGEMENT MAGIQUE EST ICI
//                 prompt: promptText,
//                 format: 'json',         // On force le format JSON
//                 stream: false,
//                 options: {
//                     temperature: 0.1    // Température très basse pour une logique pure
//                 }
//             })
//         });

//         const data = await response.json();
        
//         // 🧹 Nettoyage de sécurité : si l'IA ajoute des balises Markdown autour du JSON
//         let textePropre = data.response.replace(/```json/gi, '').replace(/```/g, '').trim();
        
//         return JSON.parse(textePropre);

//     } catch (error) {
//         console.error("❌ Erreur de connexion avec Ollama :", error);
        
//         // Fallback adapté à notre nouvelle logique texte
//         return { 
//             statut: "NON_CONFORME", 
//             explication: "ERREUR DE SCRIPT : Impossible de lire la réponse de Mistral NeMo." 
//         };
//     }
// }


// Gemini API AI Helper

import dotenv from 'dotenv';

// Charge les variables du fichier .env
dotenv.config();

// Variables globales pour gérer la limite de requêtes (15 par minute)
let requetesCetteMinute = 0;
let debutDeLaMinute = Date.now();

// Fonction utilitaire pour mettre le script en pause (sleep)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fonction pour afficher un compte à rebours dynamique dans la console
async function compteARebours(secondes) {
    for (let i = secondes; i > 0; i--) {
        process.stdout.write(`\r⏳ Attente API... Reprise dans ${i} secondes... `);
        await sleep(1000);
    }
    process.stdout.write('\r✅ Reprise de l\'audit...                                \n');
}

export async function askGemma(promptText) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("❌ ERREUR : La clé GEMINI_API_KEY est introuvable dans le fichier .env !");
        return { statut: "NON_CONFORME", explication: "Clé API manquante." };
    }

    let maxTentatives = 20; // 🚜 LE MODE BULLDOZER : On insiste 20 fois s'il le faut
    let tentative = 1;

    while (tentative <= maxTentatives) {
        // --- GESTION DU RATE LIMITING PROACTIF ---
        const maintenant = Date.now();
        // Si une minute s'est écoulée depuis le début de notre compteur, on le réinitialise
        if (maintenant - debutDeLaMinute > 60000) {
            requetesCetteMinute = 0;
            debutDeLaMinute = maintenant;
        }

        // On force une pause si on approche de la limite des 15 requêtes/minute
        if (requetesCetteMinute >= 14) {
            const tempsRestantMs = 60000 - (maintenant - debutDeLaMinute);
            const tempsRestantSec = Math.ceil(tempsRestantMs / 1000);
            await compteARebours(tempsRestantSec);
            requetesCetteMinute = 0;
            debutDeLaMinute = Date.now();
        }

        try {
            requetesCetteMinute++; // On incrémente le compteur de requêtes
            
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`;
            
            // Timeout de sécurité (60 secondes) pour éviter que le script reste bloqué à l'infini
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                signal: controller.signal,
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: promptText }]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        responseMimeType: "application/json" 
                    }
                })
            });

            clearTimeout(timeoutId);
            const data = await response.json();

            // ⚠️ 1. Si l'API nous bloque (Surcharge 500, High Demand, ou 429 Too Many Requests)
            if (response.status === 429 || response.status >= 500 || (data.error && data.error.message && data.error.message.includes("high demand"))) {
                console.log(`\n⚠️ Serveurs Google surchargés. On retient le champ et on attend 30s... (Tentative ${tentative}/${maxTentatives})`);
                await compteARebours(30);
                tentative++;
                continue; // 🔄 Recommence la boucle sur le MÊME champ
            }

            // Autres erreurs API (ex: clé invalide)
            if (data.error) {
                console.log(`\n⚠️ Erreur API : ${data.error.message}. Pause 15s... (Tentative ${tentative}/${maxTentatives})`);
                await compteARebours(15);
                tentative++;
                continue;
            }

            // ✅ 2. L'API a bien répondu
            if (data.candidates && data.candidates.length > 0) {
                const reponseTexte = data.candidates[0].content.parts[0].text;
                
                // 🛡️ SÉCURITÉ JSON : Au cas où le modèle oublie le mode JSON et rajoute du texte
                const premierAccolade = reponseTexte.indexOf('{');
                const derniereAccolade = reponseTexte.lastIndexOf('}');
                
                if (premierAccolade !== -1 && derniereAccolade !== -1 && derniereAccolade > premierAccolade) {
                    const jsonExtrait = reponseTexte.substring(premierAccolade, derniereAccolade + 1);
                    try {
                        return JSON.parse(jsonExtrait); // Succès total !
                    } catch (parseError) {
                        return { statut: "NON_CONFORME", explication: `[ERREUR DE PARSING IA] : ${reponseTexte.trim()}` };
                    }
                } else {
                    return { statut: "NON_CONFORME", explication: `[RÉPONSE BRUTE IA] : ${reponseTexte.trim()}` };
                }
            } else {
                throw new Error("Structure de réponse inattendue de l'API Gemini.");
            }

        } catch (error) {
            // ⚠️ 3. Gestion des coupures de réseau locales ou timeout
            if (error.name === 'AbortError' || error.message.includes('fetch failed')) {
                console.log(`\n⏳ Coupure réseau ou Timeout. On attend 10s... (Tentative ${tentative}/${maxTentatives})`);
                await compteARebours(10);
                tentative++;
                continue; // 🔄 Recommence la boucle
            }

            // ❌ Si on a échoué 20 fois de suite, on abandonne pour de bon
            if (tentative >= maxTentatives) {
                console.error("\n❌ ABANDON APRÈS 20 TENTATIVES :", error.message);
                return { 
                    statut: "NON_CONFORME", 
                    explication: `ERREUR FATALE : ${error.message}` 
                };
            }

            // Pour toute autre erreur non prévue, on attend et on réessaie
            console.log(`\n⚠️ Erreur inconnue de connexion, pause de 10s... (Tentative ${tentative}/${maxTentatives})`);
            await compteARebours(10);
            tentative++;
        }
    } // Fin du While
}