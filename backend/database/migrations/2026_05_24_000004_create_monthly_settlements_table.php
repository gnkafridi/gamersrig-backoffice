<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('monthly_settlements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->string('period'); // 'YYYY-MM'
            $table->decimal('total_investment', 10, 2)->default(0);
            $table->decimal('spillover', 10, 2)->default(0);
            $table->decimal('total_expenses', 10, 2)->default(0);
            $table->decimal('advance_settled', 10, 2)->default(0);
            $table->decimal('net_settlement', 10, 2)->default(0);
            $table->enum('status', ['draft', 'finalized'])->default('draft');
            $table->timestamp('finalized_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['partner_id', 'period']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monthly_settlements');
    }
};
