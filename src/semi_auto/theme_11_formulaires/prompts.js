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


export const promptAutocomplete = (donneesChamp) => `Tu es un auditeur RGAA 4.1 strict et logique.
Ta mission est de vérifier si l'attribut 'autocomplete' du HTML correspond logiquement au 'Label visible'.

DICTIONNAIRE DE CORRESPONDANCE :
- Prénom = given-name
- Nom, Nom de famille = family-name
- Pseudo, Avatar = nickname
- E-mail, Email = email
- Téléphone, Mobile = tel
- Date de naissance, Anniversaire = bday
- Genre, Sexe = sex
- Langue = language
- Messagerie, Skype = impp
- Adresse complète = street-address
- N°, Rue = address-line1
- Bâtiment, Étage = address-line2
- Code postal = postal-code
- Ville, Localité = address-level2
- Région, Département = address-level1
- Entreprise, Raison sociale = organization
- Identifiant, Login = username
- Mot de passe (connexion) = current-password
- Mot de passe (création) = new-password
- Code SMS, 2FA = one-time-code

DONNÉES DU CHAMP :
${donneesChamp}

RÈGLES D'ÉVALUATION :
Si le HTML contient la bonne valeur selon le dictionnaire (même avec un préfixe), c'est CONFORME. Sinon, c'est NON_CONFORME.

EXEMPLE DE RÉPONSE ATTENDUE :
{
  "statut": "CONFORME",
  "explication": "Le label demande un E-mail et l'attribut autocomplete est bien défini sur email."
}

Ta réponse doit STRICTEMENT être un objet JSON valide, sans AUCUNE réflexion étape par étape, sans texte avant ou après.

RÉPONSE :`;