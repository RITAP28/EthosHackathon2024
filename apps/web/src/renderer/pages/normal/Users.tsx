/* eslint-disable react/no-array-index-key */
/* eslint-disable no-console */
// import axios from 'axios';
import { useEffect, useState } from 'react';
import axios from 'axios';
import SecondNavbar from '../../components/SecondNavbar';
import { useWebSocket } from '../../context/WebSocket';
import { useAppSelector } from '../../redux/hooks/hook';

function Users() {
  const { currentUser } = useAppSelector((state) => state.user);
  const ws = useWebSocket();
  const [users, setUsers] = useState<any[]>([]);
  const [token, setToken] = useState<string>('');

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
    getToken(currentUser?.id as number);
  }, [currentUser]);

  useEffect(() => {
    if (ws) {
      if (token) {
        ws.send(token);
      } else {
        console.log('No JWT token found');
      }

      ws.send(
        JSON.stringify({
          action: 'get-users-list',
        }),
      );

      ws.onmessage = (message) => {
        const data = JSON.parse(message.data);
        console.log('Users data: ', data);
        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          console.log('Expected an array but got: ', data);
        }
      };
    }
  }, [ws, token]);

  return (
    <div>
      {ws && users && (
        <div className="w-full h-screen">
          <SecondNavbar />
          <div className="w-full h-[95%] bg-black text-white">
            {Array.isArray(users) && users.length > 0 ? ( // Ensure users is an array before mapping
              users.map((user, index) => (
                <div className="" key={index}>
                  <div>{JSON.stringify(user)}</div>
                </div>
              ))
            ) : (
              <div>No users found</div> // Handle the case where no users are returned
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
