import { useEffect, useMemo, useRef, useState } from "react";
import { CATALOG, VENDOR_LABEL } from "../models/catalog";
import { pickRandomPair } from "../lib/shuffle";
import { getAppVersion, type SessionRecord } from "../lib/telemetry";

const SCENARIOS = [
  "Greenfield: design a public HTTP API, OpenAPI, and 6-month migration plan for clients.",
  "Incident: paged 3am, logs show flapping connection pool; find root cause and harden tests.",
  "Refactor: untangle 40k lines of JS into typed modules with zero behavior change.",
] as const;

const TOTAL_ROUNDS = 12;

type Props = {
  session: SessionRecord;
  onAppend: (type: string, payload: Record<string, unknown>) => void;
};

export function HeadToHeadTest({ session, onAppend }: Props) {
  const [round, setRound] = useState(0);
  const [pair, setPair] = useState(() => pickRandomPair(CATALOG, session.seed, 0));
  const [scenarioIndex] = useState(() => Math.floor(Math.random() * SCENARIOS.length));
  const scenario = SCENARIOS[scenarioIndex]!;

  const labels = useMemo(
    () => ({ left: pair[0]!.id, right: pair[1]!.id }) as const,
    [pair]
  );

  const mountLogged = useRef(false);
  useEffect(() => {
    const key = `h2h-mount-${session.sessionId}`;
    if (mountLogged.current || sessionStorage.getItem(key)) return;
    mountLogged.current = true;
    sessionStorage.setItem(key, "1");
    onAppend("h2h_mount", {
      test: "head_to_head",
      appVersion: getAppVersion(),
      scenario,
      totalRounds: TOTAL_ROUNDS,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (side: "left" | "right") => {
    if (round >= TOTAL_ROUNDS) return;
    const winner = side === "left" ? pair[0]! : pair[1]!;
    const loser = side === "left" ? pair[1]! : pair[0]!;
    onAppend("h2h_round", {
      round: round + 1,
      scenario,
      leftId: labels.left,
      rightId: labels.right,
      winnerId: winner.id,
      loserId: loser.id,
    });
    const nextR = round + 1;
    if (nextR >= TOTAL_ROUNDS) {
      onAppend("h2h_complete", { totalRounds: TOTAL_ROUNDS, scenario });
      setRound(TOTAL_ROUNDS);
    } else {
      setPair(pickRandomPair(CATALOG, session.seed, nextR));
      setRound(nextR);
    }
  };

  if (round >= TOTAL_ROUNDS) {
    return (
      <div className="panel">
        <h2>All {TOTAL_ROUNDS} rounds done</h2>
        <p>
          Use <strong>Download this session</strong> in the header for a file, or <strong>New session</strong> to start
          over.
        </p>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Compare two at a time</h2>
        <p className="hint">Tap the side you prefer. There are {TOTAL_ROUNDS} short rounds.</p>
      </div>
      <div className="scenario">
        <span className="small muted">
          Round {round + 1} / {TOTAL_ROUNDS}
        </span>
        <p className="scenario-text">{scenario}</p>
      </div>
      <div className="h2h">
        <button type="button" className="h2h-card" onClick={() => choose("left")}>
          <div className="pill vendor">{VENDOR_LABEL[pair[0]!.vendor]}</div>
          <div className="h2h-name">{pair[0]!.displayName}</div>
          <div className="mono small">{pair[0]!.id}</div>
          <span className="chev">Pick →</span>
        </button>
        <div className="h2h-vs" aria-hidden>
          or
        </div>
        <button type="button" className="h2h-card" onClick={() => choose("right")}>
          <div className="pill vendor">{VENDOR_LABEL[pair[1]!.vendor]}</div>
          <div className="h2h-name">{pair[1]!.displayName}</div>
          <div className="mono small">{pair[1]!.id}</div>
          <span className="chev">Pick →</span>
        </button>
      </div>
    </div>
  );
}
