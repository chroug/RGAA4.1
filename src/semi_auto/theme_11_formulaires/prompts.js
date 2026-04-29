export const promptRegroupement = (html) => `Tu es un expert auditeur RGAA 4.1.
Règle 11.5 : Les champs de même nature (ex: boutons radio) DOIVENT être regroupés sémantiquement.
Extrait HTML : "${html}"

MISSION : Ce code contient-il une balise <fieldset> ou un attribut role="group" ou role="radiogroup" ?

EXEMPLE DE RÉPONSE ATTENDUE :
{
  "contient_erreur": false,
  "explication": "Le groupement est bien présent via la balise fieldset."
}

Ta réponse doit STRICTEMENT être un objet JSON valide, sans AUCUN texte avant ou après.

RÉPONSE :`;


export const promptObligatoire = (html) => `Tu es un auditeur RGAA 4.1.
Règle 11.10 : Une indication de champ obligatoire doit être visible dans l'étiquette.
Extrait du label : "${html}"

MISSION : Cherche le symbole "*" ou les mots "obligatoire" / "requis". (Ignore les exceptions car elles ont déjà été filtrées).

EXEMPLE DE RÉPONSE ATTENDUE :
{
  "contient_erreur": true,
  "explication": "Aucune indication visible (astérisque ou mot requis) dans l'étiquette."
}

Ta réponse doit STRICTEMENT être un objet JSON valide, sans AUCUN texte avant ou après.

RÉPONSE :`;


export const promptAutocomplete = (donneesChamp) => `Tu es un auditeur RGAA 4.1 strict.
Le critère 11.13 stipule que l'attribut 'autocomplete' est OBLIGATOIRE, MAIS UNIQUEMENT pour les champs qui demandent une donnée personnelle listée ci-dessous.

DICTIONNAIRE DE CORRESPONDANCE :
- Prénom = given-name
- Nom, Nom de famille = family-name
- Pseudo, Avatar = nickname
- E-mail, Email = email
- Téléphone, Mobile = tel
- Date de naissance = bday
- Genre, Sexe = sex
- Adresse complète = street-address
- N°, Rue = address-line1
- Code postal = postal-code
- Ville = address-level2
- Entreprise = organization
- Identifiant, Login = username
- Mot de passe = current-password ou new-password

DONNÉES DU CHAMP À TESTER :
${donneesChamp}

RÈGLES D'ÉVALUATION :
1. Si le champ NE DEMANDE PAS une donnée de ce dictionnaire (ex: Sujet, Message, Commentaire, Recherche, Champ caché), il N'A PAS BESOIN d'autocomplete. Le résultat est donc "CONFORME".
2. Si le champ DEMANDE une donnée de ce dictionnaire (ex: c'est un champ "Prénom") :
   - Et qu'il a le bon 'autocomplete' -> "CONFORME".
   - Et que l'attribut est ABSENT ou contient une mauvaise valeur -> "NON_CONFORME".

EXEMPLE DE RÉPONSE ATTENDUE (pour un champ "Votre message") :
{
  "statut": "CONFORME",
  "explication": "Le champ demande un message, ce n'est pas une donnée personnelle. L'autocomplete n'est pas requis."
}

Ta réponse doit STRICTEMENT être un objet JSON valide, sans aucun texte avant ou après.

RÉPONSE :`;