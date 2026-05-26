<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Rename invoice_items first (has FK to invoices)
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->dropForeign(['invoice_id']);
        });

        Schema::rename('invoice_items', 'order_items');
        Schema::rename('invoices', 'orders');

        // 2. Rename columns on orders
        Schema::table('orders', function (Blueprint $table) {
            $table->renameColumn('invoice_number', 'order_number');
            $table->renameColumn('invoice_date',   'order_date');
        });

        // 3. Rename FK column on order_items and re-add constraint
        Schema::table('order_items', function (Blueprint $table) {
            $table->renameColumn('invoice_id', 'order_id');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropForeign(['order_id']);
            $table->renameColumn('order_id', 'invoice_id');
        });

        Schema::rename('orders', 'invoices');
        Schema::rename('order_items', 'invoice_items');

        Schema::table('invoices', function (Blueprint $table) {
            $table->renameColumn('order_number', 'invoice_number');
            $table->renameColumn('order_date',   'invoice_date');
        });

        Schema::table('invoice_items', function (Blueprint $table) {
            $table->foreign('invoice_id')->references('id')->on('invoices')->cascadeOnDelete();
        });
    }
};
