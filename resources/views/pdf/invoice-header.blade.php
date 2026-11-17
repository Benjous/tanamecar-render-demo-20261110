<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Facture {{ $invoice->reference }} - avec entête</title>
    <style>
        @page { margin: 16mm 18mm 20mm 18mm; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #111111; }
        .header { width: 100%; border-bottom: 2px solid #111111; padding-bottom: 10px; margin-bottom: 14px; }
        .header td { vertical-align: middle; }
        .header .logo { width: 200px; }
        .header .logo img { width: 190px; height: auto; }
        .header .company { text-align: right; font-size: 12px; line-height: 1.5; }
        .header .company strong { font-size: 16px; letter-spacing: 0.5px; }
        .invoice-title { text-align: right; font-size: 32px; font-weight: bold; letter-spacing: 1px; margin: 26px 0 18px; }
        .invoice-infos { width: 100%; border-collapse: collapse; }
        .invoice-infos td { vertical-align: top; }
        .invoice-infos .left { width: 48%; padding-top: 8px; }
        .invoice-infos .right { width: 52%; }
        .line { margin: 0 0 5px; font-size: 11px; }
        .client-box { border: 2px solid #111111; padding: 9px 10px; font-size: 10.5px; line-height: 1.55; }
        .invoice-infos .client-box { text-align: left; }
        .subject { margin: 14px 0 0; font-size: 11px; }
        .lines { width: 100%; border-collapse: collapse; margin-top: 24px; }
        .lines th { background: #000000; color: #ffffff; font-size: 11px; font-weight: bold; padding: 6px 7px; border: 1px solid #000000; }
        .lines td { padding: 6px 7px; border: 1px solid #d9d9d9; font-size: 11px; }
        .lines .designation { text-align: left; width: 44%; }
        .right { text-align: right; }
        .totals { width: 40%; margin-left: auto; margin-top: 8px; border-collapse: collapse; }
        .totals td { padding: 5px 7px; border: 1px solid #d9d9d9; font-size: 11px; }
        .totals .total td { font-weight: bold; font-size: 13px; border-top: 2px solid #111111; }
        .words { margin-top: 42px; font-size: 11px; line-height: 1.6; }
        .note { margin-top: 14px; font-size: 10px; color: #333333; }
        .signature { margin-top: 30px; text-align: right; font-size: 10px; color: #333333; }
        .signature span { display: inline-block; width: 190px; border-bottom: 1px solid #777777; height: 28px; }
    </style>
</head>
<body>
    <table class="header">
        <tr>
            <td class="logo">
                <img src="data:image/png;base64,{{ base64_encode(file_get_contents(public_path('legacy/logo-tanamecar-transparent.png'))) }}" alt="TANAME CAR">
            </td>
            <td class="company">
                <strong>TANAME CAR</strong><br>
                Location de voitures
            </td>
        </tr>
    </table>

    @include('pdf.partials.invoice-body', ['invoice' => $invoice])

    <div class="signature">
        Signature et cachet<br>
        <span></span>
    </div>
</body>
</html>
