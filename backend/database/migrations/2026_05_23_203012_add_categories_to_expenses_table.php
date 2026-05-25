<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Extend enum with industry-standard categories for e-commerce business
        DB::statement("ALTER TABLE expenses MODIFY COLUMN category ENUM(
            'operational',
            'delivery',
            'advance_shipping',
            'technology',
            'communication',
            'packaging',
            'marketing',
            'equipment',
            'other'
        ) NOT NULL DEFAULT 'other'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE expenses MODIFY COLUMN category ENUM(
            'operational',
            'delivery',
            'advance_shipping',
            'other'
        ) NOT NULL DEFAULT 'other'");
    }
};
