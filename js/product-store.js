(() => {
  'use strict';

  const config = window.LV_SUPABASE_CONFIG || {};
  const ready = Boolean(config.url && config.publishableKey && window.supabase?.createClient);

  window.LVProductStore = {
    enabled: ready,
    client: null,
    products: []
  };

  if (!ready) return;

  const client = window.supabase.createClient(config.url, config.publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  window.LVProductStore.client = client;
  window.LVSupabaseClient = client;

  async function loadProducts() {
    const { data, error } = await client
      .from('products')
      .select('id, slug, name, catalog_type, category, category_label, description, detail_note, image_url, properties, active, sort_order, created_at')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;

    const products = Array.isArray(data) ? data : [];
    window.LVProductStore.products = products;
    window.dispatchEvent(new CustomEvent('lv:catalog-data', {
      detail: {
        products,
        lighting: products.filter(product => product.catalog_type === 'lighting'),
        other: products.filter(product => product.catalog_type === 'other')
      }
    }));
  }

  loadProducts().catch(error => {
    console.warn('Lojão Veras: catálogo remoto indisponível; mantendo catálogo local.', error);
  });
})();
