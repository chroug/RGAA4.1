import ollama from 'ollama';
import fs from 'fs';

async function testerVision() {
  console.log("🤖 Connexion à l'IA locale en cours...");

  try {
    const cheminImage = './low-dog.jpg';
    const alt = 'chien';
    
    // Node.js lit le fichier et le convertit en Base64
    const imageBase64 = fs.readFileSync(cheminImage, { encoding: 'base64' });

    const reponse = await ollama.chat({
      model: 'llava',
      format: 'json',
      options: {
        temperature: 0.0, 
        num_predict: 250 // <-- CORRIGÉ : On lui donne assez de mots pour finir sa phrase
      },
      messages: [{   
        role: 'user', 
        content: `
          Agis comme un expert en accessibilité web (RGAA). 
          Je te fournis une image et son attribut alt actuel : "${alt}".

          Ta mission est d'évaluer si ce texte alternatif décrit correctement l'image.

          Règles strictes :
          1. Analyse l'image avec précision.
          2. Si tu as le moindre doute (image floue, ambiguë, concept abstrait), tu dois l'indiquer.
          3. N'inclus AUCUN saut de ligne dans tes textes et n'utilise pas de guillemets doubles à l'intérieur de tes phrases.
          
          Réponds UNIQUEMENT au format JSON avec cette structure exacte, sans aucun autre texte :
          {
            "correspond": boolean,
            "doute_existant": true ou false,
            "explication_doute": "Si doute_existant est true, explique pourquoi tu hésites. Sinon laisse vide.",
            "description_detaillee": "Décris ce que tu vois réellement sur l'image.",
            "suggestion_alt": "Ta meilleure suggestion courte pour remplacer l'attribut alt."
          }
        `,
        images: [imageBase64]
      }]
    });

    let resultat;
    
    // 🛡️ NOUVEAU : Le bouclier pour empêcher le script de crasher si l'IA écrit mal le JSON
    try {
        resultat = JSON.parse(reponse.message.content);
    } catch (parseErreur) {
        console.log("\n⚠️ L'IA a fait une faute de frappe dans son JSON !");
        console.log("Voici sa réponse brute pour comprendre l'erreur :");
        console.log("--------------------------------------------------");
        console.log(reponse.message.content);
        console.log("--------------------------------------------------");
        return; // On arrête le script proprement ici
    }

    console.log("\n✅ Analyse terminée ! Voici le rapport structuré :\n");
    console.log(`- Correspondance : ${resultat.correspond ? "✅ Oui" : "❌ Non"}`);
    console.log(`- Doute de l'IA  : ${resultat.doute_existant ? "⚠️ Oui" : "✅ Non"}`);
    
    if (resultat.doute_existant) {
        console.log(`  👉 Explication   : ${resultat.explication_doute}`);
    }
    
    console.log(`- Description    : ${resultat.description_detaillee}`);
    console.log(`- Suggestion alt : "${resultat.suggestion_alt}"\n`);
    
  } catch (erreur) {
    console.error("❌ Erreur :", erreur.message);
  }
}

testerVision();