interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
  }
  
  export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
        {/* Modal Content */}
        <div className="bg-white rounded-lg shadow-lg p-6 w-3/4 md:w-1/2 relative flex justify-center items-center">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-red-500 text-white rounded-full px-3 py-1 hover:bg-red-600"
          >
            &times;
          </button>
          {children}
        </div>
      </div>
    );
  };