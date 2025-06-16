<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class AccessCredential extends Model
{
    protected $table = 'access_creadentials';

    protected $fillable = [
        'email',
        'qrcode_url',
        'user_id'
    ];

    /**
     * @return BelongsTo<User,AccessCredential>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
