<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class TimelineService
{
    public function forClient(int $clientId): array
    {
        $events = [];
        foreach (DB::table('contracts')->where('client_id', $clientId)->orderByDesc('departure_at')->limit(200)->get() as $row) {
            $events[] = $this->event($row->departure_at ?? $row->created_at, 'contract', 'Location '.$row->reference, $row->total_amount, $row->created_at);
        }
        foreach (DB::table('payments')->join('contracts', 'contracts.id', '=', 'payments.contract_id')->where('contracts.client_id', $clientId)->orderByDesc('payments.created_at')->limit(200)->get(['payments.*']) as $row) {
            $events[] = $this->event($row->created_at, 'payment', 'Paiement', $row->amount, $row->created_at);
        }
        foreach (DB::table('invoices')->where('client_id', $clientId)->orderByDesc('issued_at')->limit(200)->get() as $row) {
            $events[] = $this->event($row->issued_at ?? $row->created_at, 'invoice', 'Facture '.$row->reference, $row->total, $row->created_at);
        }
        foreach (DB::table('media')->where('mediable_type', 'slv_locataires')->where('mediable_id', $clientId)->orderByDesc('created_at')->get() as $row) {
            $events[] = $this->event($row->created_at, 'document', $row->collection ?: 'Document', null, $row->created_at);
        }
        foreach (DB::table('activity_log')->leftJoin('users', 'users.id', '=', 'activity_log.user_id')->where('entity_type', 'clients')->where('entity_id', $clientId)->orderByDesc('activity_log.created_at')->limit(100)->get(['activity_log.*', 'users.name as user_name']) as $row) {
            $events[] = $this->event($row->created_at, 'activity', $this->actionLabel($row->action), null, $row->created_at, $row->user_name);
        }

        return $this->sorted($events);
    }

    public function forVehicle(int $vehicleId): array
    {
        $events = [];
        foreach (DB::table('contracts')->where('vehicle_id', $vehicleId)->orderByDesc('departure_at')->limit(200)->get() as $row) {
            $events[] = $this->event($row->departure_at ?? $row->created_at, 'contract', 'Location '.$row->reference, $row->total_amount, $row->created_at);
        }
        foreach (DB::table('maintenance_events')->where('vehicle_id', $vehicleId)->orderByDesc('created_at')->limit(200)->get() as $row) {
            $events[] = $this->event($row->next_date ?? $row->created_at, 'maintenance', $row->name ?: 'Maintenance', null, $row->created_at);
        }
        foreach (DB::table('incidents')->where('vehicle_id', $vehicleId)->orderByDesc('incident_date')->limit(200)->get() as $row) {
            $events[] = $this->event($row->incident_date, 'incident', $row->description, $row->amount, $row->created_at);
        }
        foreach (DB::table('vehicle_credits')->where('vehicle_id', $vehicleId)->orderByDesc('payment_date')->limit(200)->get() as $row) {
            $events[] = $this->event($row->payment_date, 'credit', 'Crédit véhicule', $row->amount, $row->created_at);
        }
        foreach (DB::table('activity_log')->leftJoin('users', 'users.id', '=', 'activity_log.user_id')->where('entity_type', 'vehicles')->where('entity_id', $vehicleId)->orderByDesc('activity_log.created_at')->limit(100)->get(['activity_log.*', 'users.name as user_name']) as $row) {
            $events[] = $this->event($row->created_at, 'activity', $this->actionLabel($row->action), null, $row->created_at, $row->user_name);
        }

        return $this->sorted($events);
    }

    private function event($date, string $type, string $title, $amount, $createdAt, ?string $userName = null): array
    {
        return [
            'date' => $date,
            'type' => $type,
            'title' => $title,
            'amount' => $amount,
            'created_at' => $createdAt,
            'user_name' => $userName,
        ];
    }

    private function actionLabel(string $action): string
    {
        return [
            'create' => 'Création',
            'update' => 'Modification',
            'delete' => 'Suppression',
            'return' => 'Retour',
            'archive' => 'Archivage',
            'convert' => 'Conversion',
        ][$action] ?? $action;
    }

    private function sorted(array $events): array
    {
        usort($events, fn ($a, $b) => strcmp((string) ($b['date'] ?? ''), (string) ($a['date'] ?? '')));

        return array_slice($events, 0, 300);
    }
}
