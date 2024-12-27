/* eslint-disable no-console */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import BackButton from '../../components/BackButton';
import { RegistrationSuccess } from '../../redux/slices/user.slice';
// import { RegisterSchema } from '../../utils/zodSchemas';

function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setLoading(true);
    e.preventDefault();
    if (!name || !email || !password) {
      return;
    }
    const formData = {
      name: name as string,
      email: email as string,
      password: password as string,
    };
    console.log(formData);
    try {
      // const result = RegisterSchema.safeParse(formData);
      const registration = await axios.post(`http://localhost:8000/register`, {
        name,
        email,
        password,
      });
      console.log(registration.data);
      dispatch(RegistrationSuccess(registration.data.user));
    } catch (error) {
      console.error('Error while registering: ', error);
    }
    setLoading(false);
  };

  return (
    <div className="w-full min-h-screen">
      <BackButton />
      <div className="flex flex-row bg-black text-white">
        <div className="basis-1/2 min-h-screen flex justify-center items-center">
          Chat with anyone with E2EE chats
        </div>
        <div className="basis-1/2">
          <div className="min-h-screen flex justify-center items-center">
            <div className="">
              <div className="pb-2 font-bold">
                Register to chat with your family and friends
              </div>
              <div className="">
                <form
                  action=""
                  method="post"
                  className="border-[1px] border-slate-400 rounded-md px-[2rem] py-[2rem]"
                  onSubmit={(e) => {
                    handleSubmit(e);
                  }}
                >
                  <div className="pb-4 flex flex-col">
                    <label htmlFor="name" className="w-full">
                      Name
                    </label>
                    <input
                      type="text"
                      name=""
                      className="w-full border-[1px] px-2 py-1 border-black text-black rounded-md text-sm"
                      placeholder="Enter your name"
                      onChange={handleNameChange}
                    />
                  </div>
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
                      onChange={handlePasswordChange}
                    />
                  </div>
                  <div className="py-2 flex justify-center">
                    <button
                      type="submit"
                      className={`px-4 py-1 rounded-md hover:cursor-pointer bg-white text-black font-semibold ${loading && 'bg-slate-500'}`}
                      disabled={loading}
                    >
                      {loading ? 'Signing you up...' : 'Register'}
                    </button>
                  </div>
                  <div className="flex justify-center text-sm">
                    Account exists?{' '}
                    <button
                      type="button"
                      className="pl-1"
                      onClick={() => {
                        navigate('/login');
                      }}
                    >
                      Login
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

export default Register;
