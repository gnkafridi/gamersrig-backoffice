<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_spends', function (Blueprint $table) {
            $table->id();
            $table->string('period'); // YYYY-MM
            $table->date('spent_at');
            $table->decimal('amount', 10, 2)->default(0);
            // Which partner fronted this stock cash. NULL = funded by business revenue.
            $table->foreignId('paid_by_partner_id')->nullable()->constrained('partners')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->string('proof_path')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('period');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_spends');
    }
};
