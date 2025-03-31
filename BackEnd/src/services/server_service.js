const db = require('../models/connection');
const { Sequelize } = require('sequelize');
reports = db.report;

//se si tratta di array di pi_Value 
async function getAllReports() {
    try {
        const results = await db.sequelize.query(
            `
            SELECT r1.UuidReport, r1.CipherC, r1.PiValue, r1.ERecord, r1.UuidLawyer
            FROM reports r1
            JOIN reports r2 
                ON (
                    
                    (
                        JSON_UNQUOTE(JSON_EXTRACT(r1.PiValue, '$[0]')) != '' 
                        AND TRIM(JSON_UNQUOTE(JSON_EXTRACT(r1.PiValue, '$[0]'))) != ''
                        AND JSON_UNQUOTE(JSON_EXTRACT(r2.PiValue, '$[0]')) != '' 
                        AND TRIM(JSON_UNQUOTE(JSON_EXTRACT(r2.PiValue, '$[0]'))) != ''
                        AND JSON_EXTRACT(r1.PiValue, '$[0]') = JSON_EXTRACT(r2.PiValue, '$[0]')
                    )
                    OR
                   
                    (
                        JSON_UNQUOTE(JSON_EXTRACT(r1.PiValue, '$[1]')) != '' 
                        AND TRIM(JSON_UNQUOTE(JSON_EXTRACT(r1.PiValue, '$[1]'))) != ''
                        AND JSON_UNQUOTE(JSON_EXTRACT(r2.PiValue, '$[1]')) != '' 
                        AND TRIM(JSON_UNQUOTE(JSON_EXTRACT(r2.PiValue, '$[1]'))) != ''
                        AND JSON_EXTRACT(r1.PiValue, '$[1]') = JSON_EXTRACT(r2.PiValue, '$[1]')
                    )
                    OR
                   
                    (
                        JSON_UNQUOTE(JSON_EXTRACT(r1.PiValue, '$[2]')) != '' 
                        AND TRIM(JSON_UNQUOTE(JSON_EXTRACT(r1.PiValue, '$[2]'))) != ''
                        AND JSON_UNQUOTE(JSON_EXTRACT(r2.PiValue, '$[2]')) != '' 
                        AND TRIM(JSON_UNQUOTE(JSON_EXTRACT(r2.PiValue, '$[2]'))) != ''
                        AND JSON_EXTRACT(r1.PiValue, '$[2]') = JSON_EXTRACT(r2.PiValue, '$[2]')
                    )
                )
            WHERE r1.UuidReport != r2.UuidReport;
            `,
            {
                type: db.sequelize.QueryTypes.SELECT,
            }
        );

        // Filtra i duplicati nel codice
        const uniqueResults = Array.from(new Set(results.map(a => a.UuidReport)))
                                    .map(id => {
                                        return results.find(a => a.UuidReport === id)
                                    });

        return uniqueResults;

    } catch (error) {
        console.error('Errore durante il recupero dei record:', error);
        throw error;
    }
}

module.exports = {
    getAllReports,
};

