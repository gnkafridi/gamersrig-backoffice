<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_id')->constrained('vendors')->cascadeOnDelete();
            $table->string('name');
            $table->string('sku')->nullable();
            $table->string('category')->nullable();
            $table->string('brand')->nullable();
            $table->string('condition')->default('New'); // New | Used | Pulled
            $table->decimal('sell_price', 10, 2)->default(0);   // vendor's price = our cost
            $table->decimal('resell_price', 10, 2)->default(0); // our listing price
            $table->integer('stock')->default(0);
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();

            $table->index('vendor_id');
            $table->index('condition');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_products');
    }
};
