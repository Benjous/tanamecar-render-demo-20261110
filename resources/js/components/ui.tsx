import { Link } from '@inertiajs/react';
import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, Inbox, Printer, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PageHeader({ title, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
    return (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <div className="mb-2 flex items-center gap-2">
                    <span className="h-1.5 w-9 rounded-full bg-accent-500" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-700">TANAME CAR</span>
                </div>
                <h1 className="text-2xl font-black tracking-tight text-brand-900 sm:text-3xl">{title}</h1>
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
    );
}

export function StatCard({
    label, value, hint, icon, tone = 'brand', href, testId,
}: {
    label: string;
    value: string | number;
    hint?: string;
    icon?: ReactNode;
    tone?: 'brand' | 'emerald' | 'amber' | 'rose' | 'slate';
    href?: string;
    testId?: string;
}) {
    const tones: Record<string, string> = {
        brand: 'bg-brand-50 text-brand-700',
        emerald: 'bg-emerald-50 text-emerald-700',
        amber: 'bg-amber-50 text-amber-700',
        rose: 'bg-rose-50 text-rose-700',
        slate: 'bg-slate-100 text-slate-600',
    };
    const bars: Record<string, string> = {
        brand: 'bg-brand-600',
        emerald: 'bg-emerald-500',
        amber: 'bg-amber-500',
        rose: 'bg-rose-500',
        slate: 'bg-slate-400',
    };
    const className = cn(
        'tc-card group relative block min-w-0 overflow-hidden p-5 transition duration-150',
        href && 'cursor-pointer hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
    );
    const content = (
        <>
            <span className={cn('absolute inset-x-0 top-0 h-1', bars[tone])} />
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-brand-800">{label}</div>
                    <div className="mt-2 whitespace-nowrap text-xl font-black leading-tight tracking-tight text-brand-900">{value}</div>
                </div>
                {icon && <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tones[tone])}>{icon}</div>}
            </div>
        </>
    );

    if (href) {
        return (
            <Link href={href} className={className} aria-label={`Voir ${label}`} data-testid={testId}>
                {content}
            </Link>
        );
    }

    return <div className={className}>{content}</div>;
}

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: string }) {
    return <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', tone)}>{children}</span>;
}

export function EmptyState({ title = 'Aucune donnée', description, action }: { title?: string; description?: string; action?: ReactNode }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Inbox className="h-6 w-6" />
            </div>
            <div className="text-sm font-semibold text-slate-700">{title}</div>
            {description && <div className="mt-1 max-w-md text-xs text-slate-500">{description}</div>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

export function PrintButton({ label = 'Imprimer' }: { label?: string }) {
    return <button type="button" className="tc-btn-secondary" onClick={() => window.print()}><Printer className="h-4 w-4" /> {label}</button>;
}

export function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
    if (!open) return null;
    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
            <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                    <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="px-5 py-4">{children}</div>
                {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">{footer}</div>}
            </div>
        </div>,
        document.body,
    );
}

export function ConfirmButton({ label, onConfirm, variant = 'danger', title = 'Confirmer l\'action', description = 'Cette action est définitive. Voulez-vous continuer ?' }: { label: ReactNode; onConfirm: () => void; variant?: 'danger' | 'secondary'; title?: string; description?: string }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={variant === 'danger' ? 'tc-btn-danger' : 'tc-btn-secondary'}
            >
                {label}
            </button>
            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title={title}
                footer={
                    <>
                        <button className="tc-btn-secondary" onClick={() => setOpen(false)}>Annuler</button>
                        <button className="tc-btn-danger" onClick={() => { setOpen(false); onConfirm(); }}>Confirmer</button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">{description}</p>
            </Modal>
        </>
    );
}

export function Field({ label, error, children, hint }: { label: string; error?: string; children: ReactNode; hint?: string }) {
    return (
        <label className="block">
            <span className="tc-label">{label}</span>
            {children}
            {hint && <span className="mt-1 block text-[11px] text-slate-500">{hint}</span>}
            {error && <span className="mt-1 flex items-center gap-1 text-[11px] text-rose-600"><AlertCircle className="h-3 w-3" />{error}</span>}
        </label>
    );
}

export function SuccessBanner({ message }: { message?: string | null }) {
    if (!message) return null;
    return <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 className="h-4 w-4" />{message}</div>;
}
