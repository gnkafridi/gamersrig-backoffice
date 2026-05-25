<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $tables = [
        'invoices',
        'products',
        'customers',
        'users',
        'partners',
        'partner_investments',
        'expenses',
        'cod_records',
    ];

    public function up(): void
    {
        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $blueprint) use ($table) {
                $blueprint->dropForeign(["{$table}_created_by_foreign"]);
                $blueprint->dropForeign(["{$table}_updated_by_foreign"]);
                $blueprint->dropColumn(['created_by', 'updated_by']);
            });
        }
    }
};
