<?php

namespace App\Http\Requests\Event;

use Illuminate\Foundation\Http\FormRequest;

class CreateEventRescheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'new_start_date' => ['required', 'date', 'after:now'],
            'new_end_date' => ['required', 'date', 'after:new_start_date'],
            'reason' => ['required', 'string', 'min:10', 'max:2000'],
        ];
    }
}
