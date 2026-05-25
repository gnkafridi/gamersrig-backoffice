<?php

namespace App\Models;

use App\Traits\HasUserStamps;
use Illuminate\Database\Eloquent\Model;

class MonthlyInvestment extends Model
{
    use HasUserStamps;

    protected $fillable = [
        'period', 'amount', 'notes', 'created_by', 'updated_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];
}
