import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  return (
    <div className="bg-slate-600 w-full min-h-screen text-white">
      <div className="w-full flex justify-center items-center top-0 left-0 absolute">
        <button
          type="button"
          className="px-6 py-1 rounded-lg hover:cursor-pointer bg-black text-white"
          onClick={() => {
            navigate('/login');
          }}
        >
          Login
        </button>
      </div>
    </div>
  );
}

export default Home;
