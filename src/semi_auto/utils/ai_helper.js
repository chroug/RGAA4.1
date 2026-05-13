// Gemini API AI Helper

import dotenv from 'dotenv';

// Charge les variables du fichier .env
dotenv.config();

// Variables globales pour gérer la limite de requêtes (15 par minute)
let requetesCetteMinute = 0;
let debutDeLaMinute = Date.now();

// Fonction utilitaire pour mettre le script en pause (sleep)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 🛠️ NOUVEAU COMPTE À REBOURS INTELLIGENT
// Il communique avec le Loader via "onStatusChange" pour suspendre et reprendre l'animation
async function compteARebours(secondes, message = "Attente API", onStatusChange = null) {
    for (let i = secondes; i > 0; i--) {
        const texteDynamique = `${message} - Reprise dans ${i}s...`;
        
        if (onStatusChange) {
            // 👈 On envoie "true" pour indiquer que l'on est en PAUSE
            onStatusChange(texteDynamique, true);
        } else {
            // Comportement par défaut (s'il n'y a pas de Loader)
            process.stdout.write(`\r⏳ ⚠️ ${texteDynamique} \x1b[K`);
        }
        await sleep(1000);
    }
    
    if (onStatusChange) {
        // 👈 Fin du chrono : On envoie "false" pour indiquer la REPRISE
        onStatusChange("", false);
    } else {
        process.stdout.write('\r\x1b[K'); // Nettoie la ligne à la fin
    }
}

// ========================================================================
// TEXTE : askGemma
// ========================================================================
export async function askGemma(promptText, onStatusChange = null) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("❌ ERREUR : La clé GEMINI_API_KEY est introuvable dans le fichier .env !");
        return { statut: "NON_CONFORME", explication: "Clé API manquante." };
    }

    let maxTentatives = 40; 
    let tentative = 1;

    while (tentative <= maxTentatives) {
        // --- GESTION DU RATE LIMITING PROACTIF ---
        const maintenant = Date.now();
        if (maintenant - debutDeLaMinute > 60000) {
            requetesCetteMinute = 0;
            debutDeLaMinute = maintenant;
        }

        if (requetesCetteMinute >= 14) {
            const tempsRestantMs = 60000 - (maintenant - debutDeLaMinute);
            const tempsRestantSec = Math.ceil(tempsRestantMs / 1000);
            await compteARebours(tempsRestantSec, "Limite de requêtes atteinte", onStatusChange);
            requetesCetteMinute = 0;
            debutDeLaMinute = Date.now();
        }

        try {
            requetesCetteMinute++; 
            
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptText }] }],
                    generationConfig: {
                        temperature: 0.1,
                        responseMimeType: "application/json" 
                    }
                })
            });

            clearTimeout(timeoutId);
            const data = await response.json();

            // ⚠️ 1. Si l'API nous bloque (Surcharge 500, High Demand, ou 429)
            if (response.status === 429 || response.status >= 500 || (data.error && data.error.message && data.error.message.includes("high demand"))) {
                await compteARebours(5, `Serveurs surchargés (Tentative ${tentative}/${maxTentatives})`, onStatusChange);
                tentative++;
                continue; 
            }

            // Autres erreurs API (ex: clé invalide)
            if (data.error) {
                await compteARebours(5, `Erreur API: ${data.error.message} (Tentative ${tentative})`, onStatusChange);
                tentative++;
                continue;
            }

            // ✅ 2. L'API a bien répondu
            if (data.candidates && data.candidates.length > 0) {
                const reponseTexte = data.candidates[0].content.parts[0].text;
                
                const premierAccolade = reponseTexte.indexOf('{');
                const derniereAccolade = reponseTexte.lastIndexOf('}');
                
                if (premierAccolade !== -1 && derniereAccolade !== -1 && derniereAccolade > premierAccolade) {
                    const jsonExtrait = reponseTexte.substring(premierAccolade, derniereAccolade + 1);
                    try {
                        return JSON.parse(jsonExtrait);
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
                await compteARebours(5, `Coupure réseau/Timeout (Tentative ${tentative}/${maxTentatives})`, onStatusChange);
                tentative++;
                continue;
            }

            // ❌ Abandon définitif
            if (tentative >= maxTentatives) {
                if (!onStatusChange) console.error("\n❌ ABANDON APRÈS 40 TENTATIVES :", error.message);
                return { statut: "NON_CONFORME", explication: `ERREUR FATALE : ${error.message}` };
            }

            await compteARebours(5, `Erreur de connexion (Tentative ${tentative}/${maxTentatives})`, onStatusChange);
            tentative++;
        }
    } 
}


