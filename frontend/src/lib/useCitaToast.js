import {useEffect,useState} from 'react'
export function useCitaToast(){const [message,setMessage]=useState('');useEffect(()=>{if(!message)return;const timer=setTimeout(()=>setMessage(''),4000);return()=>clearTimeout(timer)},[message]);return [message,setMessage]}
