import {
  atLeastOneStar,
  createFormatter,
  formatTimeDiff,
  hoistCompletionDayLevel
} from "../utils";

// delta: time between `first` star and `second` star
const calculateTimes = (day, formatter) => {
  const def = { first: null, second: "", delta: "", raw: Infinity };
  if (!day) return { ...def };

  const first = new Date(Number(day["1"].get_star_ts) * 1000);

  if (!day["2"]) return { ...def, first: formatter.format(first) };

  const second = new Date(Number(day["2"].get_star_ts) * 1000);

  const diff = second - first;
  const readable = formatTimeDiff(diff);

  const delta = `Δ ${readable}${" ".repeat(7 - readable.length)} min`;

  return {
    delta,
    raw: diff,
    second: formatter.format(second),
    first: formatter.format(first)
  };
};

const timeDiffRank = (req, res) => {
  if (req.method !== "POST") {
    res.statusCode = 403;
    return res.end();
  }

  try {
    const { body } = req;
    const { "x-time-zone": timeZone = "Europe/Stockholm" } = req.headers;

    const formatter = createFormatter(timeZone);
    const memberStars = Object.values(body.members)
      .filter(atLeastOneStar)
      .map(hoistCompletionDayLevel);

    const stats = Array.from({ length: 25 }, (_, i) => i + 1).map((day) => {
      return {
        day,
        entries: memberStars
          .map((member) => ({
            ...calculateTimes(member[day], formatter),
            name: member.name === null ? "Unknown" : member.name
          }))
          .sort((a, b) => a.raw - b.raw)
      };
    });

    const boards = stats.reduce((prev, curr) => {
      const { day, entries } = curr;

      if (entries.filter((entry) => entry.first).length === 0) return prev;

      return `${prev}\nDay ${day}\n${entries
        .filter((entry) => entry.first)
        .map(
          (entry) =>
            ` ${entry.name}${" ".repeat(30 - entry.name.length)}${
              entry.delta
            }${" ".repeat(20 - entry.delta.length)} ${entry.first} -> ${
              entry.second
            } `
        )
        .join("\n")}\n`;
    }, `${body.event || ""} day by day\n`);

    res.setHeader("Content-Type", "text/plain");
    return res.send(boards);
  } catch (e) {
    console.log(e);
    return res.send("error");
  }
};

export default timeDiffRank;
