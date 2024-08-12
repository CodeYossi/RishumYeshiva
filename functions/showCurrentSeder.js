const moment = require("moment")
moment.locale("he")
function showCurrentSeder(sdorim) {
    function timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number)
        return hours * 60 + minutes
    }

    const currentTime = moment(Date.now()).format("LT").split(" ")[0]
    const currentMinutes = timeToMinutes(currentTime)

    function isCurrentTimeInRange(startTime, endTime) {
        const startMinutes = timeToMinutes(startTime)
        const endMinutes = timeToMinutes(endTime)
        return currentMinutes >= startMinutes && currentMinutes <= endMinutes
    }

    function findObjectInTimeRange(files) {
        const arr = []
        for (const file of files) {
            for (const item of file) {
                const { 'start-time': startTime, 'end-time': endTime } = item.value
                if (isCurrentTimeInRange(startTime, endTime)) {
                    const [hours, minutes] = endTime.split(":")
                    const endsIn = moment(new Date().setHours(hours, minutes)).fromNow()
                    arr.push({ name: item.value.name, endsIn: `${endsIn}, בשעה ${endTime}`, ended: endsIn.startsWith("לפני") ? true : false, type: item.value.type === "seder" ? "סדר" : "שיעור" })
                }
            }
        }
        return arr.length > 0 ? arr : [{ message: false }]
    }
    const files = [sdorim];
    const result = findObjectInTimeRange(files);
    return result
}
module.exports = showCurrentSeder