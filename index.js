// databases - ממסדי נתונים
const { QuickDB } = require("quick.db")
const classesDB = new QuickDB({ filePath: "./databases/classes.sqlite", table: "classes" })
const lessonsDB = new QuickDB({ filePath: "./databases/lessons.sqlite", table: "lessons" })
const overseersDB = new QuickDB({ filePath: "./databases/overseers.sqlite", table: "overseers" })
const sdorimDB = new QuickDB({ filePath: "./databases/sdorim.sqlite", table: "sdorim" })
const studentsDB = new QuickDB({ filePath: "./databases/students.sqlite", table: "students" })
const teachersDB = new QuickDB({ filePath: "./databases/teachers.sqlite", table: "teachers" })
// תיכנס אצלך במחשב לקישור http://localhost:3000 זה אמור להראות לך את האתר
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
app.use(require("body-parser").urlencoded({ extended: true }))
app.set("view engine", "ejs")
// שונות
const showCurrentSeder = require("./functions/showCurrentSeder")
// routes
app.get("/", async (req, res) => {
    const currentSeder = showCurrentSeder((await sdorimDB.all()), (await lessonsDB.all()))
    res.render("main.ejs", { currentSeder, time: hebrewJewishDate(new Date()) })
})
app.get("/jewishDate", (req, res) => res.json({ letters: hebrewJewishDate(new Date()), numbers: toJewishDate(new Date()), gregorian: moment().format("L") }))
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

// launch app
app.listen(3000, () => {``
    console.log("App Running on Port 3000.")
})