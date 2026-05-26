<?php

namespace App\Models;

use App\Traits\HasUserStamps;
use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    use HasUserStamps;

    protected $fillable = [
        'period', 'expense_date', 'category', 'description', 'amount',
        'partner_id', 'invoice_id', 'is_reimbursable', 'proof_path',
        'created_by', 'updated_by',
    ];

    protected $casts = [
        'expense_date' => 'date',
        'amount' => 'decimal:2',
        'is_reimbursable' => 'boolean',
    ];

    public function partner()
    {
        return $this->belongsTo(Partner::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class, 'invoice_id');
    }
}
