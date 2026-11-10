<?php

namespace App\Hashing;

use Illuminate\Hashing\BcryptHasher;
use RuntimeException;

class CompatibleBcryptHasher extends BcryptHasher
{
    public function check(#[\SensitiveParameter] $value, $hashedValue, array $options = [])
    {
        $normalized = $this->normalize($hashedValue);
        if ($normalized === null) {
            throw new RuntimeException('Unsupported legacy bcrypt variant.');
        }

        return parent::check($value, $normalized, $options);
    }

    public function verifyConfiguration($value)
    {
        $normalized = $this->normalize($value);

        return $normalized !== null && parent::verifyConfiguration($normalized);
    }

    public function needsRehash($hashedValue, array $options = [])
    {
        $normalized = $this->normalize($hashedValue);

        return $normalized === null || parent::needsRehash($normalized, $options);
    }

    private function normalize($hashedValue): ?string
    {
        if (! is_string($hashedValue) || strlen($hashedValue) < 4) {
            return (string) $hashedValue;
        }

        $prefix = substr($hashedValue, 0, 4);
        if ($prefix === '$2x$') {
            return null;
        }
        if ($prefix === '$2a$' || $prefix === '$2b$') {
            return '$2y$'.substr($hashedValue, 4);
        }

        return $hashedValue;
    }
}
