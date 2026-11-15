<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SanBay extends Model
{
    protected $table = 'SanBay';
    protected $primaryKey = 'MaSanBay';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = false;

    protected $fillable = [
        'MaIATA',
        'TenSanBay',
        'ThanhPho',
        'QuocGia',
    ];
}