<?php

$field = static function (string $name, string $label, string $input, string $type = 'text', bool $required = false, array $options = [], ?string $relation = null): array {
    return [
        'name' => $name,
        'source' => $name,
        'label' => $label,
        'type' => $type,
        'kind' => 'column',
        'input' => $input,
        'required' => $required,
        'options' => $options,
        'relation' => $relation,
        'display' => true,
        'readonly' => false,
    ];
};

return [
    'charges' => [
        'key' => 'charges',
        'table' => 'charges',
        'label' => 'Charges',
        'icon' => 'payments',
        'list' => ['charge_date', 'description', 'category', 'amount', 'vat', 'destination'],
        'summary' => [
            ['label' => 'Total charges', 'column' => 'amount', 'aggregate' => 'sum', 'format' => 'money'],
            ['label' => 'TVA', 'column' => 'vat', 'aggregate' => 'sum', 'format' => 'money'],
            ['label' => 'Lignes', 'column' => 'id', 'aggregate' => 'count', 'format' => 'number'],
        ],
        'fields' => [
            $field('charge_date', 'Date', 'date', 'date', true),
            $field('description', 'Description', 'text', 'text', true),
            $field('category', 'Catégorie', 'select', 'text', true, [
                ['value' => 'charge_fixe', 'label' => 'Charge fixe'],
                ['value' => 'charge_vehicule', 'label' => 'Charge véhicule'],
                ['value' => 'salaire', 'label' => 'Salaire'],
                ['value' => 'loyer', 'label' => 'Loyer'],
                ['value' => 'taxe', 'label' => 'Taxe'],
                ['value' => 'autre', 'label' => 'Autre'],
            ]),
            $field('amount', 'Montant', 'number', 'numeric(14,2)', true),
            $field('vat', 'TVA', 'number', 'numeric(14,2)'),
            $field('destination', 'Destiné à', 'text'),
            $field('notes', 'Notes', 'textarea'),
            $field('created_at', 'Créé le', 'datetime', 'timestamptz'),
        ],
    ],
    'agenda' => [
        'key' => 'agenda',
        'table' => 'agenda_events',
        'label' => 'Agenda',
        'icon' => 'calendar',
        'list' => ['event_date', 'start_time', 'subject', 'status'],
        'summary' => [
            ['label' => 'Événements', 'column' => 'id', 'aggregate' => 'count', 'format' => 'number'],
        ],
        'fields' => [
            $field('event_date', 'Date', 'date', 'date', true),
            $field('start_time', 'Heure', 'text'),
            $field('subject', 'Objet', 'text', 'text', true),
            $field('status', 'Statut', 'select', 'text', true, [
                ['value' => 'planifie', 'label' => 'Planifié'],
                ['value' => 'termine', 'label' => 'Terminé'],
                ['value' => 'annule', 'label' => 'Annulé'],
            ]),
            $field('notes', 'Notes', 'textarea'),
            $field('created_at', 'Créé le', 'datetime', 'timestamptz'),
        ],
    ],
    'client_credits' => [
        'key' => 'client_credits',
        'table' => 'client_credits',
        'label' => 'Crédits locataires',
        'icon' => 'account_balance_wallet',
        'list' => ['client_id', 'credit_date', 'advance', 'remaining'],
        'summary' => [
            ['label' => 'Avances', 'column' => 'advance', 'aggregate' => 'sum', 'format' => 'money'],
            ['label' => 'Restes', 'column' => 'remaining', 'aggregate' => 'sum', 'format' => 'money'],
            ['label' => 'Lignes', 'column' => 'id', 'aggregate' => 'count', 'format' => 'number'],
        ],
        'fields' => [
            $field('client_id', 'Client', 'relation', 'bigint', true, [], 'slv_locataires'),
            $field('credit_date', 'Date', 'date', 'date', true),
            $field('advance', 'Avance', 'number', 'numeric(14,2)', true),
            $field('remaining', 'Reste', 'number', 'numeric(14,2)', true),
            $field('notes', 'Notes', 'textarea'),
            $field('created_at', 'Créé le', 'datetime', 'timestamptz'),
        ],
    ],
    'profit_entries' => [
        'key' => 'profit_entries',
        'table' => 'profit_entries',
        'label' => 'Bénéfice',
        'icon' => 'trending_up',
        'list' => ['entry_date', 'description', 'source', 'amount'],
        'summary' => [
            ['label' => 'Total bénéfice', 'column' => 'amount', 'aggregate' => 'sum', 'format' => 'money'],
            ['label' => 'Lignes', 'column' => 'id', 'aggregate' => 'count', 'format' => 'number'],
        ],
        'fields' => [
            $field('entry_date', 'Date', 'date', 'date', true),
            $field('description', 'Description', 'text', 'text', true),
            $field('source', 'Extrait de', 'text'),
            $field('amount', 'Montant', 'number', 'numeric(14,2)', true),
            $field('notes', 'Notes', 'textarea'),
            $field('created_at', 'Créé le', 'datetime', 'timestamptz'),
        ],
    ],
    'incidents' => [
        'key' => 'incidents',
        'table' => 'incidents',
        'label' => 'Sinistres',
        'icon' => 'report_problem',
        'list' => ['incident_date', 'vehicle_id', 'client_id', 'description', 'amount', 'status'],
        'summary' => [
            ['label' => 'Sinistres', 'column' => 'id', 'aggregate' => 'count', 'format' => 'number'],
            ['label' => 'Montant', 'column' => 'amount', 'aggregate' => 'sum', 'format' => 'money'],
        ],
        'fields' => [
            $field('incident_date', 'Date', 'date', 'date', true),
            $field('vehicle_id', 'Véhicule', 'relation', 'bigint', false, [], 'slv_vehicules'),
            $field('client_id', 'Client', 'relation', 'bigint', false, [], 'slv_locataires'),
            $field('description', 'Description', 'text', 'text', true),
            $field('amount', 'Montant', 'number', 'numeric(14,2)'),
            $field('status', 'Statut', 'select', 'text', true, [
                ['value' => 'ouvert', 'label' => 'Ouvert'],
                ['value' => 'clos', 'label' => 'Clos'],
            ]),
            $field('notes', 'Notes', 'textarea'),
            $field('created_at', 'Créé le', 'datetime', 'timestamptz'),
        ],
    ],
];
