<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Step 1: Expand enum to include both old and new values so data migration is safe
        DB::statement("ALTER TABLE invoices MODIFY COLUMN status ENUM('draft','sent','paid','overdue','cancelled','pending','confirmed','shipped','delivered','returned') NOT NULL DEFAULT 'draft'");

        // Step 2: Migrate existing data to new statuses
        DB::statement("UPDATE invoices SET status = 'pending'   WHERE status IN ('draft', 'sent', 'overdue')");
        DB::statement("UPDATE invoices SET status = 'delivered' WHERE status = 'paid'");
        DB::statement("UPDATE invoices SET status = 'cancelled' WHERE status = 'cancelled'"); // no-op, keeps cancelled

        // Step 3: Lock down to only the new statuses
        DB::statement("ALTER TABLE invoices MODIFY COLUMN status ENUM('pending','confirmed','shipped','delivered','cancelled','returned') NOT NULL DEFAULT 'pending'");
    }

    public function down(): void
    {
        // Reverse: alter enum back first (so all values are valid during data rollback)
        DB::statement("ALTER TABLE invoices MODIFY COLUMN status ENUM('draft','sent','paid','overdue','cancelled','pending','confirmed','shipped','delivered','returned') NOT NULL DEFAULT 'draft'");
        DB::statement("UPDATE invoices SET status = 'paid'  WHERE status IN ('delivered', 'returned')");
        DB::statement("UPDATE invoices SET status = 'draft' WHERE status IN ('pending', 'confirmed', 'shipped')");
        DB::statement("ALTER TABLE invoices MODIFY COLUMN status ENUM('draft','sent','paid','overdue','cancelled') NOT NULL DEFAULT 'draft'");
    }
};
