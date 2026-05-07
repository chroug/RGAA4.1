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


// ==========================================
// PROMPT POUR LE CRITÈRE 5.4 (TITRE VISUEL NON LIÉ)
// ==========================================
export const prompt54_TitreVisuel = (htmlTableau, texteAvant) => `Tu es un expert RGAA 4.1 pragmatique.
MISSION : Vérifier le Critère 5.4 (Un tableau de données ayant un titre visuel doit avoir ce titre correctement associé).

RAPPEL DE L'ALGORITHME : Le tableau HTML que je t'envoie NE POSSÈDE AUCUNE liaison technique valide (ni <caption>, ni title, ni aria-label, ni aria-labelledby). Ton rôle est de vérifier s'il existe un "faux" titre visuel qui aurait dû être lié techniquement.

TEXTE PRÉSENT JUSTE AVANT LE TABLEAU SUR LA PAGE :
"${texteAvant}"

CODE HTML DU TABLEAU (début) :
\`\`\`html
${htmlTableau.substring(0, 400)}...
\`\`\`

RÈGLES D'ÉVALUATION :
1. DÉTECTION D'UN TITRE VISUEL EXTERNE : Le "TEXTE JUSTE AVANT" agit-il sémantiquement comme un TITRE direct pour ce tableau ?
   - ❌ NON_CONFORME : S'il s'agit d'un texte court, direct, autonome (comme un libellé ou un titre de section) qui annonce clairement le sujet du tableau. Le développeur a créé un titre visuel mais a oublié de le lier.
   - ✅ CONFORME : Si le texte est vide, OU s'il s'agit d'un paragraphe classique (ex: un long texte d'explication, d'introduction ou des consignes de lecture). Un paragraphe de contenu n'est pas considéré comme un "titre de tableau".
   
2. DÉTECTION D'UN FAUX TITRE INTERNE (Hack HTML) :
   - ❌ NON_CONFORME : Analyse la structure HTML. Y a-t-il, au tout début du tableau, une ligne contenant une ou plusieurs cellules fusionnées (via l'attribut 'colspan') servant UNIQUEMENT à simuler un titre visuel global pour le tableau ? (Le développeur aurait dû utiliser la balise <caption>).
   
3. CONCLUSION DE L'ANALYSE :
   - Si tu détectes un titre visuel (externe ou interne) -> NON_CONFORME.
   - S'il n'y a manifestement aucun texte conçu pour être un titre -> CONFORME (les tableaux ont tout à fait le droit de ne pas avoir de titre).

Réponds STRICTEMENT avec ce format JSON RAW (sans balises markdown) :
{
  "statut": "CONFORME" ou "NON_CONFORME",
  "explication": "Explication courte."
}`;

// ==========================================
// PROMPT POUR LE CRITÈRE 5.5 (PERTINENCE DU TITRE)
// ==========================================
export const prompt55_PertinenceTitre = (htmlTableau, texteTitre) => `Tu es un expert RGAA 4.1 pragmatique.
MISSION : Vérifier le Critère 5.5 (Pour chaque tableau de données ayant un titre, celui-ci doit être pertinent, clair et concis).

TEXTE DU TITRE EXTRAIT :
"${texteTitre}"

CODE HTML DU TABLEAU (pour contexte) :
\`\`\`html
${htmlTableau.substring(0, 800)}...
\`\`\`

RÈGLES D'ÉVALUATION :
1. IDENTIFICATION DU SUJET (Tolérance pragmatique) : L'utilisateur comprend-il de quoi parle le tableau en lisant ce titre ?
   - ❌ NON_CONFORME : Les titres purement génériques, structurels ou séquentiels qui ne décrivent pas la donnée (ex: un simple numéro, "Tableau", "Données", "Liste", "Figure", etc.).
   - ✅ CONFORME : Tout titre qui annonce le SUJET des données. NE SANCTIONNE JAMAIS la présence de préfixes, de numérotation, ou de mots d'introduction conversationnels (ex: "Annexe A :...", "Voici les...", "Exemple :..."). L'essentiel est que le sujet soit présent et compréhensible.
2. COHÉRENCE : Le titre correspond-il RÉELLEMENT aux données présentes dans le HTML ? (Si c'est hors-sujet ou déconnecté du contenu, c'est NON_CONFORME).
3. CONCISION : Le titre est-il raisonnablement court ? (Tant que ce n'est pas un long paragraphe d'explications détaillées ou un mode d'emploi expliquant comment lire le tableau, considère-le comme suffisamment concis).
4. PROPRETÉ : S'il s'agit d'un texte de test laissé par erreur (ex: Lorem ipsum, texte aléatoire), c'est NON_CONFORME.

Réponds STRICTEMENT avec ce format JSON RAW (sans balises markdown) :
{
  "statut": "CONFORME" ou "NON_CONFORME",
  "explication": "Explication courte."
}`;

// ==========================================
// PROMPT POUR LE CRITÈRE 5.3 (LINÉARISATION)
// ==========================================
export const prompt53_Linearisation = (texteLinearise, htmlTableau) => `Tu es un expert RGAA 4.1.
MISSION : Vérifier le Critère 5.3 (Le contenu linéarisé d'un tableau de mise en forme doit rester compréhensible).

Voici le texte "linéarisé" du tableau (c'est-à-dire le texte lu cellule par cellule de gauche à droite, de haut en bas, exactement comme le lirait un lecteur d'écran pour aveugle) :
"${texteLinearise}"

CODE HTML DU TABLEAU (pour contexte) :
\`\`\`html
${htmlTableau.substring(0, 500)}...
\`\`\`

RÈGLES D'ÉVALUATION :
1. Lis la phrase "linéarisée". A-t-elle un sens logique et naturel en français ?
2. ❌ NON_CONFORME (Charabia) : Si la phrase est du charabia, si des mots sont coupés ou mélangés de manière absurde (ex: "L'accessibilité numérique sont essentielles pour et la qualité web...").
3. ❌ NON_CONFORME (Formulaire cassé) : S'il s'agit d'un formulaire et que l'ordre lu mélange les labels et les champs (ex: "Ville Code Postal [champ] [champ]"). L'ordre logique d'un formulaire est "Label -> Champ -> Label -> Champ".
4. ✅ CONFORME : Si la lecture est fluide et logique (ex: un texte qui s'enchaîne bien, un menu de navigation, un label suivi de son champ).
5. ✅ CONFORME : Si le texte linéarisé est vide (tableau contenant uniquement des images ignorées).

Réponds STRICTEMENT avec ce format JSON RAW (sans balises markdown) :
{
  "statut": "CONFORME" ou "NON_CONFORME",
  "explication": "Explication courte de pourquoi la lecture a du sens ou non."
}`;