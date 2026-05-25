<?php

namespace App\Models;

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
            // Snapshot the invoice total on first create if not provided.
            if (empty($cod->order_amount) && $cod->invoice_id) {
                $invoice = Invoice::find($cod->invoice_id);
                $cod->order_amount = $invoice ? $invoice->total : 0;
            }
            $cod->net_revenue = (float) $cod->order_amount - (float) $cod->shipping_deduction;
        });
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }
}
