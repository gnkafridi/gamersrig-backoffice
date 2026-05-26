<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('billing_name')->nullable()->after('customer_id');
            $table->string('billing_phone')->nullable()->after('billing_name');
            $table->string('billing_city')->nullable()->after('billing_phone');
            $table->text('billing_address')->nullable()->after('billing_city');
        });

        // Backfill existing invoices with customer data
        DB::statement('
            UPDATE invoices i
            JOIN customers c ON c.id = i.customer_id
            SET
                i.billing_name    = c.name,
                i.billing_phone   = c.phone,
                i.billing_city    = c.city,
                i.billing_address = c.address
        ');
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['billing_name', 'billing_phone', 'billing_city', 'billing_address']);
        });
    }
};
