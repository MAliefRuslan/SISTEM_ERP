<?php

namespace App\Http\Controllers;

use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Events\StockUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryTransactionController extends Controller
{
    public function index()
    {
        return InventoryTransaction::with('product')->latest()->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'type' => 'required|in:in,out',
            'quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string'
        ]);

        return DB::transaction(function () use ($validated) {
            $transaction = InventoryTransaction::create($validated);
            
            $product = Product::find($validated['product_id']);
            if ($validated['type'] === 'in') {
                $product->stock += $validated['quantity'];
            } else {
                $product->stock -= $validated['quantity'];
            }
            $product->save();

            // Broadcast the real-time event
            broadcast(new StockUpdated($product))->toOthers();

            return $transaction->load('product');
        });
    }
}
