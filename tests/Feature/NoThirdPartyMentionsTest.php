<?php

namespace Tests\Feature;

use Tests\TestCase;

class NoThirdPartyMentionsTest extends TestCase
{
    public function test_interface_and_client_docs_do_not_mention_third_party_systems(): void
    {
        $roots = [resource_path('js'), resource_path('views'), base_path('docs')];
        $offenders = [];
        $adminOnly = [
            'resources/js/Pages/Settings/WadiSync.tsx',
            'resources/js/Layouts/AppLayout.tsx',
            'resources/js/components/OfflineDock.tsx',
            'resources/js/lib/workspaceNav.ts',
        ];
        foreach ($roots as $root) {
            if (! is_dir($root)) continue;
            $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($root));
            foreach ($iterator as $file) {
                if (! $file->isFile() || ! preg_match('/\.(tsx|ts|php|md|json)$/', $file->getFilename())) continue;
                $relative = str_replace('\\', '/', str_replace(base_path().DIRECTORY_SEPARATOR, '', $file->getPathname()));
                if (in_array($relative, $adminOnly, true)) continue;
                $contents = file_get_contents($file->getPathname());
                if (preg_match('/autoloc|wadi|wadidev/i', $contents)) {
                    $offenders[] = $relative;
                }
            }
        }
        $this->assertSame([], $offenders, 'Mentions tierces détectées : '.implode(', ', $offenders));
    }
}
