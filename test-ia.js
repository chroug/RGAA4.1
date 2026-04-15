import ollama from 'ollama';
async function testerGemma() {
  console.log("🤖 Connexion à l'IA locale en cours...");

  try {
    const reponse = await ollama.chat({
      model: 'gemma', 
      messages: [{ 
        role: 'user', 
        content: 'Bonjour ! Es-tu prêt à analyser du code HTML pour un audit RGAA ? Réponds en une seule phrase.' 
      }]
    });

    console.log("✅ Réponse de l'IA :", reponse.message.content);
    
  } catch (erreur) {
    console.error("❌ Impossible de joindre l'IA. Vérifie qu'Ollama est bien lancé :", erreur.message);
  }
}

testerGemma();