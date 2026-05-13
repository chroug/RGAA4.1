// 🎯 Prompt pour le Critère 8.4 (Langue de la page)
export const promptLanguePrincipale = (texte) => `Tu es un expert linguistique.
Voici l'introduction d'une page web :

TEXTE :
"${texte.substring(0, 400)}"

MISSION :
Quelle est la langue dominante de ce texte ? Ignore le jargon technique du web. Regarde les pronoms et les verbes (la grammaire) pour décider.
Réponds STRICTEMENT avec le format JSON suivant :
{
  "code_iso_detecte": "écris uniquement le code à 2 lettres ici (ex: fr, en, es)",
  "explication": "Justifie en citant les pronoms ou verbes qui t'ont aidé."
}`;
export const promptCritere8_7 = (htmlExtrait) => `Tu es un automate d'audit RGAA 4.1 strict.
Analyse cet extrait HTML : "${htmlExtrait}"
RÈGLE ABSOLUE (Critère 8.7 - PRÉSENCE UNIQUEMENT) :
Y a-t-il un VRAI mot ou une VRAIE phrase dans une langue étrangère qui N'EST PAS entourée par une balise avec l'attribut exact 'lang' ou 'xml:lang' ? Tu as l'interdiction de juger la cohérence de la langue.
⚠️ INSTRUCTION CRITIQUE : 
Si l'élément possède DÉJÀ un attribut 'lang' ou 'xml:lang' non vide, tu arrêtes immédiatement ton analyse et tu retournes "CONFORME". Que le texte soit en allemand et l'attribut lang="es", CELA N'A AUCUNE IMPORTANCE ici. C'est un autre critère qui le vérifiera.
Attention : Les attributs comme 'language', 'class', ou 'data-lang' sont INVALIDES. Un attribut vide (lang="") est invalide. Ils comptent comme une absence d'attribut.
CAS STRICTEMENT CONFORMES OU NON APPLICABLES (STATUT: "CONFORME") :
1. L'élément possède DÉJÀ un attribut 'lang' ou 'xml:lang' (même si la valeur te semble fausse).
2. Les mots français qui désignent une langue (ex: "Anglais", "Espagnol", "Américain"). Ce sont des mots français !
3. Les acronymes internationaux ou le jargon (ex: ISO, Algo, IA, web, email, newsletter).
4. Les Noms propres : Marques, entreprises, logiciels, lieux (ex: "Microsoft", "Photoshop", "Apple").
5. Les termes soumis par un utilisateur et rappelés (ex: "Résultats pour : Guten Tag"). 
6. Les langues imaginaires ou sans restitution vocale (ex: "Kaltxì", le Lorem Ipsum).
7. Le texte est 100% dans la langue principale (Français).
CAS STRICTEMENT NON CONFORME (STATUT: "NON_CONFORME") :
1. Présence d'un vrai mot ou phrase en langue étrangère ET oubli total de l'attribut 'lang'.
2. Utilisation d'un mauvais attribut (ex: 'language="en"') ou d'un attribut vide (lang="") sur un texte étranger.
MISSION :
Réponds STRICTEMENT avec ce format JSON et aucune autre clé :
{
  "statut": "NON_CONFORME" (Uniquement si oubli de balise valide sur un texte étranger) ou "CONFORME",
  "explication": "Justification ultra courte constatant uniquement la présence/absence de l'attribut ou l'application d'une exception."
}`;

// 🎯 Prompt pour le Critère 8.8 (Pertinence de l'attribut lang)
export const promptCritere8_8 = (htmlExtrait) => `Tu es un expert auditeur RGAA 4.1.
Analyse cet extrait HTML : "${htmlExtrait}"

RÈGLE (Critère 8.8 - PERTINENCE ET VALIDITÉ) : 
Si un attribut 'lang' est présent, sa valeur correspond-elle RÉELLEMENT à la langue du texte qu'il entoure ?

⚠️ EXEMPLES DE NON-CONFORMITÉ :
- La langue déclarée est fausse (ex: lang="es" pour de l'allemand ou lang="en" pour du français).
- Le code n'est pas un code ISO/BCP47 valide (ex: lang="english" au lieu de "en", ou lang="esp" au lieu de "es").

MISSION :
Réponds STRICTEMENT avec ce format JSON :
{
  "statut": "NON_CONFORME" (si la langue déclarée est fausse ou le code invalide) ou "CONFORME",
  "explication": "Justification ultra courte."
}`;
// 🎯 Prompt pour le Critère 8.10 (Sens de lecture - Pertinence)
export const promptSensLecture = (htmlExtrait, texteExtrait) => `Tu es un expert auditeur RGAA 4.1.
Le critère 8.10 vérifie la pertinence de l'attribut dir="rtl" (Right-To-Left).
Un développeur a utilisé dir="rtl" sur cet élément :

HTML : "${htmlExtrait}"
TEXTE EXTRAIT : "${texteExtrait}"

RÈGLES D'ÉVALUATION :
1. L'attribut dir="rtl" DOIT être utilisé UNIQUEMENT si le texte contient une langue s'écrivant de droite à gauche (comme l'Arabe, l'Hébreu, le Persan).
2. Si le développeur a utilisé dir="rtl" sur du texte en français, de l'anglais, ou des chiffres UNIQUEMENT dans le but d'inverser visuellement l'affichage (ex: inverser une flèche ou un numéro de téléphone), c'est une erreur grave d'accessibilité (Hack visuel). -> NON_CONFORME.

MISSION :
Indique si l'utilisation de cet attribut est conforme ou s'il s'agit d'un hack visuel.
Réponds STRICTEMENT avec ce format JSON :
{
  "statut": "CONFORME" ou "NON_CONFORME",
  "explication": "Explication ultra courte de ta décision."
}`;