<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class NguoiDung extends Authenticatable
{
    use HasApiTokens;

    protected $table = 'NguoiDung';

    protected $primaryKey = 'MaNguoiDung';

    public $incrementing = true;

    protected $keyType = 'int';

    public $timestamps = false;

    protected $hidden = [
        'MatKhauMaHoa',
    ];

    public function getAuthPasswordName(): string
    {
        return 'MatKhauMaHoa';
    }

    public function getAuthPassword(): string
    {
        return $this->MatKhauMaHoa;
    }
}