// ========================================================================
// VISION : askVision
// ========================================================================
export async function askVision(promptText, base64Image, onStatusChange = null) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return { statut: "NON_CONFORME", explication: "Clé API manquante." };
    }

    let maxTentatives = 40;
    let tentative = 1;

    while (tentative <= maxTentatives) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: promptText },
                            { inlineData: { mimeType: "image/jpeg", data: base64Image } }
                        ]
                    }],
                    generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
                })
            });

            clearTimeout(timeoutId);
            const data = await response.json();

            if (data.error) {
                const errorMessage = data.error.message || "";
                if (errorMessage.toLowerCase().includes("high demand") || errorMessage.toLowerCase().includes("quota") || response.status === 429 || response.status >= 500) {
                    await compteARebours(5, `Surcharge Vision (Tentative ${tentative}/${maxTentatives})`, onStatusChange);
                    tentative++;
                    continue; 
                } else {
                    if(!onStatusChange) console.error(`\n❌ GOOGLE A DÉFINITIVEMENT REFUSÉ L'IMAGE : ${errorMessage}`);
                    return { statut: "NON_CONFORME", explication: `Erreur API : ${errorMessage}` };
                }
            }

            if (response.status === 429 || response.status >= 500) {
                await compteARebours(5, `Erreur réseau Vision (Tentative ${tentative}/${maxTentatives})`, onStatusChange);
                tentative++;
                continue;
            }

            if (data.candidates && data.candidates.length > 0) {
                const reponseTexte = data.candidates[0].content.parts[0].text;
                const premierAccolade = reponseTexte.indexOf('{');
                const derniereAccolade = reponseTexte.lastIndexOf('}');
                
                if (premierAccolade !== -1 && derniereAccolade !== -1) {
                    const jsonExtrait = reponseTexte.substring(premierAccolade, derniereAccolade + 1);
                    return JSON.parse(jsonExtrait); 
                }
            }
            
            throw new Error(`Structure inattendue : ${JSON.stringify(data)}`);

        } catch (error) {
            await compteARebours(5, `Crash local Vision (Tentative ${tentative}/${maxTentatives})`, onStatusChange);
            tentative++;
        }
    }
    
    return { statut: "NON_CONFORME", explication: "Échec de l'analyse visuelle après 40 tentatives." };
}


// ========================================================================
// VISION CONTEXTUELLE : askVisionWithContext
// ========================================================================
export async function askVisionWithContext(promptText, base64Global, base64Cible, onStatusChange = null) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return { statut: "NON_CONFORME", explication: "Clé API manquante." };
    }

    const partsArray = [
        { text: promptText },
        { inlineData: { mimeType: "image/jpeg", data: base64Global } },
        { inlineData: { mimeType: "image/jpeg", data: base64Cible } }
    ];

    let maxTentatives = 40;
    let tentative = 1;

    while (tentative <= maxTentatives) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    contents: [{ parts: partsArray }],
                    generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
                })
            });

            clearTimeout(timeoutId);
            const data = await response.json();

            if (data.error) {
                const errorMessage = data.error.message || "";
                if (errorMessage.toLowerCase().includes("high demand") || errorMessage.toLowerCase().includes("quota") || response.status === 429 || response.status >= 500) {
                    await compteARebours(5, `Surcharge Vision Contextuelle (Tentative ${tentative}/${maxTentatives})`, onStatusChange);
                    tentative++;
                    continue; 
                } else {
                    return { statut: "NON_CONFORME", explication: `Erreur API : ${errorMessage}` };
                }
            }

            if (response.status === 429 || response.status >= 500) {
                await compteARebours(5, `Erreur réseau API (Tentative ${tentative}/${maxTentatives})`, onStatusChange);
                tentative++;
                continue;
            }

            if (data.candidates && data.candidates.length > 0) {
                const reponseTexte = data.candidates[0].content.parts[0].text;
                const premierAccolade = reponseTexte.indexOf('{');
                const derniereAccolade = reponseTexte.lastIndexOf('}');
                
                if (premierAccolade !== -1 && derniereAccolade !== -1) {
                    const jsonExtrait = reponseTexte.substring(premierAccolade, derniereAccolade + 1);
                    return JSON.parse(jsonExtrait); 
                }
            }
            
            throw new Error(`Structure inattendue : ${JSON.stringify(data)}`);

        } catch (error) {
            await compteARebours(5, `Crash local Vision (Tentative ${tentative}/${maxTentatives})`, onStatusChange);
            tentative++;
        }
    }
    
    return { statut: "NON_CONFORME", explication: "Échec de l'analyse visuelle après 40 tentatives." };
}