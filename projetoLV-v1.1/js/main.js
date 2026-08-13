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

  const categories = { todos: "Todos", pendente: "Pendentes", lustre: "Lustres", arandela: "Arandelas", abajur: "Abajures", chao: "Chão" };
  const catalog = [
    {
      name: "Pendente Minimal",
      category: "pendente",
      desc: "Modelo contemporâneo para bancadas, salas e áreas de convivência.",
      image: "https://m.media-amazon.com/images/I/51KQYkA8VeL._AC_SL1000_.jpg",
      colors: ["#f4f1e9", "#111827", "#c7a46b"]
    },
    {
      name: "Conjunto de Luminárias",
      category: "abajur",
      desc: "Opção decorativa para quartos, salas e ambientes de apoio.",
      image: "https://m.media-amazon.com/images/I/71H3iL43yEL._AC_SL1500_.jpg",
      colors: ["#efe7d6", "#b9a18a", "#242424"]
    },
    {
      name: "Arandela Dourada",
      category: "arandela",
      desc: "Iluminação de parede com acabamento metálico e luz aconchegante.",
      image: "https://m.media-amazon.com/images/I/61c0lS4SXGL._AC_SL1500_.jpg",
      colors: ["#d1ae69", "#111827"]
    },
    {
      name: "Pendente Cônico",
      category: "pendente",
      desc: "Formato versátil disponível em diferentes acabamentos e composições.",
      image: "https://image.made-in-china.com/202f0j00CghQlNfsZRqv/Pendant-Light-Vintage-Pendant-Lamp-Hanging-Lamp-Modern-Pendant-Ceiling-Lamps-LED-Restaurant-Living-Room-DW-D90092-.jpg",
      colors: ["#f4f1e9", "#111111", "#c8a15c"]
    },
    {
      name: "Lustre Decorativo",
      category: "lustre",
      desc: "Peça de destaque para salas, recepções e ambientes amplos.",
      image: "https://www.foaid.com/wp-content/uploads/2018/11/8.jpg",
      colors: ["#d6bd7f", "#f3eee2", "#1b1b1b"]
    },
    {
      name: "Luminária de Chão",
      category: "chao",
      desc: "Iluminação de apoio para leitura e composição de ambientes.",
      image: "https://m.media-amazon.com/images/I/71uXxC5i-vL._AC_SL1500_.jpg",
      colors: ["#f0ddac", "#a8a29e", "#202020"]
    }
  ];

  const productsGrid = $("#productsGrid");
  const filtersBox = $("#filters");
  const swatches = (colors) => colors.map((c, i) => `<button class="color-swatch${i === 0 ? " active" : ""}" type="button" style="--swatch:${c}" aria-label="Cor ${i + 1}"></button>`).join("");
  const productHTML = (p, i) => `
    <article class="product-card" data-category="${p.category}" style="animation-delay:${(i % 6) * 0.07}s">
      <div class="product-visual product-photo-wrap">
        <span class="product-cat">${categories[p.category]}</span>
        <img class="product-photo" src="${p.image}" alt="Imagem ilustrativa de ${p.name}" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentElement.classList.add('image-error');this.style.display='none'" />
        <div class="image-fallback" aria-hidden="true"><span>Imagem ilustrativa</span></div>
      </div>
      <div class="product-info product-info-stacked">
        <div><h3 class="product-name">${p.name}</h3><p class="product-desc">${p.desc}</p></div>
        <div class="product-meta"><span class="product-price">Consultar na loja ou por WhatsApp</span><div class="color-selector" aria-label="Cores de exemplo">${swatches(p.colors)}</div></div>
      </div>
    </article>`;
  const renderProducts = (filter = "todos") => {
    if (!productsGrid) return;
    const filtered = filter === "todos" ? catalog : catalog.filter((p) => p.category === filter);
    productsGrid.innerHTML = filtered.map(productHTML).join("");
  };
  filtersBox?.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter");
    if (!btn) return;
    $$(".filter", filtersBox).forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    renderProducts(btn.dataset.filter);
  });
  productsGrid?.addEventListener("click", (e) => {
    const swatch = e.target.closest(".color-swatch");
    if (!swatch) return;
    const selector = swatch.closest(".color-selector");
    $$(".color-swatch", selector).forEach((s) => s.classList.remove("active"));
    swatch.classList.add("active");
  });
  renderProducts();

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
