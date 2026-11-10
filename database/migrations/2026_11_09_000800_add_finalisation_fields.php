<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->string('caution_type', 16)->nullable();
        });
        Schema::table('reservations', function (Blueprint $table) {
            $table->foreignId('converted_contract_id')->nullable()->constrained('contracts')->nullOnDelete();
            $table->timestampTz('converted_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropConstrainedForeignId('converted_contract_id');
            $table->dropColumn('converted_at');
        });
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropColumn('caution_type');
        });
    }
};
