const { chromium } = require("playwright");
const { installAuthMock, enterWorkspace } = require("./auth-mock.cjs");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({ headless: true, channel: "msedge" });
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await installAuthMock(p);
    await p.goto("http://127.0.0.1:5180");
    await enterWorkspace(p);
    const btn = (name) => p.getByRole("button", { name, exact: true });
    await btn("Knowledge tree").click();
    await p
      .getByRole("combobox", { name: "Life-area tree", exact: true })
      .selectOption("leadership");
    const grove = p.getByRole("combobox", {
      name: "Grove (sub-area)",
      exact: true,
    });
    const groveCount = (await grove.locator("option").count()) - 1;
    assert.equal(
      await p.getByRole("button", { name: /^Grove: / }).count(),
      groveCount,
    );
    await grove.selectOption({ label: "Management" });
    assert.equal(await p.getByRole("button", { name: /^Grove: / }).count(), 1);
    await btn("Grove: Management").waitFor();
    await p
      .getByRole("combobox", { name: "Knowledge tree", exact: true })
      .selectOption({ label: "People Management" });
    await btn("Root: Human behavior").waitFor();
    assert.equal(await btn("Tree: Project Management").count(), 0);
    await grove.selectOption({ label: "Self-leadership" });
    assert.equal(await btn("Tree: People Management").count(), 0);
    assert.equal(
      await p
        .getByRole("combobox", { name: "Knowledge tree", exact: true })
        .locator("option")
        .count(),
      1,
    );
    assert.equal(await p.getByRole("button", { name: /^Grove: / }).count(), 1);
    await grove.selectOption("");
    assert.equal(
      await p.getByRole("button", { name: /^Grove: / }).count(),
      groveCount,
    );
    await btn("Tree: Project Management").waitFor();
    await grove.selectOption({ label: "Management" });
    await p
      .getByRole("combobox", { name: "Knowledge tree", exact: true })
      .selectOption({ label: "People Management" });
    await btn("Stem: Core principles of people management").waitFor();
    await btn("Sub-branch: Feedback").click();
    await btn("Grow a leaf").waitFor();
    await btn("Fruit: Giving Effective Corrective Feedback").click();
    await btn("Peel").click();
    await p
      .getByRole("textbox", { name: "Foundations", exact: true })
      .fill("My saved feedback foundation");
    await btn("Done").click();
    await p.reload();
    await btn("Knowledge tree").click();
    await p
      .getByRole("combobox", { name: "Life-area tree", exact: true })
      .selectOption("leadership");
    await btn("Fruit: Giving Effective Corrective Feedback").click();
    await btn("Peel").click();
    assert.equal(
      await p
        .getByRole("textbox", { name: "Foundations", exact: true })
        .inputValue(),
      "My saved feedback foundation",
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS Management example hierarchy, focused tree, unchanged Peel and reload preservation",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
