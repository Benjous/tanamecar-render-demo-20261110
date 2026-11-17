<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->decimal('discount_per_day', 12, 2)->nullable()->after('daily_rate');
            $table->decimal('discount_amount', 12, 2)->nullable()->after('discount_per_day');
            $table->boolean('vat_applicable')->default(false)->after('discount_amount');
        });
    }

    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropColumn(['discount_per_day', 'discount_amount', 'vat_applicable']);
        });
    }
};
