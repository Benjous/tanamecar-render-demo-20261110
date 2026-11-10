<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;

trait ExcludesArchived
{
    protected static function bootExcludesArchived(): void
    {
        static::addGlobalScope('not_archived', function (Builder $builder) {
            $table = $builder->getModel()->getTable();
            $builder->whereNotExists(function ($query) use ($table) {
                $query->selectRaw('1')
                    ->from('archived_records')
                    ->where('entity_type', $table)
                    ->whereColumn('record_id', $table.'.id');
            });
        });
    }
}
