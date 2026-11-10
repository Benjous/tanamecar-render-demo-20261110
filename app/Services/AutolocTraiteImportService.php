<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use RuntimeException;

class AutolocTraiteImportService
{
    public function exportFromStaging(string $connection = 'pgsql'): array
    {
        $db = DB::connection($connection);
        $summaries = $db->table('autoloc_traite_summaries')->orderBy('source_vehicle_id')->get();
        $vehicles = [];
        foreach ($summaries as $summary) {
            $raw = $this->decodeJson($summary->raw_record);
            $payments = $db->table('vehicle_installments')
                ->where('summary_id', $summary->id)
                ->orderBy('source_row_number')
                ->get();
            $vehicles[] = [
                'autolocVehicleId' => (int) $summary->source_vehicle_id,
                'vehicleName' => $summary->source_vehicle_name,
                'autolocPlate' => $summary->source_plate,
                'matchStatus' => $summary->match_status,
                'matchedCandidates' => $summary->vehicle_id ? [['id' => (int) $summary->vehicle_id]] : [],
                'rawVehicleListCells' => $raw['list_cells'] ?? [],
                'rawSummaryCells' => $raw['summary_cells'] ?? [],
                'calculatedVsRecorded' => $raw['calculated_vs_recorded'] ?? [],
                'payments' => $payments->map(fn ($payment) => [
                    'ordinal' => (int) $payment->source_row_number,
                    'amountText' => $payment->amount_text ?? (string) $payment->amount_recorded,
                    'amount' => (float) $payment->amount_recorded,
                    'date' => (string) ($payment->date_recorded ?? $payment->due_date),
                    'description' => $payment->description_recorded,
                    'sourceCells' => $this->decodeJson($payment->raw_record),
                ])->all(),
            ];
        }

        return ['vehicles' => $vehicles];
    }

    public function preview(array $dataset): array
    {
        $vehicles = $dataset['vehicles'] ?? [];
        $installments = collect($vehicles)->flatMap(fn (array $vehicle) => $vehicle['payments'] ?? []);

        return [
            'summaries' => count($vehicles),
            'installments' => $installments->count(),
            'recorded_amount_sum' => round((float) $installments->sum(fn (array $row) => (float) ($row['amountText'] ?? $row['amount'] ?? 0)), 2),
            'matched_summaries' => collect($vehicles)->where('matchStatus', 'matched')->count(),
            'unmatched_summaries' => collect($vehicles)->where('matchStatus', 'unmatched')->count(),
            'ambiguous_summaries' => collect($vehicles)->where('matchStatus', 'ambiguous')->count(),
        ];
    }

