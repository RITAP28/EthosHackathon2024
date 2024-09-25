/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../components/BackButton';

function Login() {
  const navigate = useNavigate();
  return (
    <div className="w-full min-h-screen">
      <BackButton />
      <div className="w-full flex flex-row bg-slate-600 text-white">
        <div className="basis-1/2 min-h-screen flex justify-center items-center">
          Chat with anyone with E2EE chats
        </div>
        <div className="basis-1/2">
          <div className="min-h-screen flex justify-center items-center">
            <div className="">
              <div className="pb-2 font-bold">
                Login to load all your previous chats
              </div>
              <div className="">
                <form
                  action=""
                  method="post"
                  className="border-[1px] border-slate-400 rounded-md px-[2rem] py-[2rem]"
                >
                  <div className="pb-4 flex flex-col">
                    <label htmlFor="email" className="w-full">
                      Email
                    </label>
                    <input
                      type="text"
                      name=""
                      className="w-full border-[1px] px-2 py-1 border-black rounded-md text-sm"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="pb-4 flex flex-col">
                    <label htmlFor="password" className="w-full">
                      Password
                    </label>
                    <input
                      type="text"
                      name=""
                      className="w-full border-[1px] px-2 py-1 border-black rounded-md text-sm"
                      placeholder="Enter your password"
                    />
                  </div>
                  <div className="py-2 flex justify-center">
                    <button
                      type="submit"
                      className="px-4 py-1 rounded-md hover:cursor-pointer bg-white text-black font-semibold"
                    >
                      Login
                    </button>
                  </div>
                  <div className="flex justify-center text-sm">
                    No Account?{' '}
                    <button
                      type="button"
                      className=""
                      onClick={() => {
                        navigate('/register');
                      }}
                    >
                      Register
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
