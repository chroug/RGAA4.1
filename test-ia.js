// Fichier: test-ia.js
// Utilisation : node test-ia.js

const imagesATester = [
    {
        nom: "Test Pertinence (Vrai)",
        url: "https://cdn.pixabay.com/photo/2016/11/21/06/53/beautiful-natural-image-1844362_1280.jpg",
        alt_text: "Un chat assis sur un canapé"
    },
    {
        nom: "Test Pertinence (Faux)",
        url: "https://static.vecteezy.com/system/resources/thumbnails/066/582/335/small/monarch-butterfly-resting-on-green-leaf-vibrant-nature-image-close-up-free-photo.jpg",
        alt_text: "papillon orange et noir posé sur une feuille verte"
    },
    {
        nom: "Test Image-Texte",
        url: "https://cdn.creativefabrica.com/2021/05/19/Buy-online-icon-Graphics-12193041-1-1-580x386.jpg",
        alt_text: "Bouton d'achat"
    }
];


async function lancerTestIA() {
    for (const test of imagesATester) {
        console.log(`\n📸 Test en cours : ${test.nom}`);
        
        try {
            // 1. Télécharger l'image depuis l'URL
            const reponse = await fetch(test.url);
            if (!reponse.ok) throw new Error(`Erreur réseau HTTP ${reponse.status}`);
            
            const buffer = await reponse.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64'); // <-- Base64 pur pour Ollama

            console.log(`✅ Image téléchargée et convertie en Base64.`);
            console.log(`📝 Texte alt à vérifier : "${test.alt_text}"`);

            // 2. Le Prompt pour ton IA
// 2. Le Prompt optimisé (Consignes en Anglais, Données en Français)
            const prompt = `
            You are an expert accessibility auditor. Compare the image with the following French alt-text: "${test.alt_text}".
            
            Task: Does the alt-text accurately describe the main subject of the image?
            
            Rules for your response:
            - If the alt-text correctly describes the image, output EXACTLY the word: CONFORME
            - If the alt-text is completely wrong (for example, saying it's a car when it's a butterfly), output EXACTLY the word: NON_CONFORME
            - If it contains a lot of embedded text or if you are not 100% sure, output EXACTLY the word: INCERTAIN
            
            Do not explain your reasoning. Output only ONE word.
            `;

            console.log("🤖 Appel de LLaVA en cours (ça va prendre quelques secondes)...");
            
            // 3. VRAI APPEL À OLLAMA (LLaVA)
            const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'llava', // Assure-toi que LLaVA est bien installé
                    prompt: prompt,
                    images: [base64], // Ollama veut le base64 PUR, sans le préfixe "data:image/..."
                    stream: false     // On veut la réponse complète en une seule fois
                })
            });

            if (!ollamaResponse.ok) {
                throw new Error("Ollama ne répond pas correctement. Est-il bien lancé en arrière-plan ?");
            }

            const data = await ollamaResponse.json();
            
            console.log(`👉 RÉPONSE DE L'IA : ${data.response.trim()}`);
            console.log("--------------------------------------------------");

        } catch (erreur) {
            console.error(`❌ Erreur sur l'image ${test.nom}:`, erreur.message);
            console.log("👉 Astuce : N'oublie pas de lancer l'application Ollama et d'avoir téléchargé le modèle (ollama pull llava)");
        }
    }
}

lancerTestIA();