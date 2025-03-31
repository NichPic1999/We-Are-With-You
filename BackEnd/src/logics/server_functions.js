const server_service = require('../services/server_service')
var updated_list = [];

async function verifyMatching() {

    const listOfReports = await server_service.getAllReports();
    console.log(listOfReports.length)

    updated_list = listOfReports

}

function returnLastMatchingOfLawyer(UuidLawyer) {

    return filteredReports = updated_list.filter(
        (report) => report.UuidLawyer === UuidLawyer
    );
   
}


module.exports = {
    verifyMatching,
    returnLastMatchingOfLawyer
};