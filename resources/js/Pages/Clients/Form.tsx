import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Field, PageHeader } from '@/components/ui';

type Option = { id: number; name: string };
type Client = any;
type Suggestion = { id: number; display_name: string; phone: string | null; address: string | null; last_rental: string | null };

export default function ClientForm({ client, countries, sources }: { client: Client | null; countries: Option[]; sources: Option[] }) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [suggestionsOpen, setSuggestionsOpen] = useState(false);
    const { data, setData, post, put, processing, errors } = useForm({
        display_name: client?.display_name ?? '',
        client_type: client?.client_type ?? 'particulier',
        first_name: client?.first_name ?? '',
        last_name: client?.last_name ?? '',
        phone: client?.phone ?? '',
        email: client?.email ?? '',
        address: client?.address ?? '',
        birth_date: client?.birth_date ?? '',
        country_id: client?.country_id ?? '',
        source_id: client?.source_id ?? '',
        status: client?.status ?? 'actif',
        identity_document_type: client?.identity_document_type ?? '',
        identity_number: client?.identity_number ?? '',
        identity_expiry_date: client?.identity_expiry_date ?? '',
        identity_issued_at: client?.identity_issued_at ?? '',
        identity_country_id: client?.identity_country_id ?? '',
        license_number: client?.license_number ?? '',
        color_hex: client?.color_hex ?? '',
        identity_document: [] as File[],
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (client) put(`/clients/${client.id}`, { forceFormData: true });
        else post('/clients', { forceFormData: true });
    }

    useEffect(() => {
        if (client || data.display_name.trim().length < 2) {
            setSuggestions([]);
            return;
        }
        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            try {
                const response = await fetch(`/clients/search?q=${encodeURIComponent(data.display_name)}`, { headers: { Accept: 'application/json' }, credentials: 'same-origin', signal: controller.signal });
                const payload = await response.json();
                setSuggestions(payload.results ?? []);
                setSuggestionsOpen(true);
            } catch (error) {
                if ((error as Error).name !== 'AbortError') setSuggestions([]);
            }
        }, 280);
        return () => { window.clearTimeout(timer); controller.abort(); };
    }, [client, data.display_name]);

    function selectSuggestion(suggestion: Suggestion) {
        setData('display_name', suggestion.display_name);
        setData('phone', suggestion.phone ?? '');
        setData('address', suggestion.address ?? '');
        setSuggestions([]);
        setSuggestionsOpen(false);
    }

    return (
        <AppLayout>
            <Head title={client ? `Modifier ${client.display_name}` : 'Nouveau client'} />
            <PageHeader title={client ? `Modifier ${client.display_name}` : 'Nouveau client'}  actions={<Link href="/clients" className="tc-btn-secondary"><ArrowLeft className="h-4 w-4" /> Retour</Link>} />

            <form onSubmit={submit} className="space-y-6">
                <section className="tc-card p-5">
                    <h2 className="mb-4 text-sm font-bold text-slate-900">Général</h2>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="relative">
                            <Field label="Nom complet *" error={errors.display_name}><input className="tc-input" value={data.display_name} onChange={(e) => setData('display_name', e.target.value)} autoComplete="off" /></Field>
                            {suggestionsOpen && suggestions.length > 0 && (
                                <div className="absolute z-40 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-brand-100 bg-white shadow-xl">
                                    {suggestions.map((suggestion) => (
                                        <button key={suggestion.id} type="button" onClick={() => selectSuggestion(suggestion)} className="block w-full border-b border-slate-50 px-3 py-2 text-left text-sm hover:bg-brand-50">
                                            <span className="block font-semibold text-brand-900">{suggestion.display_name}</span>
                                            <span className="block text-xs text-slate-500">{suggestion.phone ?? 'Téléphone non renseigné'}</span>
                                            <span className="block text-xs text-slate-500">{suggestion.address ?? 'Adresse non renseignée'}</span>
                                            {suggestion.last_rental && <span className="block text-[11px] text-slate-400">Dernière location : {suggestion.last_rental}</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <Field label="Type *" error={errors.client_type}><select className="tc-input" value={data.client_type} onChange={(e) => setData('client_type', e.target.value)}><option value="particulier">Particulier</option><option value="entreprise">Entreprise</option></select></Field>
                        <Field label="Statut *" error={errors.status}><select className="tc-input" value={data.status} onChange={(e) => setData('status', e.target.value)}><option value="actif">Actif</option><option value="inactif">Inactif</option><option value="blackliste">Blacklisté</option><option value="debiteur">Débiteur</option></select></Field>
                        <Field label="Prénom"><input className="tc-input" value={data.first_name} onChange={(e) => setData('first_name', e.target.value)} /></Field>
                        <Field label="Nom"><input className="tc-input" value={data.last_name} onChange={(e) => setData('last_name', e.target.value)} /></Field>
                        <Field label="Téléphone"><input className="tc-input" value={data.phone} onChange={(e) => setData('phone', e.target.value)} /></Field>
                        <Field label="Email"><input type="email" className="tc-input" value={data.email} onChange={(e) => setData('email', e.target.value)} /></Field>
                        <Field label="Adresse"><input className="tc-input" value={data.address} onChange={(e) => setData('address', e.target.value)} /></Field>
                        <Field label="Date de naissance"><input type="date" className="tc-input" value={data.birth_date} onChange={(e) => setData('birth_date', e.target.value)} /></Field>
                        <Field label="Pays"><select className="tc-input" value={data.country_id} onChange={(e) => setData('country_id', e.target.value)}><option value="">-</option>{countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
                        <Field label="Source"><select className="tc-input" value={data.source_id} onChange={(e) => setData('source_id', e.target.value)}><option value="">-</option>{sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
                    </div>
                </section>

                <section className="tc-card p-5">
                    <h2 className="mb-4 text-sm font-bold text-slate-900">Pièce d’identité et permis</h2>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Field label="Type de pièce"><select className="tc-input" value={data.identity_document_type} onChange={(e) => setData('identity_document_type', e.target.value)}><option value="">-</option><option value="cin">CIN</option><option value="passport">Passeport</option><option value="carte_de_sejour">Carte de séjour</option><option value="ice">ICE</option></select></Field>
                        <Field label="N° identité"><input className="tc-input" value={data.identity_number} onChange={(e) => setData('identity_number', e.target.value)} /></Field>
                        <Field label="Date d’expiration"><input type="date" className="tc-input" value={data.identity_expiry_date} onChange={(e) => setData('identity_expiry_date', e.target.value)} /></Field>
                        <Field label="Délivré le"><input type="date" className="tc-input" value={data.identity_issued_at} onChange={(e) => setData('identity_issued_at', e.target.value)} /></Field>
                        <Field label="Pays de délivrance"><select className="tc-input" value={data.identity_country_id} onChange={(e) => setData('identity_country_id', e.target.value)}><option value="">-</option>{countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
                        <Field label="N° permis"><input className="tc-input" value={data.license_number} onChange={(e) => setData('license_number', e.target.value)} /></Field>
                        <Field label="Documents (pièce + permis)" hint="JPG, PNG, PDF, DOC, DOCX - 2 fichiers max.">
                            <input type="file" multiple accept=".jpg,.jpeg,.png,.bmp,.pdf,.doc,.docx" className="tc-input" onChange={(e) => setData('identity_document', Array.from(e.target.files ?? []))} />
                        </Field>
                    </div>
                </section>

                <div className="flex justify-end gap-2">
                    <Link href="/clients" className="tc-btn-secondary">Annuler</Link>
                    <button className="tc-btn-primary" disabled={processing}><Save className="h-4 w-4" /> {processing ? 'Enregistrement…' : 'Enregistrer'}</button>
                </div>
            </form>
        </AppLayout>
    );
}
