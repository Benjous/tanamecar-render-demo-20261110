import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import type { ComponentType } from 'react';
import { theme } from '@/lib/theme';
import { installOfflineSupport } from '@/lib/offline';
import '../css/legacy.css';

const pages = import.meta.glob('./Pages/**/*.tsx') as Record<string, () => Promise<{ default: ComponentType }>>;

installOfflineSupport();

createInertiaApp({
    title: (title) => (title ? `${title} - TanameCar` : 'TanameCar'),
    resolve: async (name) => {
        const loader = pages[`./Pages/${name}.tsx`];
        if (!loader) {
            throw new Error(`Page Inertia introuvable : ${name}`);
        }
        return (await loader()).default;
    },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
    progress: {
        color: theme.blue,
    },
});


