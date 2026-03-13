import { useEffect, useState } from "react";
import axios from "axios";

export default function useUnreadMessages() {
  const [count, setCount] = useState(0);
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    const fetch = async()=> {
      const res = await axios.get("/api/messages/unread-count/",{
        headers:{ Authorization:`Token ${token}` }
      });
      setCount(res.data.unread_count);
    };
    fetch();
  },[]);

  return count;
}
