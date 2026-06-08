(function () {
  const pages = [
    { id: "home", title: "Home", href: "index.html" },
    { id: "site", title: "10-12 Ballow", href: "site.html" },
    { id: "trust", title: "Local Say", href: "trust.html" },
    { id: "sports", title: "Sand Sports", href: "sports.html" },
    { id: "film", title: "Film", href: "film.html" },
    { id: "markets", title: "Markets", href: "markets.html" },
    { id: "youth", title: "Youth & Elders", href: "youth-elders.html" },
    { id: "nearby", title: "Nearby", href: "nearby.html" },
    { id: "funding", title: "Funding", href: "funding.html" },
    { id: "sources", title: "Sources", href: "sources.html" }
  ];

  const pageId = document.body.dataset.page || "home";
  const currentIndex = Math.max(0, pages.findIndex((page) => page.id === pageId));
  const currentPage = pages[currentIndex] || pages[0];

  renderHeader();
  renderFooter();
  renderSequenceNav();
  enhanceBackToTop();

  function renderHeader() {
    const header = document.querySelector("[data-site-header]");
    if (!header) return;

    const links = pages
      .map((page) => {
        const active = page.id === pageId ? ' aria-current="page"' : "";
        return `<a href="${page.href}"${active}>${page.title}</a>`;
      })
      .join("");

    header.innerHTML = `
      <a class="skip-link" href="#main">Skip to content</a>
      <nav class="site-nav" aria-label="Main navigation">
        <a class="brand" href="index.html" aria-label="Ballow Road Sand and Screen Hub home">
          <span>Ballow Road</span>
          <strong>Sand & Screen Hub</strong>
        </a>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav">Menu</button>
        <div class="nav-links" id="primary-nav">${links}</div>
      </nav>
    `;

    const button = header.querySelector(".nav-toggle");
    const navLinks = header.querySelector(".nav-links");
    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!open));
      navLinks.classList.toggle("is-open", !open);
    });
  }

  function renderFooter() {
    const footer = document.querySelector("[data-site-footer]");
    if (!footer) return;

    footer.innerHTML = `
      <div class="footer-inner">
        <div>
          <p class="footer-title">Ballow Road Sand & Screen Hub</p>
          <p>A public concept site for 10-12 Ballow Road, Dunwich / Goompi, and the wider Straddie sand-sport, screen, market and wellbeing network.</p>
        </div>
        <nav aria-label="Footer links">
          <a href="sources.html">Sources</a>
          <a href="https://auraofintelligence.github.io/strange-but-true/" target="_blank" rel="noopener noreferrer">Strange but True</a>
          <a href="https://auraofintelligence.github.io/dunwich-gumpi-ferry-terminal-open-data-lab/" target="_blank" rel="noopener noreferrer">Ferry data lab</a>
          <a href="https://auraofintelligence.github.io/straddie-vitality-network-builders/" target="_blank" rel="noopener noreferrer">Wellbeing builders</a>
          <a href="https://auraofintelligence.github.io/ballow-road-sand-screen-hub/" target="_blank" rel="noopener noreferrer">Live site</a>
          <a href="https://github.com/auraofintelligence/ballow-road-sand-screen-hub" target="_blank" rel="noopener noreferrer">Public source</a>
        </nav>
      </div>
    `;
  }

  function renderSequenceNav() {
    const mount = document.querySelector("[data-sequence-nav]");
    if (!mount) return;

    const previous = pages[currentIndex - 1];
    const next = pages[currentIndex + 1];
    const previousLink = previous
      ? `<a class="sequence-link" href="${previous.href}"><span>Previous</span><strong>${previous.title}</strong></a>`
      : `<span class="sequence-link disabled"><span>Previous</span><strong>Start</strong></span>`;
    const nextLink = next
      ? `<a class="sequence-link next" href="${next.href}"><span>Next</span><strong>${next.title}</strong></a>`
      : `<span class="sequence-link disabled next"><span>Next</span><strong>End</strong></span>`;

    mount.innerHTML = `
      <nav class="sequence-nav" aria-label="Page sequence">
        ${previousLink}
        <a class="sequence-home" href="index.html">Home</a>
        ${nextLink}
      </nav>
    `;
  }

  function enhanceBackToTop() {
    const button = document.createElement("button");
    button.className = "back-to-top";
    button.type = "button";
    button.textContent = "Top";
    button.setAttribute("aria-label", "Back to top");
    button.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    document.body.appendChild(button);

    const update = () => button.classList.toggle("is-visible", window.scrollY > 420);
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  document.title = currentPage.id === "home"
    ? "Ballow Road Sand & Screen Hub"
    : `${currentPage.title} | Ballow Road Sand & Screen Hub`;
})();
