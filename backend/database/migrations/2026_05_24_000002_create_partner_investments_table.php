<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partner_investments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->string('period'); // 'YYYY-MM'
            $table->decimal('amount', 10, 2)->default(0);
            $table->decimal('spillover_adjust', 10, 2)->default(0); // signed carry-forward
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['partner_id', 'period']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partner_investments');
    }
};
