<?php

namespace App\Http\Controllers;

use App\Services\AuditService;
use App\Services\MaintenanceService;
use App\Services\SearchService;
use App\Services\SequenceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class GenericEntityController extends Controller
{
    private function config(string $entity): array
    {
        if ($entity === 'slv_sources' && ! request()->user()?->isAdmin()) {
            abort(403, 'Action non autorisée.');
        }
        $config = config("entities.{$entity}");
        abort_unless($config, 404, 'Entité inconnue.');
        $action = match (request()->method()) {
            'POST' => 'create',
            'PUT', 'PATCH' => 'update',
            'DELETE' => 'delete',
            default => 'view',
        };
        abort_unless(request()->user()?->canDo($entity, $action), 403, 'Action non autorisée.');

        return $config;
    }

    public function index(Request $request, string $entity, SearchService $search)
    {
        $config = $this->config($entity);
        $query = DB::table($config['table']);

        $q = trim($request->string('q')->toString());
        if ($q !== '') {
            $query->where(function ($sub) use ($config, $q, $search) {
                $searchable = array_values(array_filter($config['fields'], fn (array $field) => $field['input'] !== 'select'));
                $search->apply($sub, array_values(array_unique(array_merge(
                    [$config['table'].'.id'],
                    array_map(fn (array $field) => $config['table'].'.'.$field['name'], $searchable),
                ))), $q);

                foreach ($config['fields'] as $field) {
                    if ($field['input'] !== 'relation' || ! $field['relation']) {
                        continue;
                    }
                    $target = config("entities.{$field['relation']}");
                    if (! $target) {
                        continue;
                    }
                    $labels = array_values(array_filter([
                        Schema::hasColumn($target['table'], 'display_name') ? 'display_name' : null,
                        Schema::hasColumn($target['table'], 'name') ? 'name' : null,
                        Schema::hasColumn($target['table'], 'plate_number') ? 'plate_number' : null,
                        Schema::hasColumn($target['table'], 'reference') ? 'reference' : null,
                    ]));
                    if ($labels === []) {
                        continue;
                    }
                    $sub->orWhereIn($field['name'], DB::table($target['table'])
                        ->select('id')
                        ->where(function ($relationQuery) use ($labels, $q, $search): void {
                            $search->apply($relationQuery, $labels, $q);
                        }));
                }
            });
        }

        foreach ($config['fields'] as $field) {
            if (! in_array($field['input'], ['select', 'relation'], true)) {
                continue;
            }
            $value = $request->input($field['name']);
            if ($value !== null && $value !== '') {
                $query->where($field['name'], $value);
            }
        }

        $legacyFilters = ['date', 'heure', 'nom', 'prenom', 'tel', 'adresse', 'objet', 'destine', 'description', 'locat', 'ordre', 'option'];
        if ($entity === 'slv_type_maintenance') {
            if ($option = trim($request->string('option')->toString())) {
                $query->where('name', 'ilike', "%{$option}%");
            }
            $type = $request->string('type')->toString();
            if ($type === 'km') {
                $query->whereNotNull('km_interval');
            } elseif ($type === 'date') {
                $query->whereNull('km_interval');
            }
        }
        if ($entity === 'slv_reservations') {
            if ($date = $request->date('date')) {
                $query->whereDate('departure_at', $date->toDateString());
            }
            if ($heure = trim($request->string('heure')->toString())) {
                $query->whereRaw("to_char(departure_at, 'HH24:MI') like ?", ["{$heure}%"]);
            }
            if ($nom = trim($request->string('nom')->toString())) {
                $query->whereIn('client_id', DB::table('clients')->select('id')->where('last_name', 'ilike', "%{$nom}%"));
            }
            if ($prenom = trim($request->string('prenom')->toString())) {
                $query->whereIn('client_id', DB::table('clients')->select('id')->where('first_name', 'ilike', "%{$prenom}%"));
            }
            $today = now('Africa/Casablanca')->toDateString();
            if ($request->string('ordre')->toString() === '1') {
                $query->whereDate('departure_at', '<', $today);
            } elseif ($request->string('ordre')->toString() === '2') {
                $query->whereDate('departure_at', $today);
            } elseif ($request->string('ordre')->toString() === '3') {
                $query->whereDate('departure_at', '>=', $today);
            }
        }
        if ($entity === 'agenda') {
            if ($date = $request->date('date')) {
                $query->whereDate('event_date', $date->toDateString());
            }
            if ($heure = trim($request->string('heure')->toString())) {
                $query->where('start_time', 'ilike', "{$heure}%");
            }
            if ($objet = trim($request->string('objet')->toString())) {
                $query->where('subject', 'ilike', "%{$objet}%");
            }
            $today = now('Africa/Casablanca')->toDateString();
            if ($request->string('ordre')->toString() === '1') {
                $query->whereDate('event_date', '<', $today);
            } elseif ($request->string('ordre')->toString() === '2') {
                $query->whereDate('event_date', $today);
            } elseif ($request->string('ordre')->toString() === '3') {
                $query->whereDate('event_date', '>', $today);
            }
        }
        if ($entity === 'charges') {
            if ($destine = trim($request->string('destine')->toString())) {
                $query->where('destination', 'ilike', "%{$destine}%");
            }
            if ($description = trim($request->string('description')->toString())) {
                $query->where('description', 'ilike', "%{$description}%");
            }
        }
        if ($entity === 'client_credits') {
            foreach (['nom' => 'last_name', 'prenom' => 'first_name', 'tel' => 'phone', 'adresse' => 'address'] as $param => $column) {
                $value = trim($request->string($param)->toString());
                if ($value !== '') {
                    $query->whereIn('client_id', DB::table('clients')->select('id')->where($column, 'ilike', "%{$value}%"));
                }
            }
        }
        if ($entity === 'incidents') {
            if ($date = $request->date('date')) {
                $query->whereDate('incident_date', $date->toDateString());
            }
            if ($locat = trim($request->string('locat')->toString())) {
                $query->whereIn('client_id', DB::table('clients')->select('id')->where('display_name', 'ilike', "%{$locat}%"));
            }
        }

        $summaryQuery = clone $query;

        $rows = $query
            ->select(array_values(array_unique(array_merge(['id', 'created_at'], array_column($config['fields'], 'name')))))
            ->orderByDesc('created_at')
            ->get();

        $relationLabels = [];
        $relationDetails = [];
        foreach ($config['fields'] as $field) {
            if ($field['input'] !== 'relation' || ! $field['relation'] || ! in_array($field['name'], $config['list'], true)) {
                continue;
            }
            $target = config("entities.{$field['relation']}");
            if (! $target) {
                continue;
            }
            $ids = collect($rows)->pluck($field['name'])->filter()->unique()->values();
            $targetRows = DB::table($target['table'])->whereIn('id', $ids)->get();
            $relationLabels[$field['name']] = $targetRows->mapWithKeys(function ($row) {
                $label = $row->display_name ?? $row->name ?? $row->plate_number ?? $row->reference ?? ('#'.$row->id);

                return [$row->id => $label];
            });
            if (Schema::hasColumn($target['table'], 'phone') || Schema::hasColumn($target['table'], 'address')) {
                $relationDetails[$field['name']] = $targetRows->mapWithKeys(fn ($row) => [
                    $row->id => [
                        'phone' => $row->phone ?? null,
                        'address' => $row->address ?? null,
                    ],
                ]);
            }
        }

        $summary = [];
        foreach ($config['summary'] ?? [] as $metric) {
            $value = (clone $summaryQuery)
                ->selectRaw(strtoupper($metric['aggregate']).'('.$metric['column'].') as value')
                ->value('value');
            $summary[] = [
                'label' => $metric['label'],
                'value' => $metric['format'] === 'money' ? (float) $value : (int) $value,
                'format' => $metric['format'],
            ];
        }

        $filterKeys = ['q', ...$legacyFilters];
        foreach ($config['fields'] as $field) {
            if (in_array($field['input'], ['select', 'relation'], true)) {
                $filterKeys[] = $field['name'];
            }
        }

        return Inertia::render('Generic/Index', [
            'entity' => $config,
            'rows' => $rows,
            'filters' => $request->only($filterKeys),
            'relationLabels' => $relationLabels,
            'relationDetails' => $relationDetails,
            'summary' => $summary,
        ]);
    }

    public function show(string $entity, int $id)
    {
        $config = $this->config($entity);
        $row = DB::table($config['table'])->where('id', $id)->first();
        abort_unless($row, 404);

        return Inertia::render('Generic/Show', [
            'entity' => $config,
            'row' => $row,
        ]);
    }

    public function create(string $entity)
    {
        $config = $this->config($entity);

        return Inertia::render('Generic/Form', [
            'entity' => $config,
            'row' => null,
            'relations' => $this->relations($config),
        ]);
    }

    public function store(Request $request, string $entity, AuditService $audit)
    {
        $config = $this->config($entity);
        if ($config['table'] === 'maintenance_events') {
            $request->merge(app(MaintenanceService::class)->applyNextDue($request->all()));
        }
        $data = $this->validated($request, $config);
        if ($config['table'] === 'maintenance_events') {
            $data = app(MaintenanceService::class)->applyNextDue($data);
        }
        $fieldNames = array_column($config['fields'], 'name');
        if (in_array('reference', $fieldNames, true) && empty($data['reference'])) {
            $sequence = ['devis' => 'quotes', 'slv_reservations' => 'reservations'][$config['key']] ?? null;
            try {
                $data['reference'] = $sequence ? app(SequenceService::class)->next($sequence) : strtoupper(substr($config['key'], 0, 5)).'-'.now()->format('YmdHis');
            } catch (\Throwable) {
                $data['reference'] = strtoupper(substr($config['key'], 0, 5)).'-'.now()->format('YmdHis');
            }
            $data['reference_format'] = 'native_6';
            $data['reference_normalized'] = strtoupper(preg_replace('/[^A-Z0-9]/i', '', $data['reference']));
        }
        $data['created_at'] = now();
        $data['updated_at'] = now();
        if (Schema::hasColumn($config['table'], 'data_quality_status')) {
            $data['data_quality_status'] = 'ok';
        }
        if (Schema::hasColumn($config['table'], 'created_by')) {
            $data['created_by'] = auth()->id();
        }

        $id = DB::table($config['table'])->insertGetId($data);
        $audit->log('create', $config['table'], (int) $id, null, $data);

        return redirect()->route('data.index', $entity)->with('success', 'Enregistrement créé.');
    }

    public function edit(string $entity, int $id)
    {
        $config = $this->config($entity);
        $row = DB::table($config['table'])->where('id', $id)->first();
        abort_unless($row, 404);
        abort_unless(auth()->user()?->canAccessRecord($entity, 'update', $row), 403, 'Action non autorisée sur cet enregistrement.');

        return Inertia::render('Generic/Form', [
            'entity' => $config,
            'row' => $row,
            'relations' => $this->relations($config),
        ]);
    }

    public function update(Request $request, string $entity, int $id, AuditService $audit)
    {
        $config = $this->config($entity);
        if ($config['table'] === 'maintenance_events') {
            $request->merge(app(MaintenanceService::class)->applyNextDue($request->all()));
        }
        $data = $this->validated($request, $config);
        if ($config['table'] === 'maintenance_events') {
            $data = app(MaintenanceService::class)->applyNextDue($data);
        }
        $data['updated_at'] = now();
        $before = (array) DB::table($config['table'])->where('id', $id)->first();
        abort_unless(auth()->user()?->canAccessRecord($entity, 'update', $before), 403, 'Action non autorisée sur cet enregistrement.');

        DB::table($config['table'])->where('id', $id)->update($data);
        $audit->log('update', $config['table'], $id, $before, $data);

        return redirect()->route('data.index', $entity)->with('success', 'Enregistrement mis à jour.');
    }

    public function duplicate(Request $request, string $entity, int $id, AuditService $audit)
    {
        $config = $this->config($entity);
        $row = DB::table($config['table'])->where('id', $id)->first();
        abort_unless($row, 404);
        abort_unless($request->user()?->canAccessRecord($entity, 'create', $row), 403, 'Action non autorisée.');

        $data = (array) $row;
        unset($data['id'], $data['created_at'], $data['updated_at'], $data['legacy_uid'], $data['legacy_payload'], $data['reference_format'], $data['reference_normalized']);
        if (array_key_exists('reference', $data)) {
            $data['reference'] = mb_substr((string) $data['reference'], 0, 30).'-C'.now()->format('His');
            $data['reference_normalized'] = strtoupper(preg_replace('/[^A-Z0-9]/i', '', $data['reference']));
            $data['reference_format'] = 'native_6';
        }
        $data['created_at'] = now();
        $data['updated_at'] = now();
        if (Schema::hasColumn($config['table'], 'data_quality_status')) {
            $data['data_quality_status'] = 'ok';
        }
        if (Schema::hasColumn($config['table'], 'created_by')) {
            $data['created_by'] = $request->user()->id;
        }

        $newId = DB::table($config['table'])->insertGetId($data);
        $audit->log('duplicate', $config['table'], (int) $newId, (array) $row, $data);

        return redirect()->route('data.show', [$entity, $newId])->with('success', 'Enregistrement dupliqué.');
    }

    public function bulkDuplicate(Request $request, string $entity, AuditService $audit)
    {
        $config = $this->config($entity);
        $data = $request->validate(['ids' => ['required', 'array', 'min:1'], 'ids.*' => ['integer']]);
        $created = 0;
        foreach ($data['ids'] as $id) {
            $row = DB::table($config['table'])->where('id', $id)->first();
            if (! $row) {
                continue;
            }
            abort_unless($request->user()?->canAccessRecord($entity, 'create', $row), 403, 'Action non autorisée.');
            $copy = (array) $row;
            unset($copy['id'], $copy['created_at'], $copy['updated_at'], $copy['legacy_uid'], $copy['legacy_payload'], $copy['reference_format'], $copy['reference_normalized']);
            if (array_key_exists('reference', $copy)) {
                $copy['reference'] = mb_substr((string) $copy['reference'], 0, 30).'-C'.now()->format('His').'-'.$created;
                $copy['reference_normalized'] = strtoupper(preg_replace('/[^A-Z0-9]/i', '', $copy['reference']));
                $copy['reference_format'] = 'native_6';
            }
            $copy['created_at'] = now();
            $copy['updated_at'] = now();
            if (Schema::hasColumn($config['table'], 'data_quality_status')) {
                $copy['data_quality_status'] = 'ok';
            }
            if (Schema::hasColumn($config['table'], 'created_by')) {
                $copy['created_by'] = $request->user()->id;
            }
            $newId = DB::table($config['table'])->insertGetId($copy);
            $audit->log('duplicate', $config['table'], (int) $newId, (array) $row, $copy);
            $created++;
        }

        return back()->with('success', $created.' enregistrement(s) dupliqué(s).');
    }

    public function destroy(string $entity, int $id, AuditService $audit)
    {
        $config = $this->config($entity);
        $before = (array) DB::table($config['table'])->where('id', $id)->first();
        abort_unless(auth()->user()?->canAccessRecord($entity, 'delete', $before), 403, 'Action non autorisée sur cet enregistrement.');
        DB::table($config['table'])->where('id', $id)->delete();
        $audit->log('delete', $config['table'], $id, $before);

        return back()->with('success', 'Enregistrement supprimé.');
    }

    private function relations(array $config): array
    {
        $out = [];
        foreach ($config['fields'] as $field) {
            if ($field['input'] !== 'relation' || ! $field['relation']) {
                continue;
            }
            $target = config("entities.{$field['relation']}");
            if (! $target) {
                continue;
            }
            $rows = DB::table($target['table'])->limit(1000)->get();
            $out[$field['name']] = $rows->map(function ($row) {
                $label = $row->display_name ?? $row->name ?? $row->plate_number ?? $row->reference ?? ('#'.$row->id);

                return ['value' => $row->id, 'label' => $label];
            })->values();
        }

        return $out;
    }

    private function validated(Request $request, array $config): array
    {
        $rules = [];
        foreach ($config['fields'] as $field) {
            if ($field['kind'] === 'recorded' || $field['kind'] === 'legacy') {
                continue;
            }
            $name = $field['name'];
            $rule = [];
            if ($field['required']) {
                $rule[] = 'required';
            } else {
                $rule[] = 'nullable';
            }
            $rule[] = match ($field['input']) {
                'number' => 'numeric',
                'checkbox' => 'boolean',
                'date' => 'date',
                'datetime' => 'date',
                'relation' => 'integer',
                'select' => $field['options'] ? 'in:'.implode(',', array_column($field['options'], 'value')) : 'string',
                default => 'string',
            };
            $rules[$name] = $rule;
        }

        $data = $request->validate($rules);

        foreach ($config['fields'] as $field) {
            if ($field['kind'] === 'recorded' || $field['kind'] === 'legacy') {
                continue;
            }
            if (array_key_exists($field['name'], $data) && $field['input'] === 'checkbox') {
                $data[$field['name']] = (bool) $data[$field['name']];
            }
            if (array_key_exists($field['name'], $data) && $data[$field['name']] === '') {
                $data[$field['name']] = null;
            }
        }

        return $data;
    }
}
