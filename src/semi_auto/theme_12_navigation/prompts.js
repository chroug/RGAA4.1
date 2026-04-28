export const promptLienEvitement = (lienData) => `Tu es un auditeur RGAA 4.1 intransigeant.
Règle RGAA 12.7 : Il doit exister un lien d'évitement ou d'accès rapide fonctionnel et visible (au moins à la prise de focus).

VOICI LES DONNÉES EXTRAITES DE LA PAGE :
- Code HTML du lien : "${lienData.html}"
- La cible de ce lien existe-t-elle dans la page ? : ${lienData.cible_existe ? "OUI" : "NON"}
- Ce lien est-il bloqué visuellement par un "display: none" ? : ${lienData.est_masque_display_none ? "OUI" : "NON"}

MISSION :
Vérifie la validité de ce lien d'évitement. Le lien est INVALIDE (contient_erreur: true) si :
1. Le texte n'est pas explicite (ex: "cliquez ici").
2. La cible n'existe pas ("NON" ci-dessus).
3. Le lien est masqué par un display:none ("OUI" ci-dessus), l'empêchant de prendre le focus.

Réponds STRICTEMENT avec ce format JSON :
{
  "contient_erreur": true ou false,
  "explication": "Justification ultra courte"
}`;