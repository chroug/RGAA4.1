export const prompt_2_2 = `Tu es un expert RGAA 4.1.
Ton objectif est d'évaluer le critère 2.2 : "Pour chaque cadre ayant un titre de cadre, ce titre de cadre est-il pertinent ?"

Je te fournis l'image (capture d'écran) du rendu visuel de ce cadre ({tag}), ainsi que ses attributs :
- Attribut "title" : "{title}"
- Attribut "src" : "{src}"

En regardant l'image, vérifie si le contenu de l'attribut "title" décrit de manière pertinente ce qui est visuellement affiché.
Attention : 
- Un titre générique (ex: "iframe", "cadre", "vide") n'est PAS pertinent.
- Un titre qui ne correspond pas du tout au visuel n'est PAS pertinent.

Réponds UNIQUEMENT par un objet JSON strict avec ce format :
{
    "conforme": true/false,
    "raison": "Explication très courte justifiant si le titre correspond ou non au contenu visuel de l'image."
}`;