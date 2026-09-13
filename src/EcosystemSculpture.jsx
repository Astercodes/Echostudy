import React, { useEffect, useState } from "react";
const growth = [
  {
    label: "Understand",
    title: "Give ideas strong roots.",
    detail:
      "Peel back the foundations. Connect a new idea to what you already know.",
  },
  {
    label: "Practice",
    title: "Let knowledge meet life.",
    detail:
      "Stretch an ability. Learn from what happens. Return with a better question.",
  },
  {
    label: "Become",
    title: "Grow what you can carry.",
    detail: "Keep the evidence of what your learning and practice produce.",
  },
];
export function EcosystemSculpture() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (paused || motion.matches) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % growth.length), 5000);
    return () => window.clearInterval(timer);
  }, [paused]);
  return (
    <div className={`eco-sculpture phase-${active}`}>
      <div className="sculpture-top">
        <span>
          A LIVING BODY OF KNOWLEDGE
        </span>
      </div>
      <svg
        viewBox="0 0 600 460"
        role="img"
        aria-label="Knowledge growing from blue roots into branching orange and yellow fruit"
      >
        <defs>
          <radialGradient id="eco-glow">
            <stop stopColor="#168fff" stopOpacity=".35" />
            <stop offset="1" stopColor="#168fff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="eco-fruit" x2="1" y2="1">
            <stop stopColor="#ffd949" />
            <stop offset=".6" stopColor="#ff8c15" />
            <stop offset="1" stopColor="#ef4936" />
          </linearGradient>
        </defs>
        <circle cx="300" cy="220" r="215" fill="url(#eco-glow)" />
        <g
          className="sculpture-orbits"
          fill="none"
          stroke="#98caff"
          strokeOpacity=".18"
        >
          <ellipse cx="300" cy="235" rx="247" ry="142" />
          <ellipse
            cx="300"
            cy="235"
            rx="170"
            ry="211"
            transform="rotate(35 300 235)"
          />
          <circle cx="300" cy="225" r="180" strokeDasharray="2 10" />
        </g>
        <g
          className="sculpture-branches"
          fill="none"
          stroke="#66bfff"
          strokeWidth="3"
          strokeLinecap="round"
        >
          <path d="M300 376V245Q300 189 175 150Q126 133 103 91M300 275Q204 260 119 279M300 240Q320 161 421 133Q458 123 481 79M300 289Q390 285 465 255M300 237V91" />
          <path
            d="M300 373Q244 390 207 418M300 373Q330 403 396 417M300 380V435M300 247Q208 202 208 75M386 146Q374 90 397 57"
            strokeWidth="1.5"
            strokeOpacity=".65"
          />
        </g>
        <g className="sculpture-fruit">
          <circle cx="103" cy="91" r="19" fill="#ffd43b" />
          <circle cx="208" cy="75" r="10" fill="#91d5ff" />
          <circle cx="300" cy="91" r="29" fill="url(#eco-fruit)" />
          <circle cx="397" cy="57" r="9" fill="#ff6350" />
          <circle cx="481" cy="79" r="20" fill="#009cde" />
          <circle cx="119" cy="279" r="29" fill="url(#eco-fruit)" />
          <circle cx="465" cy="255" r="33" fill="url(#eco-fruit)" />
          <path d="M463 221q-8-30 21-39q10 28-21 39" fill="#80d2ff" />
          <path d="M296 58q-3-22 20-25q5 22-20 25" fill="#80d2ff" />
        </g>
        <g fill="#fff" fontFamily="inherit" fontSize="10" letterSpacing="2">
          <text x="60" y="137">
            DISCOVER
          </text>
          <text x="258" y="145">
            CONNECT
          </text>
          <text x="444" y="124">
            RECALL
          </text>
          <text x="72" y="332">
            PRACTICE
          </text>
          <text x="432" y="315">
            HARVEST
          </text>
        </g>
        <circle
          cx="300"
          cy="248"
          r="42"
          fill="#102e63"
          stroke="#84c7ff"
          strokeWidth="1"
        />
        <path
          d="M300 269v-27q-25 0-25-23q26-4 25 23q0-32 27-31q4 25-27 31"
          fill="none"
          stroke="#ffd43b"
          strokeWidth="3"
        />
        <circle
          className="sculpture-pulse"
          cx="300"
          cy="248"
          r="49"
          fill="none"
          stroke="#ffd43b"
          strokeOpacity=".6"
        />
      </svg>
      <div key={active} className="sculpture-caption" aria-live={paused ? "polite" : "off"}>
        <strong>{growth[active].title}</strong>
        <p>{growth[active].detail}</p>
      </div>
      <div className="sculpture-controls" aria-label="Explore the growth cycle">
        {growth.map((item, i) => (
          <button
            type="button"
            key={item.label}
            aria-pressed={active === i}
            onClick={() => setActive(i)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <button className="sculpture-pause" onClick={() => setPaused(!paused)} aria-label={paused ? "Resume growth cycle" : "Pause growth cycle"}>{paused ? "Play cycle" : "Pause cycle"}</button>
    </div>
  );
}
