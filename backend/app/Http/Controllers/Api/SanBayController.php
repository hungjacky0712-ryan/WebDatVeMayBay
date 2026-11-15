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
            'MaIATA' => [
                'required',
                'string',
                'size:3',
                Rule::unique('SanBay', 'MaIATA'),
            ],
            'TenSanBay' => ['required', 'string', 'max:150'],
            'ThanhPho' => ['required', 'string', 'max:100'],
            'QuocGia' => ['required', 'string', 'max:60'],
        ]);

        $sanBay = SanBay::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Thêm sân bay thành công!',
            'data' => $sanBay
        ], 201);
    }

    // UPDATE: Cập nhật sân bay
    public function update(Request $request, $id)
    {
        $sanBay = SanBay::findOrFail($id);

        $validated = $request->validate([
            'MaIATA' => [
                'sometimes',
                'required',
                'string',
                'size:3',
                Rule::unique('SanBay', 'MaIATA')
                    ->ignore($sanBay->MaSanBay, 'MaSanBay'),
            ],
            'TenSanBay' => ['sometimes', 'required', 'string', 'max:150'],
            'ThanhPho' => ['sometimes', 'required', 'string', 'max:100'],
            'QuocGia' => ['sometimes', 'required', 'string', 'max:60'],
        ]);

        $sanBay->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật sân bay thành công!',
            'data' => $sanBay->fresh()
        ]);
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
