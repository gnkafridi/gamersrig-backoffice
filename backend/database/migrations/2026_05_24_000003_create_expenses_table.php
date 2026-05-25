<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->string('period'); // 'YYYY-MM'
            $table->date('expense_date');
            $table->enum('category', ['operational', 'delivery', 'advance_shipping', 'technology', 'communication', 'packaging', 'marketing', 'equipment', 'other']);
            $table->string('description');
            $table->decimal('amount', 10, 2)->default(0);
            $table->foreignId('partner_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('invoice_id')->nullable()->constrained()->nullOnDelete();
            $table->boolean('is_reimbursable')->default(false);
            $table->timestamps();

            $table->index('period');
            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
