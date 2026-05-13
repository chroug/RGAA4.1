// 🎯 Prompt pour le Critère 9.1.2 (Pertinence des titres)
export const promptCritere9_1 = (titre, niveau, contenuSuivant) => `Tu es un automate d'évaluation RGAA 4.1 très permissif.
Ta mission est d'évaluer le Critère 9.1.2 : "Le contenu de chaque titre est-il pertinent ?"

Voici un titre de niveau H${niveau} et l'extrait de texte qui le suit directement sur la page web :
TITRE : "${titre}"
TEXTE SOUS LE TITRE : "${contenuSuivant}"

RÈGLES D'ÉVALUATION STRICTES (À RESPECTER IMPÉRATIVEMENT) :
1. 🚨 RUPTURE SÉMANTIQUE (NON_CONFORME) : Tu dois répondre NON_CONFORME UNIQUEMENT si le sujet n'a STRICTEMENT AUCUN RAPPORT (ex: Titre "Recette", Texte "Vidange voiture").
2. 🛡️ TOLÉRANCE ABSOLUE SUR LES THÈMES PROCHES : Ne fais PAS le juriste. Si le titre et le texte partagent un domaine commun (ex: Administratif, Juridique, E-commerce, etc.), c'est TOUJOURS CONFORME. Par exemple, un titre "Mentions légales" avec un texte sur "Conditions de vente" ou "Retours" est 100% CONFORME. Il est FORMELLEMENT INTERDIT de signaler une rupture sémantique sur ces éléments.
3. 🚨 TITRES VIDES OU CHARABIA (NON_CONFORME) : Si le titre est totalement vide, ne contient que des espaces, ou est juste un mot générique sans sens précis (ex: "Titre") -> NON_CONFORME.
4. ✅ CARTES ET BADGES (CONFORME) : Un titre sans texte en dessous ou avec un mot très court ("Passeport") est CONFORME s'il a un sens par lui-même.
5. ✅ TITRES GLOBAUX (CONFORME) : Un titre d'accueil ("Bienvenue...", "Nos produits") est CONFORME.

MISSION :
Réponds STRICTEMENT avec ce format JSON :
{
  "statut": "CONFORME" ou "NON_CONFORME",
  "explication": "Justification ultra courte."
}`;

// 🎯 Prompt pour le Critère 9.2 (Usage réservé de la balise NAV)
export const promptCritere9_2 = (label, liens, texte) => `Tu es un expert auditeur RGAA 4.1.
Ta mission est d'évaluer une partie du Critère 9.2 : "La balise <nav> est réservée à la structuration des zones de navigation principales et secondaires".

Voici le contenu extrait d'une balise <nav> trouvée sur la page :
- Attribut aria-label : "${label}"
- Liste des liens extraits : "${liens}"
- Texte brut contenu : "${texte}"

RÈGLES D'ÉVALUATION STRICTES :
1. ✅ NAVIGATION LÉGITIME (CONFORME) : Si le contenu est un menu principal, un menu de pied de page (CGV, Mentions légales), un fil d'Ariane (breadcrumb), une pagination, ou un sommaire (ancres), c'est une navigation valide -> CONFORME.
2. 🚨 USAGE ABUSIF (NON_CONFORME) : La balise <nav> ne DOIT PAS être utilisée pour :
   - Des liens de partage sur les réseaux sociaux (Facebook, Twitter, etc.).
   - Une liste de tags ou de mots-clés d'un article.
   - Du texte simple sans liens.
   - Des boutons d'action (Imprimer, Télécharger).
   Si c'est le cas, c'est une erreur sémantique -> NON_CONFORME.

MISSION :
Réponds STRICTEMENT avec ce format JSON :
{
  "statut": "CONFORME" ou "NON_CONFORME",
  "explication": "Justification ultra courte."
}`;