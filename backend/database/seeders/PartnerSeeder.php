<?php

namespace Database\Seeders;

use App\Models\Expense;
use App\Models\Partner;
use App\Models\PartnerInvestment;
use Illuminate\Database\Seeder;

class PartnerSeeder extends Seeder
{
    public function run(): void
    {
        $period = now()->format('Y-m');

        $partners = [
            ['name' => 'Ahmed Khan', 'email' => 'ahmed@gamersrig.com', 'phone' => '+92-300-1111111', 'share_percentage' => 50],
            ['name' => 'Bilal Raza', 'email' => 'bilal@gamersrig.com', 'phone' => '+92-300-2222222', 'share_percentage' => 50],
        ];

        foreach ($partners as $p) {
            $partner = Partner::firstOrCreate(['name' => $p['name']], $p);

            PartnerInvestment::updateOrCreate(
                ['partner_id' => $partner->id, 'period' => $period],
                ['amount' => 200000, 'spillover_adjust' => 0, 'notes' => 'Monthly capital']
            );
        }

        // Sample expenses
        Expense::firstOrCreate(
            ['period' => $period, 'description' => 'Office rent'],
            ['expense_date' => now()->toDateString(), 'category' => 'operational', 'amount' => 35000]
        );
        Expense::firstOrCreate(
            ['period' => $period, 'description' => 'Courier charges'],
            ['expense_date' => now()->toDateString(), 'category' => 'delivery', 'amount' => 12000]
        );
    }
}
