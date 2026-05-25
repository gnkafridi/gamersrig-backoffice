<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Product;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    /** Order statuses that count as a realised "sale" (everything except cancelled/returned). */
    private const SALE_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered'];

    public function dashboard(Request $request)
    {
        $now = now();

        $thisMonth = Invoice::where('status', 'delivered')
            ->whereYear('invoice_date', $now->year)
            ->whereMonth('invoice_date', $now->month);

        $lastMonth = Invoice::where('status', 'delivered')
            ->whereYear('invoice_date', $now->copy()->subMonth()->year)
            ->whereMonth('invoice_date', $now->copy()->subMonth()->month);

        $thisYear = Invoice::where('status', 'delivered')
            ->whereYear('invoice_date', $now->year);

        return response()->json([
            'this_month' => [
                'revenue' => (float) (clone $thisMonth)->sum('total'),
                'profit' => (float) (clone $thisMonth)->sum(DB::raw('total - cost_total')),
                'invoice_count' => (clone $thisMonth)->count(),
            ],
            'last_month' => [
                'revenue' => (float) (clone $lastMonth)->sum('total'),
                'profit' => (float) (clone $lastMonth)->sum(DB::raw('total - cost_total')),
                'invoice_count' => (clone $lastMonth)->count(),
            ],
            'this_year' => [
                'revenue' => (float) (clone $thisYear)->sum('total'),
                'profit' => (float) (clone $thisYear)->sum(DB::raw('total - cost_total')),
                'invoice_count' => (clone $thisYear)->count(),
            ],
            'all_time' => [
                'revenue' => (float) Invoice::where('status', 'delivered')->sum('total'),
                'profit' => (float) Invoice::where('status', 'delivered')->sum(DB::raw('total - cost_total')),
                'invoice_count' => Invoice::where('status', 'delivered')->count(),
            ],
            'pending_invoices' => Invoice::whereIn('status', ['pending', 'confirmed', 'shipped'])->count(),
            'total_customers' => Customer::count(),
            'total_products' => Product::where('is_active', true)->count(),
        ]);
    }

    public function monthlyRevenue(Request $request)
    {
        $year = $request->year ?? now()->year;

        $data = Invoice::where('status', 'delivered')
            ->whereYear('invoice_date', $year)
            ->select(
                DB::raw('MONTH(invoice_date) as month'),
                DB::raw('SUM(total) as revenue'),
                DB::raw('SUM(total - cost_total) as profit'),
                DB::raw('COUNT(*) as invoice_count')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->keyBy('month');

        $months = [];
        for ($m = 1; $m <= 12; $m++) {
            $months[] = [
                'month' => $m,
                'month_name' => date('M', mktime(0, 0, 0, $m, 1)),
                'revenue' => isset($data[$m]) ? (float) $data[$m]->revenue : 0,
                'profit' => isset($data[$m]) ? (float) $data[$m]->profit : 0,
                'invoice_count' => isset($data[$m]) ? (int) $data[$m]->invoice_count : 0,
            ];
        }

        return response()->json(['year' => $year, 'months' => $months]);
    }

    public function topProducts(Request $request)
    {
        $period = $request->period ?? 'all'; // this_month, this_year, all

        $query = InvoiceItem::join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->whereIn('invoices.status', self::SALE_STATUSES)
            ->select(
                'invoice_items.product_name',
                'invoice_items.product_id',
                DB::raw('SUM(invoice_items.quantity) as total_quantity'),
                DB::raw('SUM(invoice_items.total) as total_revenue'),
                DB::raw('SUM(invoice_items.total - (invoice_items.cost_price * invoice_items.quantity)) as total_profit')
            )
            ->groupBy('invoice_items.product_name', 'invoice_items.product_id');

        if ($period === 'this_month') {
            $query->whereYear('invoices.invoice_date', now()->year)
                  ->whereMonth('invoices.invoice_date', now()->month);
        } elseif ($period === 'this_year') {
            $query->whereYear('invoices.invoice_date', now()->year);
        }

        $products = $query->orderByDesc('total_revenue')->limit(10)->get();

        return response()->json($products);
    }

    /* ── Sales Analytics ─────────────────────────────────────────────── */

    private function dateRange(Request $request): array
    {
        $from = $request->from ? Carbon::parse($request->from)->startOfDay() : now()->startOfMonth()->startOfDay();
        $to   = $request->to   ? Carbon::parse($request->to)->endOfDay()     : now()->endOfDay();
        return [$from, $to];
    }

    public function salesReport(Request $request)
    {
        [$from, $to] = $this->dateRange($request);

        $base    = Invoice::whereIn('status', self::SALE_STATUSES)->whereBetween('invoice_date', [$from, $to]);
        $revenue = (float) (clone $base)->sum('total');
        $profit  = (float) (clone $base)->sum(DB::raw('total - cost_total'));
        $count   = (clone $base)->count();

        return response()->json([
            'from'            => $from->toDateString(),
            'to'              => $to->toDateString(),
            'revenue'         => $revenue,
            'profit'          => $profit,
            'orders'          => $count,
            'avg_order_value' => $count > 0 ? round($revenue / $count, 2) : 0,
            'margin'          => $revenue > 0 ? round(($profit / $revenue) * 100, 1) : 0,
        ]);
    }

    public function salesByCategory(Request $request)
    {
        [$from, $to] = $this->dateRange($request);

        $rows = InvoiceItem::join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->whereIn('invoices.status', self::SALE_STATUSES)
            ->whereBetween('invoices.invoice_date', [$from, $to])
            ->whereNotNull('invoice_items.category')
            ->where('invoice_items.category', '!=', '')
            ->select(
                'invoice_items.category',
                DB::raw('SUM(invoice_items.quantity) as units_sold'),
                DB::raw('SUM(invoice_items.total) as revenue'),
                DB::raw('SUM(invoice_items.total - (invoice_items.cost_price * invoice_items.quantity)) as profit'),
                DB::raw('COUNT(DISTINCT invoices.id) as order_count')
            )
            ->groupBy('invoice_items.category')
            ->orderByDesc('revenue')
            ->get()
            ->map(fn($r) => [
                'category'    => $r->category,
                'units_sold'  => (int) $r->units_sold,
                'revenue'     => (float) $r->revenue,
                'profit'      => (float) $r->profit,
                'order_count' => (int) $r->order_count,
                'margin'      => $r->revenue > 0 ? round(($r->profit / $r->revenue) * 100, 1) : 0,
            ]);

        return response()->json($rows);
    }

    public function productPerformance(Request $request)
    {
        [$from, $to] = $this->dateRange($request);
        $sort  = in_array($request->sort, ['revenue', 'units_sold', 'profit', 'margin']) ? $request->sort : 'revenue';
        $order = $request->order === 'asc' ? 'asc' : 'desc';

        $rows = InvoiceItem::join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->whereIn('invoices.status', self::SALE_STATUSES)
            ->whereBetween('invoices.invoice_date', [$from, $to])
            ->select(
                'invoice_items.product_id',
                'invoice_items.product_name',
                'invoice_items.category',
                DB::raw('SUM(invoice_items.quantity) as units_sold'),
                DB::raw('SUM(invoice_items.total) as revenue'),
                DB::raw('SUM(invoice_items.total - (invoice_items.cost_price * invoice_items.quantity)) as profit'),
                DB::raw('COUNT(DISTINCT invoices.id) as order_count')
            )
            ->groupBy('invoice_items.product_id', 'invoice_items.product_name', 'invoice_items.category')
            ->get()
            ->map(fn($r) => [
                'product_id'   => $r->product_id,
                'product_name' => $r->product_name,
                'category'     => $r->category,
                'units_sold'   => (int) $r->units_sold,
                'revenue'      => (float) $r->revenue,
                'profit'       => (float) $r->profit,
                'order_count'  => (int) $r->order_count,
                'margin'       => $r->revenue > 0 ? round(($r->profit / $r->revenue) * 100, 1) : 0,
            ]);

        $sorted = $order === 'desc'
            ? $rows->sortByDesc($sort)
            : $rows->sortBy($sort);

        return response()->json($sorted->values());
    }

    public function salesTrend(Request $request)
    {
        [$from, $to] = $this->dateRange($request);

        // Auto-pick granularity from the range length (overridable via group_by).
        $days = $from->diffInDays($to) + 1;
        $group = in_array($request->group_by, ['day', 'week', 'month'])
            ? $request->group_by
            : ($days <= 31 ? 'day' : ($days <= 180 ? 'week' : 'month'));

        $format = match ($group) {
            'day'   => '%Y-%m-%d',
            'week'  => '%x-W%v',
            'month' => '%Y-%m',
        };

        $rows = Invoice::whereIn('status', self::SALE_STATUSES)
            ->whereBetween('invoice_date', [$from, $to])
            ->select(
                DB::raw("DATE_FORMAT(invoice_date, '{$format}') as period"),
                DB::raw('SUM(total) as revenue'),
                DB::raw('SUM(total - cost_total) as profit'),
                DB::raw('COUNT(*) as orders')
            )
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->map(fn ($r) => [
                'period'  => $r->period,
                'label'   => $this->trendLabel($r->period, $group),
                'revenue' => (float) $r->revenue,
                'profit'  => (float) $r->profit,
                'orders'  => (int) $r->orders,
            ]);

        return response()->json([
            'group_by' => $group,
            'series'   => $rows->values(),
        ]);
    }

    private function trendLabel(string $period, string $group): string
    {
        if ($group === 'day') {
            return Carbon::createFromFormat('Y-m-d', $period)->format('d M');
        }
        if ($group === 'month') {
            return Carbon::createFromFormat('Y-m', $period)->format('M Y');
        }
        // week: "2026-W21" → "W21 '26"
        if (preg_match('/^(\d{4})-W(\d{1,2})$/', $period, $m)) {
            return 'W' . $m[2] . " '" . substr($m[1], 2);
        }
        return $period;
    }

    public function salesByPayment(Request $request)
    {
        [$from, $to] = $this->dateRange($request);

        $rows = Invoice::whereIn('status', self::SALE_STATUSES)
            ->whereBetween('invoice_date', [$from, $to])
            ->select(
                DB::raw("COALESCE(NULLIF(payment_method, ''), 'Unknown') as payment_method"),
                DB::raw('SUM(total) as revenue'),
                DB::raw('SUM(total - cost_total) as profit'),
                DB::raw('COUNT(*) as orders')
            )
            ->groupBy('payment_method')
            ->orderByDesc('revenue')
            ->get()
            ->map(fn ($r) => [
                'payment_method' => $r->payment_method,
                'revenue'        => (float) $r->revenue,
                'profit'         => (float) $r->profit,
                'orders'         => (int) $r->orders,
            ]);

        return response()->json($rows);
    }

    public function salesByBrand(Request $request)
    {
        [$from, $to] = $this->dateRange($request);

        $rows = InvoiceItem::join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->leftJoin('products', 'invoice_items.product_id', '=', 'products.id')
            ->whereIn('invoices.status', self::SALE_STATUSES)
            ->whereBetween('invoices.invoice_date', [$from, $to])
            ->select(
                DB::raw("COALESCE(NULLIF(products.brand, ''), 'Unbranded') as brand"),
                DB::raw('SUM(invoice_items.quantity) as units_sold'),
                DB::raw('SUM(invoice_items.total) as revenue'),
                DB::raw('SUM(invoice_items.total - (invoice_items.cost_price * invoice_items.quantity)) as profit'),
                DB::raw('COUNT(DISTINCT invoices.id) as order_count')
            )
            ->groupBy('brand')
            ->orderByDesc('revenue')
            ->get()
            ->map(fn ($r) => [
                'brand'       => $r->brand,
                'units_sold'  => (int) $r->units_sold,
                'revenue'     => (float) $r->revenue,
                'profit'      => (float) $r->profit,
                'order_count' => (int) $r->order_count,
                'margin'      => $r->revenue > 0 ? round(($r->profit / $r->revenue) * 100, 1) : 0,
            ]);

        return response()->json($rows);
    }

    public function revenueByPeriod(Request $request)
    {
        $groupBy = $request->group_by ?? 'month'; // month or year

        if ($groupBy === 'year') {
            $data = Invoice::where('status', 'delivered')
                ->select(
                    DB::raw('YEAR(invoice_date) as period'),
                    DB::raw('SUM(total) as revenue'),
                    DB::raw('SUM(total - cost_total) as profit'),
                    DB::raw('COUNT(*) as invoice_count')
                )
                ->groupBy('period')
                ->orderBy('period')
                ->get();
        } else {
            $data = Invoice::where('status', 'delivered')
                ->select(
                    DB::raw('DATE_FORMAT(invoice_date, "%Y-%m") as period'),
                    DB::raw('SUM(total) as revenue'),
                    DB::raw('SUM(total - cost_total) as profit'),
                    DB::raw('COUNT(*) as invoice_count')
                )
                ->groupBy('period')
                ->orderBy('period')
                ->limit(24)
                ->get();
        }

        return response()->json($data);
    }
}
