async function getStaffByEmail(staffDB, email) {
    let result = {}
    const allStaff = await staffDB.all()
    allStaff.forEach((staff) => {
        if(staff.value.email === email) {
            result = {...staff.value}
        }
    })
    return result
}

module.exports = getStaffByEmail