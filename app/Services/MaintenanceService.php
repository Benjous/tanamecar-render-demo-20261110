<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class MaintenanceService
{
    public function applyNextDue(array $data): array
    {
        $typeId = $data['maintenance_type_id'] ?? null;
        if (! $typeId) {
            return $data;
        }

        $type = DB::table('maintenance_types')->where('id', $typeId)->first();
        if (! $type) {
            return $data;
        }

        $kmInterval = (float) ($type->km_interval ?? 0);
        if (empty($data['km_interval']) && $kmInterval > 0) {
            $data['km_interval'] = $kmInterval;
        }
        $currentKm = isset($data['current_km']) ? (float) $data['current_km'] : null;
        if ($kmInterval > 0 && $currentKm !== null) {
            $data['next_km'] = $currentKm + $kmInterval;
        }

        $dateInterval = (int) ($type->date_interval ?? 0);
        if ($dateInterval > 0 && empty($data['next_date'])) {
            $data['next_date'] = CarbonImmutable::now()->addMonths($dateInterval)->toDateString();
        }

        return $data;
    }
}
