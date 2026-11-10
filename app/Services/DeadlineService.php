<?php

namespace App\Services;

use App\Models\User;
use App\Models\VehicleDeadline;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DeadlineService
{
    public function status(VehicleDeadline $deadline): array
    {
        if ($deadline->completed_at) {
            return ['code' => 'done', 'label' => 'Traité', 'tone' => 'green', 'detail' => 'Réalisé le '.$deadline->completed_at->format('d/m/Y'), 'severity' => 0];
        }

        $today = CarbonImmutable::now('Africa/Casablanca')->startOfDay();
        $rule = $this->rule($deadline->maintenance_type_id);
        $candidates = [];

        if ($deadline->due_date) {
            $days = (int) $today->diffInDays(CarbonImmutable::parse($deadline->due_date)->startOfDay(), false);
            $candidates[] = [
                'code' => $days < 0 ? 'overdue' : ($days <= $rule['alert_days'] ? 'soon' : 'up_to_date'),
                'label' => $days < 0 ? 'Dépassé' : ($days <= $rule['alert_days'] ? 'Proche' : 'À jour'),
                'tone' => $days < 0 ? 'red' : ($days <= $rule['alert_days'] ? 'orange' : 'green'),
                'detail' => $days < 0 ? 'Retard '.abs($days).' j' : 'Dans '.$days.' j',
                'severity' => $days < 0 ? 3 : ($days <= $rule['alert_days'] ? 2 : 1),
                'days' => $days,
            ];
        }

        if ($deadline->due_km !== null) {
            $currentKm = (float) ($deadline->vehicle?->km ?? 0);
            $remaining = (float) $deadline->due_km - $currentKm;
            $candidates[] = [
                'code' => $remaining < 0 ? 'overdue' : ($remaining <= $rule['alert_km'] ? 'soon' : 'up_to_date'),
                'label' => $remaining < 0 ? 'Dépassé' : ($remaining <= $rule['alert_km'] ? 'Proche' : 'À jour'),
                'tone' => $remaining < 0 ? 'red' : ($remaining <= $rule['alert_km'] ? 'orange' : 'green'),
                'detail' => $remaining < 0 ? 'Retard '.number_format(abs($remaining), 0, ',', ' ').' km' : 'Dans '.number_format($remaining, 0, ',', ' ').' km',
                'severity' => $remaining < 0 ? 3 : ($remaining <= $rule['alert_km'] ? 2 : 1),
                'remaining_km' => $remaining,
            ];
        }

        if (! $candidates && $deadline->legacy_status) {
            $code = $deadline->legacy_status === 'overdue' ? 'overdue' : 'soon';
            return ['code' => $code, 'label' => $code === 'overdue' ? 'Dépassé' : 'Proche', 'tone' => $code === 'overdue' ? 'red' : 'orange', 'detail' => '', 'severity' => $code === 'overdue' ? 3 : 2];
        }

        if (! $candidates) {
            return ['code' => 'up_to_date', 'label' => 'À jour', 'tone' => 'green', 'detail' => 'Échéance non renseignée', 'severity' => 1];
        }

        usort($candidates, fn ($a, $b) => $b['severity'] <=> $a['severity']);

        return $candidates[0];
    }

    public function active(): Collection
    {
        return VehicleDeadline::query()
            ->with(['vehicle.brand', 'vehicle.model', 'vehicle.color', 'maintenanceType'])
            ->whereNull('completed_at')
            ->orderBy('due_date')
            ->orderBy('due_km')
            ->get();
    }

    public function counts(): array
    {
        $counts = ['overdue' => 0, 'soon' => 0, 'up_to_date' => 0, 'done' => 0];
        foreach ($this->active() as $deadline) {
            $status = $this->status($deadline);
            if (isset($counts[$status['code']])) $counts[$status['code']]++;
        }
        $counts['done'] = VehicleDeadline::query()->whereNotNull('completed_at')->count();

        return $counts;
    }

    public function recap(int $limit = 12): array
    {
        $overdue = [];
        $soon = [];
        foreach ($this->active() as $deadline) {
            $status = $this->status($deadline);
            if (! in_array($status['code'], ['overdue', 'soon'], true)) continue;
            $item = [
                'id' => $deadline->id,
                'title' => $deadline->title,
                'vehicle' => $deadline->vehicle?->display_name ?? 'Véhicule',
                'plate' => $deadline->vehicle?->plate_number,
                'status' => $status,
                'due_date' => $deadline->due_date?->format('Y-m-d'),
                'due_km' => $deadline->due_km,
            ];
            if ($status['code'] === 'overdue') $overdue[] = $item; else $soon[] = $item;
        }
        $items = array_merge(array_slice($overdue, 0, 6), array_slice($soon, 0, max(0, $limit - 6)));

        return ['counts' => $this->counts(), 'items' => $items];
    }

    public function complete(VehicleDeadline $deadline, User $user, array $data, AuditService $audit): VehicleDeadline
    {
        abort_if($deadline->completed_at, 422, 'Échéance déjà traitée.');
        return DB::transaction(function () use ($deadline, $user, $data, $audit) {
            $before = $deadline->toArray();
            $deadline->update([
                'completed_at' => $data['completed_at'] ?? now(),
                'completed_by' => $user->id,
                'completion_note' => $data['note'] ?? null,
            ]);
            $audit->log('complete', 'vehicle_deadlines', $deadline->id, $before, $deadline->fresh()->toArray());

            if (! empty($data['next_due_date']) || ! empty($data['next_due_km'])) {
                $next = VehicleDeadline::create([
                    'vehicle_id' => $deadline->vehicle_id,
                    'maintenance_type_id' => $deadline->maintenance_type_id,
                    'title' => $deadline->title,
                    'due_date' => $data['next_due_date'] ?? null,
                    'due_km' => $data['next_due_km'] ?? null,
                    'source' => 'manual',
                    'created_by' => $user->id,
                ]);
                $audit->log('create', 'vehicle_deadlines', $next->id, null, $next->toArray());
            }

            return $deadline->fresh();
        });
    }

    public function rule(?int $typeId): array
    {
        if (! $typeId) return ['alert_days' => 30, 'alert_km' => 500];
        $rule = DB::table('deadline_rules')->where('maintenance_type_id', $typeId)->first();

        return ['alert_days' => (int) ($rule->alert_days ?? 30), 'alert_km' => (float) ($rule->alert_km ?? 500)];
    }
}
