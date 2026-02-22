// Injects a "Click me" button after every .big-title__wrapper on kun.uz

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

// Style the button
const style = document.createElement("style");
style.textContent = `
  .__kun-injected-btn__ {
    display: inline-block;
    margin: 6px 0;
    padding: 6px 16px;
    background: #e63946;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    font-family: system-ui, sans-serif;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .__kun-injected-btn__:hover {
    background: #c1121f;
  }
`;
document.documentElement.appendChild(style);

// Run on existing DOM, then watch for dynamic additions
injectButtons();

const observer = new MutationObserver(injectButtons);
observer.observe(document.body, { childList: true, subtree: true });
