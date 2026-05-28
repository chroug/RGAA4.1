import pool from './db.js';

export async function getAvantApresByUrl(url) {
    const query = `
        SELECT 
            audit_id, date_audit, stat_taux_conformite, stat_total_erreurs, stat_count_nc
        FROM audits 
        WHERE url_auditee = $1 
        ORDER BY date_audit DESC 
        LIMIT 2;
    `;

    try {
        const { rows } = await pool.query(query, [url]);

        if (rows.length === 0) {
            return { error: true, message: "Aucun audit trouvé pour cette URL." };
        }

        const actuel = rows[0];
        
        if (rows.length === 1) {
            return {
                url,
                message: "Premier audit, pas de comparaison possible.",
                actuel: { date: actuel.date_audit, taux: `${actuel.stat_taux_conformite}%`, erreurs: actuel.stat_total_erreurs }
            };
        }

        const precedent = rows[1];

        const evolutionTaux = parseFloat(actuel.stat_taux_conformite) - parseFloat(precedent.stat_taux_conformite);
        const evolutionErreurs = actuel.stat_total_erreurs - precedent.stat_total_erreurs;

        return {
            url: url,
            comparaison: {
                actuel: {
                    date: actuel.date_audit,
                    taux: `${actuel.stat_taux_conformite}%`,
                    erreurs: actuel.stat_total_erreurs
                },
                precedent: {
                    date: precedent.date_audit,
                    taux: `${precedent.stat_taux_conformite}%`,
                    erreurs: precedent.stat_total_erreurs
                },
                evolutions: {
                    taux: evolutionTaux > 0 ? `+${evolutionTaux.toFixed(2)}% 🟢` : (evolutionTaux < 0 ? `${evolutionTaux.toFixed(2)}% 🔴` : `0% ⚪`),
                    erreurs: evolutionErreurs < 0 ? `${evolutionErreurs} (Amélioration 🟢)` : (evolutionErreurs > 0 ? `+${evolutionErreurs} (Régression 🔴)` : `0 ⚪`)
                }
            }
        };

    } catch (error) {
        console.error('❌ Erreur dashboard:', error);
        return { error: true, message: "Erreur DB" };
    }
}