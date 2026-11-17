import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';

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
            <form onSubmit={submit}>
                <table className="al-form-table">
                    <tbody>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Nom complet *</td>
                            <td style={{ position: 'relative' }}>
                                <input value={data.display_name} onChange={(e) => setData('display_name', e.target.value)} autoComplete="off" />
                                {errors.display_name && <div className="al-login-error">{errors.display_name}</div>}
                                {suggestionsOpen && suggestions.length > 0 && (
                                    <div style={{ position: 'absolute', zIndex: 40, top: 24, left: 3, width: 255, maxHeight: 180, overflowY: 'auto', background: '#fff', border: '1px solid #767676' }}>
                                        {suggestions.map((suggestion) => (
                                            <button key={suggestion.id} type="button" onClick={() => selectSuggestion(suggestion)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '3px 5px', border: 0, background: '#fff', font: '12px Tahoma', cursor: 'pointer' }}>
                                                <b>{suggestion.display_name}</b><br />
                                                <span>{suggestion.phone ?? ''}</span><br />
                                                <span>{suggestion.address ?? ''}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Type *</td>
                            <td>
                                <select value={data.client_type} onChange={(e) => setData('client_type', e.target.value)}>
                                    <option value="particulier">Particulier</option><option value="entreprise">Entreprise</option>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Statut *</td>
                            <td>
                                <select value={data.status} onChange={(e) => setData('status', e.target.value)}>
                                    <option value="actif">Actif</option><option value="inactif">Inactif</option><option value="blackliste">Blacklisté</option><option value="debiteur">Débiteur</option>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Prénom</td>
                            <td><input value={data.first_name} onChange={(e) => setData('first_name', e.target.value)} /></td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Nom</td>
                            <td><input value={data.last_name} onChange={(e) => setData('last_name', e.target.value)} /></td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Téléphone</td>
                            <td><input value={data.phone} onChange={(e) => setData('phone', e.target.value)} /></td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Email</td>
                            <td><input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} /></td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Adresse</td>
                            <td><textarea value={data.address} onChange={(e) => setData('address', e.target.value)} /></td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Date de naissance</td>
                            <td><input type="date" value={data.birth_date} onChange={(e) => setData('birth_date', e.target.value)} /></td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Pays</td>
                            <td><select value={data.country_id} onChange={(e) => setData('country_id', e.target.value)}><option value="">-</option>{countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Source</td>
                            <td><select value={data.source_id} onChange={(e) => setData('source_id', e.target.value)}><option value="">-</option>{sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Type de pièce</td>
                            <td><select value={data.identity_document_type} onChange={(e) => setData('identity_document_type', e.target.value)}><option value="">-</option><option value="cin">CIN</option><option value="passport">Passeport</option><option value="carte_de_sejour">Carte de séjour</option><option value="ice">ICE</option></select></td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>N° identité</td>
                            <td><input value={data.identity_number} onChange={(e) => setData('identity_number', e.target.value)} /></td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Date d'expiration</td>
                            <td><input type="date" value={data.identity_expiry_date} onChange={(e) => setData('identity_expiry_date', e.target.value)} /></td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Délivré le</td>
                            <td><input type="date" value={data.identity_issued_at} onChange={(e) => setData('identity_issued_at', e.target.value)} /></td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Pays de délivrance</td>
                            <td><select value={data.identity_country_id} onChange={(e) => setData('identity_country_id', e.target.value)}><option value="">-</option>{countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>N° permis</td>
                            <td><input value={data.license_number} onChange={(e) => setData('license_number', e.target.value)} /></td>
                        </tr>
                        <tr>
                            <td className="al-form-label"><span className="al-triangle">&#9654;</span>Documents</td>
                            <td><input type="file" multiple accept=".jpg,.jpeg,.png,.bmp,.pdf,.doc,.docx" onChange={(e) => setData('identity_document', Array.from(e.target.files ?? []))} style={{ border: 0, width: 255 }} /></td>
                        </tr>
                        <tr>
                            <td />
                            <td className="al-form-actions">
                                <button type="submit" className="al-button al-button-primary" disabled={processing}>{processing ? 'Enregistrement...' : 'Valider'}</button>
                                <Link href="/clients" className="al-button" style={{ marginLeft: 6 }}>Annuler</Link>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </form>
        </AppLayout>
    );
}
