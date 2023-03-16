import React, { useEffect, useState } from "react"
import { useSession } from 'next-auth/react';
import Layout from "../components/Layout"
import Post, { PostProps } from "../components/Post"
import Swal from 'sweetalert2';
import styled from 'styled-components';


const hoursDiff = (dt1: Date, dt2: Date) => {
  let diff = (dt2.getTime() - dt1.getTime()) / 1000;
  diff /= (60 * 60);
  return Math.abs(Math.round(diff));
}

const isSamAwake = (logEntry: any) => {
  if (logEntry) {
    const entry = logEntry;
    const d = new Date(entry.createdAt);
    const now = new Date();


    let wasRecentlyAwake = entry.isAwake;
    let isAwake: boolean;
    let status: string;
    const diff = hoursDiff(d, now)

    if (diff > 168) {
      status = 'UNKNOWN';
      //TODO more in-depth date info??
    } else {
      if (wasRecentlyAwake) {
        isAwake = (diff % 24 <= 16);
      } else {
        isAwake = (diff % 24 > 8);
      }
      status = isAwake === true ? "AWAKE" : "ASLEEP";
    }

    return status;
  }
}

const fetchData = async () => {
  const latestEntry = await fetch('/api/getLatestEntry')
    .then((res) => res.json())
    .then((data) => {
      return data;
    })
  const feed = await fetch('/api/getMotd')
    .then((res) => res.json())
    .then((data) => {
      return data;
    })
  return { latestEntry: latestEntry, feed: feed }
}



const styles: any = {
  container: (isRowBased: boolean) => ({
    display: 'flex',
    flexDirection: isRowBased ? 'row' : 'columns',
    justifyContent: 'space-between'
  })
}

const StatusUpdate: React.FC = () => {

  const { data: session } = useSession();
  const [update, setUpdate] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('');
  const [hoursElapsed, setHoursElaplsed] = useState(24);

  const [feed, setFeed] = useState([]);
  const [latestEntry, setLatestEntry] = useState({} as any);


  useEffect(() => {
    const fd = async () => {
      const data = await fetchData();
      setLatestEntry(data.latestEntry[0]);
      setFeed(data.feed);
    }
    fd().catch(console.error);
  }, [update])

  useEffect(() => {
    setCurrentStatus(isSamAwake(latestEntry));
    setHoursElaplsed(hoursDiff(new Date(latestEntry.createdAt), new Date()));
  }, [latestEntry]);

  const sendAwakenessEntry = async (isAwake: boolean) => {
    try {
      const body = { isAwake: isAwake };
      const res = await fetch('/api/awakenessUpdate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 200) {
        Swal.fire('CONGRATS', `You're ${isAwake ? 'AWAKE' : 'ASLEEP'}`, 'success')
          .then(() => setUpdate(update + 1));
      } else {
        Swal.fire(res.statusText, `${res.status}`, 'error')
      }

    } catch (error) {
      console.error(error);
    }
  };

  const HeaderDiv = styled.div`
    display:flex;
      flex-direction: column;
      justify-content: space-around;
    @media only screen and (min-width:900px) {
      flex-direction: row;
      justify-content: space-between;
    }
  `;

  const HeaderCertainty = styled.h3`
    color: rgb(${hoursElapsed > 72 ? 200 : 0},${hoursElapsed < 24 ? 155 : 0},0);
    margin-top: 0em;
    margin-bottom:2em;
    @media only screen and (min-width:900px) {
      margin-top:1.5em;
      margin-bottom:2em;
    }
  `;

  return (
    <>
      <Layout>
        <div>
          <div className="page" >
            <HeaderDiv>
              <h1>Current Status: Sam is {currentStatus}</h1>
              <HeaderCertainty>{hoursElapsed < 24 ? 'and I\'m SURE about it.' : hoursElapsed > 72 ? 'samnTracker data 3+ days out of date.' : 'and this is PROBABLY correct.'}</HeaderCertainty>
            </HeaderDiv>
          </div>
          <main>
            {feed.map((post) => (
              <div key={post.id} className="post">
                <Post post={post} />
              </div>
            ))}
          </main>
        </div>
        <style jsx>{`
        .post {
          background: white;
          transition: box-shadow 0.1s ease-in;
        }

        .post:hover {
          box-shadow: 1px 1px 3px #aaa;
        }

        .post + .post {
          margin-top: 2rem;
        }
      `}</style>
      </Layout>
      {
        session && <div style={{ justifyContent: "flex-start", width: "100%", display: "flex", flex: 1, marginTop: 20, flexDirection: "row", alignContent: "space-evenly" }}>
          <button onClick={() => sendAwakenessEntry(true)} style={{ flex: 1, marginLeft: 40, marginRight: 20 }}>I am currently awake</button>
          <button onClick={() => sendAwakenessEntry(false)} style={{ flex: 1, marginLeft: 20, marginRight: 40 }}>I am currently asleep</button>
          <style jsx>{`
              button {
                border: none;
              }
      `}</style>
        </div>
      }
    </>
  )
}

export default StatusUpdate 
