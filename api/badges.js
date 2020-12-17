import {
  atLeastOneStar,
  formatTimeDiff,
  hoistCompletionDayLevel,
  withName
} from "../utils";

const badges = (req, res) => {
  if (req.method !== "POST") {
    res.statusCode = 403;
    return res.end();
  }

  try {
    const { body } = req;

    const { event, members } = body;

    const withStars = Object.values(members)
      .filter(atLeastOneStar)
      .filter(withName);

    const memberStars = withStars.map(hoistCompletionDayLevel);

    const memberScore = withStars.map(
      ({ name, global_score, local_score, stars, last_star_ts }) => ({
        name,
        global_score,
        local_score,
        stars,
        last_star_ts
      })
    );

    const highestLocalScore = memberScore
      .slice(0)
      .sort((a, b) => b.local_score - a.local_score);

    const highestGlobalScore = memberScore
      .slice(0)
      .filter(({ global_score }) => global_score > 0)
      .sort((a, b) => b.global_score - a.global_score);

    const mostStars = memberScore.slice(0).sort((a, b) => {
      const diff = b.stars - a.stars;
      if (diff > 0) {
        return 1;
      } else if (diff < 0) {
        return -1;
      } else {
        return a.last_star_ts - b.last_star_ts;
      }
    });

    const allMembersAvgTime = memberStars.map(({ name, ...days }) => {
      const solvedDays = Object.keys(days);
      const { stars } = memberScore.find((member) => member.name === name);

      const avg = solvedDays
        .map((day) => {
          const current = days[day];
          const dayStart = new Date(
            Date.UTC(Number(event), 11, Number(day), 5)
          ).getTime();

          const first = Number(current["1"].get_star_ts) * 1000;

          if (first - dayStart < 0) {
            console.log({ first, dayStart, day });
          }

          if (!current["2"])
            return {
              first,
              second: 0,
              diff: 0,
              firstDiff: (first - dayStart) / solvedDays.length,
              secondDiff: 0
            };

          const second = Number(current["2"].get_star_ts) * 1000;
          const diff = (second - first) / solvedDays.length;

          return {
            first,
            second,
            diff,
            firstDiff: (first - dayStart) / solvedDays.length,
            secondDiff: (second - dayStart) / solvedDays.length
          };
        })
        .reduce(
          (prev, { firstDiff, secondDiff, diff, ...rest }) => {
            return {
              ...rest,
              firstDiff: prev.firstDiff + firstDiff,
              secondDiff: prev.secondDiff + secondDiff,
              diff: prev.diff + diff
            };
          },
          {
            firstDiff: 0,
            secondDiff: 0,
            diff: 0
          }
        );
      return { ...avg, name, stars };
    });

    const earlyBird = allMembersAvgTime
      .sort((a, b) => a.firstDiff - b.firstDiff)
      .sort((a, b) => b.stars - a.stars)
      .map(({ firstDiff, name, stars }) => ({
        name,
        oneStar: formatTimeDiff(firstDiff),
        stars
      }));

    const starChild = allMembersAvgTime
      .filter(({ secondDiff }) => secondDiff > 0)
      .sort((a, b) => a.secondDiff - b.secondDiff)
      .sort((a, b) => b.stars - a.stars)
      .map(({ secondDiff, name, stars }) => ({
        name,
        twoStars: formatTimeDiff(secondDiff),
        stars
      }));

    const inTheZone = allMembersAvgTime
      .filter(({ diff }) => diff > 0)
      .sort((a, b) => a.diff - b.diff)
      .sort((a, b) => b.stars - a.stars)
      .map(({ diff, name, stars }) => ({
        name,
        diff: formatTimeDiff(diff),
        stars
      }));

    const badges = {
      event,
      highestGlobalScore,
      highestLocalScore,
      mostStars,
      earlyBird,
      starChild,
      inTheZone
    };

    const [earlyBird1st, earlyBird2nd, earlyBird3rd] = badges.earlyBird;
    const [starChild1st, starChild2nd, starChild3rd] = badges.starChild;
    const [inTheZone1st, inTheZone2nd, inTheZone3rd] = badges.inTheZone;

    const board = `
${event} Badges
    
Early Bird
    Fastest to one star (min)

    ${earlyBird1st.name}${" ".repeat(30 - earlyBird1st.name.length)} ${
      earlyBird1st.oneStar
    }
    ${earlyBird2nd.name}${" ".repeat(30 - earlyBird2nd.name.length)} ${
      earlyBird2nd.oneStar
    }
    ${earlyBird3rd.name}${" ".repeat(30 - earlyBird3rd.name.length)} ${
      earlyBird3rd.oneStar
    }

Star Child
    Fastest to two stars (min)

    ${starChild1st.name}${" ".repeat(30 - starChild1st.name.length)} ${
      starChild1st.twoStars
    }
    ${starChild2nd.name}${" ".repeat(30 - starChild2nd.name.length)} ${
      starChild2nd.twoStars
    }
    ${starChild3rd.name}${" ".repeat(30 - starChild3rd.name.length)} ${
      starChild3rd.twoStars
    }

In the Zone
    Once you get one star, how long does it take for two? (min)

    ${inTheZone1st.name}${" ".repeat(30 - inTheZone1st.name.length)} ${
      inTheZone1st.diff
    }
    ${inTheZone2nd.name}${" ".repeat(30 - inTheZone2nd.name.length)} ${
      inTheZone2nd.diff
    }
    ${inTheZone3rd.name}${" ".repeat(30 - inTheZone3rd.name.length)} ${
      inTheZone3rd.diff
    }

* Members are sorted, first by time, and then by stars obtained.
`;

    res.setHeader("Content-Type", "text/plain");
    return res.send(board);
  } catch (e) {
    console.log(e);
    return res.send("error");
  }
};

export default badges;
