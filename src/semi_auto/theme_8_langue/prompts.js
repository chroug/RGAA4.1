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


// 🎯 Prompt pour le Critère 8.7 (Changement de langue)
export const promptMultilingue = (htmlExtrait) => `Tu es un expert auditeur RGAA 4.1.
Le critère 8.7 exige que chaque changement de langue dans un texte soit indiqué dans le code source HTML via un attribut 'lang'.

EXTRAIT HTML À ANALYSER :
"${htmlExtrait}"

RÈGLES D'ÉVALUATION :
1. Si le texte est uniquement dans la langue principale de la page (même avec du jargon web, des anglicismes courants comme 'newsletter', 'design' ou des noms propres), c'est CONFORME. Aucun attribut 'lang' n'est requis.
2. S'il y a une VRAIE phrase ou expression grammaticale dans une langue étrangère (ex: anglais, espagnol) :
   - Et qu'elle EST entourée d'une balise avec le bon attribut 'lang' (ex: <span lang="en">) -> CONFORME.
   - Et qu'elle N'EST PAS entourée par un attribut 'lang' -> NON_CONFORME.
3. IGNORE TOTALEMENT le contenu des attributs HTML (comme href, class, id, src). Le RGAA ne s'applique qu'au texte textuel affiché entre les balises.
4. S'il y a une VRAIE phrase ou expression grammaticale dans une langue étrangère (ex: anglais, espagnol) DANS LE TEXTE VISIBLE :
   - Et qu'elle EST entourée d'une balise avec le bon attribut 'lang' (ex: <span lang="en">) -> CONFORME.
   - Et qu'elle N'EST PAS entourée par un attribut 'lang' -> NON_CONFORME.

EXEMPLES D'ANALYSE :
- "<p>Welcome to our site!</p>" -> NON_CONFORME (Anglais non balisé).
- "<p><span lang="en">Welcome to our site!</span></p>" -> CONFORME (Anglais correctement balisé).
- "<li>Phrase en anglais</li>" -> CONFORME (C'est du français qui désigne la langue anglaise, pas un texte en anglais).
- "<a href='/en/page' title='English'>Page d'accueil</a>" -> CONFORME (Les mots anglais sont dans les attributs href et title, on les ignore. Le texte visible est en français).

MISSION :
Indique si les éventuels changements de langue dans l'extrait fourni sont conformes au RGAA.
Réponds STRICTEMENT avec ce format JSON :
{
  "statut": "CONFORME" ou "NON_CONFORME",
  "explication": "Explication ultra courte de ta décision."
}`;