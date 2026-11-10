<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sub_rentals', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('source_id')->unique();
            $table->unsignedInteger('source_row')->nullable();
            $table->foreignId('vehicle_id')->nullable()->constrained('vehicles')->nullOnDelete();
            $table->string('match_status', 20)->default('unmatched');
            $table->string('company')->nullable();
            $table->string('vehicle_name');
            $table->string('client_name')->nullable();
            $table->decimal('days_recorded', 12, 2)->nullable();
            $table->decimal('rate_recorded', 18, 6)->nullable();
            $table->decimal('total_recorded', 20, 8)->nullable();
            $table->decimal('price_recorded', 20, 8)->nullable();
            $table->decimal('profit_recorded', 20, 8)->nullable();
            $table->decimal('advance_recorded', 20, 8)->nullable();
            $table->decimal('credit_recorded', 20, 8)->nullable();
            $table->decimal('days_current', 12, 2)->nullable();
            $table->decimal('rate_current', 18, 6)->nullable();
            $table->decimal('total_current', 20, 8)->nullable();
            $table->decimal('price_current', 20, 8)->nullable();
            $table->decimal('profit_current', 20, 8)->nullable();
            $table->decimal('advance_current', 20, 8)->nullable();
            $table->decimal('credit_current', 20, 8)->nullable();
            $table->jsonb('raw_record')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('modified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampTz('modified_at')->nullable();
            $table->timestampsTz();
            $table->index(['vehicle_id', 'source_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sub_rentals');
    }
};
