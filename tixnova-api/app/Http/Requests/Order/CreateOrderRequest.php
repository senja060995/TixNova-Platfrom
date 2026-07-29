<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;

class CreateOrderRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'event_id'              => ['required', 'exists:events,id'],
            'items'                 => ['required', 'array', 'min:1'],
            'items.*.ticket_id'     => ['required', 'exists:tickets,id'],
            'items.*.quantity'      => ['required', 'integer', 'min:1', 'max:10'],
            'items.*.attendees'     => ['nullable', 'array'],
            'items.*.attendees.*.name'  => ['required_with:items.*.attendees', 'string', 'max:255'],
            'items.*.attendees.*.email' => ['nullable', 'email'],
            'items.*.attendees.*.phone' => ['nullable', 'string', 'max:20'],
            'voucher_code'          => ['nullable', 'string'],
            'referral_code'         => ['nullable', 'string'],
            'payment_method'        => ['required', 'in:bank_transfer,ewallet,qris,credit_card,va,manual'],
            'buyer_name'            => ['required', 'string', 'max:255'],
            'buyer_email'           => ['required', 'email'],
            'buyer_phone'           => ['required', 'string', 'max:20'],
        ];
    }
}
