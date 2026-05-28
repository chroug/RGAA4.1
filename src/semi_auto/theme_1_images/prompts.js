// src/semi_auto/theme_1_images/prompts.js

export const PROMPT_CLASSIFICATION = `
Tu es un expert en accessibilité numérique (RGAA 4.1).
Je vais te fournir DEUX images :
1. La première image est le contexte global de la page web.
2. La deuxième image est l'élément graphique spécifique à analyser.

Texte HTML adjacent détecté (s'il y en a) : "{CONTEXTE_HTML}".

Ta mission est d'observer l'élément spécifique DANS le contexte global de la page, et de le classifier sémantiquement :
1. "INFORMATIF" : L'image apporte une information utile (graphique, logo seul, icône d'action sans texte redondant).
2. "DECORATIF" : L'image est purement esthétique OU elle est redondante visuellement avec du texte présent juste à côté d'elle dans la page.
3. "CAPTCHA" : C'est un test anti-robot ou visuel.

Réponds OBLIGATOIREMENT ET UNIQUEMENT sous ce format JSON :
{
  "statut": "INFORMATIF" ou "DECORATIF" ou "CAPTCHA",
  "raison": "Explication courte de ton choix en 1 phrase basée sur le contexte visuel."
}
`;

export const PROMPT_CRITERE_1_3 = `
Tu es un auditeur RGAA 4.1 expert.
Cette image a été qualifiée de PORTEUSE D'INFORMATION.
Le développeur lui a attribué ce texte alternatif (Accessible Name) : "{ALT_TEXT}"

Ta mission : Évaluer la PERTINENCE de ce texte (Critère 1.3).
Règles strictes :
- Le texte doit décrire fidèlement l'information ou la fonction de l'image.
- Le texte NE DOIT PAS commencer par "Image de" ou "Logo de".
- Le texte NE DOIT PAS être juste un nom de fichier (ex: "photo_01.jpg").
- Le texte doit être concis (Critère 1.3.9). Si l'image est très complexe (graphique), un résumé suffit.

Réponds OBLIGATOIREMENT ET UNIQUEMENT sous ce format JSON :
{
  "statut": "VALIDE" ou "INVALIDE",
  "raison": "Explication de ton verdict",
  "suggestion": "Si invalide, propose la meilleure alternative textuelle possible. Si valide, laisse vide."
}
`;