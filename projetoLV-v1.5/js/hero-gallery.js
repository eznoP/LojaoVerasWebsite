(() => {
  'use strict';

  const mount = document.getElementById('heroGallery');
  if (!mount || !window.React || !window.ReactDOM || !window.AccordionGallery) return;

  const items = [
    {
      image: './assets/produtos/pendente-escultural-madeira.webp',
      label: 'Pendente escultural',
      alt: 'Pendente escultural de madeira disponível no Lojão Veras',
      link: '#catalogo'
    },
    {
      image: './assets/produtos/pendente-organico-madeira.webp',
      label: 'Pendente orgânico',
      alt: 'Pendente orgânico de madeira disponível no Lojão Veras',
      link: '#catalogo'
    },
    {
      image: './assets/produtos/arandela-lanterna-preta.webp',
      label: 'Arandela lanterna',
      alt: 'Arandela estilo lanterna preta disponível no Lojão Veras',
      link: '#catalogo'
    },
    {
      image: './assets/produtos/pendente-aramado-preto.webp',
      label: 'Pendente aramado',
      alt: 'Pendente aramado preto disponível no Lojão Veras',
      link: '#catalogo'
    },
    {
      image: './assets/produtos/pendente-cupula-madeira.webp',
      label: 'Pendente cúpula',
      alt: 'Pendente com cúpula de madeira disponível no Lojão Veras',
      link: '#catalogo'
    }
  ];

  const gallery = React.createElement(window.AccordionGallery, {
    items,
    defaultIndex: 2,
    expandRatio: 0.5,
    trigger: 'hover',
    accentColor: '#f5f2ea',
    overlayColor: '#07182d',
    textColor: '#ffffff',
    grayscale: true,
    showLabels: true,
    duration: 0.65,
    ease: 'power3.out',
    parallax: 0.38,
    tilt: 4,
    stagger: 0.06,
    height: 470,
    gap: 10,
    radius: 14,
    orientation: 'horizontal',
    className: 'hero-product-gallery'
  });

  if (typeof window.ReactDOM.createRoot === 'function') {
    window.ReactDOM.createRoot(mount).render(gallery);
  } else {
    window.ReactDOM.render(gallery, mount);
  }
})();
