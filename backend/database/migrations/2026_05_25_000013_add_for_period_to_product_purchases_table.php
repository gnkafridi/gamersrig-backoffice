<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_purchases', function (Blueprint $table) {
            // Accounting month this stock counts toward (YYYY-MM) — may differ from purchased_at.
            $table->string('for_period')->nullable()->after('purchased_at');
        });

        // Backfill existing rows from their purchase date.
        DB::statement("UPDATE product_purchases SET for_period = DATE_FORMAT(purchased_at, '%Y-%m') WHERE for_period IS NULL AND purchased_at IS NOT NULL");
    }

    public function down(): void
    {
        Schema::table('product_purchases', function (Blueprint $table) {
            $table->dropColumn('for_period');
        });
    }
};
