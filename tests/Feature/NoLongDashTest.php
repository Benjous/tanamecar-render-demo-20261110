<?php

namespace Tests\Feature;

use Tests\TestCase;

class NoLongDashTest extends TestCase
{
    public function test_interface_translations_and_pdf_views_do_not_contain_long_dashes(): void
    {
        $paths = [
            resource_path('js'),
            resource_path('views'),
            base_path('docs'),
            base_path('database/seeders'),
            base_path('lang'),
        ];

        $extensions = ['php', 'tsx', 'ts', 'md', 'json', 'blade.php'];
        $offenders = [];

        foreach ($paths as $path) {
            if (! is_dir($path)) {
                continue;
            }

            $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($path));
            foreach ($iterator as $file) {
                if (! $file->isFile()) {
                    continue;
                }

                $name = $file->getFilename();
                $matchesExtension = collect($extensions)->contains(fn ($extension) => str_ends_with($name, '.'.$extension));
                if (! $matchesExtension) {
                    continue;
                }

                $content = file_get_contents($file->getPathname());
                if (str_contains($content, "\u{2014}") || str_contains($content, "\u{2013}")) {
                    $offenders[] = str_replace(base_path().DIRECTORY_SEPARATOR, '', $file->getPathname());
                }
            }
        }

        $this->assertSame([], $offenders, 'Tirets longs détectés : '.implode(', ', $offenders));
    }
}
