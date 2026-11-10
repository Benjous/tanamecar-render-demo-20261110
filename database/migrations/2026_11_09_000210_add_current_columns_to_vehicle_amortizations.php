<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vehicle_amortizations', function (Blueprint $table) {
            $table->decimal('revenue_current', 20, 8)->nullable();
            $table->decimal('credit_current', 20, 8)->nullable();
            $table->decimal('objective_current', 20, 8)->nullable();
            $table->decimal('price_per_km_current', 20, 8)->nullable();
            $table->decimal('price_current', 20, 8)->nullable();
            $table->decimal('real_cost_current', 20, 8)->nullable();
            $table->decimal('remaining_current', 20, 8)->nullable();
            $table->decimal('net_remaining_current', 20, 8)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('vehicle_amortizations', function (Blueprint $table) {
            $table->dropColumn([
                'revenue_current', 'credit_current', 'objective_current', 'price_per_km_current',
                'price_current', 'real_cost_current', 'remaining_current', 'net_remaining_current',
            ]);
        });
    }
};
