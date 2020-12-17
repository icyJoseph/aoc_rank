import { Fragment, useRef, useState } from "react";

function App() {
  const [result, setResult] = useState("");
  const [error, setError] = useState(false);

  const txtArea = useRef(null);

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      const value = txtArea.current.value ?? "";

      if (!value.trim()) return null;

      const body = value.trim();

      const timeZone =
        Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone ??
        "Europe/Stockholm";

      const text = await fetch("/api/rank", {
        method: "POST",
        body,
        headers: { "Content-Type": "application/json", "x-time-zone": timeZone }
      }).then((res) => res.text());

      if (text === "error") {
        return setError(true);
      }
      setError(false);
      return setResult(text);
    } catch (e) {
      setError(true);
    }
  };

  return (
    <Fragment>
      <header>
        <span>
          <h1>[AoC]: Between the stars</h1>{" "}
          <span className="emoji" role="img" aria-label="star">
            ⭐
          </span>
          <span className="emoji" role="img" aria-label="star">
            ⭐
          </span>
        </span>

        <p>
          Ranks leaderboard members by time taken between first and second stars
        </p>

        <form onSubmit={onSubmit}>
          <textarea
            rows="1"
            placeholder="JSON for your private leaderboard"
            spellCheck="false"
            ref={txtArea}
          />

          <button type="submit">Rank</button>
        </form>
      </header>
      <main>
        {error && (
          <span className="warning">
            Something's gone wrong. Please make sure your JSON is correct.
          </span>
        )}
        <pre>{result}</pre>
      </main>
      <footer>Totally not related to AoC and its creators.</footer>
    </Fragment>
  );
}

export default App;
