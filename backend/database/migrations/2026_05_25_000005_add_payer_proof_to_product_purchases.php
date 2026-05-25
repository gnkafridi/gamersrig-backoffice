<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_purchases', function (Blueprint $table) {
            // Which partner fronted this purchase. NULL = funded by business revenue.
            $table->foreignId('paid_by_partner_id')->nullable()->after('vendor_id')
                ->constrained('partners')->nullOnDelete();
            // Proof of payment (screenshot / receipt) stored on the public disk.
            $table->string('proof_path')->nullable()->after('notes');
        });
    }

    public function down(): void
    {
        Schema::table('product_purchases', function (Blueprint $table) {
            $table->dropConstrainedForeignId('paid_by_partner_id');
            $table->dropColumn('proof_path');
        });
    }
};
