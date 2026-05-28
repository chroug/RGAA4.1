import pool from './db.js';

async function testerConnexion() {
    console.log("⏳ Tentative de connexion à PostgreSQL...");
    
    try {
        // On essaie de se connecter et on demande l'heure au serveur
        const client = await pool.connect();
        const resultat = await client.query('SELECT NOW() as heure_actuelle');
        
        console.log("✅ SUCCÈS ! La connexion fonctionne parfaitement.");
        console.log("🕒 Heure du serveur BDD :", resultat.rows[0].heure_actuelle);
        
        // On vérifie si la table 'audits' existe bien
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'audits'
            );
        `);
        
        if (tableCheck.rows[0].exists) {
            console.log("✅ La table 'audits' a bien été trouvée ! Tu es prêt pour les audits.");
        } else {
            console.log("⚠️  Connexion OK, mais la table 'audits' n'existe pas. N'oublie pas d'exécuter le script SQL !");
        }

        client.release(); // On libère la connexion
    } catch (erreur) {
        console.error("\n❌ ÉCHEC DE LA CONNEXION ! Voici l'erreur :");
        console.error(erreur.message);
    } finally {
        await pool.end(); // On ferme le pool pour que le script s'arrête proprement
    }
}

testerConnexion();