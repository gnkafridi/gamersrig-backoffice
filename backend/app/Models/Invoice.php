<?php

namespace App\Models;

use App\Traits\HasUserStamps;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Invoice extends Model
{
    use SoftDeletes, HasUserStamps;

    protected $fillable = [
        'invoice_number', 'share_token', 'customer_id', 'invoice_date', 'due_date',
        'status', 'subtotal', 'discount', 'tax', 'delivery_fee', 'payment_method',
        'delivery_option', 'total', 'cost_total', 'notes', 'created_by', 'updated_by',
    ];

    protected static function booted(): void
    {
        static::creating(function (Invoice $invoice) {
            if (empty($invoice->share_token)) {
                $invoice->share_token = Str::random(40);
            }
        });
    }

    protected $casts = [
        'invoice_date' => 'date',
        'due_date' => 'date',
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'tax' => 'decimal:2',
        'delivery_fee' => 'decimal:2',
        'total' => 'decimal:2',
        'cost_total' => 'decimal:2',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function getProfitAttribute(): float
    {
        return (float) $this->total - (float) $this->cost_total;
    }

    /**
     * Generate a globally sequential order number — never resets.
     * Format: GR-YYYYMM-N  (e.g. GR-202605-17)
     * The YYYYMM is the order's own month; the sequence is global across all months.
     *
     * @param string|null $date  The order date (used for prefix). Defaults to today.
     */
    public static function generateNumber(?string $date = null): string
    {
        $prefix = 'GR-' . ($date ? date('Ym', strtotime($date)) : date('Ym')) . '-';

        // Find highest sequence number globally (not per-month)
        $last = self::whereNotNull('invoice_number')
            ->orderByDesc('id')
            ->value('invoice_number');

        $seq = 1;
        if ($last && preg_match('/-(\d+)$/', $last, $m)) {
            $seq = (int) $m[1] + 1;
        }

        // Minimum 2-digit padding (01, 02 … 99, 100, 101 …)
        return $prefix . str_pad($seq, max(2, strlen((string) $seq)), '0', STR_PAD_LEFT);
    }
}
