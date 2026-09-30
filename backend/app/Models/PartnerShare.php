<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PartnerShare extends Model
{
    protected $fillable = ['assessment_id', 'token_hash', 'token', 'content'];

    protected $hidden = ['token', 'token_hash', 'assessment_id'];

    protected function casts(): array
    {
        return ['token' => 'encrypted', 'content' => 'encrypted:array'];
    }
}
