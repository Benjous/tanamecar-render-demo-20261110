@php
    $client = $invoice->client;
    $formatter = new \NumberFormatter('fr_FR', \NumberFormatter::SPELLOUT);
    $amountWords = $formatter->format((float) $invoice->total);
    $amountWords = mb_convert_case($amountWords, MB_CASE_TITLE, 'UTF-8');
@endphp

<div class="invoice-title">FACTURE</div>

<table class="invoice-infos">
    <tr>
        <td class="left">
            <div class="line"><strong>FACTURE N°</strong> : {{ $invoice->reference }}</div>
            <div class="line"><strong>Date d'émission</strong> : {{ $invoice->issued_at?->format('d/m/Y') }}</div>
            <div class="line"><strong>Référence Dossier</strong> : {{ $invoice->file_reference ?: '-' }}</div>
        </td>
        <td class="right">
            <div class="client-box">
                <div><strong>CLIENT</strong> : {{ $client?->display_name ?? '-' }}</div>
                <div><strong>ICE</strong> : {{ $client?->identity_number ?: '-' }}</div>
                <div><strong>Adresse</strong> : {{ $client?->address ?: '-' }}</div>
            </div>
        </td>
    </tr>
</table>

<table class="lines">
    <thead>
        <tr>
            <th class="designation">Désignation</th>
            <th class="right">P.U HT</th>
            <th class="right">Nombre de jours</th>
            <th class="right">Total HT</th>
        </tr>
    </thead>
    <tbody>
        @foreach($invoice->lines as $line)
            <tr>
                <td>{{ $line->designation }}</td>
                <td class="right">{{ number_format((float) $line->unit_price, 2, '.', '') }}</td>
                <td class="right">{{ rtrim(rtrim(number_format((float) $line->quantity, 2, ',', ' '), '0'), ',') }}</td>
                <td class="right">{{ number_format((float) $line->net_price, 2, '.', ' ') }}</td>
            </tr>
        @endforeach
    </tbody>
</table>

<table class="totals">
    <tr><td>Sous-total</td><td class="right">{{ number_format((float) $invoice->subtotal, 2, '.', ' ') }}</td></tr>
    <tr><td>TVA {{ (float) $invoice->subtotal > 0 ? number_format(((float) $invoice->vat_value / (float) $invoice->subtotal) * 100, 0) : '0' }}%</td><td class="right">{{ number_format((float) $invoice->vat_value, 2, '.', ' ') }}</td></tr>
    <tr class="total"><td>Total</td><td class="right">{{ number_format((float) $invoice->total, 2, '.', ' ') }}</td></tr>
</table>

<div class="words">
    <strong>La présente facture est arrêtée à la somme de :</strong><br>
    {{ $amountWords }} Dirhams TTC
</div>
