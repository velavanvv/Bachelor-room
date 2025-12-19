<?php

namespace App\Models;


use Illuminate\Database\Eloquent\Model;


class Expense extends Model{

protected $fillable=[
     'expense_date', 'description', 'amount', 'created_by'
];

public function user(){
 return  $this->belongsTo(User::class);
}


}

?>