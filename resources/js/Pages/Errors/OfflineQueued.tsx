import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

export default function OfflineQueued() {
    return (
        <AppLayout>
            <Head title="Modification en attente" />
            <div className="tc-card mx-auto mt-6 max-w-2xl p-6">
                <h1 className="text-xl font-bold text-slate-900">Modification enregistrée hors connexion</h1>
                <p className="mt-2 text-sm text-slate-600">
                    Votre opération est conservée localement. Elle sera transmise automatiquement dès que le serveur TANAME sera disponible.
                </p>
                <Link href="/" className="tc-btn-primary mt-5 inline-flex">Retour</Link>
            </div>
        </AppLayout>
    );
}
