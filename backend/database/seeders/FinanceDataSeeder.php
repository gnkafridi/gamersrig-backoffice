<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Partner;

class FinanceDataSeeder extends Seeder
{
    public function run(): void
    {
        $gnk   = Partner::where('name', 'GNK Afridi')->firstOrFail()->id;
        $naqi  = Partner::where('name', 'Syed Naqi Hassan')->firstOrFail()->id;

        // ── Expenses (from spreadsheet) ────────────────────────────────
        // Categories used (industry best-practice for e-commerce/tech business):
        //   technology   – domain, hosting, SIM purchase (business line)
        //   communication– SIM balance / top-up / airtime
        //   packaging    – bubble wrap and other packing materials
        //   marketing    – flyers, OLX ads, printing of promotional material
        //   equipment    – one-off hardware / office equipment purchase

        $expenses = [
            [
                'period'       => '2026-02',
                'expense_date' => '2026-02-01',
                'category'     => 'technology',        // domain + hosting subscription
                'description'  => 'Bought Domain and Hosting',
                'amount'       => 7671.00,
                'partner_id'   => $gnk,
            ],
            [
                'period'       => '2026-02',
                'expense_date' => '2026-02-05',
                'category'     => 'technology',        // business SIM card purchase
                'description'  => 'Bought SIM',
                'amount'       => 600.00,
                'partner_id'   => $naqi,
            ],
            [
                'period'       => '2026-03',
                'expense_date' => '2026-03-01',
                'category'     => 'technology',        // hosting plan upgrade
                'description'  => 'Upgrade Hosting',
                'amount'       => 10700.00,
                'partner_id'   => $gnk,
            ],
            [
                'period'       => '2026-04',
                'expense_date' => '2026-04-20',
                'category'     => 'communication',     // mobile data / airtime top-up
                'description'  => 'SIM Balance',
                'amount'       => 200.00,
                'partner_id'   => $naqi,
            ],
            [
                'period'       => '2026-04',
                'expense_date' => '2026-04-26',
                'category'     => 'packaging',         // bubble wrap for orders
                'description'  => 'Bubble Wrap',
                'amount'       => 600.00,
                'partner_id'   => $naqi,
            ],
            [
                'period'       => '2026-04',
                'expense_date' => '2026-04-26',
                'category'     => 'marketing',         // promotional flyers
                'description'  => 'Flyer',
                'amount'       => 800.00,
                'partner_id'   => $naqi,
            ],
            [
                'period'       => '2026-04',
                'expense_date' => '2026-04-26',
                'category'     => 'marketing',         // OLX paid listing / ad package
                'description'  => 'OLX Package',
                'amount'       => 3670.00,
                'partner_id'   => $naqi,
            ],
            [
                'period'       => '2026-04',
                'expense_date' => '2026-04-28',
                'category'     => 'marketing',         // printing of marketing material
                'description'  => 'Printing',
                'amount'       => 100.00,
                'partner_id'   => $naqi,
            ],
            [
                'period'       => '2026-04',
                'expense_date' => '2026-04-30',        // no date in sheet – placed end of April
                'category'     => 'equipment',         // office printer (one-off hardware)
                'description'  => 'Printer Cost',
                'amount'       => 24000.00,
                'partner_id'   => $naqi,
            ],
            [
                'period'       => '2026-05',
                'expense_date' => '2026-05-19',
                'category'     => 'marketing',         // promotional flyers
                'description'  => 'Flyer',
                'amount'       => 200.00,
                'partner_id'   => $naqi,
            ],
        ];

        foreach ($expenses as $expense) {
            DB::table('expenses')->insert(array_merge($expense, [
                'invoice_id'      => null,
                'is_reimbursable' => false,
                'created_at'      => now(),
                'updated_at'      => now(),
            ]));
        }

        $this->command->info('✓ Seeded ' . count($expenses) . ' expenses from spreadsheet data.');
    }
}
