<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partner_reimbursements', function (Blueprint $table) {
            $table->id();
            // from_partner pays to_partner to settle a due.
            $table->foreignId('from_partner_id')->constrained('partners')->cascadeOnDelete();
            $table->foreignId('to_partner_id')->constrained('partners')->cascadeOnDelete();
            $table->decimal('amount', 10, 2)->default(0);
            $table->date('paid_at');
            $table->string('period')->nullable(); // YYYY-MM the due relates to (optional)
            $table->string('proof_path')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('paid_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partner_reimbursements');
    }
};
