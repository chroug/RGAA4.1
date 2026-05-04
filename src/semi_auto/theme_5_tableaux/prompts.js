// ==========================================
// PROMPT POUR LE CRITÈRE 5.2 (PERTINENCE DU RÉSUMÉ)
// ==========================================
export const promptPertinenceTableau = (htmlTableau, texteResume) => `Tu es un expert auditeur RGAA 4.1.
Le critère 5.2 exige que le résumé d'un tableau de données complexe soit PERTINENT. Il doit décrire la nature des données et la structure du tableau pour aider un utilisateur aveugle à s'y repérer.

RÉSUMÉ DÉTECTÉ :
"${texteResume}"

CODE HTML DU TABLEAU :
\`\`\`html
${htmlTableau}
\`\`\`

RÈGLES D'ÉVALUATION :
1. Si le résumé décrit correctement ce que contient le tableau ET comment il est organisé (ex: "Ce tableau présente X. Les lignes sont Y et les colonnes sont Z"), c'est CONFORME.
2. Si le résumé est hors-sujet, s'il répète juste le titre sans expliquer la structure, ou s'il donne une information qui ne correspond pas aux données du tableau, c'est NON_CONFORME.

MISSION :
Le résumé fourni est-il pertinent par rapport au code HTML du tableau ?
Réponds STRICTEMENT avec ce format JSON :
{
  "statut": "CONFORME" ou "NON_CONFORME",
  "explication": "Explication courte et précise de ta décision."
}`;

// ==========================================
// PROMPT POUR LE CRITÈRE 5.7 (LOGIQUE DES EN-TÊTES)
// ==========================================
// export const promptLogiqueEnTetesTableau = (htmlTableau) => `Tu es un expert auditeur RGAA 4.1, extrêmement rigoureux.
// Le critère 5.7 évalue l'association stricte entre les cellules et les en-têtes.

// CODE HTML DU TABLEAU :
// \`\`\`html
// ${htmlTableau}
// \`\`\`

// VÉRIFIE STRICTEMENT CES 5 SOUS-CRITÈRES :
// 1. [TEST 5.7.1 - Présence] CHAQUE <th> principal DOIT posséder un 'scope', un 'id', OU un 'role'. 
//    ⚠️ EXCEPTION ABSOLUE : Une cellule vide (<td> ou <th> sans texte) située dans le coin supérieur gauche du tableau EST TOTALEMENT AUTORISÉE et DOIT ÊTRE IGNORÉE par ce test. Ne signale aucune erreur pour cette cellule.
// 2. [TEST 5.7.2 - Valeurs Scope] Un 'scope="col"' DOIT encadrer les données d'une colonne (verticale). Un 'scope="row"' DOIT encadrer les données d'une ligne (horizontale). Inversion = NON_CONFORME.
// 3. [TEST 5.7.3 - Sous-en-têtes] Un <th> intermédiaire (qui ne couvre qu'une sous-partie des données) NE DOIT PAS avoir de 'scope' ni de 'role'. Il DOIT avoir un 'id'. Présence de scope/role sur un sous-en-tête = NON_CONFORME.
// 4. [TEST 5.7.4 - Logique Headers/ID] Si une cellule utilise 'headers="X"', l'association avec l'ID appelé doit avoir du sens par rapport à la structure de données.
// 5. [TEST 5.7.5 - Valeurs Role] Un 'role="columnheader"' encadre une colonne, 'role="rowheader"' encadre une ligne. Inversion = NON_CONFORME.

// RÈGLES DE PRIORITÉ :
// - Si le tableau est à simple entrée (une seule ligne ou colonne d'en-tête), l'absence totale d'attributs (scope/id/role) est CONFORME.
// - Un attribut 'headers' sur une cellule écrase et remplace la portée d'un éventuel 'scope'.

