<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quarterly_shares', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->integer('year');
            $table->tinyInteger('quarter'); // 1..4
            $table->decimal('total_revenue', 10, 2)->default(0);
            $table->integer('partner_count')->default(0);
            $table->decimal('share_amount', 10, 2)->default(0);
            $table->enum('status', ['draft', 'finalized'])->default('draft');
            $table->timestamps();

            $table->unique(['partner_id', 'year', 'quarter']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quarterly_shares');
    }
};
