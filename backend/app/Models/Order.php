<?php

namespace App\Models;

use App\Traits\HasUserStamps;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Order extends Model
{
    use SoftDeletes, HasUserStamps;

    protected $table = 'orders';

    protected $fillable = [
        'order_number', 'share_token', 'customer_id',
        'billing_name', 'billing_phone', 'billing_city', 'billing_address',
        'order_date', 'due_date', 'status',
        'subtotal', 'discount', 'tax', 'delivery_fee', 'payment_method',
        'delivery_option', 'total', 'cost_total', 'notes',
        'created_by', 'updated_by',
    ];

    protected static function booted(): void
    {
        static::creating(function (Order $order) {
            if (empty($order->share_token)) {
                $order->share_token = Str::random(40);
            }
        });
    }

    protected $casts = [
        'order_date' => 'date',
        'due_date'   => 'date',
        'subtotal'   => 'decimal:2',
        'discount'   => 'decimal:2',
        'tax'        => 'decimal:2',
        'delivery_fee' => 'decimal:2',
        'total'      => 'decimal:2',
        'cost_total' => 'decimal:2',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function getProfitAttribute(): float
    {
        return (float) $this->total - (float) $this->cost_total;
    }

    /**
     * Generate a globally sequential order number — never resets.
     * Format: GR-YYYYMM-N  (e.g. GR-202605-17)
     */
    public static function generateNumber(?string $date = null): string
    {
        $prefix = 'GR-' . ($date ? date('Ym', strtotime($date)) : date('Ym')) . '-';

        $last = self::whereNotNull('order_number')
            ->orderByDesc('id')
            ->value('order_number');

        $seq = 1;
        if ($last && preg_match('/-(\d+)$/', $last, $m)) {
            $seq = (int) $m[1] + 1;
        }

        return $prefix . str_pad($seq, max(2, strlen((string) $seq)), '0', STR_PAD_LEFT);
    }
}
