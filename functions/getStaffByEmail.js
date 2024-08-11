async function getStaffByEmail(overseersDB, teachersDB, email) {
    let result = {}
    const allOverseers = await overseersDB.all()
    const allTeachers = await teachersDB.all()
    allOverseers.forEach((overseer) => {
        if(overseer.value.email === email) {
            result = {...overseer.value, type: "overseer"}
        }
    })
    allTeachers.forEach((teacher) => {
        if(teacher.value.email === email) {
            result = {...teacher.email, type: "teacher"}
        }
    })
    return result
}

module.exports = getStaffByEmail