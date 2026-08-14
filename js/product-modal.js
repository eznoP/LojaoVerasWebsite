(() => {
  'use strict';

  const WHATSAPP_NUMBER = '5586995133553';

  const varietyProducts = {
    'cabos-eletricos': {
      id: 'cabos-eletricos',
      name: 'Cabos elétricos',
      categoryLabel: 'Material elétrico',
      description: 'Opções para instalações residenciais, comerciais e diferentes necessidades de projeto.',
      image: '',
      source: 'variado',
      detailNote: 'As opções abaixo são exemplos de variações comuns. Confirme modelos, cores, bitolas e estoque com a equipe antes da visita.',
      optionGroups: [
        { label: 'Bitola', values: ['1,5 mm²', '2,5 mm²', '4 mm²', 'Outras'] },
        { label: 'Cor', values: ['Preto', 'Azul', 'Vermelho', 'Outras'] }
      ]
    },
    lampadas: {
      id: 'lampadas',
      name: 'Lâmpadas',
      categoryLabel: 'Iluminação',
      description: 'Modelos em diferentes formatos, potências e temperaturas de cor para cada ambiente.',
      image: '',
      source: 'variado',
      detailNote: 'As opções abaixo servem como referência de consulta. Confirme potência, temperatura de cor, soquete e estoque com a equipe.',
      optionGroups: [
        { label: 'Potência', values: ['9W', '12W', '15W', 'Outras'] },
        { label: 'Luz', values: ['Quente', 'Neutra', 'Fria'] }
      ]
    },
    'extensoes-eletricas': {
      id: 'extensoes-eletricas',
      name: 'Extensões elétricas',
      categoryLabel: 'Acessórios',
      description: 'Soluções práticas para ampliar pontos de energia em diferentes usos e ambientes.',
      image: '',
      source: 'variado',
      detailNote: 'As opções abaixo são exemplos. Comprimento, quantidade de tomadas, corrente suportada e estoque devem ser confirmados na loja.',
      optionGroups: [
        { label: 'Comprimento', values: ['3 m', '5 m', '10 m', 'Outros'] },
        { label: 'Cor', values: ['Branco', 'Preto', 'Outras'] }
      ]
    },
    'tomadas-interruptores': {
      id: 'tomadas-interruptores',
      name: 'Tomadas e interruptores',
      categoryLabel: 'Material elétrico',
      description: 'Conjuntos, módulos e acabamentos para instalações e reformas.',
      image: '',
      source: 'variado',
      detailNote: 'As opções são apenas exemplos de consulta. Confirme padrão, amperagem, acabamento, cor e disponibilidade com a equipe.',
      optionGroups: [
        { label: 'Configuração', values: ['10A', '20A', 'Módulos variados'] },
        { label: 'Cor', values: ['Branco', 'Preto', 'Outras'] }
      ]
    },
    'plugues-adaptadores': {
      id: 'plugues-adaptadores',
      name: 'Plugues e adaptadores',
      categoryLabel: 'Acessórios',
      description: 'Itens de conexão e adaptação para diferentes equipamentos e pontos elétricos.',
      image: '',
      source: 'variado',
      detailNote: 'Os modelos e especificações variam. Confirme padrão, amperagem, formato e disponibilidade antes da compra.',
      optionGroups: [
        { label: 'Tipo', values: ['10A', '20A', 'Adaptadores variados'] },
        { label: 'Cor', values: ['Branco', 'Preto', 'Outras'] }
      ]
    },
    'materiais-instalacao': {
      id: 'materiais-instalacao',
      name: 'Materiais de instalação',
      categoryLabel: 'Instalação',
      description: 'Acessórios e itens auxiliares para instalações, manutenção e pequenos reparos.',
      image: '',
      source: 'variado',
      detailNote: 'Esta categoria reúne itens diversos. Informe o que precisa ao vendedor para receber orientação sobre modelos e disponibilidade.',
      optionGroups: [
        { label: 'Aplicação', values: ['Residencial', 'Comercial', 'Manutenção'] },
        { label: 'Tamanho', values: ['Diversos tamanhos'] }
      ]
    }
  };

  const modal = document.getElementById('productModal');
  const dialog = modal?.querySelector('.product-modal-dialog');
  const modalImage = document.getElementById('productModalImage');
  const modalPlaceholder = document.getElementById('productModalPlaceholder');
  const modalCategory = document.getElementById('productModalCategory');
  const modalTitle = document.getElementById('productModalTitle');
  const modalDescription = document.getElementById('productModalDescription');
  const modalOptions = document.getElementById('productModalOptions');
  const modalNote = document.getElementById('productModalNote');
  const modalWhatsapp = document.getElementById('productModalWhatsapp');

  modalImage?.addEventListener('error', () => {
    modalImage.hidden = true;
    modalPlaceholder.hidden = false;
  });

  let currentProduct = null;
  let lastFocused = null;
  let closeTimer = null;
  const selectedOptions = new Map();

  function normalizeProduct(product) {
    if (!product) return null;
    return {
      id: product.id || '',
      name: product.name || product.text || 'Produto',
      categoryLabel: product.categoryLabel || product.category || 'Produto',
      description: product.description || 'Consulte detalhes e disponibilidade diretamente com a equipe do Lojão Veras.',
      image: product.image || '',
      source: product.source || 'variado',
      detailNote: product.detailNote || 'Consulte cores, dimensões, variações e disponibilidade diretamente com a equipe.',
      optionGroups: Array.isArray(product.optionGroups) ? product.optionGroups : []
    };
  }

  function optionSummary() {
    if (!selectedOptions.size) return '';
    return Array.from(selectedOptions.entries())
      .map(([label, value]) => `${label}: ${value}`)
      .join(' · ');
  }

  function updateWhatsappLink() {
    if (!modalWhatsapp || !currentProduct) return;
    const options = optionSummary();
    const message = [
      'Olá, Lojão Veras! Gostaria de consultar este produto:',
      currentProduct.name,
      options ? `Opções de interesse: ${options}` : '',
      'Poderia me informar disponibilidade e mais detalhes?'
    ].filter(Boolean).join('\n');

    modalWhatsapp.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }

  function renderOptions(product) {
    if (!modalOptions) return;
    selectedOptions.clear();
    modalOptions.innerHTML = '';

    if (!product.optionGroups.length) {
      const info = document.createElement('div');
      info.className = 'product-modal-simple-info';
      info.innerHTML = '<span>Variações</span><strong>Consulte cores, acabamentos e dimensões disponíveis.</strong>';
      modalOptions.appendChild(info);
      return;
    }

    product.optionGroups.forEach((group, groupIndex) => {
      if (!group?.values?.length) return;
      const wrapper = document.createElement('fieldset');
      wrapper.className = 'product-option-group';

      const legend = document.createElement('legend');
      legend.textContent = group.label;
      wrapper.appendChild(legend);

      const options = document.createElement('div');
      options.className = 'product-option-list';

      group.values.forEach((value, valueIndex) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'product-option-chip';
        button.textContent = value;
        button.dataset.optionGroup = group.label;
        button.dataset.optionValue = value;
        button.setAttribute('aria-pressed', valueIndex === 0 ? 'true' : 'false');

        if (valueIndex === 0) {
          button.classList.add('active');
          selectedOptions.set(group.label, value);
        }

        button.addEventListener('click', () => {
          options.querySelectorAll('.product-option-chip').forEach(chip => {
            chip.classList.remove('active');
            chip.setAttribute('aria-pressed', 'false');
          });
          button.classList.add('active');
          button.setAttribute('aria-pressed', 'true');
          selectedOptions.set(group.label, value);
          updateWhatsappLink();
        });

        options.appendChild(button);
      });

      wrapper.appendChild(options);
      modalOptions.appendChild(wrapper);
    });
  }

  function openModal(product) {
    if (!modal || !dialog) return;
    const normalized = normalizeProduct(product);
    if (!normalized) return;

    currentProduct = normalized;
    lastFocused = document.activeElement;
    clearTimeout(closeTimer);

    modalCategory.textContent = normalized.categoryLabel;
    modalTitle.textContent = normalized.name;
    modalDescription.textContent = normalized.description;
    modalNote.textContent = normalized.detailNote;

    if (normalized.image) {
      modalImage.src = normalized.image;
      modalImage.alt = normalized.name;
      modalImage.hidden = false;
      modalPlaceholder.hidden = true;
    } else {
      modalImage.removeAttribute('src');
      modalImage.alt = '';
      modalImage.hidden = true;
      modalPlaceholder.hidden = false;
    }

    renderOptions(normalized);
    updateWhatsappLink();

    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('product-modal-open');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        modal.classList.add('is-open');
        modal.querySelector('.product-modal-close')?.focus({ preventScroll: true });
      });
    });
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('product-modal-open');

    closeTimer = setTimeout(() => {
      modal.hidden = true;
      currentProduct = null;
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus({ preventScroll: true });
      }
    }, 360);
  }

  function getFocusable() {
    if (!dialog) return [];
    return Array.from(dialog.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      .filter(el => !el.hidden && el.offsetParent !== null);
  }

  modal?.addEventListener('click', event => {
    if (event.target.closest('[data-modal-close]')) closeModal();
  });

  document.addEventListener('keydown', event => {
    if (!modal || modal.hidden) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
      return;
    }

    if (event.key === 'Tab') {
      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  window.addEventListener('lv:open-product', event => openModal(event.detail));

  document.addEventListener('click', event => {
    const card = event.target.closest('.variety-product-card[data-product-id]');
    if (!card) return;
    openModal(varietyProducts[card.dataset.productId]);
  });

  document.addEventListener('keydown', event => {
    const card = event.target.closest?.('.variety-product-card[data-product-id]');
    if (!card || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    openModal(varietyProducts[card.dataset.productId]);
  });

  // Filtro e busca do catálogo de produtos variados.
  const varietyFilters = document.getElementById('varietyFilters');
  const varietySearch = document.getElementById('varietySearch');
  const varietyGrid = document.getElementById('varietyGrid');
  const varietyCount = document.getElementById('varietyCount');
  const varietyEmpty = document.getElementById('varietyEmpty');
  let activeFilter = 'todos';

  function applyVarietyFilters() {
    if (!varietyGrid) return;
    const query = (varietySearch?.value || '').trim().toLocaleLowerCase('pt-BR');
    let visible = 0;

    varietyGrid.querySelectorAll('.variety-product-card').forEach(card => {
      const categoryMatch = activeFilter === 'todos' || card.dataset.varietyCategory === activeFilter;
      const searchMatch = !query || card.textContent.toLocaleLowerCase('pt-BR').includes(query);
      const show = categoryMatch && searchMatch;
      card.hidden = !show;
      if (show) visible += 1;
    });

    if (varietyCount) {
      varietyCount.textContent = `${visible} ${visible === 1 ? 'produto' : 'produtos'} para consulta`;
    }
    if (varietyEmpty) varietyEmpty.hidden = visible !== 0;
  }

  varietyFilters?.addEventListener('click', event => {
    const button = event.target.closest('[data-variety-filter]');
    if (!button) return;

    activeFilter = button.dataset.varietyFilter || 'todos';
    varietyFilters.querySelectorAll('[data-variety-filter]').forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    applyVarietyFilters();
  });

  varietySearch?.addEventListener('input', applyVarietyFilters);
  applyVarietyFilters();
})();
