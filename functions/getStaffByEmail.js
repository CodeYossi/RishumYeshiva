async function getStaffByEmail(overseersDB, teachersDB, email) {
    let result = {}
    const allOverseers = await overseersDB.all()
    const allTeachers = await teachersDB.all()
    allOverseers.forEach((overseer) => {
        if(overseer.value.email === email) {
            result = overseer.value
        }
    })
    allTeachers.forEach((teacher) => {
        if(teacher.value.email === email) {
            result = teacher.email
        }
    })
    return result
}

module.exports = getStaffByEmail