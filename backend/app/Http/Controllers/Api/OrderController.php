<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::with(['customer', 'creator:id,name', 'updater:id,name'])->withCount('items');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('order_number', 'like', "%{$request->search}%")
                  ->orWhereHas('customer', fn($c) => $c->where('name', 'like', "%{$request->search}%"));
            });
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->from) {
            $query->whereDate('order_date', '>=', $request->from);
        }

        if ($request->to) {
            $query->whereDate('order_date', '<=', $request->to);
        }

        $sortable = ['order_number', 'order_date', 'due_date', 'status', 'total'];
        $sortBy  = in_array($request->sort_by, $sortable) ? $request->sort_by : 'order_date';
        $sortDir = $request->sort_dir === 'asc' ? 'asc' : 'desc';

        if ($sortBy === 'order_number') {
            $query->orderBy('order_date', $sortDir)->orderBy('id', $sortDir);
        } else {
            $query->orderBy($sortBy, $sortDir)->orderBy('id', $sortDir);
        }

        $paginated = $query->paginate(20);

        $statsQuery = Order::query();
        if ($request->search) {
            $statsQuery->where(function ($q) use ($request) {
                $q->where('order_number', 'like', "%{$request->search}%")
                  ->orWhereHas('customer', fn($c) => $c->where('name', 'like', "%{$request->search}%"));
            });
        }
        if ($request->status) $statsQuery->where('status', $request->status);
        if ($request->from)   $statsQuery->whereDate('order_date', '>=', $request->from);
        if ($request->to)     $statsQuery->whereDate('order_date', '<=', $request->to);

        $allRows = $statsQuery->get(['total', 'payment_method']);

        $summary = [
            'total_orders'  => $allRows->count(),
            'total_amount'  => round($allRows->sum('total'), 2),
            'online_orders' => $allRows->filter(fn($r) => strtoupper($r->payment_method) !== 'COD')->count(),
            'online_amount' => round($allRows->filter(fn($r) => strtoupper($r->payment_method) !== 'COD')->sum('total'), 2),
            'cod_orders'    => $allRows->filter(fn($r) => strtoupper($r->payment_method) === 'COD')->count(),
            'cod_amount'    => round($allRows->filter(fn($r) => strtoupper($r->payment_method) === 'COD')->sum('total'), 2),
        ];

        return response()->json(array_merge($paginated->toArray(), ['summary' => $summary]));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'customer_id'                  => 'required|exists:customers,id',
            'order_date'                   => 'required|date',
            'due_date'                     => 'nullable|date',
            'status'                       => 'in:pending,confirmed,shipped,delivered,cancelled,returned',
            'discount'                     => 'numeric|min:0',
            'tax'                          => 'numeric|min:0',
            'delivery_fee'                 => 'numeric|min:0',
            'payment_method'               => 'nullable|string',
            'delivery_option'              => 'nullable|string',
            'notes'                        => 'nullable|string',
            'items'                        => 'required|array|min:1',
            'items.*.product_id'           => 'nullable|exists:products,id',
            'items.*.vendor_product_id'    => 'nullable|exists:vendor_products,id',
            'items.*.product_name'         => 'required|string',
            'items.*.serial_number'        => 'nullable|string',
            'items.*.category'             => 'nullable|string',
            'items.*.unit_price'           => 'required|numeric|min:0',
            'items.*.cost_price'           => 'numeric|min:0',
            'items.*.quantity'             => 'required|integer|min:1',
        ]);

        return DB::transaction(function () use ($data) {
            $subtotal  = 0;
            $costTotal = 0;

            foreach ($data['items'] as &$item) {
                $item['total'] = $item['unit_price'] * $item['quantity'];
                $subtotal     += $item['total'];
                $costTotal    += ($item['cost_price'] ?? 0) * $item['quantity'];

                if (!isset($item['cost_price']) && !empty($item['product_id'])) {
                    $p = Product::find($item['product_id']);
                    $item['cost_price'] = $p ? $p->cost_price : 0;
                    $costTotal += $item['cost_price'] * $item['quantity'];
                }
            }

            $discount    = $data['discount'] ?? 0;
            $tax         = $data['tax'] ?? 0;
            $deliveryFee = $data['delivery_fee'] ?? 0;
            $total       = $subtotal - $discount + $tax + $deliveryFee;

            // Snapshot billing details from customer at time of order
            $customer = \App\Models\Customer::find($data['customer_id']);

            $order = Order::create([
                'order_number'    => Order::generateNumber($data['order_date']),
                'customer_id'     => $data['customer_id'],
                'billing_name'    => $customer?->name,
                'billing_phone'   => $customer?->phone,
                'billing_city'    => $customer?->city,
                'billing_address' => $customer?->address,
                'order_date'      => $data['order_date'],
                'due_date'        => $data['due_date'] ?? null,
                'status'          => $data['status'] ?? 'pending',
                'subtotal'        => $subtotal,
                'discount'        => $discount,
                'tax'             => $tax,
                'delivery_fee'    => $deliveryFee,
                'payment_method'  => $data['payment_method'] ?? null,
                'delivery_option' => $data['delivery_option'] ?? null,
                'total'           => $total,
                'cost_total'      => $costTotal,
                'notes'           => $data['notes'] ?? null,
            ]);

            foreach ($data['items'] as $item) {
                $order->items()->create($item);
            }

            return response()->json($order->load(['customer', 'items']), 201);
        });
    }

    public function show(Order $order)
    {
        return response()->json($order->load(['customer', 'items.product', 'items.vendorProduct.vendor']));
    }

    public function update(Request $request, Order $order)
    {
        $data = $request->validate([
            'customer_id'                  => 'sometimes|exists:customers,id',
            'order_date'                   => 'sometimes|date',
            'due_date'                     => 'nullable|date',
            'status'                       => 'sometimes|in:pending,confirmed,shipped,delivered,cancelled,returned',
            'discount'                     => 'numeric|min:0',
            'tax'                          => 'numeric|min:0',
            'delivery_fee'                 => 'numeric|min:0',
            'payment_method'               => 'nullable|string',
            'delivery_option'              => 'nullable|string',
            'notes'                        => 'nullable|string',
            'items'                        => 'sometimes|array|min:1',
            'items.*.product_id'           => 'nullable|exists:products,id',
            'items.*.vendor_product_id'    => 'nullable|exists:vendor_products,id',
            'items.*.product_name'         => 'required_with:items|string',
            'items.*.serial_number'        => 'nullable|string',
            'items.*.category'             => 'nullable|string',
            'items.*.unit_price'           => 'required_with:items|numeric|min:0',
            'items.*.cost_price'           => 'numeric|min:0',
            'items.*.quantity'             => 'required_with:items|integer|min:1',
        ]);

        return DB::transaction(function () use ($data, $order) {
            if (isset($data['items'])) {
                $subtotal  = 0;
                $costTotal = 0;

                foreach ($data['items'] as &$item) {
                    $item['total'] = $item['unit_price'] * $item['quantity'];
                    $subtotal     += $item['total'];
                    $costTotal    += ($item['cost_price'] ?? 0) * $item['quantity'];
                }

                $discount    = $data['discount'] ?? $order->discount;
                $tax         = $data['tax'] ?? $order->tax;
                $deliveryFee = $data['delivery_fee'] ?? $order->delivery_fee;

                $data['subtotal']   = $subtotal;
                $data['cost_total'] = $costTotal;
                $data['total']      = $subtotal - $discount + $tax + $deliveryFee;

                $order->items()->delete();
                foreach ($data['items'] as $item) {
                    $order->items()->create($item);
                }
                unset($data['items']);
            }

            // Re-snapshot billing if customer changed
            if (isset($data['customer_id'])) {
                $customer = \App\Models\Customer::find($data['customer_id']);
                $data['billing_name']    = $customer?->name;
                $data['billing_phone']   = $customer?->phone;
                $data['billing_city']    = $customer?->city;
                $data['billing_address'] = $customer?->address;
            }

            $order->update($data);
            return response()->json($order->load(['customer', 'items']));
        });
    }

    public function destroy(Order $order)
    {
        $order->delete();
        return response()->json(null, 204);
    }

    public function mapItem(Request $request, Order $order, OrderItem $item)
    {
        abort_unless($item->order_id === $order->id, 404);

        $data = $request->validate([
            'product_id'        => 'nullable|exists:products,id',
            'vendor_product_id' => 'nullable|exists:vendor_products,id',
        ]);

        $item->update([
            'product_id'        => $data['product_id'] ?? null,
            'vendor_product_id' => $data['vendor_product_id'] ?? null,
        ]);

        return response()->json($order->fresh()->load(['customer', 'items.product', 'items.vendorProduct.vendor']));
    }

    public function restore(int $id)
    {
        $order = Order::withTrashed()->findOrFail($id);
        $order->restore();
        return response()->json(null, 204);
    }

    public function timeline(Order $order)
    {
        $logs = \App\Models\AuditLog::with('user:id,name')
            ->where('auditable_type', Order::class)
            ->where('auditable_id', $order->id)
            ->orderBy('created_at')
            ->get()
            ->map(function ($log) {
                if ($log->event === 'created') {
                    return [
                        'event'      => 'created',
                        'status'     => $log->new_values['status'] ?? 'pending',
                        'label'      => 'Order Created',
                        'user'       => $log->user?->name,
                        'created_at' => $log->created_at,
                    ];
                }
                if ($log->event === 'updated' && isset($log->new_values['status'])) {
                    $s = $log->new_values['status'];
                    $labels = [
                        'pending'   => 'Marked as Pending',
                        'confirmed' => 'Order Confirmed',
                        'shipped'   => 'Order Shipped',
                        'delivered' => 'Order Delivered',
                        'cancelled' => 'Order Cancelled',
                        'returned'  => 'Order Returned',
                    ];
                    return [
                        'event'      => 'status_change',
                        'status'     => $s,
                        'label'      => $labels[$s] ?? 'Status Updated',
                        'user'       => $log->user?->name,
                        'created_at' => $log->created_at,
                    ];
                }
                if ($log->event === 'updated') {
                    return [
                        'event'      => 'updated',
                        'status'     => null,
                        'label'      => 'Order Updated',
                        'user'       => $log->user?->name,
                        'created_at' => $log->created_at,
                    ];
                }
                if ($log->event === 'deleted') {
                    return ['event' => 'deleted',  'status' => 'deleted',  'label' => 'Order Deleted',  'user' => $log->user?->name, 'created_at' => $log->created_at];
                }
                if ($log->event === 'restored') {
                    return ['event' => 'restored', 'status' => 'restored', 'label' => 'Order Restored', 'user' => $log->user?->name, 'created_at' => $log->created_at];
                }
                return null;
            })
            ->filter()
            ->values();

        return response()->json($logs);
    }

    public function pdf(Order $order)
    {
        return $this->buildPdf($order)->download("order-{$order->order_number}.pdf");
    }

    public function publicView(string $token)
    {
        $order = Order::where('share_token', $token)
            ->with(['customer', 'items.product'])
            ->firstOrFail();
        return view('orders.pdf', compact('order'));
    }

    private function buildPdf(Order $order)
    {
        $order->load(['customer', 'items.product']);
        return Pdf::loadView('orders.pdf', compact('order'))
            ->setPaper('a4', 'portrait');
    }
}
