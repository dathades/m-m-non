interface ExitConfirmProps {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
}

export default function ExitConfirm({ open, onStay, onLeave }: ExitConfirmProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-3xl p-7 max-w-sm w-full text-center shadow-2xl">
        <div className="text-5xl mb-2">🚪</div>
        <h3 className="text-xl font-bold text-gray-700">Thoát trò chơi?</h3>
        <p className="text-gray-500 mt-1">Kết quả lượt chơi sẽ không được lưu.</p>
        <div className="flex gap-3 mt-5">
          <button onClick={onStay} className="flex-1 py-3 rounded-2xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200">Ở lại</button>
          <button onClick={onLeave} className="flex-1 py-3 rounded-2xl font-bold bg-red-500 text-white hover:bg-red-600">Thoát</button>
        </div>
      </div>
    </div>
  );
}
