import pool from './db.js';

export async function saveAuditToDb(jsonData, projetName = "Default Project") {
    const client = await pool.connect();

    try {
        await client.query('BEGIN'); 

        const meta = jsonData.metadata;
        const stats = jsonData.statistiques;
        
        // Convertir "73%" en 73.00
        const tauxStr = stats.score_rgaa_partiel.taux_de_conformite || "0%";
        const tauxConformite = parseFloat(tauxStr.replace('%', ''));

        // 1. Insertion de l'audit
        const insertAuditQuery = `
            INSERT INTO audits (
                audit_id, projet, url_auditee, date_audit, env_moteur, env_viewport,
                stat_points_obtenus, stat_criteres_evalues, stat_taux_conformite,
                stat_count_c, stat_count_nc, stat_count_na, stat_total_erreurs, resultats_complets
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            ON CONFLICT (audit_id) DO NOTHING;
        `;
        
        const auditValues = [
            meta.audit_id, projetName, meta.url_auditee, meta.date_audit,
            meta.environnement.moteur, meta.environnement.viewport,
            stats.score_rgaa_partiel.points_obtenus, stats.score_rgaa_partiel.criteres_evalues,
            tauxConformite, stats.repartition_par_statut.C, stats.repartition_par_statut.NC,
            stats.repartition_par_statut.NA, stats.total_elements_en_erreur,
            jsonData.resultats
        ];

        await client.query(insertAuditQuery, auditValues);

        // 2. Insertion des détails d'anomalies
        const insertDetailsQuery = `
            INSERT INTO anomalies_details (
                audit_reference, theme, critere, statut, methode_detection, element_data
            ) VALUES ($1, $2, $3, $4, $5, $6)
        `;

        // Parcourir le JSON pour extraire chaque erreur/conformité
        if (jsonData.resultats) {
            for (const [themeName, themeData] of Object.entries(jsonData.resultats)) {
                for (const [critereName, critereData] of Object.entries(themeData.criteres)) {
                    
                    // Les NC
                    for (const violation of (critereData.violations || [])) {
                        await client.query(insertDetailsQuery, [
                            meta.audit_id, themeName, critereName, 'NC', 
                            critereData.methode_detection, violation
                        ]);
                    }

                    // Les C
                    for (const conformite of (critereData.conformites || [])) {
                        await client.query(insertDetailsQuery, [
                            meta.audit_id, themeName, critereName, 'C', 
                            critereData.methode_detection, conformite
                        ]);
                    }
                }
            }
        }

        await client.query('COMMIT');
        console.log(`💾 [DB] Audit ${meta.audit_id} sauvegardé en BDD avec succès !`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ [DB] Erreur lors de l\'insertion :', error);
    } finally {
        client.release();
    }
}