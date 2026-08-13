(() => {
  "use strict";
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const preloader = $("#preloader");
  const hidePreloader = () => preloader?.classList.add("done");
  window.addEventListener("load", () => setTimeout(hidePreloader, 450));
  setTimeout(hidePreloader, 2500);

  const header = $("#header");
  const progress = $("#scrollProgress");
  let lastScrollY = window.scrollY;
  let menuOpen = false;
  const onScroll = () => {
    const y = window.scrollY;
    header?.classList.toggle("scrolled", y > 40);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = max > 0 ? `${(y / max) * 100}%` : "0%";
    if (header) header.classList.toggle("hidden", y > lastScrollY && y > 320 && !menuOpen);
    lastScrollY = y;
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  const navToggle = $("#navToggle");
  const mobileMenu = $("#mobileMenu");
  navToggle?.addEventListener("click", () => {
    menuOpen = !menuOpen;
    navToggle.classList.toggle("open", menuOpen);
    mobileMenu?.classList.toggle("open", menuOpen);
    navToggle.setAttribute("aria-expanded", String(menuOpen));
    document.body.style.overflow = menuOpen ? "hidden" : "";
  });
  $$("#mobileMenu a").forEach((link) => link.addEventListener("click", () => {
    menuOpen = false;
    navToggle?.classList.remove("open");
    mobileMenu?.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
  $$(".reveal").forEach((el) => revealObserver.observe(el));

  const waBtn = $("#waBtn");
  const addressBlock = $("#addressBlock");
  if (waBtn && addressBlock) {
    const waObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          waBtn.classList.add("lit");
          waObserver.disconnect();
        }
      });
    }, { threshold: 0.45 });
    waObserver.observe(addressBlock);
  }

  const contactForm = $("#contactForm");
  contactForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const nome = $("#nome").value.trim();
    const mensagem = $("#mensagem").value.trim();
    const text = `Olá, Lojão Veras! Meu nome é ${nome}.\n\n${mensagem}`;
    window.open(`https://wa.me/5586995133553?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    $("#formFeedback").textContent = "Abrindo o WhatsApp…";
    setTimeout(() => { $("#formFeedback").textContent = ""; }, 4000);
  });

  $("#year").textContent = new Date().getFullYear();
})();
