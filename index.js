// databases - ממסדי נתונים
const { QuickDB } = require("quick.db")
const classesDB = new QuickDB({ filePath: "./databases/classes.sqlite", table: "classes" })
const lessonsDB = new QuickDB({ filePath: "./databases/lessons.sqlite", table: "lessons" })
const overseersDB = new QuickDB({ filePath: "./databases/overseers.sqlite", table: "overseers" })
const sdorimDB = new QuickDB({ filePath: "./databases/sdorim.sqlite", table: "sdorim" })
const studentsDB = new QuickDB({ filePath: "./databases/students.sqlite", table: "students" })
const teachersDB = new QuickDB({ filePath: "./databases/teachers.sqlite", table: "teachers" })
// זמנים ולוח שנה יהודי
const { toJewishDate, formatJewishDateInHebrew, toGregorianDate } = require("jewish-date")
const moment = require("moment")
moment.locale("he")
const hebrewJewishDate = function (date) {
    let base = formatJewishDateInHebrew(toJewishDate(date)).split(" ")
    // special jewish months
    if (base[1] === "אדר" && ["ב", "א"].includes(base[2])) base[2] = base[2] + "'"
    if (base[1] === "אב") base[1] = "מנחם אב"
    var year = base[base.length - 1].split("")
    year[0] = `${year[0]}'`
    base[base.length - 1] = year.join("")
    return `${moment().format("dddd")}, ${base.join(" ")}`
}
// שרת 
const express = require("express")
const app = express()
const cookieParser = require("cookie-parser")
app.use(cookieParser())
app.use(require("body-parser").urlencoded({ extended: true }))
app.set("view engine", "ejs")
// שונות
const showCurrentSeder = require("./functions/showCurrentSeder")
const getStaffByEmail = require("./functions/getStaffByEmail")
const getRole = require("./functions/getRole")
// routes
app.get("/", async (req, res) => {
    if (!req.cookies.email) return res.redirect("/login")
    const staffUser = await getStaffByEmail(overseersDB, teachersDB, req.cookies.email)
    if (!staffUser || Object.keys(staffUser).length === 0) {
        res.clearCookie("email")
        res.redirect("/login")
        return
    }

    let currentSeder = showCurrentSeder((await sdorimDB.all()), (await lessonsDB.all()))
    if (currentSeder[0].message !== false) {
        if (staffUser.type === "overseer") {
            if (staffUser.seder[0] !== "*") currentSeder = currentSeder.filter(x => staffUser.seder.includes(x.name))
        } else if (staffUser.type === "teacher") {
            currentSeder = currentSeder.filter(x => staffUser.lessons.includes(x.name))
        }
    }
    let responsibleSdorim = []
    if (staffUser.type === "overseer") {
        if (staffUser.seder[0] === "*") responsibleSdorim.push("הכל")
        else staffUser.seder.forEach((x) => responsibleSdorim.push(x))
    } else if (staffUser.type === "teacher") {
        staffUser.lessons.forEach((x) => responsibleSdorim.push(x.name))
    }
    // console.log(currentSeder)
    res.render("main.ejs", { responsibleSdorim, yourRole: getRole(staffUser), currentSeder, time: `${hebrewJewishDate(new Date())} - ${moment().format("LT").replace("AM", 'לפה"צ').replace("PM", 'אחה"צ')}`, staffUser })
})
app.get("/login", async (req, res) => {
    if (req.cookies.email) return res.redirect("/")
    res.render("login.ejs")
})
app.get("/checkEmail", async (req, res) => {
    (req.query)
    if (!req.query || !req.query.email) return res.send(false)
    const allStaff = {}
        ; (await overseersDB.all()).forEach((x => {
            allStaff[x.id] = { ...x.value, type: "overseer" }
        }))
        ; (await teachersDB.all()).forEach((x => {
            allStaff[x.id] = { ...x.value, type: "teacher" }
        }))
    let found = false
    Object.keys(allStaff).forEach(x => {
        if (allStaff[x].email === req.query.email) {
            res.json({ result: allStaff[x] }); found = true
            return
        }
    })
    if (!found) return res.send(false)
})
app.get("/jewishDate", (req, res) => {
    res.json({ letters: hebrewJewishDate(new Date()), numbers: toJewishDate(new Date()), gregorian: moment().format("L") })
})
app.get("/findClass")
app.get("/findStudent", async (req, res) => {
    const { name, shiur } = req.query
    const all = await studentsDB.all()
    if (!shiur) return res.json(all.map(x => x.value))
    const shiurData = await studentsDB.get(shiur)
    if (!shiurData) return res.json({ message: `Unknown shiur: (${(await studentsDB.all()).map(x => x.id).join(", ")})` })
    if (!name) return res.json(shiurData)
    const result = shiurData.students.filter(x => x.name.includes(name))
    if (result.length === 0) return res.json({ message: `Student in shiur '${shiur}' named '${name}' not found.` })
    return res.json(result)
})
app.get("/showCurrentSeder", async (req, res) => {
    return res.json(showCurrentSeder((await sdorimDB.all()), (await lessonsDB.all())))
})
app.get("/styles/:fileName", (req, res) => {
    const { fileName } = req.params
    if (require("fs").readdirSync("./views/styles").includes(fileName)) return res.sendFile(__dirname + "/views/styles/" + fileName)
    else return res.sendStatus(404)
})
app.post("/login", async (req, res) => {
    if (!req.query || !req.query.email) return res.send(false)
    const email = req.query.email
    res.cookie("email", email).sendStatus(200)
})
app.delete("/logout", async (req, res) => {
    if (!req.cookies || !req.cookies.email) return true
    try {
        res.clearCookie("email")
        res.sendStatus(200)
    } catch (err) {
        console.log(`Error while trying to disconnect, email: ${req.cookies.email}`)
        return res.sendStatus(403)
    }
})

// launch app
app.listen(8000, () => {
    console.log("App Running on Port 3000.")
})