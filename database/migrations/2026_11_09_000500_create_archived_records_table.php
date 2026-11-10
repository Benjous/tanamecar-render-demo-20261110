<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('archived_records', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('entity_type', 64);
            $table->unsignedBigInteger('record_id');
            $table->string('batch_id', 64);
            $table->date('business_date')->nullable();
            $table->foreignId('archived_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampTz('created_at')->useCurrent();
            $table->unique(['entity_type', 'record_id']);
            $table->index(['batch_id', 'entity_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('archived_records');
    }
};
