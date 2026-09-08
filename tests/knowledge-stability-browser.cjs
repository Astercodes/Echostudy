const { chromium } = require("playwright");
const { installAuthMock, enterWorkspace } = require("./auth-mock.cjs");
(async () => {
  const b = await chromium.launch({
    headless: true,
    channel: "msedge",
    ignoreDefaultArgs: ["--hide-scrollbars"],
  });
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
    await installAuthMock(p);
    await p.goto("http://127.0.0.1:5180");
    await enterWorkspace(p);
    await p
      .getByRole("button", { name: "Knowledge tree", exact: true })
      .click();
    await p
      .getByRole("combobox", { name: "Life-area tree", exact: true })
      .selectOption({ label: "Leadership & influence" });
    await p.getByRole("button", { name: "Add concept", exact: true }).click();
    await p.getByLabel("Concept name", { exact: true }).fill("Leading teams");
    await p.getByRole("button", { name: "Save concept", exact: true }).click();
    await p
      .getByRole("button", { name: "Grow a sub-concept", exact: true })
      .click();
    await p.getByLabel("Concept name", { exact: true }).fill("Delegation");
    await p.getByRole("button", { name: "Save concept", exact: true }).click();
    await p.getByRole("button", { name: "Grow a fruit", exact: true }).click();
    await p.getByLabel("Fruit name", { exact: true }).fill("Clear ownership");
    await p.getByRole("button", { name: "Save fruit", exact: true }).click();
    await p.addStyleTag({
      content: ".orchard-scroll::-webkit-scrollbar {width:17px;height:17px}",
    });
    const height = await p
      .locator(".orchard-tree")
      .evaluate((e) => e.getBoundingClientRect().height);
    await p.addStyleTag({
      content: ".orchard-scroll {height:" + (height - 3) + "px !important}",
    });
    const widths = await p.locator(".orchard-scroll").evaluate(
      (el) =>
        new Promise((resolve) => {
          const a = [];
          function sample() {
            a.push(el.clientWidth);
            if (a.length < 90) requestAnimationFrame(sample);
            else resolve(a);
          }
          requestAnimationFrame(sample);
        }),
    );
    console.log(
      await p
        .locator(".orchard-scroll")
        .evaluate((e) => ({
          w: e.clientWidth,
          offset: e.offsetWidth,
          h: e.clientHeight,
          sh: e.scrollHeight,
          svg: e.firstElementChild.getBoundingClientRect().height,
          overflow: getComputedStyle(e).overflow,
        })),
    );
    console.log(
      JSON.stringify({
        widths: [...new Set(widths)],
        changes: widths.filter((v, i) => i && v !== widths[i - 1]).length,
      }),
    );
    if (new Set(widths.slice(15)).size > 1)
      throw Error("Tree oscillates at scrollbar threshold");
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
