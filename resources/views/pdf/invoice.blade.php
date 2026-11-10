<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Facture {{ $invoice->reference }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #0f172a; }
        .header { border-bottom: 2px solid #175171; padding-bottom: 10px; margin-bottom: 18px; }
        .brand { font-size: 22px; font-weight: bold; color: #175171; letter-spacing: 1px; }
        .muted { color: #64748b; }
        h1 { font-size: 18px; margin: 0 0 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #e2e8f0; padding: 7px; text-align: left; }
        th { background: #F4F7F9; font-size: 10px; text-transform: uppercase; color: #175171; }
        .right { text-align: right; }
        .totals { margin-top: 14px; width: 45%; margin-left: auto; }
        .totals td { border: none; padding: 4px 0; }
        .totals .total { border-top: 2px solid #175171; font-weight: bold; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <img src="data:image/jpeg;base64,{{ base64_encode(file_get_contents(public_path('brand/login-logo.jpg'))) }}" style="height:58px; width:auto;" alt="TANAMECAR">
        <div class="muted">Location de voitures - Casablanca, Maroc</div>
    </div>

    <h1>Facture {{ $invoice->reference }}</h1>
    <div class="muted">Date d’émission : {{ $invoice->issued_at?->format('d/m/Y') }} - Client : {{ $invoice->client?->display_name }}</div>
    @if($invoice->file_reference)<div class="muted">Réf. dossier : {{ $invoice->file_reference }}</div>@endif

    <table>
        <thead><tr><th>Désignation</th><th class="right">Qté</th><th class="right">P.U. HT</th><th class="right">TVA</th><th class="right">Total TTC</th></tr></thead>
        <tbody>
            @foreach($invoice->lines as $line)
                <tr>
                    <td>{{ $line->designation }}</td>
                    <td class="right">{{ $line->quantity }}</td>
                    <td class="right">{{ number_format((float) $line->unit_price, 2, ',', ' ') }} MAD</td>
                    <td class="right">{{ $line->vat_rate }} %</td>
                    <td class="right">{{ number_format((float) $line->price, 2, ',', ' ') }} MAD</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals">
        <tr><td>Sous-total HT</td><td class="right">{{ number_format((float) $invoice->subtotal, 2, ',', ' ') }} MAD</td></tr>
        <tr><td>TVA</td><td class="right">{{ number_format((float) $invoice->vat_value, 2, ',', ' ') }} MAD</td></tr>
        <tr class="total"><td>Total TTC</td><td class="right">{{ number_format((float) $invoice->total, 2, ',', ' ') }} MAD</td></tr>
    </table>

    @if($invoice->note)<p><strong>Note :</strong> {{ $invoice->note }}</p>@endif
</body>
</html>

