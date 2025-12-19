<?php 

namespace App\Models;


use Illuminate\Database\Eloquent\Model;


class Wallet extends Model{
   

    protected $fillable = [
        'month', 'total_collected', 'total_spent', 'balance'
    ];

}
?>