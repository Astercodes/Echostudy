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
function PracticeArt() {
  return <svg viewBox="0 0 600 460" role="img" aria-label="A golden idea travels over blue stepping stones through practice and feedback toward a real-world doorway">
    <defs><linearGradient id="practice-step" x2="0" y2="1"><stop stopColor="#29b4f1"/><stop offset="1" stopColor="#133d94"/></linearGradient><radialGradient id="practice-light"><stop stopColor="#ffab36" stopOpacity=".25"/><stop offset="1" stopColor="#ffab36" stopOpacity="0"/></radialGradient></defs>
    <circle cx="390" cy="200" r="210" fill="url(#practice-light)"/>
    <g fill="none" stroke="#86cfff" strokeOpacity=".16"><ellipse cx="300" cy="330" rx="250" ry="85"/><ellipse cx="300" cy="330" rx="195" ry="55"/></g>
    <g className="practice-door"><path d="M418 286V105Q418 62 463 62Q508 62 508 105V286" fill="#ff932d"/><path d="M436 286V110Q436 82 463 82Q490 82 490 110V286" fill="#081d39"/><path d="M449 154l13-13 13 13m-13-13v53" fill="none" stroke="#ffd43b" strokeWidth="3"/></g>
    {[[90,320,66],[192,280,66],[294,240,66],[396,200,66]].map(([x,y,w],i)=><g key={x} className="practice-stone" style={{animationDelay:`${i*.12}s`}}><path d={`M${x} ${y}l40-20 ${w} 20-40 22Z`} fill="#64c9ff"/><path d={`M${x} ${y}v35l66 24 40-24v-35l-40 22Z`} fill="url(#practice-step)"/></g>)}
    <path className="practice-feedback" d="M437 313C380 419 154 413 104 368" fill="none" stroke="#ffad45" strokeWidth="2" strokeDasharray="7 8"/>
    <path d="M106 384l-6-19 20 3" fill="none" stroke="#ffad45" strokeWidth="2"/>
    <g className="practice-idea"><circle r="24" fill="#ffab32"/><circle cx="-7" cy="-8" r="7" fill="#ffe5a0"/><circle r="33" fill="none" stroke="#ffd43b" strokeOpacity=".3"/></g>
    <g fill="#c8def4" fontSize="10" letterSpacing="2"><text x="87" y="398">TRY</text><text x="240" y="418">REFLECT & RETURN</text><text x="404" y="40">REAL LIFE</text></g>
  </svg>;
}
function BecomeArt() {
  return <svg viewBox="0 0 600 460" role="img" aria-label="Drops of practice and evidence fill a blue glass capacity vessel as golden rings expand outward">
    <defs><linearGradient id="capacity-glass" x2="1" y2="1"><stop stopColor="#54c9ff" stopOpacity=".35"/><stop offset=".5" stopColor="#258bdf" stopOpacity=".08"/><stop offset="1" stopColor="#70d6ff" stopOpacity=".4"/></linearGradient><linearGradient id="capacity-water" x2="0" y2="1"><stop stopColor="#ffce49"/><stop offset="1" stopColor="#f36b27"/></linearGradient><clipPath id="capacity-clip"><path d="M190 170L211 348Q300 405 389 348L410 170Z"/></clipPath></defs>
    <g className="capacity-halo" fill="none" stroke="#62baff" strokeOpacity=".24"><ellipse cx="300" cy="357" rx="235" ry="65"/><ellipse cx="300" cy="357" rx="190" ry="45"/></g>
    <path d="M190 170L211 348Q300 405 389 348L410 170" fill="url(#capacity-glass)" stroke="#80cdff" strokeWidth="2"/>
    <g clipPath="url(#capacity-clip)"><g className="hero-water"><path d="M180 260Q240 243 300 260T420 260V410H180Z" fill="url(#capacity-water)" opacity=".9"/><ellipse cx="300" cy="260" rx="118" ry="14" fill="#ffe28b"/></g></g>
    <ellipse cx="300" cy="170" rx="110" ry="29" fill="#0b2c55" fillOpacity=".6" stroke="#a0dcff" strokeWidth="2"/>
    <path d="M206 193l18 141" stroke="#daf2ff" strokeWidth="5" opacity=".4" strokeLinecap="round"/>
    <path className="hero-capacity-drop" d="M300 73Q274 108 300 113Q326 108 300 73" fill="#ffce49"/>
    <g className="capacity-evidence" fill="#102f59" stroke="#63bbef"><rect x="77" y="112" width="95" height="66" rx="12"/><rect x="424" y="224" width="95" height="66" rx="12"/></g>
    <g fill="none" stroke="#ffd43b" strokeWidth="3"><path d="M110 140l8 8 19-20M457 252l8 8 19-20"/></g>
    <g fill="#c8def4" fontSize="10" letterSpacing="2"><text x="74" y="98">EXPERIENCE</text><text x="426" y="315">EVIDENCE</text><text x="223" y="431">ROOM FOR MORE</text></g>
    <path d="M172 146Q200 112 255 116M424 256h-24" fill="none" stroke="#7ecbfa" strokeDasharray="4 6"/>
  </svg>;
}
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
      <div key={active} className="sculpture-slide" data-scene={growth[active].label}>
      {active === 1 ? <PracticeArt /> : active === 2 ? <BecomeArt /> : <svg
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
      </svg>}
      <div key={active} className="sculpture-caption" aria-live={paused ? "polite" : "off"}>
        <strong>{growth[active].title}</strong>
        <p>{growth[active].detail}</p>
      </div>
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
