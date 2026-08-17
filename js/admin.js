(() => {
  'use strict';

  const config = window.LV_SUPABASE_CONFIG || {};
  const configured = Boolean(config.url && config.publishableKey && window.supabase?.createClient);
  const $ = selector => document.querySelector(selector);

  const configWarning = $('#configWarning');
  const authView = $('#authView');
  const dashboardView = $('#dashboardView');
  const adminState = $('#adminState');
  const logoutButton = $('#logoutButton');
  const loginForm = $('#loginForm');
  const loginFeedback = $('#loginFeedback');
  const productList = $('#adminProductList');
  const editor = $('#editorOverlay');
  const productForm = $('#productForm');
  const propertyList = $('#propertyList');
  const catalogType = $('#catalogType');
  const categorySelect = $('#productCategory');
  const imageInput = $('#productImage');
  const imagePreview = $('#imagePreview');
  const imageDropLabel = $('#imageDropLabel');
  const editorFeedback = $('#editorFeedback');
  const deleteButton = $('#deleteProductButton');
  const searchInput = $('#adminSearch');
  const catalogFilter = $('#adminCatalogFilter');

  const categories = {
    lighting: [
      ['pendente', 'Pendente'], ['lustre', 'Lustre'], ['arandela', 'Arandela'],
      ['abajur', 'Luminária de mesa'], ['chao', 'Luminária']
    ],
    other: [
      ['material', 'Material elétrico'], ['iluminacao', 'Iluminação'],
      ['acessorios', 'Acessórios'], ['instalacao', 'Instalação'], ['reparo', 'Peças para reparo']
    ]
  };

  let client = null;
  let products = [];
  let currentProduct = null;
  let pendingImageBlob = null;
  let closeTimer = null;

  function feedback(element, message = '', type = '') {
    if (!element) return;
    element.textContent = message;
    element.className = `admin-feedback${type ? ` ${type}` : ''}`;
  }

  if (!configured) {
    configWarning.hidden = false;
    loginForm.querySelectorAll('input,button').forEach(el => el.disabled = true);
    feedback(loginFeedback, 'Configure o Supabase para ativar o acesso administrativo.');
    return;
  }

  client = window.supabase.createClient(config.url, config.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  async function isAdmin(user) {
    if (!user) return false;
    const { data, error } = await client.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
    return !error && Boolean(data);
  }

  async function refreshSession() {
    const { data: { user } } = await client.auth.getUser();
    if (user && await isAdmin(user)) {
      authView.hidden = true;
      dashboardView.hidden = false;
      logoutButton.hidden = false;
      adminState.textContent = user.email || 'Administrador';
      await loadProducts();
      return;
    }
    authView.hidden = false;
    dashboardView.hidden = true;
    logoutButton.hidden = true;
    adminState.textContent = 'Área administrativa';
  }

  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    feedback(loginFeedback, 'Verificando acesso…');
    const email = $('#loginEmail').value.trim();
    const password = $('#loginPassword').value;
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) return feedback(loginFeedback, 'Não foi possível entrar. Verifique seus dados.', 'error');
    if (!await isAdmin(data.user)) {
      await client.auth.signOut();
      return feedback(loginFeedback, 'Esta conta não possui permissão administrativa.', 'error');
    }
    feedback(loginFeedback, '');
    await refreshSession();
  });

  logoutButton.addEventListener('click', async () => {
    await client.auth.signOut();
    await refreshSession();
  });

  function updateMetrics() {
    $('#metricTotal').textContent = products.length;
    $('#metricLighting').textContent = products.filter(p => p.catalog_type === 'lighting').length;
    $('#metricOther').textContent = products.filter(p => p.catalog_type === 'other').length;
    $('#metricHidden').textContent = products.filter(p => !p.active).length;
  }

  function productThumb(product) {
    const box = document.createElement('div');
    box.className = 'admin-product-thumb';
    if (product.image_url) {
      const img = document.createElement('img');
      img.src = product.image_url;
      img.alt = '';
      box.appendChild(img);
    } else box.textContent = 'Sem foto';
    return box;
  }

  function renderProducts() {
    const query = (searchInput.value || '').trim().toLocaleLowerCase('pt-BR');
    const filter = catalogFilter.value;
    const visible = products.filter(product => {
      const catalogMatch = filter === 'todos' || product.catalog_type === filter;
      const searchMatch = !query || `${product.name} ${product.category_label || product.category}`.toLocaleLowerCase('pt-BR').includes(query);
      return catalogMatch && searchMatch;
    });

    productList.replaceChildren();
    if (!visible.length) {
      const empty = document.createElement('p');
      empty.style.padding = '28px 4px';
      empty.style.color = '#68717d';
      empty.textContent = 'Nenhum produto encontrado.';
      productList.appendChild(empty);
      return;
    }

    const fragment = document.createDocumentFragment();
    visible.forEach(product => {
      const row = document.createElement('article');
      row.className = 'admin-product-row';
      row.appendChild(productThumb(product));

      const copy = document.createElement('div');
      copy.className = 'admin-product-copy';
      const name = document.createElement('strong'); name.textContent = product.name;
      const meta = document.createElement('span'); meta.textContent = `${product.catalog_type === 'lighting' ? 'Luminárias' : 'Outros'} · ${product.category_label || product.category}`;
      const badges = document.createElement('div'); badges.className = 'admin-product-badges';
      const state = document.createElement('span'); state.className = `admin-badge${product.active ? '' : ' off'}`; state.textContent = product.active ? 'Visível' : 'Oculto';
      const props = document.createElement('span'); props.className = 'admin-badge'; props.textContent = `${Array.isArray(product.properties) ? product.properties.length : 0} propriedades`;
      badges.append(state, props); copy.append(name, meta, badges); row.appendChild(copy);

      const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'admin-ghost'; edit.textContent = 'Editar'; edit.addEventListener('click', () => openEditor(product));
      row.appendChild(edit);
      fragment.appendChild(row);
    });
    productList.appendChild(fragment);
  }

  async function loadProducts() {
    const { data, error } = await client.from('products').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: true });
    if (error) {
      productList.textContent = 'Não foi possível carregar os produtos.';
      return;
    }
    products = data || [];
    updateMetrics();
    renderProducts();
  }

  function fillCategories(type, selected = '') {
    categorySelect.replaceChildren();
    (categories[type] || []).forEach(([value, label]) => {
      const option = new Option(label, value, false, value === selected);
      categorySelect.add(option);
    });
  }

  function addPropertyRow(label = '', values = []) {
    const row = document.createElement('div');
    row.className = 'property-row';
    const labelInput = document.createElement('input');
    labelInput.type = 'text'; labelInput.placeholder = 'Propriedade (ex.: Voltagem)'; labelInput.value = label; labelInput.dataset.propertyLabel = '';
    const valuesInput = document.createElement('input');
    valuesInput.type = 'text'; valuesInput.placeholder = 'Opções separadas por vírgula'; valuesInput.value = values.join(', '); valuesInput.dataset.propertyValues = '';
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'property-remove'; remove.textContent = '×'; remove.setAttribute('aria-label','Remover propriedade'); remove.addEventListener('click', () => row.remove());
    row.append(labelInput, valuesInput, remove); propertyList.appendChild(row);
  }

  function defaultProperties() {
    return [
      { label: 'Tamanho', values: [] }, { label: 'Voltagem', values: ['127V', '220V'] },
      { label: 'Cor', values: [] }, { label: 'Temperatura de cor', values: [] }
    ];
  }

  function resetImagePreview(url = '') {
    pendingImageBlob = null;
    imageInput.value = '';
    if (url) { imagePreview.src = url; imagePreview.hidden = false; imageDropLabel.textContent = 'Trocar imagem'; }
    else { imagePreview.removeAttribute('src'); imagePreview.hidden = true; imageDropLabel.textContent = 'Selecionar imagem'; }
  }

  function openEditor(product = null) {
    currentProduct = product;
    $('#editorTitle').textContent = product ? 'Editar produto' : 'Novo produto';
    $('#productId').value = product?.id || '';
    $('#existingImagePath').value = product?.image_path || '';
    $('#existingImageUrl').value = product?.image_url || '';
    catalogType.value = product?.catalog_type || 'lighting';
    fillCategories(catalogType.value, product?.category || '');
    $('#productName').value = product?.name || '';
    $('#productDescription').value = product?.description || '';
    $('#productDetailNote').value = product?.detail_note || '';
    $('#sortOrder').value = product?.sort_order ?? 100;
    $('#productActive').checked = product?.active ?? true;
    resetImagePreview(product?.image_url || '');
    propertyList.replaceChildren();
    const properties = Array.isArray(product?.properties) ? product.properties : defaultProperties();
    properties.forEach(prop => addPropertyRow(prop.label || '', Array.isArray(prop.values) ? prop.values : []));
    deleteButton.hidden = !product;
    feedback(editorFeedback, '');
    editor.hidden = false; editor.setAttribute('aria-hidden','false');
    requestAnimationFrame(() => requestAnimationFrame(() => editor.classList.add('is-open')));
  }

  function closeEditor() {
    editor.classList.remove('is-open'); editor.setAttribute('aria-hidden','true');
    clearTimeout(closeTimer); closeTimer = setTimeout(() => { editor.hidden = true; currentProduct = null; }, 320);
  }

  $('#newProductButton').addEventListener('click', () => openEditor());
  editor.addEventListener('click', event => { if (event.target.closest('[data-editor-close]')) closeEditor(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !editor.hidden) closeEditor(); });
  catalogType.addEventListener('change', () => fillCategories(catalogType.value));
  $('#addPropertyButton').addEventListener('click', () => addPropertyRow());
  searchInput.addEventListener('input', renderProducts);
  catalogFilter.addEventListener('change', renderProducts);

  function collectProperties() {
    return Array.from(propertyList.querySelectorAll('.property-row')).map(row => {
      const label = row.querySelector('[data-property-label]').value.trim();
      const values = row.querySelector('[data-property-values]').value.split(',').map(v => v.trim()).filter(Boolean);
      return { label, values };
    }).filter(group => group.label && group.values.length);
  }

  function slugify(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80) || `produto-${Date.now()}`;
  }

  async function convertToWebP(file) {
    if (!file) return null;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Formato de imagem não permitido.');
    if (file.size > 12 * 1024 * 1024) throw new Error('A imagem deve ter no máximo 12 MB.');
    const bitmap = await createImageBitmap(file);
    const max = 1800;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false }); ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,width,height); ctx.drawImage(bitmap,0,0,width,height); bitmap.close?.();
    return await new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Falha ao converter a imagem.')), 'image/webp', .86));
  }

  imageInput.addEventListener('change', async () => {
    const file = imageInput.files?.[0]; if (!file) return;
    try {
      feedback(editorFeedback, 'Otimizando imagem…');
      pendingImageBlob = await convertToWebP(file);
      imagePreview.src = URL.createObjectURL(pendingImageBlob); imagePreview.hidden = false; imageDropLabel.textContent = 'Imagem pronta · WebP';
      feedback(editorFeedback, `Imagem otimizada (${Math.round(pendingImageBlob.size/1024)} KB).`, 'success');
    } catch (error) { pendingImageBlob = null; feedback(editorFeedback, error.message, 'error'); }
  });

  async function uploadImage(name) {
    if (!pendingImageBlob) return { imagePath: $('#existingImagePath').value || null, imageUrl: $('#existingImageUrl').value || null };
    const imagePath = `products/${crypto.randomUUID()}-${slugify(name)}.webp`;
    const { error } = await client.storage.from('product-images').upload(imagePath, pendingImageBlob, { contentType:'image/webp', cacheControl:'31536000', upsert:false });
    if (error) throw error;
    const { data } = client.storage.from('product-images').getPublicUrl(imagePath);
    return { imagePath, imageUrl: data.publicUrl };
  }

  productForm.addEventListener('submit', async event => {
    event.preventDefault();
    const saveButton = $('#saveProductButton'); saveButton.disabled = true; feedback(editorFeedback, 'Salvando produto…');
    try {
      const name = $('#productName').value.trim();
      const { imagePath, imageUrl } = await uploadImage(name);
      const categoryLabel = categorySelect.options[categorySelect.selectedIndex]?.text || categorySelect.value;
      const payload = {
        slug: currentProduct?.slug || slugify(name), name,
        catalog_type: catalogType.value, category: categorySelect.value, category_label: categoryLabel,
        description: $('#productDescription').value.trim(), detail_note: $('#productDetailNote').value.trim(),
        image_path: imagePath, image_url: imageUrl, properties: collectProperties(),
        active: $('#productActive').checked, sort_order: Number($('#sortOrder').value) || 100,
        updated_at: new Date().toISOString()
      };
      let result;
      if (currentProduct?.id) result = await client.from('products').update(payload).eq('id', currentProduct.id).select().single();
      else result = await client.from('products').insert(payload).select().single();
      if (result.error) throw result.error;

      const oldPath = currentProduct?.image_path;
      if (pendingImageBlob && oldPath && oldPath !== imagePath) await client.storage.from('product-images').remove([oldPath]);
      feedback(editorFeedback, 'Produto salvo.', 'success');
      await loadProducts(); setTimeout(closeEditor, 450);
    } catch (error) { console.error(error); feedback(editorFeedback, error.message || 'Não foi possível salvar.', 'error'); }
    finally { saveButton.disabled = false; }
  });

  deleteButton.addEventListener('click', async () => {
    if (!currentProduct || !confirm(`Excluir “${currentProduct.name}”? Essa ação não pode ser desfeita.`)) return;
    deleteButton.disabled = true; feedback(editorFeedback, 'Excluindo…');
    const { error } = await client.from('products').delete().eq('id', currentProduct.id);
    if (error) { deleteButton.disabled = false; return feedback(editorFeedback, error.message, 'error'); }
    if (currentProduct.image_path) await client.storage.from('product-images').remove([currentProduct.image_path]);
    await loadProducts(); closeEditor(); deleteButton.disabled = false;
  });

  refreshSession();
  client.auth.onAuthStateChange(() => refreshSession());
})();
