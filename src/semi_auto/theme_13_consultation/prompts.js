export const promptContenuCryptique = (donnees) => `Tu es un auditeur RGAA 4.1 strict. Ton rôle est d'évaluer le critère 13.5 (Contenus cryptiques, émoticônes, art ASCII).

DONNÉES EXTRAITES DE LA PAGE :
- Texte adjacent : "${donnees.texte}"
- Un attribut 'title' est-il présent dans le code HTML de ce bloc ? : ${donnees.possede_title ? "OUI" : "NON"}

RÈGLES D'ÉVALUATION :
1. Détection : Y a-t-il vraiment un émoticône fait avec de la ponctuation (ex: :-) ou ¯\\_(ツ)_/¯ ) ou de l'art ASCII ? (Ignore les émojis graphiques comme 😀). Si NON, le statut est "CONFORME" (Faux positif).
2. Conformité : Si un émoticône est présent, il est CONFORME uniquement si :
   - Un attribut 'title' est présent OU
   - Une définition textuelle explicite est donnée dans le contexte adjacent (juste à côté).
3. Sinon, le statut est "NON_CONFORME".

CONTRAINTES DE FORMATAGE (TRÈS IMPORTANT) :
- Tu dois retourner un objet JSON pur.
- AUCUN formatage Markdown (pas de \`\`\`json ... \`\`\`).
- TU DOIS ÉCHAPPER LES CARACTÈRES SPÉCIAUX : Si ton explication contient un backslash (\\), tu dois impérativement l'écrire avec un double backslash (\\\\). 
- Exemple de JSON correct : {"statut": "CONFORME", "explication": "L'émoticône ¯\\\\_(ツ)_/¯ est expliqué par le texte adjacent."}

RÉPONSE ATTENDUE (Format JSON STRICT) :
{
  "statut": "CONFORME" | "NON_CONFORME",
  "explication": "Justification ultra courte sans markdown"
}

RÉPONSE :`;

export const promptPertinenceCryptique = (donnees) => `Tu es un auditeur RGAA 4.1 expert. Ton rôle est d'évaluer le critère 13.6 : "L'alternative au contenu cryptique (art ASCII, émoticône) est-elle pertinente ?".

DONNÉES EXTRAITES DE LA PAGE :
  - Code HTML complet de l'élément : "${donnees.html}"
  - Texte adjacent : "${donnees.texte}"

RÈGLES D'ÉVALUATION UNIVERSELLES :

1. Identification du contenu : Y a-t-il un véritable contenu cryptique (émoticône typographique textuelle ou art ASCII) ? (Ignore le code source informatique ou les émojis graphiques natifs). Si aucun contenu cryptique n'est présent -> "NON_APPLICABLE".
   
2. Recherche de l'alternative : Analyse l'intégralité du code HTML et du texte. Une alternative est valide si elle se trouve :
   - Dans un attribut 'title' ou 'aria-label' (sur l'élément ou un parent/enfant proche).
   - Dans le texte directement adjacent (ex: entre parenthèses juste avant ou après).
   - Dans la cellule de tableau voisine (ex: si le symbole est dans un <td> et sa définition dans le <td> précédent).
   Si AUCUNE alternative textuelle n'est trouvée -> "NON_CONFORME".

3. Évaluation de la PERTINENCE : Si une alternative est trouvée, juge son sens :
   - PERTINENT : L'alternative décrit fidèlement l'émotion, le concept ou l'animal/objet représenté par le symbole (ex: "bear" pour ʕ·͡ᴥ·ʔ, ou "shrug" pour un haussement d'épaules). -> "CONFORME".
   - NON PERTINENT : L'alternative est absurde, contradictoire avec l'émotion du symbole, ou purement générique ("image", "symbole") sans en donner le sens. -> "NON_CONFORME".

CONTRAINTES DE FORMATAGE (STRICTES) :
  - Tu dois retourner un objet JSON pur (aucun markdown, pas de \`\`\`json).
  - Échappe impérativement tous les backslashs (ex: \\\\).

RÉPONSE ATTENDUE (Format JSON) : { "statut": "CONFORME" | "NON_CONFORME" | "NON_APPLICABLE", "explication": "Justification courte de l'alternative trouvée (ex: Le mot entre parenthèse décrit bien le symbole)." }

RÉPONSE :`;