/* eslint-disable no-console */
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../../redux/hooks/hook';
import { LogoutSuccess } from '../../redux/slices/user.slice';

function Landing() {
  const { currentUser } = useAppSelector((state) => state.user);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [token, setToken] = useState<string>('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async (userId: number) => {
    try {
      const logoutResponse = await axios.post(
        `http://localhost:8000/logout?id=${userId}`,
        {
          withCredentials: true,
        },
      );
      console.log('Logged out successfully: ', logoutResponse.data);
      dispatch(LogoutSuccess());
      navigate('/login');
    } catch (error) {
      console.error('Error while logging out: ', error);
    }
  };

  const getToken = async (userId: number) => {
    try {
      const tokenResponse = await axios.get(
        `http://localhost:8000/readtoken?id=${userId}`,
        {
          withCredentials: true,
        },
      );
      console.log('token response: ', tokenResponse);
      setToken(tokenResponse.data.token);
    } catch (error) {
      console.error('Error while fetching token: ', error);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
    getToken(currentUser?.id as number);
    const socket = new WebSocket('ws://localhost:8001');
    socket.onopen = () => {
      console.log(`Websocket connection established`);
      // token sent for the authentication of Websocket connection
      socket.send(token);
    };

    socket.onmessage = (message) => {
      const data = JSON.parse(message.data);
      console.log(`Message from server: `, data);
    };

    socket.onclose = () => {
      console.log(`Websocket closed successfully`);
    };

    setWs(socket);

    return () => {
      if (socket) socket.close();
    };
  }, [currentUser, token, navigate]);

  return (
    <div>
      {ws ? (
        <div className="w-full h-screen">
          <div className="w-full h-[5%] bg-slate-600 text-white flex flex-row justify-between items-center">
            <div className="pl-3">{`WhatsApp for ${currentUser?.name}`}</div>
            <div className="pr-3">
              <button
                type="button"
                className="px-4 py-1 bg-white transform duration-200 ease-in-out hover:bg-black hover:text-white rounded-lg hover:cursor-pointer text-black"
                onClick={() => {
                  handleLogout(currentUser?.id as number);
                }}
              >
                Logout
              </button>
            </div>
          </div>
          <div className="w-full h-[95%] flex flex-row bg-slate-700">
            <div className="w-[20%] bg-slate-300">sdjcknjsd</div>
            <div className="w-[80%]">sdnjcjksdnc</div>
          </div>
        </div>
      ) : (
        <div>No</div>
      )}
    </div>
  );
}

export default Landing;
