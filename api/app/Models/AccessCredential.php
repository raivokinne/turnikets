<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class AccessCredential extends Model
{
    use HasFactory;

    protected $fillable = [
        'email',
        'qrcode_url',
        'student_id',
        'uuid'
    ];    

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
