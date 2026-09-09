const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const { installAuthMock, enterWorkspace } = require("./auth-mock.cjs");
(async () => {
  const b = await chromium.launch({ headless: true, channel: "msedge" });
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await installAuthMock(p);
    await p.goto("http://127.0.0.1:5180");
    await enterWorkspace(p);
    await p.evaluate(() => {
      const key = "echostudy-v1:11111111-1111-4111-8111-111111111111";
      const d = JSON.parse(localStorage.getItem(key));
      const n = d.concepts.find(
        (n) => n.id === "ecosystem-management-v1:fruit-feedback",
      );
      n.learning = {
        peel: { foundations: "Keep my original foundation" },
        taste: {
          questions: [
            {
              id: "legacy-question",
              prompt: "Can feedback be specific?",
              answer: "Yes",
            },
          ],
          attempts: [
            {
              id: "legacy-attempt",
              response: "My historic answer",
              rating: "Partly understood",
              at: new Date().toISOString(),
            },
          ],
        },
      };
      localStorage.setItem(key, JSON.stringify(d));
    });
    await p.reload();
    const btn = (name) => p.getByRole("button", { name, exact: true });
    const box = (name) => p.getByRole("textbox", { name, exact: true });
    const select = (name) => p.getByRole("combobox", { name, exact: true });
    const open = async () => {
      await btn("Knowledge Ecosystem").click();
      await select("Life-area tree").selectOption("leadership");
      await btn("Fruit: Giving Effective Corrective Feedback").click();
    };
    await open();
    await btn("Peel").click();
    assert.equal(
      await box("Foundations").inputValue(),
      "Keep my original foundation",
    );
    await box("Find a component").fill("Formal Definition");
    await p.getByRole("tab", { name: /Formal Definition/ }).click();
    await box("Formal Definition").fill("My expanded definition");
    await btn("Done").click();
    await btn("Taste").click();
    await box("Quick Meaning").fill("A light introduction");
    await p
      .getByRole("group", { name: "Audio for Quick Meaning", exact: true })
      .waitFor();
    await btn("Done").click();
    await btn("Test").click();
    await btn("Performance & history").click();
    await p.getByText("My historic answer", { exact: true }).waitFor();
    await btn("Questions & answers").click();
    await select("Question format 1").selectOption("Multiple choice");
    await box("Options or matching items 1").fill("Yes\nNo");
    await btn("Practice").click();
    await p.getByRole("radio", { name: "Yes", exact: true }).check();
    await btn("Reveal reference & assess").click();
    await select("Diagnostic result").selectOption("Correct");
    await p
      .getByRole("spinbutton", { name: "Assessed accuracy (%)", exact: true })
      .fill("100");
    await btn("Save diagnostic result").click();
    await btn("Performance & history").click();
    await p.getByText(/Possible underconfidence/).waitFor();
    await btn("Done").click();
    await btn("Pluck").click();
    await p.getByText(/Pluck · Comprehensive components/).click();
    await select("Pluck component").selectOption("reason_for_isolation");
    await box("Reason for isolation").fill("Explore independently");
    await btn("Close dialog").click();
    await btn("Plant").click();
    await p.getByText(/Plant · Comprehensive components/).click();
    await select("Plant component").selectOption("desired_outcome");
    await box("Desired outcome").fill("Understand the evidence");
    await box("Seed question or idea").fill("What makes feedback useful?");
    await btn("Save seed").click();
    await p.reload();
    await open();
    await btn("Peel").click();
    await box("Find a component").fill("Formal Definition");
    await p.getByRole("tab", { name: /Formal Definition/ }).click();
    assert.equal(
      await box("Formal Definition").inputValue(),
      "My expanded definition",
    );
    await btn("Done").click();
    await btn("Taste").click();
    assert.equal(
      await box("Quick Meaning").inputValue(),
      "A light introduction",
    );
    await btn("Done").click();
    await btn("Regurgitate").click();
    await select("Recall method").selectOption("Teach From Memory");
    await box("Recall from memory").fill("Specific feedback names an observable behavior.");
    await btn("Save recall & compare").click();
    await p.getByRole("spinbutton",{name:"Recall accuracy after comparison (%)",exact:true}).fill("80");
    await btn("Done").click();
    await btn("Graft").click();
    await p.getByRole("checkbox",{name:/What makes feedback useful/}).check();
    await select("Relationship with What makes feedback useful?").selectOption("Supports");
    await select("Graft direction for What makes feedback useful?").selectOption("Bidirectional");
    await select("Connection strength for What makes feedback useful?").selectOption("Strong");
    await box("Why connect to What makes feedback useful??").fill("The practice prompts this question.");
    await p.getByText(/Graft · Comprehensive components/).click();
    await select("Graft component").selectOption("evidence_for_connection");
    await box("Evidence for connection").fill("A shared feedback example.");
    await btn("Save grafts").click();
    await btn("Prune").click();
    await p.getByText(/Prune · Comprehensive components/).click();
    await select("Prune component").selectOption("correction");
    await box("Correction").fill("Keep for later refinement.");
    await btn("Prune & preserve").click();
    await p.getByText(/Integrity check passed/).waitFor();
    await btn("Pruned knowledge").click();await btn("Restore").click();await btn("Close dialog").click();
    const d = await p.evaluate(() =>
      JSON.parse(
        localStorage.getItem(
          "echostudy-v1:11111111-1111-4111-8111-111111111111",
        ),
      ),
    );
    const n = d.concepts.find(
      (n) => n.id === "ecosystem-management-v1:fruit-feedback",
    );
    assert.equal(n.learning.test.attempts.length, 2);
    assert.equal(n.learning.taste.attempts.length, 1);
    assert.equal(n.learning.regurgitate.attempts[0].accuracy,80);
    assert.equal(n.learning.prune.components.correction,"Keep for later refinement.");
    const graft=Object.values(n.grafts)[0];
    assert.equal(graft.direction,"Bidirectional");assert.equal(graft.strength,"Strong");assert.equal(graft.components.evidence_for_connection,"A shared feedback example.");
    assert.equal(
      n.learning.pluck.components.reason_for_isolation,
      "Explore independently",
    );
    assert.equal(
      d.concepts.find((n) => n.title === "What makes feedback useful?").learning
        .plant.components.desired_outcome,
      "Understand the evidence",
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS exhaustive fields, legacy preservation, Taste/Test separation, diagnostic scores, audio controls, structural plans and reload",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
