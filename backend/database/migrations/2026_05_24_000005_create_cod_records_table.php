<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cod_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->unique()->constrained()->cascadeOnDelete();
            $table->decimal('order_amount', 10, 2)->default(0);     // snapshot of invoice total
            $table->decimal('shipping_deduction', 10, 2)->default(0); // courier's cut
            $table->decimal('net_revenue', 10, 2)->default(0);       // order_amount - shipping_deduction
            $table->enum('status', ['pending', 'received', 'returned'])->default('pending');
            $table->date('disbursed_at')->nullable();
            $table->string('courier_reference')->nullable();
            $table->timestamps();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cod_records');
    }
};
