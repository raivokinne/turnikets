<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccessCreadential extends Model
{
    protected $fillable = [
        'email',
        'qrcode_url',
        'user_id',
    ];
    /**
     * @return BelongsTo<User,AccessCreadential>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
