<?php

namespace App\Services;

use Dompdf\Dompdf;
use Dompdf\Options;

class PdfService
{
    public function render(string $view, array $data, string $paper = 'A4', bool $withFooter = true): string
    {
        $options = new Options;
        $options->set('isRemoteEnabled', true);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml(view($view, $data)->render(), 'UTF-8');
        $dompdf->setPaper($paper, 'portrait');
        $dompdf->render();

        if ($withFooter) {
            $canvas = $dompdf->getCanvas();
            $canvas->page_text(
                30,
                $canvas->get_height() - 22,
                'TanameCar - Page {PAGE_NUM} / {PAGE_COUNT}',
                null,
                8,
                [23, 81, 113]
            );
        }

        return $dompdf->output();
    }

    public function renderHtml(string $html, array $tokens, string $paper = 'A4'): string
    {
        foreach ($tokens as $key => $value) {
            $html = str_replace('{{'.$key.'}}', e((string) ($value ?? '')), $html);
        }

        $options = new Options;
        $options->set('isRemoteEnabled', true);
        $options->set('defaultFont', 'DejaVu Sans');
        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html, 'UTF-8');
        $dompdf->setPaper($paper, 'portrait');
        $dompdf->render();

        return $dompdf->output();
    }
}
