import { useNavigate } from 'react-router-dom';

function BackButton() {
  const navigate = useNavigate();
  return (
    <div className="w-full h-[5rem] absolute">
      <button
        type="button"
        className="px-5 py-1 bg-black text-white hover:cursor-pointer"
        onClick={() => {
          navigate(-1);
        }}
      >
        Back
      </button>
    </div>
  );
}

export default BackButton;
