<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Contrat {{ $contract->reference }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #0f172a; }
        .header { border-bottom: 2px solid #175171; padding-bottom: 10px; margin-bottom: 18px; }
        .brand { font-size: 22px; font-weight: bold; color: #175171; letter-spacing: 1px; }
        .muted { color: #64748b; }
        h1 { font-size: 18px; margin: 0 0 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #e2e8f0; padding: 7px; text-align: left; }
        th { background: #F4F7F9; font-size: 10px; text-transform: uppercase; color: #175171; }
        .totals { margin-top: 14px; width: 45%; margin-left: auto; }
        .totals td { border: none; padding: 4px 0; }
        .totals .total { border-top: 2px solid #175171; font-weight: bold; font-size: 14px; }
        .signature { margin-top: 40px; display: flex; justify-content: space-between; }
        .box { width: 45%; border-top: 1px solid #94a3b8; padding-top: 6px; }
    </style>
</head>
<body>
    <div class="header">
        <img src="data:image/jpeg;base64,{{ base64_encode(file_get_contents(public_path('brand/login-logo.jpg'))) }}" style="height:58px; width:auto;" alt="TANAMECAR">
        <div class="muted">Location de voitures - Casablanca, Maroc</div>
    </div>

    <h1>Contrat de location {{ $contract->reference }}</h1>
    <div class="muted">Édité le {{ now()->format('d/m/Y H:i') }}</div>

    <table>
        <tr><th style="width:25%">Client</th><td>{{ $contract->client?->display_name }}</td><th style="width:20%">Téléphone</th><td>{{ $contract->client?->phone ?? '-' }}</td></tr>
        <tr><th>Voiture</th><td>{{ $contract->vehicle?->display_name ?? 'Non renseigné' }}</td><th>Plaque</th><td>{{ $contract->vehicle?->plate_number ?? '-' }}</td></tr>
        <tr><th>Départ</th><td>{{ $contract->departure_at?->format('d/m/Y H:i') }} - {{ $contract->departure_place ?? '-' }}</td><th>Km départ</th><td>{{ $contract->departure_km ?? '-' }}</td></tr>
        <tr><th>Retour</th><td>{{ $contract->return_at?->format('d/m/Y H:i') }} - {{ $contract->return_place ?? '-' }}</td><th>Km retour</th><td>{{ $contract->return_km ?? '-' }}</td></tr>
    </table>

    <table>
        <thead><tr><th>Prix / jour</th><th>Nombre de jours</th><th>Total</th><th>Caution</th><th>Franchise</th></tr></thead>
        <tbody><tr><td>{{ number_format((float) $contract->daily_rate, 2, ',', ' ') }} MAD</td><td>{{ $contract->days }}</td><td>{{ number_format((float) $contract->total_amount, 2, ',', ' ') }} MAD</td><td>{{ number_format((float) ($contract->deposit ?? 0), 2, ',', ' ') }} MAD</td><td>{{ number_format((float) ($contract->deductible ?? 0), 2, ',', ' ') }} MAD</td></tr></tbody>
    </table>

    <table class="totals">
        <tr><td>Payé (enregistré)</td><td style="text-align:right">{{ number_format((float) ($financials->paid_amount_recorded ?? 0), 2, ',', ' ') }} MAD</td></tr>
        <tr><td>Payé (calculé)</td><td style="text-align:right">{{ number_format((float) ($financials->paid_amount_calculated ?? 0), 2, ',', ' ') }} MAD</td></tr>
        <tr class="total"><td>Reste calculé</td><td style="text-align:right">{{ number_format((float) ($financials->remaining_calculated ?? 0), 2, ',', ' ') }} MAD</td></tr>
    </table>

    @if($contract->note)<p><strong>Note :</strong> {{ $contract->note }}</p>@endif

    <div class="signature">
        <div class="box">Signature du locataire</div>
        <div class="box">Signature TanameCar</div>
    </div>
</body>
</html>

