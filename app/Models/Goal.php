<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Goal extends Model
{
    protected $fillable = ['title', 'target', 'progress', 'unit'];

    public function percentage(): int
    {
        if ($this->target <= 0) {
            return 0;
        }

        return min(100, (int) round(($this->progress / $this->target) * 100));
    }
}
