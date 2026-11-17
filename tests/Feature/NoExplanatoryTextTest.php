<?php

namespace Tests\Feature;

use Tests\TestCase;

class NoExplanatoryTextTest extends TestCase
{
    public function test_interface_has_no_long_explanatory_text_or_forbidden_terms(): void
    {
        $root = resource_path('js');
        $allowed = [
            'Cette action est définitive. Voulez-vous continuer ?',
        ];
        $offenders = [];
        $adminOnly = ['AppLayout.tsx', 'WadiSync.tsx', 'OfflineDock.tsx', 'Forbidden.tsx', 'OfflineQueued.tsx'];
        $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($root));
        foreach ($iterator as $file) {
            if (! $file->isFile() || ! str_ends_with($file->getFilename(), '.tsx')) continue;
            if (in_array($file->getFilename(), $adminOnly, true)) continue;
            $contents = file_get_contents($file->getPathname());
            foreach (['synchronisation', 'à valider', 'interprétation', 'historique des données', 'autoloc', 'wadi'] as $term) {
                if (stripos($contents, $term) !== false) $offenders[] = $file->getFilename().' contient '.$term;
            }
            preg_match_all('/>([^<>{}\n]{25,})</u', $contents, $matches);
            foreach ($matches[1] as $value) {
                $value = trim(preg_replace('/\s+/u', ' ', $value) ?? '');
                if (count(preg_split('/\s+/u', $value)) > 6 && ! in_array($value, $allowed, true)) {
                    $offenders[] = $file->getFilename().' : '.$value;
                }
            }
        }
        $this->assertSame([], $offenders, implode("\n", $offenders));
    }
}
