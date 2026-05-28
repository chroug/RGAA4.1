import pool from './db.js';

export async function saveAuditToDb(jsonData, projetName = "Default Project") {
    console.log("⏳ [DB] Début du processus de sauvegarde...");
    const client = await pool.connect();

    try {
        await client.query('BEGIN'); 
        console.log("⏳ [DB] Transaction commencée.");

        const meta = jsonData.metadata;
        const stats = jsonData.statistiques;
        
        // Sécurisation du taux
        const tauxStr = (stats.score_rgaa_partiel && stats.score_rgaa_partiel.taux_de_conformite) ? stats.score_rgaa_partiel.taux_de_conformite : "0%";
        let tauxConformite = parseFloat(tauxStr.replace('%', ''));
        if (isNaN(tauxConformite)) tauxConformite = 0; // Sécurité anti-crash

        console.log(`⏳ [DB] Insertion de l'audit principal (${meta.audit_id})...`);
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
            meta.audit_id, 
            projetName, 
            meta.url_auditee, 
            meta.date_audit,
            meta.environnement.moteur, 
            meta.environnement.viewport,
            stats.score_rgaa_partiel ? stats.score_rgaa_partiel.points_obtenus : 0, 
            stats.score_rgaa_partiel ? stats.score_rgaa_partiel.criteres_evalues : 0,
            tauxConformite, 
            stats.repartition_par_statut ? stats.repartition_par_statut.C : 0, 
            stats.repartition_par_statut ? stats.repartition_par_statut.NC : 0,
            stats.repartition_par_statut ? stats.repartition_par_statut.NA : 0, 
            stats.total_elements_en_erreur || 0,
            jsonData.resultats || {}
        ];

        await client.query(insertAuditQuery, auditValues);
        console.log("✅ [DB] Audit principal inséré !");

        // 2. Insertion des détails d'anomalies
        console.log("⏳ [DB] Insertion des détails par critère...");
        const insertDetailsQuery = `
            INSERT INTO anomalies_details (
                audit_reference, theme, critere, statut, methode_detection, element_data
            ) VALUES ($1, $2, $3, $4, $5, $6)
        `;

        let countDetails = 0;
        if (jsonData.resultats) {
            for (const [themeName, themeData] of Object.entries(jsonData.resultats)) {
                if (themeData.criteres) {
                    for (const [critereName, critereData] of Object.entries(themeData.criteres)) {
                        
                        // Les NC (Violations)
                        if (critereData.violations && Array.isArray(critereData.violations)) {
                            for (const violation of critereData.violations) {
                                await client.query(insertDetailsQuery, [
                                    meta.audit_id, themeName, critereName, 'NC', 
                                    critereData.methode_detection || 'Inconnu', violation || {}
                                ]);
                                countDetails++;
                            }
                        }

                        // Les C (Conformités)
                        if (critereData.conformites && Array.isArray(critereData.conformites)) {
                            for (const conformite of critereData.conformites) {
                                await client.query(insertDetailsQuery, [
                                    meta.audit_id, themeName, critereName, 'C', 
                                    critereData.methode_detection || 'Inconnu', conformite || {}
                                ]);
                                countDetails++;
                            }
                        }
                    }
                }
            }
        }
        
        console.log(`✅ [DB] ${countDetails} détails d'anomalies insérés !`);

        await client.query('COMMIT');
        console.log(`💾 [DB] TOUT EST VALIDE ! Audit ${meta.audit_id} sauvegardé définitivement en BDD !`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n=============================================');
        console.error('❌ [DB] CRASH LORS DE L\'INSERTION EN BASE DE DONNÉES');
        console.error('=============================================');
        console.error("Message d'erreur :", error.message);
        console.error("Détail complet :", error);
        console.error('=============================================\n');
    } finally {
        client.release();
    }
}