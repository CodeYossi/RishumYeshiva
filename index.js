// databases - ממסדי נתונים
const { QuickDB } = require("quick.db")
const classesDB = new QuickDB({ filePath: "./databases/classes.sqlite", table: "classes" })
const staffDB = new QuickDB({ filePath: "./databases/staff.sqlite", table: "staff" })
const sdorimDB = new QuickDB({ filePath: "./databases/sdorim.sqlite", table: "sdorim" })
const studentsDB = new QuickDB({ filePath: "./databases/students.sqlite", table: "students" })
const rishumDB = new QuickDB({ filePath: "./databases/rishum.sqlite" })
const sqlite = require("better-sqlite3")
const betterRishumDB = new sqlite("./databases/rishum.sqlite")
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
Date.prototype.getMonth = function () {
    return this.getUTCMonth() + 1
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
const getResponsibleSdorim = require("./functions/getResponsibleSdorim")
function timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
}
// routes
app.get("/", async (req, res) => {
    if (!req.cookies.email) return res.redirect("/login")
    const staffUser = await getStaffByEmail(staffDB, req.cookies.email)
    if (!staffUser || Object.keys(staffUser).length === 0) {
        res.clearCookie("email")
        res.redirect("/login")
        return
    }
    let currentSeder = showCurrentSeder((await sdorimDB.all()))
    const date = `${new Date().getDate()}-${new Date().getMonth().toString().length === 1 ? `0${new Date().getMonth()}` : `${new Date().getMonth()}`}-${new Date().getFullYear()}`
    if (currentSeder[0].message === false) {
        staffUser.responsibleSdorim = getResponsibleSdorim(staffUser)
        res.render("main", { date, yourRole: getRole(staffUser), currentSeder, time: `${hebrewJewishDate(new Date())} - ${moment().format("LT").replace("AM", 'לפה"צ').replace("PM", 'אחה"צ')}`, staffUser })
        return
    }
    else {
        if (staffUser.seder[0] !== "*") {
            currentSeder = currentSeder.filter(x => staffUser.seder.includes(x.name))
        }
        const startTimePromises = currentSeder.map(async (seder) => {
            const startTime = await sdorimDB.get(seder.name);
            return { ...seder, startTime: timeToMinutes(startTime["start-time"]) }
        })
        const sederWithStartTimes = await Promise.all(startTimePromises)
        const sorted = sederWithStartTimes.sort((a, b) => a.startTime - b.startTime).map(async x => {
            let newObj = x
            const hours = Math.floor(x.startTime / 60);
            const minutes = x.startTime % 60;
            newObj.startTime = `${hours}:${String(minutes).length === 1 ? `0${minutes}` : minutes}`
            if(!(await (await rishumDB.table(`'${date}'`)).has(x.name)) || (await (await rishumDB.table(`'${date}'`)).get(x.name)).length === 0) {
                 newObj.isRegistered = false
            } else {
                newObj.isRegistered = true
            }
            return newObj
        })
        const sortedPromised = await Promise.all(sorted)
        const onlyFor = sortedPromised.map(async (seder) => {
            if ((await sdorimDB.get(seder.name)).onlyFor) {
                seder.onlyFor = (await sdorimDB.get(seder.name)).onlyFor
                return seder
            } else {
                return seder
            }
        })
        const promised = await Promise.all(onlyFor)
        staffUser.responsibleSdorim = getResponsibleSdorim(staffUser)
        res.render("main.ejs", { date, yourRole: getRole(staffUser), currentSeder: promised, time: `${hebrewJewishDate(new Date())} - ${moment().format("LT").replace("AM", 'לפה"צ').replace("PM", 'אחה"צ')}`, staffUser })
    }
})
app.get("/login", async (req, res) => {
    if (req.cookies.email && (await staffDB.all()).filter(x => x.value.email === req.cookies.email).length === 0) return res.redirect("/")
    res.render("login.ejs")
})
app.get("/checkEmail", async (req, res) => {
    if (!req.query || !req.query.email) return res.send(false)
    const allStaff = {}
        ; (await staffDB.all()).forEach((x => {
            allStaff[x.id] = { ...x.value, type: "overseer" }
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
    return res.json(showCurrentSeder((await sdorimDB.all())))
})
app.get("/rishum/:date/:seder", async (req, res) => {
    if (!req.params || !req.params.date || !req.params.seder) return res.sendStatus(404)
    if (!req.cookies || !req.cookies.email) return res.redirect("/login")
    let { date, seder } = req.params
    seder = seder.split("-").join(" ")
    const { email } = req.cookies
    let staffUser = (await staffDB.all()).filter(x => x.value.email === email)
    if(staffUser.length === 0) return res.redirect("/login")
    staffUser = staffUser[0].value
    const result = betterRishumDB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(date)
    if(!result) return res.json({ message: "Invalid Date" }).status(404)
    const names = (await sdorimDB.all()).map(x => x.value.name)
    if(!names.includes(seder)) return res.json({ message: "Invalid Seder" }).status(404)
    if(staffUser.seder[0] !== "*") {
        if(!staffUser.seder.includes(seder)) return res.redirect("/")
    } 
    const thisDayTable = rishumDB.table(`'${date}'`)
    if(!(await thisDayTable.has(seder))) {
        thisDayTable.set(seder, [])
    }
    staffUser.responsibleSdorim = getResponsibleSdorim(staffUser)
    
    res.render("rishum", { seder: (await sdorimDB.get(seder)), staffUser, yourRole: getRole(staffUser), time: `${hebrewJewishDate(new Date())} - ${moment().format("LT").replace("AM", 'לפה"צ').replace("PM", 'אחה"צ')}` })
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
app.listen(8000, async () => {
    console.log("App Running on Port 3000.")
    const date = `${new Date().getDate()}-${new Date().getMonth().toString().length === 1 ? `0${new Date().getMonth()}` : `${new Date().getMonth()}`}-${new Date().getFullYear()}`
    await rishumDB.table(`'${date}'`)
})