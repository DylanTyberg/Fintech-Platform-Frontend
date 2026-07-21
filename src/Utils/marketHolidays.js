// NYSE holiday calendar, computed rather than hardcoded so it doesn't go
// stale every January. Used to filter portfolio snapshots: on days the
// market is closed, the snapshot job currently records cash-only (not the
// full portfolio value) instead of skipping the day — this excludes those
// bad data points from charts/stats until that's fixed server-side.

const pad2 = (n) => String(n).padStart(2, "0");
const formatYMD = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

// Shifts a fixed-date holiday off weekends the way NYSE observes it:
// Saturday -> observed the preceding Friday, Sunday -> observed the
// following Monday.
const observedDate = (date) => {
    const day = date.getDay();
    if (day === 6) return new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
    if (day === 0) return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    return date;
};

// nth occurrence of a weekday in a month (e.g. "3rd Monday of January").
// month is 0-indexed, weekday 0=Sunday..6=Saturday, n is 1-4.
const nthWeekdayOfMonth = (year, month, weekday, n) => {
    const first = new Date(year, month, 1);
    const offset = (weekday - first.getDay() + 7) % 7;
    return new Date(year, month, 1 + offset + (n - 1) * 7);
};

const lastWeekdayOfMonth = (year, month, weekday) => {
    const last = new Date(year, month + 1, 0);
    const offset = (last.getDay() - weekday + 7) % 7;
    return new Date(year, month, last.getDate() - offset);
};

// Meeus/Jones/Butcher Gregorian algorithm for Easter Sunday.
const getEasterSunday = (year) => {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
};

const getGoodFriday = (year) => {
    const easter = getEasterSunday(year);
    return new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 2);
};

const holidaySetCache = {};

const getMarketHolidaySet = (year) => {
    if (holidaySetCache[year]) return holidaySetCache[year];

    const dates = [
        observedDate(new Date(year, 0, 1)),        // New Year's Day
        nthWeekdayOfMonth(year, 0, 1, 3),           // MLK Day
        nthWeekdayOfMonth(year, 1, 1, 3),           // Presidents Day
        getGoodFriday(year),                        // Good Friday
        lastWeekdayOfMonth(year, 4, 1),              // Memorial Day
        observedDate(new Date(year, 5, 19)),        // Juneteenth
        observedDate(new Date(year, 6, 4)),         // Independence Day
        nthWeekdayOfMonth(year, 8, 1, 1),           // Labor Day
        nthWeekdayOfMonth(year, 10, 4, 4),          // Thanksgiving
        observedDate(new Date(year, 11, 25)),       // Christmas
    ];

    const set = new Set(dates.map(formatYMD));
    holidaySetCache[year] = set;
    return set;
};

export const isMarketHoliday = (ymdString) => {
    const year = Number(ymdString.slice(0, 4));
    return getMarketHolidaySet(year).has(ymdString);
};

export const isTradingDay = (ymdString) => {
    const [y, m, d] = ymdString.split("-").map(Number);
    const dayOfWeek = new Date(y, m - 1, d).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return false; // weekend
    return !isMarketHoliday(ymdString);
};

// Shared by TradeSimulator and PortfolioAnalytics: turns raw snapshot
// records ({date: "MM-DD-YYYY", portfolioValue}) into sorted {time, value}
// points, dropping weekends/holidays where the value is currently unreliable.
export const buildSnapshotSeries = (snapshots) => {
    if (!snapshots || snapshots.length === 0) return [];
    return snapshots
        .map((snapshot) => {
            const [month, day, year] = snapshot.date.split("-");
            return { time: `${year}-${month}-${day}`, value: snapshot.portfolioValue };
        })
        .filter(({ time }) => isTradingDay(time))
        .sort((a, b) => a.time.localeCompare(b.time));
};