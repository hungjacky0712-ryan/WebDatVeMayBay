<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\QueryException;
use Illuminate\Validation\Rule;

class HanhKhachController extends Controller
{
    // 1. DANH SACH KHACH HANG
    public function index()
    {
        $data = DB::table('HanhKhach')
            ->orderBy('MaHanhKhach', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    // 2. CHI TIET KHACH HANG
    public function show($id)
    {
        $data = DB::table('HanhKhach')
            ->where('MaHanhKhach', $id)
            ->first();

        if (!$data) {
            return response()->json([
                'success' => false,
                'message' => 'Khong tim thay khach hang.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    // 3. THEM KHACH HANG
    public function store(Request $request)
    {
        $validated = $request->validate([
            'MaNguoiDung' => 'nullable|integer|exists:NguoiDung,MaNguoiDung',
            'HoTen' => 'required|string|max:200',
            'CCCD' => 'required|string|max:20|unique:HanhKhach,CCCD',
            'NgaySinh' => 'nullable|date',
            'GioiTinh' => 'nullable|string|max:20',
            'QuocTich' => 'required|string|max:100'
        ]);

        try {
            $id = DB::table('HanhKhach')->insertGetId(
                $validated,
                'MaHanhKhach'
            );

            return response()->json([
                'success' => true,
                'message' => 'Them khach hang thanh cong.',
                'MaHanhKhach' => $id
            ], 201);

        } catch (QueryException $e) {
            \Log::error('LOI THEM HANH KHACH: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Khong the them khach hang.'
            ], 409);
        }
    }

    // 4. CAP NHAT KHACH HANG
    public function update(Request $request, $id)
    {
        $exists = DB::table('HanhKhach')
            ->where('MaHanhKhach', $id)
            ->exists();

        if (!$exists) {
            return response()->json([
                'success' => false,
                'message' => 'Khong tim thay khach hang.'
            ], 404);
        }

        $validated = $request->validate([
            'MaNguoiDung' => 'nullable|integer|exists:NguoiDung,MaNguoiDung',
            'HoTen' => 'required|string|max:200',
            'CCCD' => [
                'required',
                'string',
                'max:20',
                Rule::unique('HanhKhach', 'CCCD')
                    ->ignore($id, 'MaHanhKhach')
            ],
            'NgaySinh' => 'nullable|date',
            'GioiTinh' => 'nullable|string|max:20',
            'QuocTich' => 'required|string|max:100'
        ]);

        try {
            DB::table('HanhKhach')
                ->where('MaHanhKhach', $id)
                ->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Cap nhat khach hang thanh cong.'
            ]);

        } catch (QueryException $e) {
            \Log::error('LOI CAP NHAT HANH KHACH: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Khong the cap nhat khach hang.'
            ], 409);
        }
    }

    // 5. XOA KHACH HANG
    public function destroy($id)
    {
        $exists = DB::table('HanhKhach')
            ->where('MaHanhKhach', $id)
            ->exists();

        if (!$exists) {
            return response()->json([
                'success' => false,
                'message' => 'Khong tim thay khach hang.'
            ], 404);
        }

        try {
            DB::table('HanhKhach')
                ->where('MaHanhKhach', $id)
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'Xoa khach hang thanh cong.'
            ]);

        } catch (QueryException $e) {
            \Log::error('LOI XOA HANH KHACH: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Khach hang dang co du lieu dat ve, khong the xoa.'
            ], 409);
        }
    }
}
