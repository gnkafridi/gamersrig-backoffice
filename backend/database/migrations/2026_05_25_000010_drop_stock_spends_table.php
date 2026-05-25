<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Stock-spent is now unified into product_purchases; this table is retired.
        Schema::dropIfExists('stock_spends');
    }

    public function down(): void
    {
        // No-op: re-create via the original create_stock_spends migration if ever needed.
    }
};
