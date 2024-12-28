import React, { useRef, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../socket';
import ACTIONS from '../Actions';
import { useLocation, useParams, useNavigate, Navigate } from 'react-router-dom';
import { IoPlayOutline } from "react-icons/io5";
import { IoLogOutOutline } from "react-icons/io5";
const EditorPage = () => {
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const location = useLocation();
    const reactNavigator = useNavigate();
    const { roomId } = useParams();
    const [clients, setClients] = useState([]);
    const [terminalOutput, setTerminalOutput] = useState('');  
    const [isAsideOpen, setIsAsideOpen] = useState(false);  // State to control aside visibility

    useEffect(() => {
        const init = async () => {
            if (!socketRef.current) {
                socketRef.current = await initSocket();

                socketRef.current.on('connect_error', (err) => handleErrors(err));
                socketRef.current.on('connect_failed', (err) => handleErrors(err));

                function handleErrors(e) {
                    console.log('socket error', e);
                    toast.error('Socket connection failed, try again later.');
                    reactNavigator('/');
                }

                socketRef.current.emit(ACTIONS.JOIN, {
                    roomId,
                    username: location.state?.username,
                });

                socketRef.current.on(ACTIONS.JOINED, ({ clients, username, socketId }) => {
                    if (username !== location.state?.username) {
                        toast.success(`${username} joined the room.`);
                    }
                    setClients(clients);
                    socketRef.current.emit(ACTIONS.SYNC_CODE, {
                        code: codeRef.current,
                        socketId,
                    });
                });

                socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
                    toast.success(`${username} left the room.`);
                    setClients((prev) => {
                        return prev.filter((client) => client.socketId !== socketId);
                    });
                });
            }
        };

        init();

        return () => {
            if (socketRef.current) {
                socketRef.current.emit(ACTIONS.LEAVE, {
                    roomId,
                    username: location.state?.username,
                });
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [roomId, location.state, reactNavigator]);

    const compileCode = () => {
        let output = '';  
        const originalLog = console.log;  
      
        console.log = (...args) => {
          output += args.join(' ') + '\n';  
        };
      
        try {
          let result = new Function(codeRef.current)(); 
      
          if (result !== undefined) {
            output += `Result: ${result}\n`;
          }
      
          setTerminalOutput(prevOutput => prevOutput + output);
        } catch (error) {
          setTerminalOutput(prevOutput => prevOutput + `\nError: ${error.message}`);
        } finally {
          console.log = originalLog;
        }
      };

    const copyRoomId = async () => {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success("ROOM ID has been copied to your clipboard");
        } catch (err) {
            toast.error("Could not copy the room ID");
        }
    };

    const leaveRoom = () => {
        if (socketRef.current) {
            socketRef.current.emit(ACTIONS.LEAVE, {
                roomId,
                username: location.state?.username,
            });
            socketRef.current.disconnect();
        }
        reactNavigator('/');
    };

    const toggleAside = () => {
        setIsAsideOpen(!isAsideOpen);  // Toggle the aside panel state
    };

    if (!location.state) {
        return <Navigate to="/" />;
    }

    return (
        <div className='mainWrap'   style={{ 
            display: 'grid', 
            gridTemplateColumns: isAsideOpen ? '250px 2fr' : '70px 2fr'  // Conditional grid layout
          }}>
            <div className={`aside ${isAsideOpen ? 'open' : 'closed'}`}>
                <div className='asideInner'>
                    <div className='logo'>
                        <div className='logoBox' onClick={toggleAside}>  {/* Toggle on logo click */}
                            <img className='logoImage' src='/logo.png' alt='logo' />
                            {isAsideOpen && <h2>🄲&lt;&gt;DE🅇SPA🄲E</h2>}
                        </div>
                    </div>
                    {isAsideOpen && (
        <>
            <h3>Connected</h3>
            <div className='clientsList'>
                {clients.map((client) => (
                    <Client key={client.socketId} username={client.username} />
                ))}
            </div>
        </>
    )}
                </div>
             {isAsideOpen && (
        <button className='btn copyBtn' onClick={copyRoomId}>Copy ROOM ID</button>
    )}
                <button className={`btn leaveBtn ${!isAsideOpen ? 'iconleave' : ''}`} onClick={leaveRoom}>    {!isAsideOpen ? <IoLogOutOutline />
 : 'Leave Room'}</button>
            </div>
            <div className='editorWrap'>
                <Editor socketRef={socketRef} roomId={roomId} onCodeChange={(code) => { codeRef.current = code }} />
                <div className='terminalBox'>
                    <button className='btn compileBtn' onClick={compileCode}><IoPlayOutline /></button> 
                    <div className='terminalOutput'>
                        <h3>Terminal Output:</h3>
                        <pre>{terminalOutput}</pre> 
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditorPage;
