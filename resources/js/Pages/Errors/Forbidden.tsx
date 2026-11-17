import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';

export default function Forbidden() {
    return (
        <AppLayout>
            <Head title="Accès refusé" />
            <section className="flex min-h-[56vh] items-center justify-center px-4 py-10">
                <div className="w-full max-w-4xl rounded-2xl border border-blue-100 bg-white px-6 py-10 text-center shadow-sm sm:px-12 sm:py-14">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                        <ShieldAlert className="h-8 w-8" />
                    </div>
                    <h1
                        className="font-bold leading-snug"
                        style={{ color: '#124f9c', fontSize: 'clamp(22px, 2.6vw, 32px)' }}
                    >
                        Vous n'avez pas accès à cette section,<br />
                        veuillez solliciter un administrateur (Abdelilah).
                    </h1>
                    <p className="mt-6 font-semibold" style={{ color: '#124f9c', fontSize: 'clamp(22px, 2.6vw, 30px)' }}>
                        Merci !
                    </p>
                    <Link href="/contracts?view=returns" className="tc-btn-primary mt-8 inline-flex">
                        <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
                    </Link>
                </div>
            </section>
        </AppLayout>
    );
}
