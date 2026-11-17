<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Facture {{ $invoice->reference }}</title>
    <style>
        @page { margin: 24mm 18mm 22mm 18mm; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #111111; }
        .invoice-title { text-align: right; font-size: 32px; font-weight: bold; letter-spacing: 1px; margin: 26px 0 18px; }
        .invoice-infos { width: 100%; border-collapse: collapse; }
        .invoice-infos td { vertical-align: top; }
        .invoice-infos .left { width: 48%; padding-top: 8px; }
        .invoice-infos .right { width: 52%; }
        .line { margin: 0 0 5px; font-size: 11px; }
        .client-box { border: 2px solid #111111; padding: 9px 10px; font-size: 10.5px; line-height: 1.55; }
        .invoice-infos .client-box { text-align: left; }
        .subject { margin: 16px 0 0; font-size: 11px; }
        .lines { width: 100%; border-collapse: collapse; margin-top: 24px; }
        .lines th { background: #000000; color: #ffffff; font-size: 11px; font-weight: bold; padding: 6px 7px; border: 1px solid #000000; }
        .lines td { padding: 6px 7px; border: 1px solid #d9d9d9; font-size: 11px; }
        .lines .designation { text-align: left; width: 44%; }
        .right { text-align: right; }
        .totals { width: 40%; margin-left: auto; margin-top: 8px; border-collapse: collapse; }
        .totals td { padding: 5px 7px; border: 1px solid #d9d9d9; font-size: 11px; }
        .totals .total td { font-weight: bold; font-size: 13px; border-top: 2px solid #111111; }
        .words { margin-top: 42px; font-size: 11px; line-height: 1.6; }
        .note { margin-top: 18px; font-size: 10px; color: #333333; }
    </style>
</head>
<body>
    @include('pdf.partials.invoice-body', ['invoice' => $invoice])
</body>
</html>
