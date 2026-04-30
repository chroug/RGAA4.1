// 🎯 Prompt pour le Critère 7.5 (Messages de statut)
export const promptMessageStatut = (htmlExtrait) => `Tu es un expert auditeur RGAA 4.1.
Le critère 7.5 exige que les messages de statut (succès, erreur, progression) apparus dynamiquement soient vocalisés par les lecteurs d'écran via WAI-ARIA.

EXTRAIT HTML DU MESSAGE :
"${htmlExtrait}"

RÈGLES D'ÉVALUATION RGAA :
1. Lis le texte dans le HTML pour comprendre le contexte.
2. Si c'est un message de RÉUSSITE ou d'ÉTAT (ex: "Enregistré", "Mise à jour réussie") :
   -> Il DOIT avoir role="status" OU (aria-live="polite" ET aria-atomic="true").
3. Si c'est une ERREUR ou AVERTISSEMENT (ex: "Mot de passe incorrect", "Champ requis") :
   -> Il DOIT avoir role="alert" OU (aria-live="assertive" ET aria-atomic="true").
4. Si c'est une PROGRESSION (ex: "Chargement...") :
   -> Il DOIT avoir role="progressbar", role="log", role="status" OU aria-live="polite".
5. Si ce n'est PAS un message de statut (ex: juste un titre de section qui contient le mot "Erreur", ou un bouton), c'est hors-sujet. -> CONFORME (Aucun attribut requis).

MISSION :
Vérifie si le message HTML respecte strictement les règles ci-dessus.
Réponds STRICTEMENT avec ce format JSON :
{
  "contient_erreur": true ou false,
  "attribut_aria_trouve": "Indique ce que tu as trouvé (ex: role='alert', ou 'Aucun')",
  "explication": "Explique pourquoi c'est conforme ou non selon le RGAA."
}`;