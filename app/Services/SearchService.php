<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Query\Builder;

class SearchService
{
    /**
     * Normalise une valeur pour une recherche partielle, insensible à la casse et aux accents.
     */
    public static function normalize(?string $value): string
    {
        $value = trim((string) $value);
        if ($value === '') {
            return '';
        }

        $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
        if ($ascii !== false) {
            $value = $ascii;
        }

        return mb_strtolower(trim(preg_replace('/\s+/u', ' ', $value) ?? $value));
    }

    /**
     * Ajoute une recherche "contient" sur plusieurs colonnes.
     * Les colonnes sont converties en texte, minuscule et sans accents.
     *
     * @param  array<int, string>  $columns
     */
    public function apply(Builder|EloquentBuilder $query, array $columns, ?string $term, string $boolean = 'and'): void
    {
        $term = self::normalize($term);
        if ($term === '' || $columns === []) {
            return;
        }

        if ($query instanceof EloquentBuilder) {
            $query = $query->getQuery();
        }

        $pattern = '%'.$term.'%';
        $grammar = $query->getGrammar();

        $query->where(function (Builder $sub) use ($columns, $pattern, $grammar): void {
            foreach ($columns as $column) {
                $wrapped = $grammar->wrap($column);
                $sub->orWhereRaw(
                    "lower(translate(replace(replace(replace(replace(coalesce({$wrapped}::text, ''), 'Œ', 'OE'), 'œ', 'oe'), 'Æ', 'AE'), 'æ', 'ae'), 'ÀÂÄÁÃÅÇÈÉÊËÌÍÎÏÑÒÓÔÖÕÙÚÛÜÝŸàâäáãåçèéêëìíîïñòóôöõùúûüýÿ', 'aaaaaaceeeeiiiinooooouuuuyyaaaaaaceeeeiiiinooooouuuuyy')) like ?",
                    [$pattern],
                );
            }
        }, null, $boolean);
    }
}
