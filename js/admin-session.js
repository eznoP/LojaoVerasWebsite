(() => {
  'use strict';

  const quickLink = document.getElementById('adminQuickLink');
  const client = window.LVSupabaseClient;
  if (!quickLink || !client) return;

  async function refreshAdminVisibility() {
    try {
      const { data: { user } } = await client.auth.getUser();
      if (!user) {
        quickLink.hidden = true;
        return;
      }

      const { data, error } = await client
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      quickLink.hidden = Boolean(error || !data);
    } catch {
      quickLink.hidden = true;
    }
  }

  refreshAdminVisibility();
  client.auth.onAuthStateChange(() => refreshAdminVisibility());
})();
