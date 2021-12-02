export const atLeastOneStar = (member) =>
  Object.keys(member.completion_day_level).length > 0;

export const createFormatter = (timeZone) =>
  new Intl.DateTimeFormat("sv-SE", {
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    timeZone
  });

export const hoistCompletionDayLevel = ({ name, completion_day_level }) => ({
  ...completion_day_level,
  name
});

export const formatTimeDiff = (diff) => {
  const scaled = diff / 1000;
  const minutes = Math.floor(scaled / 60);
  const seconds = Math.floor(scaled % 60);

  return minutes < 9999
    ? `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`
    : "+9999";
};

export const withName = ({ id, name, ...rest }) => ({
  ...rest,
  id,
  name: name || `anonymous user #${id}`
});
