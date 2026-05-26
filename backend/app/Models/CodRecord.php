<?php

namespace App\Models;

use App\Models\Order;
use App\Traits\HasUserStamps;
use Illuminate\Database\Eloquent\Model;

class CodRecord extends Model
{
    use HasUserStamps;

    protected $fillable = [
        'invoice_id', 'order_amount', 'shipping_deduction', 'net_revenue',
        'status', 'disbursed_at', 'courier_reference',
        'created_by', 'updated_by',
    ];

    protected $casts = [
        'order_amount' => 'decimal:2',
        'shipping_deduction' => 'decimal:2',
        'net_revenue' => 'decimal:2',
        'disbursed_at' => 'date',
    ];

    protected $attributes = [
        'status' => 'pending',
    ];

    protected static function booted(): void
    {
        static::saving(function (CodRecord $cod) {
            if (empty($cod->order_amount) && $cod->invoice_id) {
                $order = Order::find($cod->invoice_id);
                $cod->order_amount = $order ? $order->total : 0;
            }
            $cod->net_revenue = (float) $cod->order_amount - (float) $cod->shipping_deduction;
        });
    }

    public function order()
    {
        return $this->belongsTo(Order::class, 'invoice_id');
    }
}
