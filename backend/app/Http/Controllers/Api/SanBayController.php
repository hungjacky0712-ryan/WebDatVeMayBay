<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SanBay;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;
use Illuminate\Validation\Rule;

class SanBayController extends Controller
{
    // READ: Danh sách sân bay
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => SanBay::orderBy('MaSanBay')->get()
        ]);
    }

    // READ: Chi tiết sân bay
    public function show($id)
    {
        $sanBay = SanBay::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $sanBay
        ]);
    }

    // CREATE: Thêm sân bay
    

public function store(Request $request)
{
    $validated = $request->validate([
        'MaHang' => 'required|integer|exists:HangHangKhong,MaHang',
        'MaMayBay' => 'nullable|integer|exists:MayBay,MaMayBay',
        'SoHieuChuyenBay' => 'required|string|max:40',
        'MaSanBayDi' => 'required|integer|exists:SanBay,MaSanBay',
        'MaSanBayDen' => 'required|integer|different:MaSanBayDi|exists:SanBay,MaSanBay',
        'GioKhoiHanh' => 'required|date',
        'GioDen' => 'required|date|after:GioKhoiHanh',
        'TrangThai' => 'required|in:DaLenLich,DaKhoiHanh,TreGio,DaDen,DaHuy'
    ]);

    try {
        // CHUYEN DINH DANG DATETIME-LOCAL SANG SQL SERVER
        $validated['GioKhoiHanh'] = date(
            'Y-m-d H:i:s',
            strtotime($validated['GioKhoiHanh'])
        );

        $validated['GioDen'] = date(
            'Y-m-d H:i:s',
            strtotime($validated['GioDen'])
        );

        $id = DB::table('ChuyenBay')->insertGetId(
            $validated,
            'MaChuyenBay'
        );

        return response()->json([
            'success' => true,
            'message' => 'Them chuyen bay thanh cong.',
            'MaChuyenBay' => $id
        ], 201);

    } catch (QueryException $e) {

        Log::error('LOI THEM CHUYEN BAY', [
            'message' => $e->getMessage(),
            'sql_state' => $e->errorInfo[0] ?? null,
            'driver_code' => $e->errorInfo[1] ?? null,
            'driver_message' => $e->errorInfo[2] ?? null,
            'payload' => $validated
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Khong the them chuyen bay.',
            'debug' => config('app.debug') ? $e->getMessage() : null
        ], 409);
    }
}


    // UPDATE: Cập nhật sân bay
    
public function update(Request $request, $id)
{
    $validated = $request->validate([
        'MaHang' => 'required|integer|exists:HangHangKhong,MaHang',
        'MaMayBay' => 'nullable|integer|exists:MayBay,MaMayBay',
        'SoHieuChuyenBay' => 'required|string|max:40',
        'MaSanBayDi' => 'required|integer|exists:SanBay,MaSanBay',
        'MaSanBayDen' => 'required|integer|different:MaSanBayDi|exists:SanBay,MaSanBay',
        'GioKhoiHanh' => 'required|date',
        'GioDen' => 'required|date|after:GioKhoiHanh',
        'TrangThai' => 'required|in:DaLenLich,DaKhoiHanh,TreGio,DaDen,DaHuy'
    ]);

    $exists = DB::table('ChuyenBay')
        ->where('MaChuyenBay', $id)
        ->exists();

    if (!$exists) {
        return response()->json([
            'success' => false,
            'message' => 'Khong tim thay chuyen bay.'
        ], 404);
    }

    try {
        $validated['GioKhoiHanh'] = date(
            'Y-m-d H:i:s',
            strtotime($validated['GioKhoiHanh'])
        );

        $validated['GioDen'] = date(
            'Y-m-d H:i:s',
            strtotime($validated['GioDen'])
        );

        DB::table('ChuyenBay')
            ->where('MaChuyenBay', $id)
            ->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cap nhat chuyen bay thanh cong.'
        ]);

    } catch (QueryException $e) {

        Log::error('LOI CAP NHAT CHUYEN BAY', [
            'id' => $id,
            'message' => $e->getMessage(),
            'payload' => $validated
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Khong the cap nhat chuyen bay.',
            'debug' => config('app.debug') ? $e->getMessage() : null
        ], 409);
    }
}


    // DELETE: Xóa sân bay
    public function destroy($id)
    {
        $sanBay = SanBay::findOrFail($id);

        try {
            $sanBay->delete();

            return response()->json([
                'success' => true,
                'message' => 'Xóa sân bay thành công!'
            ]);
        } catch (QueryException $e) {
            // SQL Server error 547: Vi phạm ràng buộc khóa ngoại
            if (($e->errorInfo[1] ?? null) == 547) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không thể xóa sân bay vì đang được sử dụng trong chuyến bay!'
                ], 409);
            }

            throw $e;
        }
    }
}
