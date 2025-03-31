const db = require('../models/connection');
const Sequelize = require('sequelize');
const lawyers = db.lawyer;
const reportdb = db.report;


async function getReportAndLawyerByPiValueForAllLawyers(req, res, data) {

    try {
        // Assicurati che piValueArray sia un array valido
        let piValueArray = Array.isArray(data.piValue) ? data.piValue : JSON.parse(data.piValue);
        console.log("PiValues in input:", piValueArray);
    
        // Filtra i valori esadecimali non vuoti, rimuovendo spazi o caratteri invisibili
        const hexValues = piValueArray.filter(value => value.trim() !== "");
        console.log("Filtered PiValues:", hexValues);
    
        if (hexValues.length === 0) {
            return { message: "No valid PiValue provided for search." };
        }
    
        // Crea una condizione LIKE per ciascun valore non vuoto
        const whereConditions = hexValues.map(value => ({
            PiValue: { [Sequelize.Op.like]: `%${value}%` }
        }));
    
        // Query al database per trovare i report che corrispondono almeno a uno dei valori
        const existingReports = await reportdb.findAll({
            where: {
                [Sequelize.Op.or]: whereConditions, // Combina tutte le condizioni con OR
            },
            include: [
                {
                    model: db.lawyer,
                    as: "lawyer",
                },
            ],
            limit: 1, // Limita a restituire solo il primo report che trova
        });
    
        if (existingReports.length > 0) {
            // Restituisce il primo report con l'avvocato associato
            const report = existingReports[0];
            return {
                PublicKey: report.lawyer.dataValues.PublicKey,  // L'avvocato che gestisce il report
                PiValue: report.PiValue,  // PiValue del report trovato
                message: "Matching PiValue found.",
            };
        } else {
            return { message: "No matching PiValues found in any report." };
        }
    } catch (error) {
        console.error("Error in retrieving the report and the lawyer:", error);
        throw error;
    }
}



async function getReportCountByLawyer(req, res) {

    try {

        const lawyersWithReportCounts = await lawyers.findAll({
            attributes: [
                'UuidLawyer', // UUID dell'avvocato
                'PublicKey',
                [db.sequelize.fn('COUNT', db.sequelize.col('reports.UuidReport')), 'reportCount'] // Conta i report
            ],
            include: [
                {
                    model: reportdb,  // Modello Report
                    as: 'reports',    // Alias per l'associazione
                    attributes: []     // Non selezioniamo colonne dalla tabella reports, solo per fare il conteggio
                }
            ],
            group: ['lawyer.UuidLawyer'],  // Raggruppa per UUID dell'avvocato
            order: [[db.sequelize.literal('reportCount'), 'ASC']], // Ordina in base al conteggio dei report in modo decrescente
            raw: true,  // Restituisce un oggetto "puro"
            logging: console.log  // Aggiungi log per debug
        });

        console.log("Avvocato con meno report:", lawyersWithReportCounts[0]);

        const firstLawyer = lawyersWithReportCounts[0];

        if (firstLawyer) {
            return {
                PublicKey: lawyersWithReportCounts[0].PublicKey, // Avvocato che gestisce il report
            };
        } else {
            return { message: "No lawyer found" };
        }

    } catch (error) {
        console.error('Error while searching for lawyer with fewer reports:', error);
        throw error;
    }

};

async function getKeyByLawyer(req, res) {
    try {
        const lawyer = await lawyers.findOne();
        if (!lawyer) {
            console.log('No lawyer found');
            return null;
        }

        return {
            PublicKey: lawyer.PublicKey
        };
    } catch (error) {
        console.error('Error fetching lawyer:', error);
        throw error;
    }
}

async function getKeyByUuidLawyer(req, res, lawyer) {
    try {
        const result = await lawyers.findOne({
            where: { UuidLawyer: lawyer },
        });

        if (result) {
            // Ritorno di successo con la PublicKey
            return {
                success: true,
                data: { PublicKey: result.dataValues.PublicKey },
            };
        } else {
            // Ritorno di errore se il lawyer non è stato trovato
            return {
                success: false,
                error: 'Lawyer not found',
            };
        }
    } catch (error) {
        console.error('Error fetching lawyer:', error);
        // Ritorno di errore in caso di eccezione
        return {
            success: false,
            error: 'An error occurred while fetching the lawyer',
            details: error, // Dettagli tecnici opzionali
        };
    }
}

module.exports = {
    getKeyByLawyer,
    getReportAndLawyerByPiValueForAllLawyers,
    getReportCountByLawyer,
    getKeyByUuidLawyer
};