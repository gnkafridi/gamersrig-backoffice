<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            // Proof of payment (screenshot / receipt). partner_id already records who paid (NULL = revenue-funded).
            $table->string('proof_path')->nullable()->after('is_reimbursable');
        });
    }

    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropColumn('proof_path');
        });
    }
};
