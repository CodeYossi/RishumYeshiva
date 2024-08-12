function getResponsibleSdorim(staffUser) {
    if (staffUser.seder[0] === "*") return ["הכל"]
    else return staffUser.seder
}
module.exports = getResponsibleSdorim