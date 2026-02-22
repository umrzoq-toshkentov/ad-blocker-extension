import "./setup.ts";
import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";

// ── Helpers (mirror the logic from kun-injector.ts) ───────────────────────────

function injectButtons() {
  const wrappers = document.querySelectorAll<HTMLElement>(
    ".big-title__wrapper:not([data-btn-injected])",
  );
  wrappers.forEach((wrapper) => {
    wrapper.setAttribute("data-btn-injected", "true");
    const btn = document.createElement("button");
    btn.textContent = "Click me";
    btn.className = "__kun-injected-btn__";
    btn.addEventListener("click", () => {
      alert("Clicked: " + (wrapper.querySelector(".big-title")?.textContent ?? ""));
    });
    wrapper.insertAdjacentElement("afterend", btn);
  });
}

function setupDOM(html: string) {
  document.body.innerHTML = html;
}

beforeEach(() => {
  document.body.innerHTML = "";
});

afterEach(() => {
  document.body.innerHTML = "";
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("kun-injector: injectButtons", () => {
  it("injects a button after each .big-title__wrapper", () => {
    setupDOM(`
      <div class="big-title__wrapper">
        <a class="big-title" href="/news/1">Article one</a>
      </div>
    `);

    injectButtons();

    const btn = document.querySelector(".__kun-injected-btn__") as HTMLButtonElement;
    expect(btn).not.toBeNull();
    expect(btn.textContent).toBe("Click me");
  });

  it("places the button immediately after the wrapper (as next sibling)", () => {
    setupDOM(`
      <div class="big-title__wrapper">
        <a class="big-title" href="/news/1">Article</a>
      </div>
    `);

    injectButtons();

    const wrapper = document.querySelector(".big-title__wrapper")!;
    expect(wrapper.nextElementSibling?.classList.contains("__kun-injected-btn__")).toBe(true);
  });

  it("marks wrapper with data-btn-injected to prevent double injection", () => {
    setupDOM(`
      <div class="big-title__wrapper">
        <a class="big-title">Article</a>
      </div>
    `);

    injectButtons();
    injectButtons(); // second call should be no-op

    const buttons = document.querySelectorAll(".__kun-injected-btn__");
    expect(buttons.length).toBe(1);
  });

  it("handles multiple wrappers on the page", () => {
    setupDOM(`
      <div class="big-title__wrapper"><a class="big-title">One</a></div>
      <div class="big-title__wrapper"><a class="big-title">Two</a></div>
      <div class="big-title__wrapper"><a class="big-title">Three</a></div>
    `);

    injectButtons();

    const buttons = document.querySelectorAll(".__kun-injected-btn__");
    expect(buttons.length).toBe(3);
  });

  it("does nothing when no .big-title__wrapper elements exist", () => {
    setupDOM(`<div class="some-other-div"><a href="/news">Article</a></div>`);

    injectButtons();

    const buttons = document.querySelectorAll(".__kun-injected-btn__");
    expect(buttons.length).toBe(0);
  });

  it("button click alerts the headline text", () => {
    setupDOM(`
      <div class="big-title__wrapper">
        <a class="big-title">Breaking News</a>
      </div>
    `);

    const alertSpy = spyOn(globalThis, "alert").mockImplementation(() => {});
    injectButtons();

    const btn = document.querySelector(".__kun-injected-btn__") as HTMLButtonElement;
    btn.click();

    expect(alertSpy).toHaveBeenCalledWith("Clicked: Breaking News");
    alertSpy.mockRestore();
  });

  it("button click uses empty string when no .big-title link present", () => {
    setupDOM(`<div class="big-title__wrapper"></div>`);

    const alertSpy = spyOn(globalThis, "alert").mockImplementation(() => {});
    injectButtons();

    const btn = document.querySelector(".__kun-injected-btn__") as HTMLButtonElement;
    btn.click();

    expect(alertSpy).toHaveBeenCalledWith("Clicked: ");
    alertSpy.mockRestore();
  });
});

describe("kun-injector: MutationObserver wires up for dynamic content", () => {
  it("injects buttons into dynamically added wrappers", async () => {
    document.body.innerHTML = "";

    const observer = new MutationObserver(injectButtons);
    observer.observe(document.body, { childList: true, subtree: true });

    // Dynamically add a wrapper
    const wrapper = document.createElement("div");
    wrapper.className = "big-title__wrapper";
    const link = document.createElement("a");
    link.className = "big-title";
    link.textContent = "Dynamic article";
    wrapper.appendChild(link);
    document.body.appendChild(wrapper);

    // Wait for MutationObserver microtask
    await new Promise((r) => setTimeout(r, 0));

    const btn = document.querySelector(".__kun-injected-btn__");
    expect(btn).not.toBeNull();

    observer.disconnect();
  });
});
