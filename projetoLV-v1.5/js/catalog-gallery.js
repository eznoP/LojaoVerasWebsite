const React = window.React;
const ReactDOM = window.ReactDOM;

const mount = document.getElementById('circularCatalog');
const filters = document.getElementById('filters');
const status = document.getElementById('catalogStatus');

const products = [
  {
    image: './assets/produtos/pendente-escultural-madeira.webp',
    text: 'Pendente Escultural',
    category: 'pendente'
  },
  {
    image: './assets/produtos/pendente-organico-madeira.webp',
    text: 'Pendente Orgânico',
    category: 'pendente'
  },
  {
    image: './assets/produtos/arandela-lanterna-preta.webp',
    text: 'Arandela Lanterna',
    category: 'arandela'
  },
  {
    image: './assets/produtos/pendente-aramado-preto.webp',
    text: 'Pendente Aramado',
    category: 'pendente'
  },
  {
    image: './assets/produtos/pendente-cupula-madeira.webp',
    text: 'Pendente Cúpula',
    category: 'pendente'
  }
];

const categoryNames = {
  todos: 'todos os produtos fotografados',
  pendente: 'pendentes',
  lustre: 'lustres',
  arandela: 'arandelas',
  abajur: 'abajures',
  chao: 'luminárias de chão'
};

let CircularGallery = null;
let componentPromise = null;
let liveRoot = null;
let renderToken = 0;

function visibleProducts(filter) {
  return filter === 'todos' ? products : products.filter(product => product.category === filter);
}

function updateStatus(filter, visible) {
  if (!status) return;
  status.textContent = visible.length
    ? `Mostrando ${categoryNames[filter] || 'produtos'} · ${visible.length} ${visible.length === 1 ? 'item' : 'itens'}.`
    : `Ainda não há fotos de ${categoryNames[filter] || 'produtos desta categoria'} no catálogo.`;
}

function destroyReactRoot() {
  if (liveRoot) {
    liveRoot.unmount();
    liveRoot = null;
  }
}

function renderEmpty(filter) {
  updateStatus(filter, []);
  destroyReactRoot();
  mount.innerHTML = `
    <div class="catalog-empty" role="status">
      <span class="catalog-empty-kicker">Catálogo em atualização</span>
      <strong>Novas fotos serão adicionadas em breve.</strong>
      <p>Enquanto isso, consulte os modelos disponíveis diretamente na loja ou pelo WhatsApp.</p>
    </div>`;
}

function renderStaticFallback(items) {
  destroyReactRoot();
  mount.innerHTML = `
    <div class="circular-gallery-fallback-list" role="list" aria-label="Catálogo de luminárias">
      ${items.map(item => `
        <article class="circular-gallery-fallback-card" role="listitem">
          <img src="${item.image}" alt="${item.text}" loading="lazy" />
          <span>${item.text}</span>
        </article>`).join('')}
    </div>`;
}

async function ensureComponent() {
  if (CircularGallery) return CircularGallery;
  if (!React || !ReactDOM) throw new Error('React ou ReactDOM não estão disponíveis.');

  if (!componentPromise) {
    componentPromise = import('./CircularGallery.js').then(module => {
      CircularGallery = module.default;
      return CircularGallery;
    });
  }

  return componentPromise;
}

if (mount && filters) {
  const safeRender = async filter => {
    const token = ++renderToken;
    const visible = visibleProducts(filter);
    updateStatus(filter, visible);

    if (!visible.length) {
      renderEmpty(filter);
      return;
    }

    if (!React || !ReactDOM) {
      renderStaticFallback(visible);
      return;
    }

    mount.innerHTML = '<div class="circular-catalog-fallback">Carregando catálogo…</div>';

    try {
      const Gallery = await ensureComponent();
      if (token !== renderToken) return;

      if (typeof ReactDOM.createRoot === 'function') {
        destroyReactRoot();
        mount.innerHTML = '';
        liveRoot = ReactDOM.createRoot(mount);
        liveRoot.render(
          React.createElement(Gallery, {
            items: visible,
            bend: 3,
            textColor: '#0d2340',
            borderRadius: 0.055,
            font: '500 28px Jost',
            scrollSpeed: 2,
            scrollEase: 0.045
          })
        );
      } else {
        ReactDOM.render(
          React.createElement(Gallery, {
            items: visible,
            bend: 3,
            textColor: '#0d2340',
            borderRadius: 0.055,
            font: '500 28px Jost',
            scrollSpeed: 2,
            scrollEase: 0.045
          }),
          mount
        );
      }
    } catch (error) {
      console.error('Catálogo: falha ao iniciar CircularGallery. Usando versão alternativa.', error);
      if (token === renderToken) renderStaticFallback(visible);
    }
  };

  filters.addEventListener('click', event => {
    const button = event.target.closest('.filter');
    if (!button) return;

    filters.querySelectorAll('.filter').forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });

    safeRender(button.dataset.filter || 'todos');
  });

  safeRender('todos');
}
