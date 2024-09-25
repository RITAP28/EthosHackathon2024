import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  return (
    <div className="bg-slate-600 w-full min-h-screen text-white">
      <div className="w-full flex justify-center items-center">
        <button
          type="button"
          className="px-6 py-1 rounded-lg hover:cursor-pointer bg-black text-white"
          onClick={() => {
            navigate('/login');
          }}
        >
          Login with email
        </button>
      </div>
      <div className="w-full flex flex-row justify-center items-center">
        <p>OR</p>
      </div>
      <div className="w-full flex justify-center">
        <button
          type="button"
          className="px-5 py-1 bg-black text-white rounded-lg hover:cursor-pointer"
        >
          Login by scanning a qr code
        </button>
      </div>
    </div>
  );
}

export default Home;
