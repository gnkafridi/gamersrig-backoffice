<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\CodRecord;
use Illuminate\Support\Facades\DB;

class SalesDataSeeder extends Seeder
{
    public function run(): void
    {
        // ── Sales records from spreadsheet ───────────────────────────
        // Ahsan Zaidi (red row) skipped — "Not added in the prod"
        // Rehman Warraich RTX 3070 → sale price 90,000 (note: "Sold it for 90000")
        // COD rows: status='sent', cod_record created (pending)
        // Non-COD rows: status='paid', payment_method='Online'
        // delivery_fee=0 for TBD (COD courier charges unknown at time of sale)
        // cost_price=0 (not tracked on customer invoices)

        $sales = [
            // ── May 2026 ──────────────────────────────────────────────
            [
                'customer'      => 'Muhammad Naveed Ayub',
                'product'       => 'M15',
                'date'          => '2026-05-19',
                'sale_price'    => 15700,
                'delivery_fee'  => 0,       // TBD
                'payment'       => 'COD',
                'notes'         => null,
            ],
            [
                'customer'      => 'Jahanzaib Ahmed Shaikh',
                'product'       => 'X5 Lite Wasabi',
                'date'          => '2026-05-18',
                'sale_price'    => 8000,
                'delivery_fee'  => 0,       // TBD
                'payment'       => 'COD',
                'notes'         => null,
            ],
            [
                'customer'      => 'Usayd Uddin Saeed',
                'product'       => 'T3 Lite Gray',
                'date'          => '2026-05-04',
                'sale_price'    => 6500,
                'delivery_fee'  => 0,       // TBD
                'payment'       => 'COD',
                'notes'         => null,
            ],
            [
                'customer'      => 'Abubakar Siddique',
                'product'       => 'M05',
                'date'          => '2026-05-01',
                'sale_price'    => 10000,
                'delivery_fee'  => 0,       // TBD
                'payment'       => 'COD',
                'notes'         => null,
            ],
            // ── April 2026 ────────────────────────────────────────────
            [
                'customer'      => 'Rafay Zulfiqar',
                'product'       => 'AK820 W/G',
                'date'          => '2026-04-23',
                'sale_price'    => 10700,
                'delivery_fee'  => 0,       // TBD
                'payment'       => 'COD',
                'notes'         => null,
            ],
            [
                'customer'      => 'Maaz',
                'product'       => 'M05',
                'date'          => '2026-04-28',
                'sale_price'    => 9500,
                'delivery_fee'  => 0,
                'payment'       => 'Online',
                'notes'         => 'Pickup order',
            ],
            [
                'customer'      => 'Moiz Hussain',
                'product'       => 'T3 Lite Gray',
                'date'          => '2026-04-28',
                'sale_price'    => 6000,
                'delivery_fee'  => 0,
                'payment'       => 'Online',
                'notes'         => 'Bykea paid by customer',
            ],
            [
                'customer'      => 'Mirza Ezaaf Shuja',
                'product'       => 'X5 Lite Black',
                'date'          => '2026-04-20',
                'sale_price'    => 7700,
                'delivery_fee'  => 660,
                'payment'       => 'Online',
                'notes'         => null,
            ],
            [
                'customer'      => 'Muhammad Munnam Khalid',
                'product'       => 'M15',
                'date'          => '2026-04-17',
                'sale_price'    => 15000,
                'delivery_fee'  => 850,
                'payment'       => 'Online',
                'notes'         => null,
            ],
            [
                'customer'      => 'Muhammad Waqas Khan',
                'product'       => 'X5 Lite Wasabi',
                'date'          => '2026-04-17',
                'sale_price'    => 7500,
                'delivery_fee'  => 500,
                'payment'       => 'Online',
                'notes'         => null,
            ],
            [
                'customer'      => 'Muhammad Hamza Ihsan',
                'product'       => 'X5 Lite Wasabi',
                'date'          => '2026-04-13',
                'sale_price'    => 6750,
                'delivery_fee'  => 750,
                'payment'       => 'Online',
                'notes'         => 'Item price was increased',
            ],
            [
                'customer'      => 'Taha Nasir',
                'product'       => 'X5 Lite Wasabi',
                'date'          => '2026-04-07',
                'sale_price'    => 6000,
                'delivery_fee'  => 0,
                'payment'       => 'Online',
                'notes'         => null,
            ],
            [
                'customer'      => 'Muhammad Awais Baloch',
                'product'       => 'T3 Lite White',
                'date'          => '2026-04-02',
                'sale_price'    => 5350,
                'delivery_fee'  => 350,
                'payment'       => 'Online',
                'notes'         => null,
            ],
            // ── March 2026 ────────────────────────────────────────────
            [
                'customer'      => 'Sajid Ali',
                'product'       => 'X5 Lite Wasabi',
                'date'          => '2026-03-29',
                'sale_price'    => 6000,
                'delivery_fee'  => 0,
                'payment'       => 'Online',
                'notes'         => null,
            ],
            [
                'customer'      => 'Rehman Warraich',
                'product'       => 'RTX 3070',
                'date'          => '2026-03-19',
                'sale_price'    => 90000,
                'delivery_fee'  => 720,
                'payment'       => 'Online',
                'notes'         => 'Sold for 90,000',
            ],
            // ── February 2026 ─────────────────────────────────────────
            [
                'customer'      => 'Abdullah Shafiq',
                'product'       => 'X5 Lite Black',
                'date'          => '2026-02-15',
                'sale_price'    => 6000,
                'delivery_fee'  => 720,
                'payment'       => 'Online',
                'notes'         => null,
            ],
        ];

        $created = 0;

        // Sequence counters per month prefix so numbers don't collide
        $seqMap = [];

        DB::transaction(function () use ($sales, &$created, &$seqMap) {
            foreach ($sales as $sale) {
                // Find or create customer by name
                $customer = Customer::firstOrCreate(
                    ['name' => $sale['customer']],
                    [
                        'email' => null,
                        'phone' => null,
                        'address' => null,
                    ]
                );

                $subtotal    = $sale['sale_price'] - $sale['delivery_fee'];
                $total       = $sale['sale_price'];
                $isCod       = strtoupper($sale['payment']) === 'COD';
                $status      = $isCod ? 'pending' : 'delivered';
                $invoiceDate = \Carbon\Carbon::parse($sale['date']);

                // Generate invoice number using the invoice's own year-month
                $prefix = 'GR-' . $invoiceDate->format('Ym') . '-';
                if (!isset($seqMap[$prefix])) {
                    // Find highest existing sequence for this month
                    $last = Invoice::where('invoice_number', 'like', $prefix . '%')
                        ->orderByDesc('id')->first();
                    $seqMap[$prefix] = $last ? ((int) substr($last->invoice_number, -4)) + 1 : 1;
                }
                $invoiceNumber = $prefix . str_pad($seqMap[$prefix]++, max(2, strlen((string)$seqMap[$prefix])), '0', STR_PAD_LEFT);

                // Create invoice
                $invoice = Invoice::create([
                    'invoice_number' => $invoiceNumber,
                    'share_token'    => \Illuminate\Support\Str::random(40),
                    'customer_id'    => $customer->id,
                    'invoice_date'   => $invoiceDate,
                    'due_date'       => $invoiceDate->copy()->addDays(7),
                    'status'         => $status,
                    'subtotal'       => $subtotal,
                    'discount'       => 0,
                    'tax'            => 0,
                    'delivery_fee'   => $sale['delivery_fee'],
                    'total'          => $total,
                    'cost_total'     => 0,
                    'payment_method' => $sale['payment'],
                    'notes'          => $sale['notes'],
                ]);

                // Create invoice item
                $invoice->items()->create([
                    'product_id'     => null,
                    'product_name'   => $sale['product'],
                    'serial_number'  => null,
                    'category'       => 'controller',
                    'unit_price'     => $subtotal,
                    'cost_price'     => 0,
                    'quantity'       => 1,
                    'total'          => $subtotal,
                ]);

                // For COD orders → create a pending cod_record
                if ($isCod) {
                    CodRecord::create([
                        'invoice_id'          => $invoice->id,
                        'shipping_deduction'  => 0,   // TBD — update when courier confirms
                    ]);
                }

                $created++;
            }
        });

        $this->command->info("✓ Seeded {$created} invoices (COD pending records created for COD orders).");
        $this->command->info('  Skipped: Ahsan Zaidi (red row — not added to prod)');
    }
}