    public function import(array $dataset, string $connection = 'pgsql'): array
    {
        $vehicles = $dataset['vehicles'] ?? null;
        if (! is_array($vehicles) || $vehicles === []) {
            throw new RuntimeException('Le fichier d’import ne contient aucune synthèse de Traites.');
        }

        $sourceIds = [];
        $sourceKeys = [];
        foreach ($vehicles as $vehicle) {
            $sourceVehicleId = (int) ($vehicle['autolocVehicleId'] ?? 0);
            if ($sourceVehicleId < 1 || in_array($sourceVehicleId, $sourceIds, true)) {
                throw new RuntimeException('Identifiant de voiture Autoloc manquant ou dupliqué.');
            }
            $sourceIds[] = $sourceVehicleId;
            foreach ($vehicle['payments'] ?? [] as $payment) {
                $rowNumber = (int) ($payment['ordinal'] ?? 0);
                $sourceKey = "autoloc:{$sourceVehicleId}:{$rowNumber}";
                if ($rowNumber < 1 || in_array($sourceKey, $sourceKeys, true)) {
                    throw new RuntimeException('Clé historique de traite manquante ou dupliquée.');
                }
                if (! is_numeric($payment['amountText'] ?? $payment['amount'] ?? null)
                    || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) ($payment['date'] ?? ''))) {
                    throw new RuntimeException("Valeur de traite invalide pour {$sourceKey}.");
                }
                $sourceKeys[] = $sourceKey;
            }
        }

        $db = DB::connection($connection);
        return $db->transaction(function () use ($db, $vehicles, $sourceIds, $sourceKeys): array {
            $existingSummary = $db->table('autoloc_traite_summaries')->whereIn('source_vehicle_id', $sourceIds)->count();
            $existingInstallments = $sourceKeys === [] ? 0 : $db->table('vehicle_installments')->whereIn('source_key', $sourceKeys)->count();
            if ($existingSummary > 0 || $existingInstallments > 0) {
                throw new RuntimeException('Import arrêté : des identifiants Autoloc existent déjà. Aucune ligne n’a été remplacée.');
            }

            $insertedSummaries = 0;
            $insertedInstallments = 0;
            $summaryIds = [];
            foreach ($vehicles as $source) {
                $summaryCells = $source['rawSummaryCells'] ?? [];
                $matched = ($source['matchStatus'] ?? 'unmatched') === 'matched'
                    ? ($source['matchedCandidates'][0]['id'] ?? null)
                    : null;
                $summaryId = $db->table('autoloc_traite_summaries')->insertGetId([
                    'source_vehicle_id' => (int) $source['autolocVehicleId'],
                    'vehicle_id' => $matched ? (int) $matched : null,
                    'match_status' => (string) ($source['matchStatus'] ?? 'unmatched'),
                    'source_vehicle_name' => (string) ($source['vehicleName'] ?? 'Voiture Autoloc'),
                    'source_plate' => (string) ($source['autolocPlate'] ?? ''),
                    'credit_house' => $summaryCells[3] ?? null,
                    'monthly_amount_recorded' => $summaryCells[4] !== '' ? $summaryCells[4] : null,
                    'total_months_recorded' => is_numeric($summaryCells[5] ?? null) ? (int) $summaryCells[5] : null,
                    'paid_months_recorded' => is_numeric($summaryCells[6] ?? null) ? (int) $summaryCells[6] : null,
                    'remaining_months_recorded' => is_numeric($summaryCells[7] ?? null) ? (int) $summaryCells[7] : null,
                    'total_amount_recorded' => $summaryCells[8] ?? null,
                    'paid_amount_recorded' => $summaryCells[9] ?? null,
                    'remaining_amount_recorded' => $summaryCells[10] ?? null,
                    'raw_record' => json_encode([
                        'list_cells' => $source['rawVehicleListCells'] ?? [],
                        'summary_cells' => $summaryCells,
                        'calculated_vs_recorded' => $source['calculatedVsRecorded'] ?? [],
                    ], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $summaryIds[(int) $source['autolocVehicleId']] = $summaryId;
                $insertedSummaries++;

                foreach ($source['payments'] ?? [] as $payment) {
                    $sourceVehicleId = (int) $source['autolocVehicleId'];
                    $rowNumber = (int) $payment['ordinal'];
                    $sourceKey = "autoloc:{$sourceVehicleId}:{$rowNumber}";
                    $db->table('vehicle_installments')->insert([
                        'vehicle_id' => $matched ? (int) $matched : null,
                        'summary_id' => $summaryId,
                        'source_vehicle_id' => $sourceVehicleId,
                        'source_row_number' => $rowNumber,
                        'source_key' => $sourceKey,
                        'origin' => 'autoloc',
                        'amount_recorded' => $payment['amountText'] ?? $payment['amount'],
                        'amount_current' => $payment['amountText'] ?? $payment['amount'],
                        'amount_text' => (string) ($payment['amountText'] ?? $payment['amount']),
                        'due_date' => $payment['date'],
                        'date_recorded' => $payment['date'],
                        'description' => $payment['description'] ?? null,
                        'description_recorded' => $payment['description'] ?? null,
                        'status' => 'paid',
                        'status_recorded' => 'paid',
                        'raw_record' => json_encode($payment['sourceCells'] ?? $payment, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    $insertedInstallments++;
                }
            }

            $sum = (float) $db->table('vehicle_installments')->where('origin', 'autoloc')->sum('amount_recorded');
            return [
                'summaries_inserted' => $insertedSummaries,
                'installments_inserted' => $insertedInstallments,
                'recorded_amount_sum' => round($sum, 2),
                'unmatched_summaries' => collect($vehicles)->where('matchStatus', 'unmatched')->count(),
            ];
        });
    }

    private function decodeJson(mixed $value): array
    {
        if (is_array($value)) {
            return $value;
        }
        if (! is_string($value) || $value === '') {
            return [];
        }

        $decoded = json_decode($value, true);
        return is_array($decoded) ? $decoded : [];
    }
}
