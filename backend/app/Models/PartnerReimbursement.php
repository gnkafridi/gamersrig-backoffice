<?php

namespace App\Models;

use App\Traits\HasUserStamps;
use Illuminate\Database\Eloquent\Model;

class PartnerReimbursement extends Model
{
    use HasUserStamps;

    protected $fillable = [
        'from_partner_id', 'to_partner_id', 'amount', 'paid_at',
        'period', 'proof_path', 'notes', 'created_by', 'updated_by',
    ];

    protected $casts = [
        'amount'  => 'decimal:2',
        'paid_at' => 'date:Y-m-d',
    ];

    public function fromPartner()
    {
        return $this->belongsTo(Partner::class, 'from_partner_id');
    }

    public function toPartner()
    {
        return $this->belongsTo(Partner::class, 'to_partner_id');
    }
}
