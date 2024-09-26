/* eslint-disable no-console */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import BackButton from '../../components/BackButton';
import { LoginSuccess } from '../../redux/slices/user.slice';

function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };
  const handlePwdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setLoading(true);
    e.preventDefault();
    try {
      const loginResponse = await axios.post(`http://localhost:8000/login`, {
        email,
        password,
      });
      console.log('Login response: ', loginResponse.data);
      dispatch(LoginSuccess(loginResponse.data.user));
      navigate('/');
    } catch (error) {
      console.error('Error while logging in: ', error);
    }
    setLoading(true);
  };
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
                  onSubmit={handleSubmit}
                >
                  <div className="pb-4 flex flex-col">
                    <label htmlFor="email" className="w-full">
                      Email
                    </label>
                    <input
                      type="text"
                      name=""
                      className="w-full border-[1px] px-2 py-1 border-black text-black rounded-md text-sm"
                      placeholder="Enter your email"
                      onChange={handleEmailChange}
                    />
                  </div>
                  <div className="pb-4 flex flex-col">
                    <label htmlFor="password" className="w-full">
                      Password
                    </label>
                    <input
                      type="text"
                      name=""
                      className="w-full border-[1px] px-2 py-1 border-black text-black rounded-md text-sm"
                      placeholder="Enter your password"
                      onChange={handlePwdChange}
                    />
                  </div>
                  <div className="py-2 flex justify-center">
                    <button
                      type="submit"
                      className="px-4 py-1 rounded-md hover:cursor-pointer bg-white text-black font-semibold"
                      disabled={loading}
                    >
                      {loading ? 'Signing you in...' : 'Login'}
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
