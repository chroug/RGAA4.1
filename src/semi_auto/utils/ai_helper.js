// Gemini API AI Helper

import dotenv from 'dotenv';

// Charge les variables du fichier .env
dotenv.config();

// ========================================================================
// 🔑 SYSTÈME DE ROTATION DES CLÉS API (POOL)
// ========================================================================
const apiKeys = [];
for (let i = 1; i <= 10; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    
    // 👇 NOTE SUR LA FONCTIONNALITÉ DONT NOUS AVONS PARLÉ :
    // 💡 C'est ce "if" qui crée le tri dynamique. Il vérifie que la clé existe ET qu'elle n'est pas vide.
    // Si tu n'as rempli que les clés 1 à 4 dans ton .env, les clés 5 à 10 seront silencieusement ignorées ici.
    // Le tableau `apiKeys` ne contiendra donc que tes 4 clés valides, sans jamais provoquer d'erreur.
    if (key && key.trim() !== "") {
        apiKeys.push(key.trim());
    }
}

// Fallback : Si l'utilisateur utilise encore l'ancien nom "GEMINI_API_KEY"
if (apiKeys.length === 0 && process.env.GEMINI_API_KEY) {
    apiKeys.push(process.env.GEMINI_API_KEY.trim());
}

if (apiKeys.length === 0) {
    console.error("❌ ERREUR FATALE : Aucune clé API trouvée dans le fichier .env !");
    process.exit(1); // Arrêt immédiat si aucune clé n'est trouvée
}

let currentKeyIndex = 0;
let requestCountCurrentKey = 0;
const MAX_REQUESTS_PER_KEY = 500; // Limite gratuite par jour

// Variables globales pour gérer la limite de requêtes (15 par minute)
let requetesCetteMinute = 0;
let debutDeLaMinute = Date.now();

// 🔄 Fonction interne pour récupérer la bonne clé et gérer la rotation
function getApiKeyAndManageRotation(onStatusChange = null) {
    if (requestCountCurrentKey >= MAX_REQUESTS_PER_KEY) {
        forceKeyRotation("Limite des 500 requêtes atteinte", onStatusChange);
    }
    
    requestCountCurrentKey++;
    return apiKeys[currentKeyIndex];
}

// 🔄 Fonction pour forcer la rotation (ex: si l'API nous signale que le quota est vide avant les 500)
function forceKeyRotation(raison, onStatusChange = null) {
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    requestCountCurrentKey = 0; // On remet le compteur à 0 pour la nouvelle clé
    requetesCetteMinute = 0;    // Nouvelle clé = nouveau quota de 15 par minute !
    debutDeLaMinute = Date.now();

    const msg = `🔄 Rotation API (${raison}) : Passage à la clé n°${currentKeyIndex + 1}/${apiKeys.length}`;
    if (onStatusChange) {
        onStatusChange(msg, false);
    } else {
        console.log(`\n ${msg}`);
    }
}

// Fonction utilitaire pour mettre le script en pause (sleep)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 🛠️ COMPTE À REBOURS INTELLIGENT
async function compteARebours(secondes, message = "Attente API", onStatusChange = null) {
    for (let i = secondes; i > 0; i--) {
        const texteDynamique = `${message} - Reprise dans ${i}s...`;
        
        if (onStatusChange) {
            onStatusChange(texteDynamique, true); // true = PAUSE
        } else {
            process.stdout.write(`\r⏳ ⚠️ ${texteDynamique} \x1b[K`);
        }
        await sleep(1000);
    }
    
    if (onStatusChange) {
        onStatusChange("", false); // false = REPRISE
    } else {
        process.stdout.write('\r\x1b[K');
    }
}


// ========================================================================
// TEXTE : askGemma
// ========================================================================
export async function askGemma(promptText, onStatusChange = null) {
    let maxTentatives = 40; 
    let tentative = 1;

    while (tentative <= maxTentatives) {
        // --- GESTION DU RATE LIMITING PROACTIF (15 par minute) ---
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
            // 👈 ON DEMANDE LA CLÉ (Gère la rotation auto toutes les 500 requêtes)
            const apiKey = getApiKeyAndManageRotation(onStatusChange);
            
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;
            
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

            // ⚠️ GESTION DES ERREURS GOOGLE
            if (response.status === 429 || response.status >= 500 || data.error) {
                const errorMessage = (data.error && data.error.message) ? data.error.message.toLowerCase() : "";

                // 🔄 SI LE QUOTA JOURNALIER EST ÉPUISÉ (Forçage de la rotation)
                if (errorMessage.includes("quota") && !errorMessage.includes("minute")) {
                    forceKeyRotation("Quota journalier épuisé", onStatusChange);
                    continue; // On relance immédiatement avec la nouvelle clé !
                }

                // SI C'EST JUSTE UNE SURCHARGE TEMPORAIRE
                await compteARebours(5, `Serveurs surchargés/Erreur (Tentative ${tentative}/${maxTentatives})`, onStatusChange);
                tentative++;
                continue; 
            }

            // ✅ L'API a bien répondu
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
            if (error.name === 'AbortError' || error.message.includes('fetch failed')) {
                await compteARebours(5, `Coupure réseau/Timeout (Tentative ${tentative}/${maxTentatives})`, onStatusChange);
                tentative++;
                continue;
            }

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
    let maxTentatives = 40;
    let tentative = 1;

    while (tentative <= maxTentatives) {
        try {
            const apiKey = getApiKeyAndManageRotation(onStatusChange);
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;
            
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

            if (response.status === 429 || response.status >= 500 || data.error) {
                const errorMessage = (data.error && data.error.message) ? data.error.message.toLowerCase() : "";

                if (errorMessage.includes("quota") && !errorMessage.includes("minute")) {
                    forceKeyRotation("Quota journalier épuisé", onStatusChange);
                    continue; 
                }

                await compteARebours(5, `Surcharge Vision (Tentative ${tentative}/${maxTentatives})`, onStatusChange);
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
    const partsArray = [
        { text: promptText },
        { inlineData: { mimeType: "image/jpeg", data: base64Global } },
        { inlineData: { mimeType: "image/jpeg", data: base64Cible } }
    ];

    let maxTentatives = 40;
    let tentative = 1;

    while (tentative <= maxTentatives) {
        try {
            const apiKey = getApiKeyAndManageRotation(onStatusChange);
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;
            
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

            if (response.status === 429 || response.status >= 500 || data.error) {
                const errorMessage = (data.error && data.error.message) ? data.error.message.toLowerCase() : "";

                if (errorMessage.includes("quota") && !errorMessage.includes("minute")) {
                    forceKeyRotation("Quota journalier épuisé", onStatusChange);
                    continue; 
                }

                await compteARebours(5, `Surcharge Vision Contextuelle (Tentative ${tentative}/${maxTentatives})`, onStatusChange);
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