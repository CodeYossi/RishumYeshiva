function getRole(staffUser) {
    const roles = []
    if (staffUser.seder[0] === "*") return "מנהל"
    if (staffUser.seder.some(x => x === "חסידות בוקר" || x === "חסידות ערב" && staffUser.type === "teacher")) roles.push('משפיע בחסידות')
    if (staffUser.seder.some(x => x.includes("שחרית"))) roles.push("משגיח בחסידות בוקר")
    if (staffUser.seder.some(x => x === "שיעור עיונא" && staffUser.type === "teacher")) roles.push('ר"מ בעיונא')
    if (staffUser.seder.some(x => x === "סדר  חזרה" || x === "סדר הכנה") || staffUser.seder.some(x => x.includes("הכנה"))) roles.push("משגיח בעיונא")
    if (staffUser.seder.some(x => x.includes("גירסא") && staffUser.type === "overseer")) roles.push("משגיח בגירסא")
    if (staffUser.seder.some(x => x.includes("גירסא") && staffUser.type === "teacher")) roles.push('ר"מ בגירסא')
    if (staffUser.seder.some(x => x.includes("מעריב"))) roles.push("משגיח בחסידות ערב")
    return roles.length > 1 ? roles.join(", ") : "לא זמין"
}

module.exports = getRole