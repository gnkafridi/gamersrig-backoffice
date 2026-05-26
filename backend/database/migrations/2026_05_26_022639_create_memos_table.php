<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('memos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->longText('content')->nullable();
            $table->timestamps();

            $table->unique('user_id'); // one memo per user
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('memos');
    }
};
