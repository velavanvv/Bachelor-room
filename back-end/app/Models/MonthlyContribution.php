<?php 


namespace App\Models;

use Illuminate\Database\Eloquent\Model;


class MonthlyContribution extends Model
{
    protected $fillable = [
        'user_id', 'month', 'amount', 'status', 'paid_date'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

?>
