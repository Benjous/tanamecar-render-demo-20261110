<?php

$entities = json_decode(file_get_contents(__DIR__.'/../database/schema/entities.json'), true) ?: [];
$operations = require __DIR__.'/operations.php';

return array_merge($entities, $operations);
