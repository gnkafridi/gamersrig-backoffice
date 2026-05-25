<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('share_token', 40)->nullable()->unique()->after('id');
        });

        foreach (DB::table('invoices')->whereNull('share_token')->pluck('id') as $id) {
            DB::table('invoices')->where('id', $id)->update(['share_token' => Str::random(40)]);
        }
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn('share_token');
        });
    }
};
