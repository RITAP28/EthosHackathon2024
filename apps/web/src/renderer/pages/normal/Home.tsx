/* eslint-disable no-nested-ternary */
/* eslint-disable no-console */
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAppSelector } from '../../redux/hooks/hook';
import { User } from '../../types/types';

function Home() {
  const { currentUser } = useAppSelector((state) => state.user);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const getCurrentUser = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:8000/getCurrentUser?id=${currentUser?.id}`,
        {
          withCredentials: true,
        },
      );
      console.log('The current user is: ', response.data);
      setUser(response.data.user);
    } catch (error) {
      console.error('Error while fetching user: ', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  return (
    <div>
      {loading ? (
        <div>Loading...</div>
      ) : !user ? (
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
      ) : (
        <div className="w-full min-h-screen">
          <p className="">Current user is: {user?.name}</p>
        </div>
      )}
    </div>
  );
}

export default Home;
