// script.js

// ERREUR RGAA 7.1 : Script dépendant uniquement de la souris (pas de clavier)
document.addEventListener("DOMContentLoaded", () => {
    const fakeBtn = document.getElementById("fake-btn");
    if(fakeBtn) {
        fakeBtn.addEventListener("click", () => {
            alert("Action effectuée à la souris !");
        });
        // Pas de gestion de l'événement keydown (Entrée/Espace)
    }

    // ERREUR RGAA 7.1 / 11.2 : Erreur non annoncée au lecteur d'écran (Pas de aria-live)
    const submitBtn = document.getElementById("submit-bad-form");
    if(submitBtn) {
        submitBtn.addEventListener("click", (e) => {
            e.preventDefault();
            document.getElementById("error-message").innerText = "Le champ est obligatoire !";
            document.getElementById("error-message").style.color = "red";
        });
    }
});

// Modale inaccessible (Erreur RGAA 7)
function openModal() {
    document.getElementById("bad-modal").style.display = "block";
    // ERREUR : Le focus n'est pas envoyé dans la modale, et l'arrière-plan n'est pas masqué (aria-hidden)
}

function closeModal() {
    document.getElementById("bad-modal").style.display = "none";
    // ERREUR : Le focus n'est pas retourné à l'élément déclencheur
}