// MISSION :
// Évalue ce tableau. Réponds STRICTEMENT avec ce format JSON RAW (SANS AUCUNE BALISE MARKDOWN COMME \`\`\`json ET SANS TEXTE AUTOUR) :
// {
//   "statut": "CONFORME" ou "NON_CONFORME",
//   "explication": "Mentionne le numéro du sous-critère violé ou explique que tout est correct."
// }`;

// ==========================================
// PROMPTS POUR LE CRITÈRE 5.7 (DÉCOUPAGE EN 3 ÉTAPES)
// ==========================================

// ÉTAPE 1 : Vérification de la présence basique (5.7.1)
export const prompt571_Presence = (htmlTableau) => `Tu es un expert RGAA 4.1.
MISSION : Vérifie le Test 5.7.1 sur ce tableau.
RÈGLE : Dans un tableau complexe, CHAQUE <th> principal DOIT posséder un attribut 'scope', 'id', OU 'role'. 
EXCEPTION : Ignore totalement les cellules vides (<td> ou <th>) situées dans le coin supérieur gauche, elles ont le droit de ne rien avoir.
TOLÉRANCE : Si le tableau est à simple entrée (une seule ligne/colonne d'en-tête), l'absence d'attributs est CONFORME.

HTML :
\`\`\`html
${htmlTableau}
\`\`\`

Réponds STRICTEMENT avec ce format JSON RAW :
{ "statut": "CONFORME" ou "NON_CONFORME", "explication": "..." }`;

// ÉTAPE 2 : Vérification de la direction (5.7.2 et 5.7.5)
export const prompt572_Direction = (htmlTableau) => `Tu es un expert RGAA 4.1.
MISSION : Vérifier si les attributs 'scope' ou 'role' sont INVERSÉS (Tests 5.7.2 et 5.7.5).

🛑 RÈGLE D'EXCLUSION ABSOLUE (À VÉRIFIER EN PREMIER) :
Si le tableau NE POSSÈDE AUCUN attribut 'scope' ET AUCUN attribut 'role="columnheader"' ou 'role="rowheader"' sur ses <th>, tu DOIS IMMÉDIATEMENT répondre CONFORME. Ne cherche pas plus loin. (Ceci couvre les tableaux simples et ceux utilisant des 'id').

RÈGLES D'ÉVALUATION (Uniquement si scope ou role sont présents) :
1. Un 'scope="col"' ou 'role="columnheader"' DOIT encadrer une colonne verticale. 
2. Un 'scope="row"' ou 'role="rowheader"' DOIT encadrer une ligne horizontale.
Si tu trouves une inversion flagrante, réponds NON_CONFORME.

HTML :
\`\`\`html
${htmlTableau}
\`\`\`

Réponds STRICTEMENT avec ce format JSON RAW :
{ "statut": "CONFORME" ou "NON_CONFORME", "explication": "..." }`;


// ÉTAPE 3 : Vérification de la logique complexe (5.7.3 et 5.7.4)
export const prompt573_LogiqueID = (htmlTableau) => `Tu es un expert RGAA 4.1.
MISSION : Vérifier les liaisons complexes d'identifiants (Tests 5.7.3 et 5.7.4).

🛑 RÈGLE D'EXCLUSION ABSOLUE (À VÉRIFIER EN PREMIER) :
Si le tableau est à SIMPLE ENTRÉE (une seule ligne d'en-tête et/ou une seule colonne d'en-tête, sans sous-niveaux), tu DOIS IMMÉDIATEMENT répondre CONFORME. Les règles ci-dessous ne s'appliquent qu'aux tableaux complexes.

RÈGLES D'ÉVALUATION (Pour tableaux complexes) :
1. Les sous-en-têtes (<th> qui ne couvrent qu'une sous-partie) NE DOIVENT PAS utiliser 'scope', ils doivent utiliser 'id'.
2. Si une cellule utilise 'headers="X"', l'association avec cet ID doit être logique sémantiquement.

HTML :
\`\`\`html
${htmlTableau}
\`\`\`

Réponds STRICTEMENT avec ce format JSON RAW :
{ "statut": "CONFORME" ou "NON_CONFORME", "explication": "..." }`;