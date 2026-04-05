/**
 * LifePlanner 7 – Supabase (optional, ESM von esm.sh)
 */
const SupabaseBridge = {
    _mod: null,

    async module() {
        if (this._mod) return this._mod;
        this._mod = await import('https://esm.sh/@supabase/supabase-js@2');
        return this._mod;
    },

    getConfig() {
        const s = Store.getSettings();
        return {
            url: (s.supabaseUrl || '').trim(),
            key: (s.supabaseAnonKey || '').trim()
        };
    },

    async createClient() {
        const { createClient } = await this.module();
        const { url, key } = this.getConfig();
        if (!url || !key) {
            throw new Error('Bitte SUPABASE_URL und SUPABASE_ANON_KEY im Backend eintragen.');
        }
        return createClient(url, key);
    },

    async testConnection() {
        const client = await this.createClient();
        const { error } = await client.from('lifeplanner_payload').select('id').limit(1);
        if (error) {
            const msg = error.message || '';
            if (msg.includes('relation') || msg.includes('does not exist') || error.code === '42P01' || error.code === 'PGRST205') {
                throw new Error('Tabelle „lifeplanner_payload“ fehlt. SQL aus supabase/schema.sql in Supabase ausführen.');
            }
            throw error;
        }
        return true;
    },

    async push() {
        const client = await this.createClient();
        const payload = Store.buildCloudPayload();
        const { error } = await client.from('lifeplanner_payload').upsert(
            {
                id: 'default',
                payload,
                updated_at: new Date().toISOString()
            },
            { onConflict: 'id' }
        );
        if (error) throw error;
    },

    async pull() {
        const client = await this.createClient();
        const { data, error } = await client.from('lifeplanner_payload').select('payload').eq('id', 'default').maybeSingle();
        if (error) throw error;
        if (!data || !data.payload) {
            throw new Error('Noch keine Cloud-Daten. Zuerst „Hochladen“ ausführen.');
        }
        Store.hydrateFromCloudPayload(data.payload);
    }
};
