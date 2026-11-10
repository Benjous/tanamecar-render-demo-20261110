<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class SequenceService
{
    public function next(string $name): string
    {
        return DB::transaction(function () use ($name) {
            $sequence = DB::table('sequences')->where('name', $name)->lockForUpdate()->first();
            if (! $sequence) {
                throw new \RuntimeException("Séquence introuvable : {$name}");
            }

            $value = (int) $sequence->next_value;
            $formatted = str_pad((string) $value, (int) $sequence->padding, '0', STR_PAD_LEFT);
            $formatted = str_replace(
                ['{value}', '{year}'],
                [$formatted, now()->format('Y')],
                $sequence->format ?: '{value}'
            );

            DB::table('sequences')->where('id', $sequence->id)->update(['next_value' => $value + 1]);

            return $formatted;
        });
    }
}
