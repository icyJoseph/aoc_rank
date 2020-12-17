const formatter = new Intl.DateTimeFormat("sv-SE", {
  hour: "numeric",
  minute: "numeric",
  second: "numeric"
});

const atLeastOneStar = (member) =>
  Object.keys(member.completion_day_level).length > 0;

const hoistCompletionDayLevel = ({ name, completion_day_level }) => ({
  ...completion_day_level,
  name
});

// delta: time between `first` star and `second` star
const calculateTimes = (day) => {
  const def = { first: null, second: "", delta: "", raw: Infinity };
  if (!day) return { ...def };

  const first = new Date(Number(day["1"].get_star_ts) * 1000);

  if (!day["2"]) return { ...def, first: formatter.format(first) };

  const second = new Date(Number(day["2"].get_star_ts) * 1000);

  const diff = (second - first) / 1000;
  const minutes = Math.floor(diff / 60);
  const seconds = diff % 60;

  const readable =
    minutes < 9999
      ? `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`
      : "+9999";

  const delta = `Δ ${readable}${" ".repeat(7 - readable.length)} min`;

  return {
    delta,
    raw: diff,
    second: formatter.format(second),
    first: formatter.format(first)
  };
};

const handler = (req, res) => {
  if (req.method !== "POST") {
    res.statusCode = 403;
    return res.end();
  }

  try {
    const { body } = req;
    const memberStars = Object.values(body.members)
      .filter(atLeastOneStar)
      .map(hoistCompletionDayLevel);

    const stats = Array.from({ length: 25 }, (_, i) => i + 1).map((day) => {
      return {
        day,
        entries: memberStars
          .map((member) => ({
            ...calculateTimes(member[day]),
            name: member.name === null ? "Unknown" : member.name
          }))
          .sort((a, b) => a.raw - b.raw)
      };
    });

    const boards = stats.reduce((prev, curr) => {
      const { day, entries } = curr;
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
    }, "");

    res.setHeader("Content-Type", "text/plain");
    return res.send(boards);
  } catch (e) {
    console.log(e);
    return res.send("error");
  }
};

export default handler;
