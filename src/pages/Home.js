import React, { useState } from 'react'
import {v4 as uuidV4} from 'uuid'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
const Home = () => {
    const [roomId,setRoomId]=useState('')
    const [username,setUsername]=useState('')
    const navigate=useNavigate();
    const joinRoom=()=>{
        if(!roomId||!username){
            toast.error("ROOM ID & USERNAME is required!")
        }else{
        navigate(`/editor/${roomId}`,{
            state:{
                username,
            },
        })
    }
    }
    const handleInputEnter=(e)=>{
        if(e.code==='Enter')
        {
            joinRoom();
        }
    }
    const createNewRoom=(e)=>{
        e.preventDefault();
        const id=uuidV4();
        setRoomId(id)
        toast.success('Created a New Room')
    }
  return (
    <div className='homePageWrapper'>
        <div className='formWrapper'>
            <div className='logoWrapper'>
            <img src='/logo.png' alt='code-x-paces--logo'/>
            <h2>🄲&lt;&gt;DE🅇SPA🄲E</h2>
            </div>

            <h4 className='mainLabel'>Paste Invitation ROOM ID</h4>
            <div className='inputGroup'>
                <input type='text' className='inputBox' placeholder='ROOM ID' value={roomId} onChange={(e)=>setRoomId(e.target.value)} onKeyUp={handleInputEnter}/>
                <input type='text' className='inputBox' placeholder='USERNAME' value={username} onChange={(e)=>setUsername(e.target.value)} onKeyUp={handleInputEnter}/>
                <button className='btn JoinBtn'onClick={joinRoom}>Join</button>
                <span className='createInfo'>
                    If you don't have an invite create &nbsp;
                    <a href='' className='createNewBtn' onClick={createNewRoom}>
                        new room
                    </a>
                </span>
            </div>
        </div>
        <footer>
        <h4>Built by <a href=''>Jahanzaib</a>👦🏻 – Code Awaits You on <a href='https://github.com/jahan-code'>GitHub!</a></h4>
        </footer>
    </div>
  )
}

export default Home