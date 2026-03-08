import { useEffect, useMemo, useState } from "react";

type Step =
  | { type: "line"; text: string; className?: string }
  | { type: "spacer" };

function buildSteps(lines: Array<{ text: string; className?: string }>): Step[] {
  const steps: Step[] = [];
  for (const l of lines) {
    if (l.text === "") {
      steps.push({ type: "spacer" });
    } else {
      steps.push({ type: "line", text: l.text, className: l.className });
    }
  }
  return steps;
}

export function TerminalSequence({
  logs,
  message,
  charDelayMs = 22,
  lineGapMs = 160,
}: {
  logs: Array<{ text: string; className?: string }>;
  message: string;
  charDelayMs?: number;
  lineGapMs?: number;
}) {
  const steps = useMemo<Step[]>(() => {
    const messageLines = message.split("\n").map((t) => ({ text: t, className: "text-white" }));
    return [...buildSteps(logs), { type: "spacer" }, ...buildSteps(messageLines)];
  }, [logs, message]);

  const [stepIndex, setStepIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [isLineComplete, setIsLineComplete] = useState(false);

  const current = steps[stepIndex];

  // Type current line
  useEffect(() => {
    setTyped("");
    setIsLineComplete(false);

    if (!current) return;
    if (current.type === "spacer") {
      setIsLineComplete(true);
      return;
    }

    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(current.text.slice(0, i));
      if (i >= current.text.length) {
        window.clearInterval(id);
        setIsLineComplete(true);
      }
    }, charDelayMs);

    return () => window.clearInterval(id);
  }, [charDelayMs, current, stepIndex]);

  // Advance to next step
  useEffect(() => {
    if (!current) return;
    if (!isLineComplete) return;

    const timeout = window.setTimeout(() => {
      if (stepIndex < steps.length - 1) setStepIndex((v) => v + 1);
    }, current.type === "spacer" ? 120 : lineGapMs);

    return () => window.clearTimeout(timeout);
  }, [current, isLineComplete, lineGapMs, stepIndex, steps.length]);

  return (
    <div className="space-y-1 text-sm sm:text-base leading-relaxed">
      {steps.slice(0, stepIndex).map((s, idx) => {
        if (s.type === "spacer") return <div key={idx} className="h-3" />;
        return (
          <div key={idx} className={s.className ?? "text-white/70"}>
            {s.text}
          </div>
        );
      })}

      {/* Current step (typing) */}
      {current?.type === "spacer" ? (
        <div className="h-3" />
      ) : current ? (
        <div className={current.className ?? "text-white/70"}>
          {typed}
          {!isLineComplete && <span className="ml-1 animate-pulse">█</span>}
        </div>
      ) : null}
    </div>
  );
}
