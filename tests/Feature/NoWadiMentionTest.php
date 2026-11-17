<?php

namespace Tests\Feature;

use Tests\TestCase;

class NoWadiMentionTest extends TestCase
{
    public function test_client_visible_files_do_not_contain_wadi(): void
    {
        $paths = [
            resource_path('js'),
            resource_path('views'),
            base_path('public'),
            base_path('docs'),
            base_path('lang'),
            base_path('README.md'),
            base_path('RAPPORT-FINAL.md'),
        ];

        $extensions = ['php', 'tsx', 'ts', 'md', 'json', 'js', 'css', 'html', 'txt'];
        $offenders = [];
        $adminOnly = [
            'resources/js/Pages/Settings/WadiSync.tsx',
            'resources/js/Layouts/AppLayout.tsx',
            'resources/js/components/OfflineDock.tsx',
            'resources/js/lib/workspaceNav.ts',
        ];

        foreach ($paths as $path) {
            if (is_file($path)) {
                $this->scanFile($path, $extensions, $offenders, $adminOnly);
                continue;
            }

            if (! is_dir($path)) {
                continue;
            }

            $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($path));
            foreach ($iterator as $file) {
                if (! $file->isFile()) {
                    continue;
                }

                $relative = str_replace('\\', '/', str_replace(base_path().DIRECTORY_SEPARATOR, '', $file->getPathname()));
                if (preg_match('#^(scripts|database/import|storage|vendor|node_modules|private|public/build)/#', $relative)) {
                    continue;
                }
                if (in_array($relative, $adminOnly, true)) {
                    continue;
                }

                $this->scanFile($file->getPathname(), $extensions, $offenders, $adminOnly);
            }
        }

        $this->assertSame([], $offenders, 'Mentions Wadi détectées : '.implode(', ', $offenders));
    }

    private function scanFile(string $path, array $extensions, array &$offenders, array $adminOnly = []): void
    {
        $name = basename($path);
        $relative = str_replace('\\', '/', str_replace(base_path().DIRECTORY_SEPARATOR, '', $path));
        if (in_array($relative, $adminOnly, true)) {
            return;
        }

        $matchesExtension = collect($extensions)->contains(fn (string $extension) => str_ends_with($name, '.'.$extension));
        if (! $matchesExtension) {
            return;
        }

        $content = @file_get_contents($path);
        if ($content !== false && preg_match('/wadi/i', $content)) {
            $offenders[] = $relative;
        }
    }
}
