<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Rename: admin → super_admin, staff → admin
        DB::statement("UPDATE users SET role = 'super_admin' WHERE role = 'admin'");
        DB::statement("UPDATE users SET role = 'admin' WHERE role = 'staff'");

        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('admin')->change();
        });
    }

    public function down(): void
    {
        DB::statement("UPDATE users SET role = 'admin' WHERE role = 'super_admin'");
        DB::statement("UPDATE users SET role = 'staff' WHERE role = 'admin'");

        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('staff')->change();
        });
    }
};
