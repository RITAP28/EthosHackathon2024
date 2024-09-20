import React from 'react';
import { useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  return (
    <div className="w-full h-[5rem] bg-black text-white flex flex-row justify-between">
      <div className="">Navbar</div>
      <div className="hover:cursor-pointer">
        <button
          type="button"
          className=""
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

export default Navbar;
