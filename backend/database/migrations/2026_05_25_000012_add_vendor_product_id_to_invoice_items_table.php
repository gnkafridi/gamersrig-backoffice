<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoice_items', function (Blueprint $table) {
            // Third-party vendor product sold in this order (NULL = own catalog or free text).
            $table->foreignId('vendor_product_id')->nullable()->after('product_id')
                ->constrained('vendor_products')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('vendor_product_id');
        });
    }
};
