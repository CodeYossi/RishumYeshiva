function getRole(staffUser) {
    const roles = []
    if (staffUser.type === "overseer") {
        if (staffUser.seder[0] === "*") return "מנהל"
        if (staffUser.seder.some(x => x.includes("חזרה")) || staffUser.seder.some(x => x.includes("הכנה"))) roles.push("משגיח בעיונא")
        if (staffUser.seder.some(x => x.includes("גירסא"))) roles.push("משגיח בגירסא")
        if (staffUser.seder.some(x => x.includes("שחרית"))) roles.push("משגיח בחסידות בוקר")
        if (staffUser.seder.some(x => x.includes("מעריב"))) roles.push("משגיח בחסידות ערב")
    } else if (staffUser.type === "teacher") {
    }
    return roles.join(", ")
}

module.exports = getRole