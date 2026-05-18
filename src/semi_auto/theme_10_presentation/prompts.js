// 🎯 Prompt pour le Critère 10.2 (Textes injectés en CSS)
export const promptCritere10_2 = (texteCSS, tagName) => `Tu es un expert auditeur RGAA 4.1.
Ta mission est d'évaluer une partie du Critère 10.2 : "L'information reste-t-elle présente lorsque les feuilles de styles sont désactivées ?".

Nous avons détecté qu'un développeur a injecté le texte suivant via CSS (pseudo-élément ::before ou ::after) sur une balise <${tagName}> :
Texte injecté : "${texteCSS}"

RÈGLES D'ÉVALUATION :
1. ✅ DÉCORATIF (CONFORME) : Si le texte est purement cosmétique (ex: des guillemets decoratifs, des séparateurs, des puces complexes, des numéros de liste automatiques simples), l'information n'est pas perdue -> CONFORME.
2. 🚨 INFORMATIF (NON_CONFORME) : Si le texte apporte un SENS (ex: "Requis", "*", "Nouveau", "Attention", "Étape 1"), s'il disparait sans CSS, l'utilisateur perd l'information -> NON_CONFORME.

MISSION :
Réponds STRICTEMENT avec ce format JSON :
{
  "statut": "CONFORME" ou "NON_CONFORME",
  "explication": "Justification ultra courte."
}`;